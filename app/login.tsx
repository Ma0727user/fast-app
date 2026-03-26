/**
 * FAST - Login Screen
 * Tela de autenticação com número de telemóvel e palavra-passe
 */

import { ModalFeedback } from "@/components/ModalFeedback";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Colors, FontSizes, Spacing } from "@/constants/theme";
import { login as authLogin } from "@/services/authService";
import { useStore } from "@/store/useStore";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useStore();

  const [telemovel, setTelemovel] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Estados do Modal de Feedback
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [modalMessage, setModalMessage] = useState("");

  const handleLogin = async () => {
    // Validação básica
    if (!telemovel.trim()) {
      setModalType("error");
      setModalMessage("Por favor, insira o número de telemóvel.");
      setModalVisible(true);
      return;
    }
    if (!password.trim()) {
      setModalType("error");
      setModalMessage("Por favor, insira a palavra-passe.");
      setModalVisible(true);
      return;
    }

    try {
      setIsLoading(true);

      // Chamar API de login
      const user = await authLogin(telemovel, password);

      // Atualizar store com dados do usuário e token
      const token = await SecureStore.getItemAsync("jwt_token");
      console.log(
        "[LoginScreen] Token obtido do SecureStore:",
        token ? "sim" : "não",
      );
      console.log("[LoginScreen] Token comprimento:", token?.length || 0);

      setUser(
        {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          addresses: [],
        },
        token || undefined,
      );

      console.log("[LoginScreen] setUser chamado com id:", user.id);

      // Mostrar mensagem de sucesso
      setModalType("success");
      setModalMessage(`Bem-vindo, ${user.name}!`);
      setModalVisible(true);

      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 2000);
    } catch (err: any) {
      // Tratamento de erros baseado no código HTTP
      const errorMessage =
        err.message || "Erro ao fazer login. Tente novamente.";
      setModalType("error");
      setModalMessage(errorMessage);
      setModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/fast-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Formulário */}
        <View style={styles.form}>
          <Text style={styles.title}>ENTRAR</Text>

          <View style={styles.inputContainer}>
            <Input
              placeholder="Número de telemóvel"
              value={telemovel}
              onChangeText={setTelemovel}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Input
              placeholder="Palavra-passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              showPasswordToggle
            />
          </View>

          <Button
            title={isLoading ? "A entrar..." : "ENTRAR"}
            onPress={handleLogin}
            disabled={isLoading}
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push("/reporpasse")}
          >
            <Text style={styles.forgotPasswordText}>
              Esqueceu a palavra-passe?
            </Text>
          </TouchableOpacity>
        </View>

        {/* Link para registo */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Ainda não tem conta?</Text>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text style={styles.linkText}>Registe-se</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Feedback */}
      <ModalFeedback
        visible={modalVisible}
        variant={modalType}
        message={modalMessage}
        confirmText="OK"
        onConfirm={() => {
          setModalVisible(false);
          if (modalType === "success") {
            router.replace("/(tabs)");
          }
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 140,
    height: 50,
  },
  form: {
    width: "100%",
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: Spacing.xl,
    letterSpacing: 2,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: Spacing.md,
  },
  forgotPasswordText: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  footerText: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
  },
  linkText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: "600",
  },
});
