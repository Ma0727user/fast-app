/**
 * FAST - Verificação de Código Screen
 * Verifica o código enviado por SMS após registro
 */

import { Button } from "@/components/ui/Button";
import { InputCode } from "@/components/ui/Input";
import { Colors, FontSizes, Spacing } from "@/constants/theme";
import { verifyCode } from "@/services/authService";
import { useStore } from "@/store/useStore";
import { useLocalSearchParams, useRouter } from "expo-router";
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

export default function VerificacaoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const telemovel = (params.telemovel as string) || "";

  const setUser = useStore((state) => state.setUser);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (!code.trim() || code.length < 4) {
      setError("Por favor, insira o código de 4 dígitos.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // Chamar API de verificação
      const user = await verifyCode(telemovel, code);

      // Atualizar store com dados do usuário
      setUser({
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        addresses: [],
      });

      // Redirecionar para home
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.message || "Código inválido. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    // Aqui poderia chamar um endpoint para reenviar o código
    setError("Código reenviado! Aguarde alguns segundos.");
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
          <Text style={styles.title}>VALIDAR CÓDIGO</Text>

          <Text style={styles.instruction}>
            Por favor, insira o código de 4 dígitos que recebeu por SMS no
            número {telemovel}
          </Text>

          <View style={styles.codeContainer}>
            <InputCode value={code} onChangeText={setCode} length={4} />
          </View>

          <Button
            title={isLoading ? "A verificar..." : "CONFIRMAR"}
            onPress={handleVerify}
            disabled={isLoading}
          />

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Não recebeu o código?</Text>
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}> Reenviar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Link para login */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.backText}>← Voltar ao Login</Text>
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
  instruction: {
    fontSize: FontSizes.md,
    color: Colors.secondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  codeContainer: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.lg,
  },
  resendText: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
  },
  resendLink: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  backText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: "600",
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
