import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const html = await readFile(new URL('../apps/web/index.html', import.meta.url), 'utf8');
const bootstrap = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(saved, systemDark, blocked = false) {
  const root = { dataset: {}, style: {} }, meta = {};
  vm.runInNewContext(bootstrap, {
    document: { documentElement: root, querySelector: () => meta },
    localStorage: { getItem: () => { if (blocked) throw Error('Storage blocked'); return saved; } },
    window: { matchMedia: () => ({ matches: systemDark }) },
  });
  return { root, meta };
}
for (const saved of ['light', 'dark']) {
  test(`saved ${saved} preference wins over the system before first paint`, () => {
    const { root, meta } = boot(saved, saved === 'light');
    assert.equal(root.dataset.theme, saved);
    assert.equal(root.dataset.themePreference, saved);
    assert.equal(root.style.colorScheme, saved);
    assert.equal(meta.content, saved === 'dark' ? '#202123' : '#f7f8f7');
  });
}
for (const saved of [null, 'system', 'unexpected']) {
  test(`${saved ?? 'missing'} preference follows the OS`, () => {
    assert.equal(boot(saved, true).root.dataset.theme, 'dark');
    assert.equal(boot(saved, false).root.dataset.theme, 'light');
  });
}
test('blocked storage still resolves the system theme', () => {
  assert.equal(boot(null, true, true).root.dataset.theme, 'dark');
});

const css = await readFile(new URL('../apps/web/src/design-system/tokens.css', import.meta.url), 'utf8');
const light = Object.fromEntries([...css.match(/:root \{([\s\S]*?)\}/)[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
const dark = { ...light, ...Object.fromEntries([...css.match(/:root\[data-theme='dark'\] \{([\s\S]*?)\}/)[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()])) };
function value(tokens, name) {
  const v = tokens[name];
  assert.ok(v, `Missing token ${name}`);
  return v.startsWith('var(') ? value(tokens, v.slice(4, -1)) : v;
}
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(n => parseInt(n, 16) / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
function contrast(a, b) { const [hi, lo] = [luminance(a), luminance(b)].sort((a, b) => b - a); return (hi + .05) / (lo + .05); }
for (const [name, tokens] of Object.entries({ light, dark })) {
  test(`${name} text, status, syntax and primary action roles meet WCAG AA contrast`, () => {
    const pairs = [];
    for (const fg of ['--text-main','--text-secondary','--text-muted'])
      for (const bg of ['--bg-app','--bg-surface','--bg-surface-subtle','--bg-sidebar','--bg-active','--bg-surface-elevated']) pairs.push([fg,bg]);
    for (const status of ['orphan','resolved','provisional','late','retracted']) pairs.push([`--state-${status}`,`--state-${status}-bg`]);
    for (const channel of ['web','mobile','call','branch']) pairs.push([`--channel-${channel}`,`--channel-${channel}-bg`]);
    for (const syntax of ['key','string','number','boolean','null']) pairs.push([`--syntax-${syntax}`,'--bg-app']);
    pairs.push(['--color-danger','--danger-bg'],['--on-primary','--color-primary'],['--on-primary','--color-primary-hover'],['--code-text','--code-bg'],['--selection-text','--selection-bg']);
    for (const [fg,bg] of pairs) assert.ok(contrast(value(tokens,fg),value(tokens,bg)) >= 4.5, `${name}: ${fg} on ${bg}: ${contrast(value(tokens,fg),value(tokens,bg)).toFixed(2)}:1`);
    for (const bg of ['--bg-surface','--bg-app']) assert.ok(contrast(value(tokens,'--border-control'),value(tokens,bg)) >= 3);
  });
}
