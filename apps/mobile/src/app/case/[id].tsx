import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMobile } from "../../state/MobileProvider";
import {
  Screen,
  Heading,
  Button,
  Field,
  Panel,
  Section,
  usePalette,
} from "../../components/ui";
export default function CaseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    m = useMobile(),
    t = usePalette();
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const emitted = useRef<string | null>(null);
  const c = m.cases.find((c) => c.id === id);
  const refresh = m.refresh;
  useEffect(() => {
    void refresh();
  }, [id, refresh]);
  useEffect(() => {
    if (c && emitted.current !== id && m.online) {
      emitted.current = id;
      void m
        .emit(
          "mobile.case.viewed",
          { case_id: id },
          { caseId: id, threadHint: c.threadHint },
        )
        .catch(() => {});
    }
  }, [id, c, m]);
  const send = async () => {
    if (!message.trim() || !c) return;
    setBusy(true);
    setError("");
    try {
      await m.emit(
        "mobile.case.message_sent",
        { case_id: id, content: message.trim(), sender_type: "customer" },
        { caseId: id, threadHint: c.threadHint },
      );
      setMessage("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your message could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  };
  if (!m.session?.customer_id)
    return (
      <Screen>
        <Heading
          title="Sign in to continue"
          description="This conversation belongs to your customer account."
        />
        <Button title="Sign in" onPress={() => router.replace("/sign-in")} />
      </Screen>
    );
  if (!c)
    return (
      <Screen>
        <Heading
          title={
            m.pending.some((e) => e.payload.case_id === id)
              ? "Saved on this phone"
              : "Finding your conversation…"
          }
          description="Pull down to refresh. New inquiries appear here once they reach your shared server."
        />
        {m.refreshing && <ActivityIndicator color={t.primary} />}
        <Button
          title="Refresh conversations"
          secondary
          onPress={() => void m.refresh()}
        />
        <Button
          title="Back to conversations"
          secondary
          onPress={() => router.replace("/(tabs)/cases")}
        />
      </Screen>
    );
  const pending = m.pending.filter(
    (e) =>
      e.payload.case_id === id && e.event_type === "mobile.case.message_sent",
  );
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen refresh>
        <Heading title={c.merchant} description={c.reason} />
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Ionicons name="ellipse" size={7} color={t.primary} />
          <Text style={{ color: t.primary, fontSize: 13 }}>
            {c.status === "resolved" ? "Resolved" : "In progress"}
          </Text>
          <Text style={{ color: t.muted, fontSize: 13 }}>
            · Opened {new Date(c.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {c.threadHint === "billing_dispute" && (
          <Panel>
            <Text style={{ fontSize: 13, color: t.muted }}>
              Disputed transaction
            </Text>
            <Text style={{ fontSize: 26, fontWeight: "500", color: t.text }}>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: c.currency,
              }).format(c.amount)}
            </Text>
            <Text style={{ fontSize: 13, color: t.secondary }}>
              {c.transactionId}
            </Text>
          </Panel>
        )}
        <Section title="Conversation">
          {c.messages.map((item) => (
            <View
              key={item.id}
              style={{
                gap: 10,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: t.border,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <Text
                  style={{ color: t.text, fontSize: 14, fontWeight: "600" }}
                >
                  {item.senderName}
                </Text>
                <Text style={{ color: t.muted, fontSize: 12 }}>
                  {(item as typeof item & { channel?: string }).channel ===
                  "mobile"
                    ? "Mobile"
                    : "Web"}{" "}
                  ·{" "}
                  {new Date(item.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <Text
                selectable
                style={{ color: t.secondary, fontSize: 16, lineHeight: 25 }}
              >
                {item.content}
              </Text>
              {item.attachments?.map((a) => (
                <Text key={a} style={{ color: t.muted, fontSize: 13 }}>
                  {a}
                </Text>
              ))}
            </View>
          ))}
          {pending.map((e) => (
            <Panel key={e.event_id}>
              <Text
                style={{ color: t.secondary, fontSize: 16, lineHeight: 25 }}
              >
                {String(e.payload.content)}
              </Text>
              <Text style={{ color: t.warning, fontSize: 12 }}>
                Waiting to send · saved on this phone
              </Text>
            </Panel>
          ))}
        </Section>
        <Field
          label="Your reply"
          placeholder="Continue the conversation…"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={10000}
          style={{ minHeight: 110 }}
          error={error || undefined}
        />
        <Button
          title={m.online ? "Send reply" : "Save reply to send later"}
          icon={m.online ? "send-outline" : "cloud-upload-outline"}
          disabled={!message.trim()}
          busy={busy}
          onPress={() => void send()}
        />
        <Section title="Journey history">
          {c.timeline.map((item) => (
            <View
              key={item.id}
              style={{ flexDirection: "row", gap: 14, paddingVertical: 12 }}
            >
              <Ionicons
                name={
                  item.channel === "mobile"
                    ? "phone-portrait-outline"
                    : item.actor === "system"
                      ? "git-merge-outline"
                      : "globe-outline"
                }
                size={20}
                color={t.primary}
              />
              <View style={{ flex: 1, gap: 7 }}>
                <Text
                  style={{ color: t.text, fontSize: 14, fontWeight: "500" }}
                >
                  {item.title}
                </Text>
                <Text style={{ color: t.muted, fontSize: 12, lineHeight: 19 }}>
                  {item.channel === "mobile" ? "Mobile" : "Web"} ·{" "}
                  {new Date(item.timestamp).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </Section>
      </Screen>
    </KeyboardAvoidingView>
  );
}
