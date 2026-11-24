import React from "react";
import { router } from "expo-router";
import { Screen, Heading, Button } from "../components/ui";
export default function NotFound() {
  return (
    <Screen>
      <Heading
        title="Let’s get you back."
        description="This screen is not available. Your conversations are still in Wager."
      />
      <Button title="Go home" onPress={() => router.replace("/")} />
    </Screen>
  );
}
