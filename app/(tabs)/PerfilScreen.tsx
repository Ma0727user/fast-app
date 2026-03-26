/**
 * FAST - Perfil Screen
 * Perfil do utilizador com opções de gestão
 */

import { Colors, FontSizes, Spacing } from "@/constants/theme";
import { useStore } from "@/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OPCOES_PERFIL = [
  {
    id: "1",
    name: "Meus Pedidos",
    icon: "receipt-outline",
    route: "/(tabs)/MinhasEncomendasScreen",
  },
  {
    id: "2",
    name: "Editar Perfil",
    icon: "person-outline",
    route: "/(profile)/EditarPerfilScreen",
  },
  {
    id: "4",
    name: "Perguntas Frequentes",
    icon: "help-circle-outline",
    route: "/(info)/FaqScreen",
  },
  {
    id: "5",
    name: "Termos e Condições",
    icon: "document-text-outline",
    route: "/(info)/TermosECondicoes",
  },
];

export default function PerfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useStore((state) => state.user);
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  // Atualizar dados quando a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      // Dados são atualizados automaticamente pelo Zustand
    }, []),
  );

  const handleOptionPress = (route: string) => {
    router.push(route as any);
  };

  const handleLogout = () => {
    router.replace("/login");
  };

  // Dados do usuário ou valores padrão
  const userName = user?.name || "João Manuel";
  const userPhone = user?.phone || "+244 900 000 000";

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/fast-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Perfil Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userPhone}>{userPhone}</Text>
        </View>

        {/* Opções */}
        <View style={styles.opcoesContainer}>
          {OPCOES_PERFIL.map((opcao) => (
            <TouchableOpacity
              key={opcao.id}
              style={styles.opcaoItem}
              onPress={() => handleOptionPress(opcao.route)}
            >
              <View style={styles.opcaoLeft}>
                <Ionicons
                  name={opcao.icon as any}
                  size={22}
                  color={Colors.primary}
                />
                <Text style={styles.opcaoText}>{opcao.name}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.secondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sair */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={Colors.error} />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>

        {/* Versão */}
        <Text style={styles.version}>FAST v1.0.0</Text>
      </ScrollView>

      {/* Padding bottom para safe area */}
      <View style={{ height: 60 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  logo: {
    width: 100,
    height: 40,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  userName: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    color: Colors.primary,
  },
  userPhone: {
    fontSize: FontSizes.md,
    color: Colors.secondary,
    marginTop: Spacing.xs,
  },
  opcoesContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  opcaoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  opcaoLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  opcaoText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    marginLeft: Spacing.md,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: FontSizes.md,
    color: Colors.error,
    fontWeight: "600",
    marginLeft: Spacing.sm,
  },
  version: {
    fontSize: FontSizes.xs,
    color: Colors.lightGray,
    textAlign: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
});
