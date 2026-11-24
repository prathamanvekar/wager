import React from "react";
import { Text, View } from "react-native";
import { router, Redirect } from "expo-router";
import { useMobile } from "../../state/MobileProvider";
import {
  Screen,
  Heading,
  Row,
  Empty,
  Button,
  usePalette,
} from "../../components/ui";
export default function Cases() {
  const m = useMobile(),
    t = usePalette();
  if (!m.session?.customer_id) return <Redirect href="/" />;
  return (
    <Screen refresh>
      <Heading
        title="Your conversations"
        description="The same cases. The full context. Wherever you started."
      />
      {m.cases.length ? (
        <View>
          {m.cases.map((c) => (
            <Row
              key={c.id}
              title={c.merchant}
              description={`${c.reason}\n${new Date(c.createdAt).toLocaleDateString()} · ${c.timeline.some((e) => e.channel === "web") ? "Web" : "Mobile"}${c.timeline.some((e) => e.channel === "mobile") ? " + Mobile" : ""}`}
              trailing={c.status === "resolved" ? "Resolved" : "In progress"}
              onPress={() =>
                router.push({ pathname: "/case/[id]", params: { id: c.id } })
              }
            />
          ))}
        </View>
      ) : (
        <Empty
          title="Nothing to follow up on yet."
          description="Start an inquiry, or link the web session where you opened a case."
        />
      )}
      {m.pending
        .filter((e) => e.event_type === "support.inquiry.created")
        .map((e) => (
          <Row
            key={e.event_id}
            title="Inquiry waiting to send"
            description={String(e.payload.description || "Saved on this phone")}
            icon="cloud-upload-outline"
          />
        ))}
      {m.error && <Text style={{ color: t.error }}>{m.error}</Text>}
      <Button
        title="Link a web conversation"
        secondary
        icon="qr-code-outline"
        onPress={() => router.push("/link")}
      />
    </Screen>
  );
}
