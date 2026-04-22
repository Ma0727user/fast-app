/**
 * FAST - Politica de Privacidade
 * Tela com informacoes sobre tratamento de dados pessoais.
 */

import { Colors, FontSizes, Spacing } from "@/constants/theme";
import { getPolitica } from "@/services/authService";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function PoliticaPrivacidade() {
  const insets = useSafeAreaInsets();
  const [conteudoPolitica, setConteudoPolitica] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolitica = async () => {
      try {
        const politicas = await getPolitica();

        if (!politicas.length) {
          setConteudoPolitica(
            "A Politica de Privacidade nao esta disponivel no momento.",
          );
          return;
        }

        const descricaoCombinada = politicas
          .map((item) => item.descricao?.trim() || "")
          .filter((item) => item.length > 0)
          .join("\n\n");

        setConteudoPolitica(
          descricaoCombinada ||
            "A Politica de Privacidade nao esta disponivel no momento.",
        );
      } catch (error) {
        console.error("Erro ao carregar politica:", error);
        setConteudoPolitica(
          "Nao foi possivel carregar a Politica de Privacidade.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPolitica();
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "POLITICA DE PRIVACIDADE",
          headerTitleStyle: styles.headerTitle,
          headerStyle: styles.header,
          headerTintColor: Colors.primary,
          headerBackTitle: "Voltar",
        }}
      />
      <SafeAreaView
        style={styles.container}
        edges={["top", "bottom", "left", "right"]}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Spacing.xxl + insets.bottom },
          ]}
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.title}>POLITICA DE PRIVACIDADE</Text>

          <Text style={styles.text}>
            {loading ? "A carregar politica..." : conteudoPolitica}
          </Text>

          <Text style={styles.lastUpdate}>Ultima atualizacao: Abril 2026</Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: Colors.primary,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  text: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    lineHeight: 22,
    textAlign: "justify",
  },
  lastUpdate: {
    fontSize: FontSizes.xs,
    color: Colors.lightGray,
    marginTop: Spacing.xl,
    textAlign: "center",
  },
});
