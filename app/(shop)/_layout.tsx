/**
 * FAST - Shop Stack Layout
 * Configuração de navegação para as telas de produtos
 */

import { Colors } from "@/constants/theme";
import { Stack } from "expo-router";

export default function ShopLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="ProductGridScreen" />
      <Stack.Screen name="ProductDetailScreen" />
    </Stack>
  );
}
