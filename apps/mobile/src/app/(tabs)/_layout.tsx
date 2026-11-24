import React from "react";
import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { usePalette } from "../../components/ui";
export default function TabLayout() {
  const t = usePalette();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.background },
        headerTintColor: t.text,
        headerShadowVisible: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.border },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "500" },
        tabBarItemStyle: { minHeight: 48 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: "Wager",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              color={typeof color === "string" ? color : t.muted}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: "Conversations",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="chatbubbles-outline"
              color={typeof color === "string" ? color : t.muted}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: "Support",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="help-buoy-outline"
              color={typeof color === "string" ? color : t.muted}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-outline"
              color={typeof color === "string" ? color : t.muted}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
