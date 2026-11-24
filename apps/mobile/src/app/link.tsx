import React, { useRef, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  Screen,
  Heading,
  Field,
  Button,
  Panel,
  usePalette,
} from "../components/ui";
import { useMobile } from "../state/MobileProvider";
export default function LinkSession() {
  const m = useMobile(),
    t = usePalette(),
    params = useLocalSearchParams<{ code?: string }>();
  const [enteredCode, setCode] = useState<string | null>(null);
  const code = enteredCode ?? params.code ?? "";
  const [scanning, setScanning] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [permission, requestPermission] = useCameraPermissions();
  const scanLock = useRef(false);
  const scan = async () => {
    setError("");
    scanLock.current = false;
    if (permission?.granted) {
      setScanning(true);
      return;
    }
    const result = await requestPermission();
    if (result.granted) setScanning(true);
    else
      setError(
        "Camera access was not allowed. You can enter the code below instead.",
      );
  };
  const scanned = ({ data }: { data: string }) => {
    if (scanLock.current) return;
    try {
      const uri = new URL(data);
      if (uri.protocol !== "wager:" || uri.hostname !== "handoff")
        throw new Error("Not a Wager code");
      const value = uri.searchParams.get("code");
      if (!value || !/^[A-Fa-f0-9]{16}$/.test(value))
        throw new Error("Invalid code");
      scanLock.current = true;
      setCode(value);
      setScanning(false);
      setError("");
    } catch {
      scanLock.current = true;
      setScanning(false);
      setError(
        "That is not a Wager handoff code. Generate one in the web portal.",
      );
    }
  };
  const claim = async () => {
    const normalized = code.replace(/[\s-]/g, "").toUpperCase();
    if (!/^[A-F0-9]{16}$/.test(normalized)) {
      setError("Enter the 16-character code shown in the web portal.");
      return;
    }
    if (!m.session?.customer_id) {
      router.push({ pathname: "/sign-in", params: { code: normalized } });
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await m.client!.redeemHandoff(normalized);
      await m.refresh();
      m.notify(
        result.bound_events
          ? `Connected ${result.bound_events} earlier web event${result.bound_events === 1 ? "" : "s"}. Your conversations are ready.`
          : result.message,
      );
      router.replace("/(tabs)/cases");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not link this session.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <Heading
        title={"Bring the conversation\nwith you."}
        description="In the web portal, choose Continue on mobile. Scan its QR code or enter the handoff code here."
      />
      {scanning ? (
        <View style={{ height: 300, borderRadius: 16, overflow: "hidden" }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scanned}
          />
        </View>
      ) : (
        <Panel>
          <Text style={{ color: t.secondary, lineHeight: 24, fontSize: 15 }}>
            Connect only a web session that belongs to you. Your earlier
            inquiries will become part of{" "}
            {m.customer?.fullName
              ? `${m.customer.fullName}’s`
              : "your signed-in"}{" "}
            account.
          </Text>
          <Button
            title="Scan QR code"
            icon="scan-outline"
            onPress={() => void scan()}
            secondary
          />
        </Panel>
      )}
      {scanning && (
        <Button
          title="Cancel scan"
          secondary
          onPress={() => setScanning(false)}
        />
      )}
      <Field
        label="Handoff code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder="AB12 CD34 EF56 7890"
        maxLength={32}
        error={error || undefined}
      />
      <Button
        title={
          m.session?.customer_id
            ? "Connect web conversation"
            : "Sign in to connect"
        }
        icon="git-merge-outline"
        busy={busy}
        disabled={!code.trim() || !m.online}
        onPress={() => void claim()}
      />
      <Text style={{ color: t.muted, fontSize: 13, lineHeight: 22 }}>
        Codes expire after 5 minutes and can be used once. Linking records an
        identity change while keeping the original web history intact.
      </Text>
    </Screen>
  );
}
