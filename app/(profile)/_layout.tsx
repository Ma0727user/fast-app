/**
 * FAST - Profile Stack Layout
 * Configuração de navegação para as telas de perfil
 */

import { Colors } from "@/constants/theme";
import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="EditarPerfilScreen" />
    </Stack>
  );
}
