import React, { useState } from "react";
import { Text, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Screen, Heading, Button, Panel, usePalette } from "../components/ui";
import { useMobile } from "../state/MobileProvider";
export default function SignIn() {
  const m = useMobile(),
    t = usePalette(),
    params = useLocalSearchParams<{ code?: string }>();
  const [selected, setSelected] = useState("C1041"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const signIn = async () => {
    setBusy(true);
    setError("");
    try {
      await m.login(selected);
      router.replace(
        params.code
          ? { pathname: "/link", params: { code: params.code } }
          : "/(tabs)",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <Heading
        title={"Pick up where\nyou left off."}
        description="Sign in to find your conversations across web and mobile."
      />
      <View style={{ gap: 12 }}>
        {m.customers.map((person) => (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === person.id }}
            key={person.id}
            onPress={() => setSelected(person.id)}
            style={{
              borderWidth: 1,
              borderColor: selected === person.id ? t.primary : t.border,
              borderRadius: 16,
              padding: 20,
              minHeight: 88,
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              backgroundColor: selected === person.id ? t.subtle : t.surface,
            }}
          >
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={{ color: t.text, fontWeight: "600", fontSize: 17 }}>
                {person.fullName}
              </Text>
              <Text style={{ color: t.muted, fontSize: 13 }}>
                {person.id} · {person.tier}
              </Text>
            </View>
            <Ionicons
              name={
                selected === person.id ? "radio-button-on" : "radio-button-off"
              }
              size={23}
              color={selected === person.id ? t.primary : t.muted}
            />
          </Pressable>
        ))}
      </View>
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ color: t.error, lineHeight: 22 }}
        >
          {error}
        </Text>
      )}
      {!m.customers.length && (
        <Panel>
          <Text style={{ color: t.secondary, lineHeight: 23 }}>
            Reconnect to load the demo customer accounts.
          </Text>
          <Button
            title="Connection settings"
            secondary
            onPress={() => router.push("/connect")}
          />
        </Panel>
      )}
      <Button
        title="Continue to Wager"
        onPress={() => void signIn()}
        busy={busy}
        disabled={!m.customers.length || !m.online}
        icon="arrow-forward"
      />
      <Text style={{ color: t.muted, fontSize: 13, lineHeight: 22 }}>
        Local demonstration · choose a sample customer. This is not a production
        banking login. Session credentials are stored securely on Android.
      </Text>
    </Screen>
  );
}
