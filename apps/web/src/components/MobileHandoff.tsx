import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Smartphone, Copy, Check } from "lucide-react";
import { Modal } from "../design-system/Modal";
import { Button } from "../design-system/Button";
import { useSession } from "../context/SessionContext";
import { apiClient } from "../services/api";
import type { Handoff } from "../../../../packages/contracts/src";
export function MobileHandoff() {
  const { isLoggedIn, isReady } = useSession();
  const [open, setOpen] = useState(false),
    [handoff, setHandoff] = useState<Handoff | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [copied, setCopied] = useState(false);
  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      setHandoff(await apiClient.createHandoff());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create a handoff.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button
        className="mobile-handoff-trigger"
        variant="outline"
        size="sm"
        leftIcon={<Smartphone size={14} />}
        disabled={!isReady}
        onClick={() => {
          setOpen(true);
          if (!isLoggedIn) void generate();
        }}
      >
        Continue on mobile
      </Button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Continue on your phone"
        subtitle="Your conversation travels with you."
        maxWidth="460px"
        footer={
          <Button variant="outline" onClick={() => setOpen(false)}>
            Done
          </Button>
        }
      >
        {isLoggedIn ? (
          <p>
            Your cases are already connected to your account. Sign in to the
            Wager mobile app with the same customer to pick up where you left
            off.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
              In the mobile app, sign in and choose{" "}
              <strong>Link web session</strong>. Scan this code or enter the
              handoff code below. Your earlier web inquiries will be connected
              to that account.
            </p>
            {busy && <p role="status">Preparing your handoff…</p>}
            {error && (
              <p role="alert" style={{ color: "var(--color-danger)" }}>
                {error}
              </p>
            )}
            {!busy && handoff && (
              <>
                <div
                  style={{
                    alignSelf: "center",
                    padding: 16,
                    background: "#fff",
                    borderRadius: 12,
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <QRCodeSVG
                    value={handoff.uri}
                    size={180}
                    title="Wager session handoff"
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await navigator.clipboard.writeText(handoff.code);
                    setCopied(true);
                  }}
                  rightIcon={copied ? <Check size={14} /> : <Copy size={14} />}
                >
                  {handoff.code.match(/.{1,4}/g)?.join(" ")}
                </Button>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Expires at{" "}
                  {new Date(handoff.expires_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  . This code works once. Only share it with the person
                  continuing this conversation.
                </p>
              </>
            )}
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => void generate()}
            >
              Generate a new code
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
