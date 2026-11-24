import React, { useState } from "react";
import { Text } from "react-native";
import { router, Redirect } from "expo-router";
import {
  Screen,
  Heading,
  Panel,
  Row,
  Button,
  usePalette,
} from "../../components/ui";
import { useMobile } from "../../state/MobileProvider";
export default function Account() {
  const m = useMobile(),
    t = usePalette();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (!m.session?.customer_id) return <Redirect href="/" />;
  const signOut = async () => {
    setBusy(true);
    try {
      await m.logout();
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign out.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <Heading
        title="Your account"
        description="One identity across your connected channels."
      />
      <Panel>
        <Text style={{ color: t.text, fontWeight: "600", fontSize: 22 }}>
          {m.customer?.fullName || m.session.customer_id}
        </Text>
        <Text style={{ color: t.muted, fontSize: 14 }}>
          {m.session.customer_id} · {m.customer?.tier}
        </Text>
        <Text style={{ color: t.secondary, fontSize: 14 }}>
          Account ending {m.customer?.accountNumber.slice(-4) || "—"}
        </Text>
      </Panel>
      <Row
        title="Link web session"
        description="Connect a conversation started before sign-in."
        icon="qr-code-outline"
        onPress={() => router.push("/link")}
      />
      <Row
        title="Connection"
        description={`${m.online ? "Connected" : "Offline"} · ${m.url}`}
        icon="server-outline"
        onPress={() => router.push("/connect")}
      />
      <Row
        title="Sync conversations"
        description={
          m.pending.length
            ? `${m.pending.length} pending actions`
            : "Refresh your shared history"
        }
        icon="sync-outline"
        onPress={() => void m.refresh()}
      />
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ color: t.error, lineHeight: 22 }}
        >
          {error}
        </Text>
      )}
      <Button
        title="Sign out"
        secondary
        busy={busy}
        onPress={() => void signOut()}
      />
      <Text style={{ color: t.muted, lineHeight: 22, fontSize: 13 }}>
        Wager · Mobile channel\nLocal demonstration. Case history is stored on
        your shared server, with a record of when each event occurred and when
        it became known.
      </Text>
    </Screen>
  );
}
