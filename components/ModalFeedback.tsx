/**
 * FAST - Modal Feedback Component
 * Componente reutilizável para feedback de operações
 */

import { Colors, FontSizes, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type ModalVariant = "success" | "error" | "alert";

interface ModalFeedbackProps {
  visible: boolean;
  variant: ModalVariant;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

const getVariantStyles = (variant: ModalVariant) => {
  switch (variant) {
    case "success":
      return {
        icon: "checkmark-circle",
        iconColor: Colors.success,
        title: "Sucesso",
      };
    case "error":
      return {
        icon: "close-circle",
        iconColor: Colors.error,
        title: "Erro",
      };
    case "alert":
      return {
        icon: "warning",
        iconColor: Colors.warning,
        title: "Atenção",
      };
    default:
      return {
        icon: "information-circle",
        iconColor: Colors.primary,
        title: "Informação",
      };
  }
};

export const ModalFeedback: React.FC<ModalFeedbackProps> = ({
  visible,
  variant,
  message,
  confirmText = "OK",
  cancelText,
  onConfirm,
  onCancel,
}) => {
  const variantStyles = getVariantStyles(variant);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* Ícone */}
              <Ionicons
                name={variantStyles.icon as any}
                size={64}
                color={variantStyles.iconColor}
              />

              {/* Mensagem */}
              <Text style={styles.message}>{message}</Text>

              {/* Botões */}
              {variant === "alert" && cancelText ? (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onCancel || (() => {})}
                  >
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={onConfirm}
                  >
                    <Text style={styles.confirmButtonText}>{confirmText}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.singleButton}
                  onPress={onConfirm}
                >
                  <Text style={styles.singleButtonText}>{confirmText}</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Exemplo de uso:
// <ModalFeedback
//   visible={showModal}
//   variant="success" // ou "error" ou "alert"
//   message="Operação realizada com sucesso"
//   onConfirm={() => setShowModal(false)}
// />

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  container: {
    backgroundColor: Colors.background,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    borderRadius: 0,
  },
  message: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    textAlign: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  confirmButton: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  singleButton: {
    width: "100%",
    height: 52,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  singleButtonText: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
