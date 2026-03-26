/**
 * FAST - Resumo da Compra Screen
 * Resumo do pedido com itens, entrega e financeiras
 */

import { Button } from "@/components/ui/Button";
import { Colors, FontSizes, formatPrice, Spacing } from "@/constants/theme";
import {
  AuthError,
  getPedido,
  salvarCarrinho,
  verificarPagamento,
} from "@/services/carrinhoService";
import { useStore } from "@/store/useStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ResumoCompraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const cart = useStore((state) => state.cart);
  const user = useStore((state) => state.user);
  const clearCart = useStore((state) => state.clearCart);
  const [isLoading, setIsLoading] = useState(false);
  const [pagamentoStatus, setPagamentoStatus] = useState<string | null>(null);
  const [referenciaPagamento, setReferenciaPagamento] = useState<string | null>(
    null,
  );
  const [idPedido, setIdPedido] = useState<number | null>(null);

  // Dados de entrega vindos da tela anterior
  const dadosEntrega = {
    endereco: (params.endereco as string) || "Rua do Kinaxixi, 123",
    provincia: (params.provincia as string) || "Luanda",
    referencia: (params.referencia as string) || "Perto do Banco de Angola",
    idEndereco: params.idEndereco
      ? parseInt(params.idEndereco as string, 10)
      : 1,
    taxaEntrega: params.taxaEntrega
      ? parseFloat(params.taxaEntrega as string)
      : 2500,
  };

  // Calcular subtotal
  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const iva = Math.round(subtotal * 0.14);
  const taxaEntrega = dadosEntrega.taxaEntrega;
  const total = subtotal + iva + taxaEntrega;

  const handleEfetuarPagamento = async () => {
    if (cart.length === 0) {
      Alert.alert("Erro", "O carrinho está vazio");
      return;
    }

    setIsLoading(true);
    try {
      // Preparar dados do carrinho para a API
      const itens = cart.map((item) => ({
        id_produto: item.idProduto || parseInt(item.id, 10),
        quantidade: item.quantity,
        cor: item.color || "Default",
        tamanho: item.size || "M",
        idVariacao: item.idVariacao || 1,
      }));

      // ID do usuário - usa user.id se disponível, ou 12 como fallback
      const userId = user ? parseInt(user.id, 10) : 12;

      console.log("[ResumoCompra] Salvando carrinho para userId:", userId);
      console.log("[ResumoCompra] Itens:", itens);

      // Salvar carrinho na API
      const result = await salvarCarrinho(
        userId,
        itens,
        subtotal,
        dadosEntrega.idEndereco,
        taxaEntrega,
        iva,
      );

      console.log("[ResumoCompra] Carrinho salvo:", result);

      // Variáveis para armazenar os dados de pagamento
      let refPagamento = "";
      let idPedidoValue: string | number = "";
      let entidadePagamento = "012888";

      // Verificar formato de resposta - novo formato ou formato antigo com data
      // Novo formato: { idPedido, referencia, status, message }
      // Formato antigo: { data: { id_pedido, pagamento: {...} } }

      // Primeiro tenta formato novo
      if (result.idPedido && result.referencia) {
        refPagamento = result.referencia;
        idPedidoValue = result.idPedido;
        setReferenciaPagamento(refPagamento);
        setIdPedido(result.idPedido);
        console.log(
          "[ResumoCompra] Referência pagamento (novo formato):",
          refPagamento,
        );
        console.log(
          "[ResumoCompra] ID Pedido (novo formato):",
          result.idPedido,
        );
      }
      // Tenta formato antigo com data
      else if (result.data && result.data.pagamento) {
        refPagamento =
          result.data.pagamento.referencia_pagamento ||
          result.data.referencia ||
          "";
        idPedidoValue = result.data.id_pedido || "";
        entidadePagamento = result.data.pagamento.entidade || "012888";
        setReferenciaPagamento(refPagamento || null);
        setIdPedido(result.data.id_pedido || null);
        console.log("[ResumoCompra] Referência pagamento:", refPagamento);
        console.log("[ResumoCompra] ID Pedido:", result.data.id_pedido);
      }
      // Tenta obter do result.data (formato alternativo)
      else if (result.data) {
        refPagamento = result.data.referencia || "";
        idPedidoValue = result.data.id_pedido || "";
        setReferenciaPagamento(refPagamento || null);
        setIdPedido(result.data.id_pedido || null);
        console.log("[ResumoCompra] Referência do data:", refPagamento);
      }

      // Limpar carrinho após salvar com sucesso (se temos referência)
      if (result.status === 200 && refPagamento) {
        clearCart();
      }

      // Navegar para a tela de método de pagamento com os dados
      router.push({
        pathname: "/(checkout)/MetodoPagamentoScreen",
        params: {
          referenciaPagamento: refPagamento,
          idPedido: String(idPedidoValue),
          total: String(total),
          entidade: entidadePagamento,
        },
      });
    } catch (error: any) {
      console.error("[ResumoCompra] Erro ao salvar carrinho:", error);

      // Tratar erro de autenticação específico
      if (error instanceof AuthError) {
        Alert.alert("Sem autorização", "Faça login para continuar.");
        router.push("/(auth)/LoginScreen");
        return;
      }

      // Em caso de erro, ainda assim permite continuar para pagamento
      Alert.alert(
        "Aviso",
        "Erro ao salvar carrinho. Pode continuar com o pagamento.",
      );
      router.push("/(checkout)/MetodoPagamentoScreen");
    } finally {
      setIsLoading(false);
    }
  };

  // Função para verificar o estado do pagamento
  const handleVerificarPagamento = async () => {
    if (!idPedido) {
      Alert.alert("Erro", "ID do pedido não disponível");
      return;
    }

    setIsLoading(true);
    try {
      console.log(
        "[ResumoCompra] Verificando pagamento para idPedido:",
        idPedido,
      );
      console.log("[ResumoCompra] Referência:", referenciaPagamento);

      const result = await verificarPagamento(
        idPedido,
        referenciaPagamento || "",
      );

      console.log("[ResumoCompra] Resultado verificação:", result);

      setPagamentoStatus(result.estado_pagamento);

      if (
        result.estado_pagamento === "Pago" ||
        result.estado_pagamento === "Pago"
      ) {
        Alert.alert(
          "Sucesso",
          "Pagamento confirmado! O seu pedido foi-processado com sucesso.",
        );
      } else if (result.estado_pagamento === "Pendente") {
        Alert.alert(
          "Pendente",
          "O pagamento ainda está pendente. Por favor, efetue o pagamento.",
        );
      } else {
        Alert.alert("Erro", `Estado do pagamento: ${result.estado_pagamento}`);
      }
    } catch (error: any) {
      console.error("[ResumoCompra] Erro ao verificar pagamento:", error);

      // Tratar erro de autenticação específico
      if (error instanceof AuthError) {
        Alert.alert("Sem autorização", "Faça login para continuar.");
        router.push("/(auth)/LoginScreen");
        return;
      }

      Alert.alert("Erro", "Não foi possível verificar o estado do pagamento.");
    } finally {
      setIsLoading(false);
    }
  };

  // Função para buscar detalhes do pedido
  const handleVerDetalhesPedido = async () => {
    if (!idPedido) {
      Alert.alert("Erro", "ID do pedido não disponível");
      return;
    }

    setIsLoading(true);
    try {
      console.log("[ResumoCompra] Buscando detalhes do pedido:", idPedido);

      const result = await getPedido(idPedido);

      console.log("[ResumoCompra] Detalhes do pedido:", result);

      if (result.data) {
        const pedido = result.data;
        Alert.alert(
          "Detalhes do Pedido",
          `ID: ${pedido.id_pedido}\nEstado: ${pedido.estado_pedido}\nData: ${pedido.data_pedido}\nSubtotal: ${formatPrice(pedido.subtotal)}\nTaxa Entrega: ${formatPrice(pedido.taxa_entrega)}\nTotal: ${formatPrice(pedido.subtotal + pedido.taxa_entrega + (pedido.iva || 0))}`,
        );
      }
    } catch (error: any) {
      console.error("[ResumoCompra] Erro ao buscar detalhes:", error);

      // Tratar erro de autenticação específico
      if (error instanceof AuthError) {
        Alert.alert("Sem autorização", "Faça login para continuar.");
        router.push("/(auth)/LoginScreen");
        return;
      }

      Alert.alert("Erro", "Não foi possível buscar os detalhes do pedido.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>{"<"} Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>RESUMO DO PEDIDO</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Itens do Pedido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ITENS</Text>
          {cart.length > 0 ? (
            cart.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Image source={{ uri: item.image }} style={styles.itemImage} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDetails}>
                    Tamanho: {item.size || "M"} | Cor: {item.color || "Default"}{" "}
                    | Qtd: {item.quantity}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  {formatPrice(item.price * item.quantity)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Carrinho vazio</Text>
          )}
        </View>

        {/* Dados de Entrega */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DADOS DE ENTREGA</Text>
          <View style={styles.entregaCard}>
            <Text style={styles.entregaText}>{dadosEntrega.endereco}</Text>
            <Text style={styles.entregaText}>{dadosEntrega.provincia}</Text>
            <Text style={styles.entregaRef}>{dadosEntrega.referencia}</Text>
          </View>
        </View>

        {/* Resumo Financeiro */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RESUMO FINANCEIRO</Text>
          <View style={styles.financeiroCard}>
            <View style={styles.financeiroRow}>
              <Text style={styles.financeiroLabel}>Subtotal</Text>
              <Text style={styles.financeiroValue}>
                {formatPrice(subtotal)}
              </Text>
            </View>
            <View style={styles.financeiroRow}>
              <Text style={styles.financeiroLabel}>IVA (14%)</Text>
              <Text style={styles.financeiroValue}>{formatPrice(iva)}</Text>
            </View>
            <View style={styles.financeiroRow}>
              <Text style={styles.financeiroLabel}>Taxa de Entrega</Text>
              <Text style={styles.financeiroValue}>
                {formatPrice(taxaEntrega)}
              </Text>
            </View>
            <View style={[styles.financeiroRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>
          </View>
        </View>

        {/* Informações de Pagamento */}
        {(referenciaPagamento || idPedido) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INFORMAÇÕES DE PAGAMENTO</Text>
            <View style={styles.pagamentoCard}>
              {referenciaPagamento && (
                <View style={styles.pagamentoRow}>
                  <Text style={styles.pagamentoLabel}>Referência:</Text>
                  <Text style={styles.pagamentoValue}>
                    {referenciaPagamento}
                  </Text>
                </View>
              )}
              {idPedido && (
                <View style={styles.pagamentoRow}>
                  <Text style={styles.pagamentoLabel}>ID Pedido:</Text>
                  <Text style={styles.pagamentoValue}>#{idPedido}</Text>
                </View>
              )}
              {pagamentoStatus && (
                <View style={styles.pagamentoRow}>
                  <Text style={styles.pagamentoLabel}>Estado:</Text>
                  <Text
                    style={[
                      styles.pagamentoValue,
                      pagamentoStatus === "Pago"
                        ? styles.statusPago
                        : styles.statusPendente,
                    ]}
                  >
                    {pagamentoStatus}
                  </Text>
                </View>
              )}
            </View>

            {/* Botões de Verificação */}
            <View style={styles.botoesVerificacao}>
              <TouchableOpacity
                style={styles.botaoVerificacao}
                onPress={handleVerificarPagamento}
                disabled={isLoading || !referenciaPagamento}
              >
                <Text style={styles.textoBotaoVerificacao}>
                  Verificar Pagamento
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botaoVerificacao, styles.botaoSecundario]}
                onPress={handleVerDetalhesPedido}
                disabled={isLoading || !idPedido}
              >
                <Text
                  style={[styles.textoBotaoVerificacao, styles.textoSecundario]}
                >
                  Ver Detalhes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Botão Fixo no Rodapé */}
      <View
        style={[
          styles.footerButton,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
      >
        <Button
          title={isLoading ? "A processar..." : "Efetuar Pagamento"}
          onPress={handleEfetuarPagamento}
          disabled={isLoading || cart.length === 0}
        />
      </View>
    </SafeAreaView>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  backButton: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: "600",
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
  placeholder: {
    width: 60,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  itemImage: {
    width: 50,
    height: 60,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  itemName: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  itemDetails: {
    fontSize: FontSizes.xs,
    color: Colors.secondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  emptyText: {
    textAlign: "center",
    color: Colors.secondary,
    fontSize: FontSizes.md,
    paddingVertical: Spacing.lg,
  },
  entregaCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: Spacing.md,
    borderRadius: 12,
  },
  entregaText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
  },
  entregaRef: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    marginTop: Spacing.xs,
  },
  financeiroCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: Spacing.md,
    borderRadius: 12,
  },
  financeiroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  financeiroLabel: {
    fontSize: FontSizes.md,
    color: Colors.secondary,
  },
  financeiroValue: {
    fontSize: FontSizes.md,
    color: Colors.primary,
  },
  totalRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.primary,
  },
  totalValue: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.primary,
  },
  pagamentoCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  pagamentoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  pagamentoLabel: {
    fontSize: FontSizes.md,
    color: Colors.secondary,
  },
  pagamentoValue: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: "600",
  },
  statusPago: {
    color: "#22C55E",
  },
  statusPendente: {
    color: "#F59E0B",
  },
  botoesVerificacao: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  botaoVerificacao: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  botaoSecundario: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  textoBotaoVerificacao: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: "600",
  },
  textoSecundario: {
    color: Colors.primary,
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
