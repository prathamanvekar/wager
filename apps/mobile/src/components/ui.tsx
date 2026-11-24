import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
  type TextInputProps,
  type ViewStyle,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMobile } from "../state/MobileProvider";
export const light = {
  background: "#f7f8f7",
  surface: "#ffffff",
  subtle: "#edf3ee",
  text: "#202b25",
  secondary: "#4d5d53",
  muted: "#627268",
  border: "#dce4de",
  primary: "#176b55",
  onPrimary: "#ffffff",
  warning: "#8b571d",
  warningBg: "#fff3df",
  error: "#b42318",
};
export const dark = {
  background: "#121a15",
  surface: "#1c2720",
  subtle: "#24342a",
  text: "#e8eee9",
  secondary: "#c1d0c5",
  muted: "#a1b5a7",
  border: "#3c4f41",
  primary: "#90d5ae",
  onPrimary: "#113321",
  warning: "#efc47c",
  warningBg: "#342b1d",
  error: "#ffb4a8",
};
export function usePalette() {
  return useColorScheme() === "dark" ? dark : light;
}
export function Screen({
  children,
  refresh = false,
}: {
  children: React.ReactNode;
  refresh?: boolean;
}) {
  const t = usePalette(),
    m = useMobile();
  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={{ flex: 1, backgroundColor: t.background }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.screen}
        refreshControl={
          refresh ? (
            <RefreshControl
              refreshing={m.refreshing}
              onRefresh={() => void m.refresh()}
              tintColor={t.primary}
            />
          ) : undefined
        }
      >
        {!m.online && m.client && (
          <View style={[styles.notice, { backgroundColor: t.warningBg }]}>
            <Ionicons
              name="cloud-offline-outline"
              size={18}
              color={t.warning}
            />
            <Text
              style={{
                color: t.warning,
                flex: 1,
                fontSize: 13,
                lineHeight: 20,
              }}
            >
              Offline · showing saved conversations
              {m.pending.length ? ` · ${m.pending.length} waiting to send` : ""}
            </Text>
          </View>
        )}
        {m.error && m.client && (
          <Text
            accessibilityRole="alert"
            style={{ color: t.error, fontSize: 13, lineHeight: 20 }}
          >
            {m.error}
          </Text>
        )}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Heading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const t = usePalette();
  return (
    <View style={{ gap: 12, marginBottom: 8 }}>
      <Text
        accessibilityRole="header"
        style={{
          fontSize: 30,
          lineHeight: 37,
          fontWeight: "600",
          letterSpacing: -0.8,
          color: t.text,
        }}
      >
        {title}
      </Text>
      {description && (
        <Text style={{ fontSize: 15, lineHeight: 24, color: t.secondary }}>
          {description}
        </Text>
      )}
    </View>
  );
}
export function Section({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const t = usePalette();
  return (
    <View style={{ gap: 16 }}>
      {title && (
        <Text
          accessibilityRole="header"
          style={{ color: t.text, fontSize: 18, fontWeight: "600" }}
        >
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  busy = false,
  disabled = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  busy?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
}) {
  const t = usePalette();
  const color = secondary ? t.primary : t.onPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      accessibilityLabel={title}
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => ({
        minHeight: 50,
        borderRadius: 12,
        paddingHorizontal: 18,
        paddingVertical: 14,
        backgroundColor: secondary ? t.subtle : t.primary,
        opacity: disabled || busy ? 0.5 : pressed ? 0.8 : 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      })}
    >
      {busy ? (
        <ActivityIndicator color={color} />
      ) : icon ? (
        <Ionicons name={icon} size={19} color={color} />
      ) : null}
      <Text
        style={{
          color,
          fontSize: 15,
          fontWeight: "600",
          flexShrink: 1,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const t = usePalette();
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: t.text, fontSize: 14, fontWeight: "500" }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={t.muted}
        selectionColor={t.primary}
        {...props}
        style={[
          {
            borderWidth: 1,
            borderColor: error ? t.error : t.border,
            color: t.text,
            backgroundColor: t.surface,
            borderRadius: 12,
            padding: 15,
            minHeight: 52,
            fontSize: 16,
            textAlignVertical: props.multiline ? "top" : "center",
          },
          props.style,
        ]}
      />
      {error && (
        <Text
          accessibilityRole="alert"
          style={{ color: t.error, fontSize: 13 }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
export function Panel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const t = usePalette();
  return (
    <View
      style={[
        {
          padding: 20,
          borderRadius: 16,
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.border,
          gap: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Row({
  title,
  description,
  icon,
  onPress,
  trailing,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  onPress?: () => void;
  trailing?: string;
}) {
  const t = usePalette();
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        minHeight: 64,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: t.border,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {icon && <Ionicons name={icon} size={22} color={t.primary} />}
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={{ fontSize: 16, fontWeight: "500", color: t.text }}>
          {title}
        </Text>
        {description && (
          <Text style={{ fontSize: 13, lineHeight: 20, color: t.muted }}>
            {description}
          </Text>
        )}
      </View>
      {trailing && (
        <Text style={{ color: t.primary, fontSize: 12 }}>{trailing}</Text>
      )}
      {onPress && <Ionicons name="chevron-forward" size={18} color={t.muted} />}
    </Pressable>
  );
}
export function Empty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const t = usePalette();
  return (
    <View style={{ paddingVertical: 32, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "500", color: t.text }}>
        {title}
      </Text>
      <Text style={{ fontSize: 15, lineHeight: 24, color: t.muted }}>
        {description}
      </Text>
    </View>
  );
}
export function Feedback() {
  const m = useMobile(),
    t = usePalette();
  if (!m.notice) return null;
  return (
    <View
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 96,
        backgroundColor: t.text,
        borderRadius: 14,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Text
        accessibilityRole="alert"
        style={{ color: t.background, flex: 1, lineHeight: 21, fontSize: 14 }}
      >
        {m.notice}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
        hitSlop={12}
        onPress={() => m.notify(null)}
        style={{
          minWidth: 48,
          minHeight: 48,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="close" size={20} color={t.background} />
      </Pressable>
    </View>
  );
}
export const styles = StyleSheet.create({
  screen: {
    padding: 24,
    gap: 28,
    paddingBottom: 48,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
});
