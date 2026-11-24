import { useCallback, useEffect, useRef, useState } from 'react';

export function useVoice(text: string, enabled: boolean) {
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    utterance.current = null;
    setSpeaking(false);
  }, [supported]);
  const replay = useCallback(() => {
    if (!enabled || !text) return;
    if (!supported) { setError('Spoken prompts are unavailable in this browser. The full call is available in the transcript.'); return; }
    window.speechSynthesis.cancel();
    const next = new SpeechSynthesisUtterance(text);
    next.lang = 'en-US'; next.rate = 0.95;
    utterance.current = next;
    next.onstart = () => { if (utterance.current === next) { setSpeaking(true); setError(null); } };
    next.onend = () => { if (utterance.current === next) setSpeaking(false); };
    next.onerror = event => {
      if (utterance.current !== next) return;
      setSpeaking(false);
      if (!['canceled', 'interrupted'].includes(event.error)) setError('Audio could not play. Read the transcript or press Replay to try again.');
    };
    window.speechSynthesis.speak(next);
  }, [enabled, supported, text]);
  useEffect(() => { replay(); return stop; }, [replay, stop]);
  return { speaking, error, replay, stop, supported };
}
