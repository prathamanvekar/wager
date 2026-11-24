import React from "react";
import { Text, View } from "react-native";
import { router, Redirect } from "expo-router";
import { useMobile } from "../../state/MobileProvider";
import {
  Screen,
  Heading,
  Button,
  Panel,
  Row,
  Section,
  Empty,
  usePalette,
} from "../../components/ui";
export default function Home() {
  const m = useMobile(),
    t = usePalette();
  if (!m.session?.customer_id) return <Redirect href="/" />;
  const active = m.cases.filter((c) => c.status !== "resolved");
  return (
    <Screen refresh>
      <Heading
        title={`Hello, ${m.customer?.fullName.split(" ")[0] || "there"}.`}
        description="Your conversations, without starting over."
      />
      <Panel>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 15, color: t.secondary }}>
            Connected channels
          </Text>
          <Text style={{ fontSize: 12, color: t.primary }}>
            {m.online ? "Up to date" : "On this phone"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: "500", color: t.text }}>
            Web
          </Text>
          <Text style={{ color: t.muted }}>→</Text>
          <Text style={{ fontSize: 16, fontWeight: "500", color: t.primary }}>
            Mobile
          </Text>
        </View>
        <Text style={{ fontSize: 14, lineHeight: 23, color: t.secondary }}>
          Signed-in activity shares one history. To bring an anonymous web
          conversation here, link that web session.
        </Text>
        <Button
          title="Link web session"
          secondary
          icon="qr-code-outline"
          onPress={() => router.push("/link")}
        />
      </Panel>
      <Section title="Continue a conversation">
        {active.length ? (
          active
            .slice(0, 3)
            .map((c) => (
              <Row
                key={c.id}
                title={c.merchant}
                description={`${c.reason} · ${c.messages.length} message${c.messages.length === 1 ? "" : "s"}`}
                onPress={() =>
                  router.push({ pathname: "/case/[id]", params: { id: c.id } })
                }
                icon="chatbubble-ellipses-outline"
              />
            ))
        ) : (
          <Empty
            title="A fresh start."
            description="No active conversations yet. Link a web session or contact support to start one."
          />
        )}
      </Section>
      <Button
        title="Contact support"
        onPress={() => router.push("/(tabs)/support")}
        icon="help-buoy-outline"
      />
      {m.pending.length > 0 && (
        <Text style={{ color: t.warning, lineHeight: 22 }}>
          {m.pending.length} action{m.pending.length === 1 ? " is" : "s are"}{" "}
          waiting to send. Pull down to retry.
        </Text>
      )}
    </Screen>
  );
}
