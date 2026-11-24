import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { MobileProvider } from "../state/MobileProvider";
import { Feedback, usePalette } from "../components/ui";
function Navigation() {
  const t = usePalette(),
    dark = useColorScheme() === "dark";
  return (
    <>
      <StatusBar style={dark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.background },
          headerTintColor: t.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: t.background },
          headerTitleStyle: { fontSize: 17, fontWeight: "600" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="connect" options={{ title: "Connect to Wager" }} />
        <Stack.Screen name="sign-in" options={{ title: "Your account" }} />
        <Stack.Screen name="case/[id]" options={{ title: "Conversation" }} />
        <Stack.Screen name="link" options={{ title: "Link web session" }} />
        <Stack.Screen name="handoff" options={{ title: "Link web session" }} />
        <Stack.Screen name="inquiry" options={{ title: "Contact support" }} />
      </Stack>
      <Feedback />
    </>
  );
}
export default function Layout() {
  return (
    <SafeAreaProvider>
      <MobileProvider>
        <Navigation />
      </MobileProvider>
    </SafeAreaProvider>
  );
}
