/**
 * FAST - Info Stack Layout
 * Configuração de navegação para telas informativas
 */

import { Colors } from "@/constants/theme";
import { Stack } from "expo-router";

export default function InfoLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="TermosECondicoes" />
      <Stack.Screen name="PoliticaPrivacidade" />
      <Stack.Screen name="FaqScreen" />
    </Stack>
  );
}
