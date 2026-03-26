/**
 * FAST - Root Layout
 * Configuração principal de navegação com React Native Paper
 */

import { Colors, DarkTheme, LightTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const theme = isDark ? DarkTheme : LightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar
          style={isDark ? "light" : "dark"}
          backgroundColor={isDark ? Colors.black : Colors.background}
        />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: isDark ? Colors.black : Colors.background,
            },
            animation: "slide_from_right",
          }}
        >
          {/* Group Routes - these need explicit definitions */}
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(shop)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(checkout)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(profile)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(info)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(orders)"
            options={{
              headerShown: false,
            }}
          />
          {/* Individual routes are auto-detected from file-based routing:
              - app/index.tsx -> "index"
              - app/login.tsx -> "login"
              - app/signup.tsx -> "signup"
              - app/reporpasse.tsx -> "reporpasse"
              - app/verificacao.tsx -> "verificacao"
          */}
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
