/**
 * FAST - Repor Palavra-passe Screen
 * Dois passos: 1) Telefone 2) Código SMS
 */

import { ModalFeedback } from "@/components/ModalFeedback";
import { Button } from "@/components/ui/Button";
import { Input, InputCode } from "@/components/ui/Input";

import { Colors, FontSizes, Spacing } from "@/constants/theme";
import { sendRecoveryCode, verifyRecoveryCode } from "@/services/authService";
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

export default function ReporPasseScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [telefone, setTelefone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error" | "alert">(
    "error",
  );
  const [modalMessage, setModalMessage] = useState("");

  const showModal = (type: "success" | "error", message: string) => {
    setModalType(type);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleTelefoneSubmit = async () => {
    if (telefone.length < 9) {
      showModal("error", "Por favor, insira um número de telemóvel válido");
      return;
    }

    setLoading(true);
    try {
      const result = await sendRecoveryCode(telefone);

      if (result.success) {
        // Avançar para o passo do código
        setStep(2);
      } else {
        showModal("error", result.message);
      }
    } catch (error: any) {
      showModal("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async () => {
    if (code.length !== 4) {
      showModal("error", "Por favor, insira o código de 4 dígitos");
      return;
    }

    setLoading(true);
    try {
      const result = await verifyRecoveryCode(telefone, code);

      if (result.success) {
        showModal(
          "success",
          "Código verificado! Agora pode criar uma nova senha.",
        );
        // Aqui você pode redirecionar para uma tela de nova senha
        setTimeout(() => {
          router.replace("/login");
        }, 2000);
      }
    } catch (error: any) {
      showModal("error", error.message);
    } finally {
      setLoading(false);
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
          {step === 1 ? (
            // Passo 1: Telefone
            <>
              <Text style={styles.title}>RECUPERAR PALAVRA-PASSE</Text>

              <Text style={styles.instruction}>
                Por favor, digite o número de telefone associado à sua conta
              </Text>

              <Input
                label="TELEMÓVEL"
                placeholder="Ex: 900 000 000"
                value={telefone}
                onChangeText={setTelefone}
                keyboardType="phone-pad"
              />

              <Button
                title={loading ? "A ENVIAR..." : "CONFIRMAR"}
                onPress={handleTelefoneSubmit}
                disabled={loading}
              />
            </>
          ) : (
            // Passo 2: Código SMS
            <>
              <Text style={styles.title}>VALIDAR CÓDIGO</Text>

              <Text style={styles.instruction}>
                Por favor, insira o código de 4 dígitos que recebeu por SMS
              </Text>

              <View style={styles.codeContainer}>
                <InputCode value={code} onChangeText={setCode} length={4} />
              </View>

              <Button
                title={loading ? "A VERIFICAR..." : "CONFIRMAR"}
                onPress={handleCodeSubmit}
                disabled={loading}
              />

              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Não recebeu o código?</Text>
                <TouchableOpacity onPress={() => setStep(1)}>
                  <Text style={styles.resendLink}> Reenviar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Link para login */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.backText}>← Voltar ao Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Feedback */}
      <ModalFeedback
        visible={modalVisible}
        variant={modalType}
        message={modalMessage}
        onConfirm={() => setModalVisible(false)}
      />
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
});
