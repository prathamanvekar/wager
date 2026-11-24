import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Screen,
  Heading,
  Field,
  Button,
  Panel,
  usePalette,
} from "../components/ui";
import { defaultUrl, useMobile } from "../state/MobileProvider";
export default function Connect() {
  const m = useMobile(),
    t = usePalette();
  const [address, setAddress] = useState(m.url || defaultUrl()),
    [error, setError] = useState("");
  const connect = async () => {
    setError("");
    try {
      await m.connect(address);
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect.");
    }
  };
  return (
    <Screen>
      <View style={{ paddingTop: 20 }}>
        <Ionicons name="git-merge-outline" size={40} color={t.primary} />
      </View>
      <Heading
        title={"One conversation.\nEvery channel."}
        description="Connect this phone to the same Wager server as your web portal. Your cases and messages stay together."
      />
      <Panel>
        <Field
          label="Server address"
          value={address}
          onChangeText={setAddress}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="http://192.168.1.10:8000/api/v1"
          error={error || undefined}
        />
        <Button
          title="Connect to Wager"
          onPress={() => void connect()}
          busy={m.loading}
          icon="arrow-forward"
        />
      </Panel>
      <Text style={{ color: t.muted, lineHeight: 23, fontSize: 14 }}>
        For local testing, keep your phone and computer on the same Wi-Fi and
        start the backend on your computer. Use its local network address, not
        localhost.
      </Text>
      <Text style={{ color: t.muted, lineHeight: 22, fontSize: 13 }}>
        Your connection is saved on this phone. You can change it later in
        Account.
      </Text>
    </Screen>
  );
}
