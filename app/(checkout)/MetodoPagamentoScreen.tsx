/**
 * FAST - Método de Pagamento Screen
 * Seleção do método de pagamento
 */

import { ModalFeedbackPagamento } from "@/components/ModalFeedbackPagamento";
import { Button } from "@/components/ui/Button";
import { Colors, FontSizes, formatPrice, Spacing } from "@/constants/theme";
import { verificarPagamento } from "@/services/carrinhoService";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TipoPagamento = "referencia" | "cartao";

// Valores padrão quando não há dados
const DADOS_DEFAULT = {
  entidade: "01068",
  referencia: "A gerar",
  total: 0,
  idPedido: 0,
  referenciaPagamento: "",
};

export default function MetodoPagamentoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [selectedMethod, setSelectedMethod] =
    useState<TipoPagamento>("referencia");
  const [modalVisible, setModalVisible] = useState(false);
  const [feedbackTipo, setFeedbackTipo] = useState<"sucesso" | "erro">(
    "sucesso",
  );
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<
    "entidade" | "referencia" | null
  >(null);

  const copiar = async (valor: string, campo: "entidade" | "referencia") => {
    await Clipboard.setStringAsync(valor);
    setCopiedField(campo);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Dados recebidos da tela anterior
  const dadosPagamento = {
    entidade: (params.entidade as string) || DADOS_DEFAULT.entidade,
    referencia: (params.referencia as string) || DADOS_DEFAULT.referencia,
    total: params.total
      ? parseFloat(params.total as string)
      : DADOS_DEFAULT.total,
    idPedido: params.idPedido
      ? parseInt(params.idPedido as string, 10)
      : DADOS_DEFAULT.idPedido,
    referenciaPagamento: (params.referenciaPagamento as string) || "",
  };

  // Debug - mostrar os parâmetros recebidos
  console.log("[MetodoPagamento] Params recebidos:", JSON.stringify(params));
  console.log(
    "[MetodoPagamento] referenciaPagamento:",
    dadosPagamento.referenciaPagamento,
  );

  const handlePagamento = async () => {
    setLoading(true);

    try {
      // Se temos referência do pagamento, verificar o estado
      if (dadosPagamento.referenciaPagamento && dadosPagamento.idPedido > 0) {
        const result = await verificarPagamento(
          dadosPagamento.idPedido,
          dadosPagamento.referenciaPagamento,
        );
        console.log("[MetodoPagamento] Resultado:", result);

        // Verificar o status retornado pela API
        if (result.estado_pagamento === "Pago") {
          setFeedbackTipo("sucesso");
        } else {
          setFeedbackTipo("erro");
        }
      } else {
        // Sem referência, simulation de sucesso para演示
        console.log(
          "[MetodoPagamento] Sem referência de pagamento, simulando sucesso",
        );
        setFeedbackTipo("sucesso");
      }
    } catch (error: any) {
      console.error("[MetodoPagamento] Erro:", error);
      // Em caso de erro, mostra erro mas continua para demonstração
      setFeedbackTipo("erro");
    } finally {
      setLoading(false);
      setModalVisible(true);
    }
  };

  const handleVerEncomendas = () => {
    setModalVisible(false);
    router.replace("/(tabs)/MinhasEncomendasScreen");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>PAGAMENTO</Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/NotificacoesScreen")}
          style={styles.notificationButton}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Subtítulo */}
        <Text style={styles.subtitle}>Selecione uma forma de pagamento:</Text>

        {/* Opção: Pagamento por Referência */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedMethod === "referencia" && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedMethod("referencia")}
          >
            <View style={styles.optionLeft}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="barcode-outline"
                  size={24}
                  color={
                    selectedMethod === "referencia"
                      ? Colors.white
                      : Colors.primary
                  }
                />
              </View>
              <View style={styles.optionInfo}>
                <Text
                  style={[
                    styles.optionName,
                    selectedMethod === "referencia" &&
                      styles.optionNameSelected,
                  ]}
                >
                  Pagamento por Referência
                </Text>
                <Text style={styles.optionDescription}>
                  Pagamento multibanco
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.radioButton,
                selectedMethod === "referencia" && styles.radioButtonSelected,
              ]}
            >
              {selectedMethod === "referencia" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>

          {/* Dados da Referência (quando selecionado) */}
          {selectedMethod === "referencia" && (
            <View style={styles.referenciaCard}>
              <TouchableOpacity
                style={styles.referenciaRow}
                onPress={() => copiar(dadosPagamento.entidade, "entidade")}
                activeOpacity={0.7}
              >
                <Text style={styles.referenciaLabel}>Entidade</Text>
                <View style={styles.copyRow}>
                  <Text style={styles.referenciaValue}>
                    {dadosPagamento.entidade}
                  </Text>
                  <Ionicons
                    name={
                      copiedField === "entidade"
                        ? "checkmark-outline"
                        : "copy-outline"
                    }
                    size={16}
                    color={
                      copiedField === "entidade"
                        ? Colors.success || "#22c55e"
                        : Colors.secondary
                    }
                    style={{ marginLeft: 6 }}
                  />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.referenciaRow}
                onPress={() =>
                  copiar(dadosPagamento.referenciaPagamento || "", "referencia")
                }
                activeOpacity={0.7}
              >
                <Text style={styles.referenciaLabel}>Referência</Text>
                <View style={styles.copyRow}>
                  <Text style={styles.referenciaValue}>
                    {dadosPagamento.referenciaPagamento || "A gerar"}
                  </Text>
                  <Ionicons
                    name={
                      copiedField === "referencia"
                        ? "checkmark-outline"
                        : "copy-outline"
                    }
                    size={16}
                    color={
                      copiedField === "referencia"
                        ? Colors.success || "#22c55e"
                        : Colors.secondary
                    }
                    style={{ marginLeft: 6 }}
                  />
                </View>
              </TouchableOpacity>
              <View
                style={[styles.referenciaRow, styles.referenciaRowHighlight]}
              >
                <Text style={styles.referenciaLabelBold}>Valor</Text>
                <Text style={styles.referenciaValueBold}>
                  {formatPrice(dadosPagamento.total)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Opção: Cartão Visa / Pagamento Internacional - oculto por enquanto */}
        {/* <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedMethod === "cartao" && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedMethod("cartao")}
          >
            <View style={styles.optionLeft}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="card-outline"
                  size={24}
                  color={
                    selectedMethod === "cartao" ? Colors.white : Colors.primary
                  }
                />
              </View>
              <View style={styles.optionInfo}>
                <Text
                  style={[
                    styles.optionName,
                    selectedMethod === "cartao" && styles.optionNameSelected,
                  ]}
                >
                  Visa
                </Text>
                <Text style={styles.optionDescription}>
                  Pagamento internacional
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.radioButton,
                selectedMethod === "cartao" && styles.radioButtonSelected,
              ]}
            >
              {selectedMethod === "cartao" && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>

          {selectedMethod === "cartao" && (
            <View style={styles.cartaoCard}>
              <Text style={styles.cartaoTitle}>Processamento</Text>
              <Text style={styles.cartaoText}>
                O pagamento será processado através do Stripe
              </Text>
              <View style={styles.cartaoValorContainer}>
                <Text style={styles.cartaoValorLabel}>Valor</Text>
                <Text style={styles.cartaoValor}>$890</Text>
              </View>
            </View>
          )}
        </View> */}
      </ScrollView>

      {/* Botão Fixo no Rodapé */}
      <View
        style={[
          styles.footerButton,
          { paddingBottom: Spacing.lg + insets.bottom },
        ]}
      >
        <Button
          title={
            loading
              ? "A processar..."
              : selectedMethod === "cartao"
                ? "Pagar"
                : "Confirmar Pagamento"
          }
          onPress={handlePagamento}
          disabled={loading}
        />
      </View>

      {/* Modal de Feedback */}
      <ModalFeedbackPagamento
        visible={modalVisible}
        tipo={feedbackTipo}
        onClose={() => setModalVisible(false)}
        onVerEncomendas={handleVerEncomendas}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  notificationButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  subtitle: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.md,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.lightGray,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  optionInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  optionName: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: Colors.primary,
  },
  optionNameSelected: {
    color: Colors.white,
  },
  optionDescription: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    marginTop: 2,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    borderColor: Colors.white,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.white,
  },
  referenciaCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  referenciaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  referenciaRowHighlight: {
    borderBottomWidth: 0,
    backgroundColor: Colors.primary,
    marginHorizontal: -Spacing.md,
    marginBottom: -Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  copyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  referenciaLabel: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
  },
  referenciaValue: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  referenciaLabelBold: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: Colors.white,
  },
  referenciaValueBold: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.white,
  },
  cartaoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  cartaoTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  cartaoText: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    marginBottom: Spacing.md,
  },
  cartaoValorContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: 8,
  },
  cartaoValorLabel: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.white,
  },
  cartaoValor: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    color: Colors.white,
  },
  footerButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
});
