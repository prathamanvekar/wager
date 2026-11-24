import React from "react";
import { router, Redirect } from "expo-router";
import { Screen, Heading, Row, Section } from "../../components/ui";
import { useMobile } from "../../state/MobileProvider";
export default function Support() {
  const m = useMobile();
  if (!m.session?.customer_id) return <Redirect href="/" />;
  return (
    <Screen>
      <Heading
        title="How can we help?"
        description="Every request gets its own conversation. Your existing cases stay separate."
      />
      <Section>
        <Row
          title="Credit limit request"
          description="Request a change to your available credit."
          icon="card-outline"
          onPress={() =>
            router.push({
              pathname: "/inquiry",
              params: { type: "credit_limit" },
            })
          }
        />
        <Row
          title="Replace a card"
          description="Get help with a lost or damaged card."
          icon="shield-checkmark-outline"
          onPress={() =>
            router.push({
              pathname: "/inquiry",
              params: { type: "card_replacement" },
            })
          }
        />
        <Row
          title="General assistance"
          description="Ask a question or talk through an issue."
          icon="chatbubbles-outline"
          onPress={() =>
            router.push({ pathname: "/inquiry", params: { type: "general" } })
          }
        />
      </Section>
      <Section title="Already started on the web?">
        <Row
          title="Bring your conversation here"
          description="Link your web session to continue on this phone."
          icon="qr-code-outline"
          onPress={() => router.push("/link")}
        />
      </Section>
    </Screen>
  );
}
