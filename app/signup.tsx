/**
 * FAST - Signup Screen
 * Tela de registo com campos: Nome Completo, Telemóvel, Palavra-passe
 */

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Colors, FontSizes, Spacing } from "@/constants/theme";
import { register } from "@/services/authService";
import { useStore } from "@/store/useStore";
import { useRouter } from "expo-router";
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

export default function SignupScreen() {
  const router = useRouter();
  const setUser = useStore((state) => state.setUser);
  const [nome, setNome] = useState("");
  const [telemovel, setTelemovel] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    // Validação
    if (!nome.trim()) {
      setError("Por favor, insira o seu nome.");
      return;
    }
    if (!telemovel.trim()) {
      setError("Por favor, insira o número de telemóvel.");
      return;
    }
    if (!password.trim()) {
      setError("Por favor, insira a palavra-passe.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As palavras-passe não coincidem.");
      return;
    }
    if (password.length < 4) {
      setError("A palavra-passe deve ter pelo menos 4 caracteres.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // Chamar API de registro
      const result = await register(nome, telemovel, password);

      // Mostrar mensagem de sucesso
      alert(result.message);

      // Redirecionar para verificação de código
      router.replace("/verificacao?telemovel=" + telemovel);
    } catch (err: any) {
      setError(err.message || "Erro ao registar. Tente novamente.");
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
          <Text style={styles.title}>CRIAR CONTA</Text>

          <View style={styles.inputContainer}>
            <Input
              placeholder="Nome Completo"
              value={nome}
              onChangeText={setNome}
            />
          </View>

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

          <View style={styles.inputContainer}>
            <Input
              placeholder="Confirmar Palavra-passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              showPasswordToggle
            />
          </View>

          <Button
            title={isLoading ? "A registar..." : "REGISTAR"}
            onPress={handleSignup}
            disabled={isLoading}
          />

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.terms}>
            <Text style={styles.termsText}>
              Ao registar-se, aceita os nossos{" "}
              <Text
                style={styles.linkText}
                onPress={() => router.push("/(info)/TermosECondicoes")}
              >
                Termos e Condições
              </Text>
            </Text>
          </View>
        </View>

        {/* Link para login */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Já tem conta?</Text>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.linkText}>Entre</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
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
  terms: {
    marginTop: Spacing.md,
    alignItems: "center",
  },
  termsText: {
    fontSize: FontSizes.xs,
    color: Colors.secondary,
    textAlign: "center",
  },
  linkText: {
    color: Colors.primary,
    fontWeight: "600",
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
  errorContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    textAlign: "center",
  },
});
