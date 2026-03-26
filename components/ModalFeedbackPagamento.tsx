/**
 * FAST - Modal de Feedback de Pagamento
 * Modal para mostrar sucesso ou erro do pagamento
 */

import { Colors, FontSizes, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ModalFeedbackPagamentoProps {
  visible: boolean;
  tipo: "sucesso" | "erro";
  onClose: () => void;
  onVerEncomendas?: () => void;
}

export const ModalFeedbackPagamento: React.FC<ModalFeedbackPagamentoProps> = ({
  visible,
  tipo,
  onClose,
  onVerEncomendas,
}) => {
  const isSuccess = tipo === "sucesso";

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Ícone */}
          <View
            style={[
              styles.iconContainer,
              isSuccess ? styles.iconSuccess : styles.iconError,
            ]}
          >
            <Ionicons
              name={isSuccess ? "checkmark-circle" : "alert-circle"}
              size={60}
              color={isSuccess ? Colors.success : Colors.error}
            />
          </View>

          {/* Título */}
          <Text style={styles.title}>
            {isSuccess ? "Pagamento Efetuado!" : "Erro no Pagamento"}
          </Text>

          {/* Mensagem */}
          <Text style={styles.message}>
            {isSuccess
              ? "O seu pagamento foi processado com sucesso. A sua encomenda está a ser preparada!"
              : "Ocorreu um erro ao processar o seu pagamento. Por favor, tente novamente."}
          </Text>

          {/* Botão */}
          <TouchableOpacity
            style={[
              styles.button,
              isSuccess ? styles.buttonSuccess : styles.buttonError,
            ]}
            onPress={isSuccess ? onVerEncomendas : onClose}
          >
            <Text style={styles.buttonText}>
              {isSuccess ? "Ver Encomendas" : "Tentar Novamente"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconSuccess: {
    backgroundColor: Colors.success + "20",
  },
  iconError: {
    backgroundColor: Colors.error + "20",
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  message: {
    fontSize: FontSizes.md,
    color: Colors.secondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
    width: "100%",
  },
  buttonSuccess: {
    backgroundColor: Colors.primary,
  },
  buttonError: {
    backgroundColor: Colors.error,
  },
  buttonText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 1,
  },
});
