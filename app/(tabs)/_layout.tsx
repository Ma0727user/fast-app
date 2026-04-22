/**
 * FAST - Tab Layout
 * Configuração da Bottom Tab Navigation
 */

import { Colors } from "@/constants/theme";
import { useStore } from "@/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const cartItemCount = useStore((state) => state.getCartItemCount());
  const pathname = usePathname();
  const isDarkScreen = pathname?.includes("ProdutoAngola");

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDarkScreen ? Colors.white : Colors.primary,
        tabBarInactiveTintColor: isDarkScreen
          ? "rgba(255,255,255,0.5)"
          : Colors.secondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDarkScreen ? "#0a0a0a" : Colors.background,
          borderTopColor: isDarkScreen
            ? "rgba(255,255,255,0.1)"
            : Colors.lightGray,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="PesquisarScreen"
        options={{
          title: "Pesquisar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="CategoriasScreen"
        options={{
          title: "Menu",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="CarrinhoScreen"
        options={{
          title: "Carrinho",
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="bag-outline" size={size} color={color} />
              {cartItemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="PerfilScreen"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Telas internas - não aparecem na tab bar mas mantêm ela visível */}
      <Tabs.Screen name="NotificacoesScreen" options={{ href: null }} />
      <Tabs.Screen name="MinhasEncomendasScreen" options={{ href: null }} />
      <Tabs.Screen name="StatusEncomendaScreen" options={{ href: null }} />
      <Tabs.Screen name="ProductDetailScreen" options={{ href: null }} />
      <Tabs.Screen name="ProdutoAngolaScreen" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
});
