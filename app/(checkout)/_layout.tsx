/**
 * FAST - Checkout Stack Layout
 * Configuração de navegação para as telas de checkout
 */

import { Colors } from "@/constants/theme";
import { Stack } from "expo-router";

export default function CheckoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="DadosEntregaScreen" />
      <Stack.Screen name="ResumoCompraScreen" />
      <Stack.Screen name="MetodoPagamentoScreen" />
      <Stack.Screen name="TransferenciaScreen" />
    </Stack>
  );
}
