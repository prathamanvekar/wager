import React, { useState } from "react";
import { Text } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Screen, Heading, Field, Button, usePalette } from "../components/ui";
import { useMobile } from "../state/MobileProvider";
import { newId } from "../../../../packages/client/src";
export default function Inquiry() {
  const m = useMobile(),
    t = usePalette(),
    params = useLocalSearchParams<{ type: string }>();
  const type = ["credit_limit", "card_replacement", "general"].includes(
    params.type,
  )
    ? params.type
    : "general";
  const credit = type === "credit_limit";
  const [notes, setNotes] = useState(""),
    [amount, setAmount] = useState("25000"),
    [income, setIncome] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (!m.session?.customer_id) return <Redirect href="/sign-in" />;
  const submit = async () => {
    if (notes.trim().length < 5) {
      setError("Add a little detail so we can help—at least 5 characters.");
      return;
    }
    if (credit && (!Number.isFinite(Number(amount)) || Number(amount) <= 0)) {
      setError("Enter a positive requested credit limit.");
      return;
    }
    if (
      credit &&
      income &&
      (!Number.isFinite(Number(income)) || Number(income) < 0)
    ) {
      setError("Enter a valid annual income.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const id = newId("case");
      const thread = credit
        ? "credit_inquiry"
        : type === "card_replacement"
          ? "card_replacement"
          : "general_support";
      await m.emit(
        "support.inquiry.created",
        {
          case_id: id,
          intent_type: type,
          description: notes.trim(),
          requested_limit: credit ? Number(amount) : undefined,
          annual_income: credit && income ? Number(income) : undefined,
          thread_hint: thread,
        },
        { caseId: id, threadHint: thread },
      );
      router.replace({ pathname: "/case/[id]", params: { id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your request.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <Heading
        title={
          credit
            ? "Credit limit request"
            : type === "card_replacement"
              ? "Replace your card"
              : "Let’s talk."
        }
        description="This starts a separate conversation. Existing disputes and requests stay in their own threads."
      />
      {credit && (
        <>
          <Field
            label="Requested total limit (USD)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          <Field
            label="Annual income (USD, optional)"
            value={income}
            onChangeText={setIncome}
            keyboardType="decimal-pad"
            placeholder="Enter annual income"
          />
        </>
      )}
      <Field
        label={
          type === "card_replacement"
            ? "What happened to your card?"
            : "How can we help?"
        }
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder={
          type === "card_replacement"
            ? "Tell us if it was lost, damaged, or stolen."
            : "Describe what you need help with."
        }
        maxLength={10000}
        style={{ minHeight: 160 }}
        error={error || undefined}
      />
      <Text style={{ color: t.muted, fontSize: 13, lineHeight: 22 }}>
        Your request and any replies will be available in the web portal and on
        this phone.
      </Text>
      <Button
        title={m.online ? "Start conversation" : "Save request for later"}
        busy={busy}
        onPress={() => void submit()}
        icon="arrow-forward"
      />
    </Screen>
  );
}
