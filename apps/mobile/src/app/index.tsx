import React from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useMobile } from "../state/MobileProvider";
import { usePalette } from "../components/ui";
export default function Index() {
  const m = useMobile(),
    t = usePalette();
  if (m.loading)
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: t.background,
        }}
      >
        <ActivityIndicator
          accessibilityLabel="Opening Wager"
          color={t.primary}
        />
      </View>
    );
  if (!m.client || !m.session) return <Redirect href="/connect" />;
  if (!m.session.customer_id) return <Redirect href="/sign-in" />;
  return <Redirect href="/(tabs)" />;
}
