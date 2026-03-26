/**
 * FAST - Orders Stack Layout
 * Configuração de navegação para as telas de pedidos
 */

import { Colors } from "@/constants/theme";
import { Stack } from "expo-router";

export default function OrdersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="MinhasEncomendasScreen" />
      <Stack.Screen name="StatusEncomendaScreen" />
    </Stack>
  );
}
