/**
 * FAST - Status da Encomenda Screen
 * Timeline visual do acompanhamento do pedido - Parte das Tabs
 * Utiliza polling para atualização em tempo real do status
 */

import { Colors, FontSizes, formatPrice, Spacing } from "@/constants/theme";
import { usePolling } from "@/hooks/usePolling";
import { getPedidoById, PedidoDetalhe } from "@/services/encomendaService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Mapeamento de status da API para steps
const getStepFromStatus = (status: string | null): number => {
  if (!status) return 1;

  const statusMap: Record<string, number> = {
    Pendente: 1,
    Confirmado: 1,
    "Em Preparação": 2,
    "Em Preparacao": 2,
    "A caminho": 3,
    "A Caminho": 3,
    Entregue: 4,
    Cancelado: 0,
  };

  return statusMap[status] || 1;
};

// Dados fallback para quando não há dados da API
const PASSOS_DEFAULT = [
  {
    id: "1",
    titulo: "Pedido Confirmado",
    descricao: "O seu pedido foi recebido",
    data: "--/--/---- --:--",
  },
  {
    id: "2",
    titulo: "Em Preparação",
    descricao: "A sua encomenda está a ser preparada",
    data: "--/--/---- --:--",
  },
  {
    id: "3",
    titulo: "A Caminho",
    descricao: "A sua encomenda foi enviada",
    data: "--/--/---- --:--",
  },
  {
    id: "4",
    titulo: "Entregue",
    descricao: "A sua encomenda foi entregue",
    data: "--/--/---- --:--",
  },
];

// Itens do pedido (fallback)
const ITENS_PEDIDO = [
  {
    id: "1",
    nome: "T-Shirt Algodão Premium",
    preco: 15000,
    quantidade: 1,
    imagem:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=80&h=100&fit=crop",
    variantes: [{ cor: "Branco", tamanho: "M", quantidade: 1 }],
  },
  {
    id: "2",
    nome: "T-Shirt Algodão Premium",
    preco: 15000,
    quantidade: 2,
    imagem:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=80&h=100&fit=crop",
    variantes: [
      { cor: "Preto", tamanho: "M", quantidade: 1 },
      { cor: "Cinza", tamanho: "M", quantidade: 1 },
    ],
  },
  {
    id: "3",
    nome: "Sneakers Urbanos",
    preco: 27000,
    quantidade: 1,
    imagem:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=100&fit=crop",
    variantes: [{ cor: "Preto", tamanho: "42", quantidade: 1 }],
  },
];

export default function StatusEncomendaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // ID da encomenda (pode vir dos params ou usar um default para demo)
  const encomendaId = params.id ? String(params.id) : "1";

  // Estado local para dados do pedido
  const [pedido, setPedido] = useState<PedidoDetalhe | null>(null);
  const [isLoadingEncomenda, setIsLoadingEncomenda] = useState(true);
  const [dataAtualizacao, setDataAtualizacao] = useState<string>("");

  // Hook de polling para status em tempo real (a cada 15 segundos)
  const {
    status: statusPolling,
    isLoading: isPolling,
    isPolling: pollingAtivo,
    error: pollingError,
    start: iniciarPolling,
    stop: pararPolling,
  } = usePolling(encomendaId, {
    interval: 15000, // 15 segundos
    autoStart: false,
  });

  // Determina o step atual baseado no status
  const currentStep = pedido
    ? getStepFromStatus(pedido.estado_pedido)
    : getStepFromStatus(statusPolling);

  // Carregar dados iniciais da encomenda
  useEffect(() => {
    const carregarEncomenda = async () => {
      try {
        setIsLoadingEncomenda(true);
        const dados = await getPedidoById(encomendaId);
        setPedido(dados);

        // Atualizar data de atualização
        const agora = new Date();
        setDataAtualizacao(
          `${agora.getHours().toString().padStart(2, "0")}:${agora.getMinutes().toString().padStart(2, "0")}`,
        );
      } catch (error) {
        console.error("Erro ao carregar encomenda:", error);
        // Mantém dados mock em caso de erro
      } finally {
        setIsLoadingEncomenda(false);
      }
    };

    carregarEncomenda();

    // Iniciar polling após carregar dados
    iniciarPolling();

    // Parar polling ao desmontar
    return () => {
      pararPolling();
    };
  }, [encomendaId]);

  // Atualizar data de atualização quando houver nova verificação
  useEffect(() => {
    if (pollingAtivo) {
      const agora = new Date();
      setDataAtualizacao(
        `${agora.getHours().toString().padStart(2, "0")}:${agora.getMinutes().toString().padStart(2, "0")}`,
      );
    }
  }, [statusPolling, pollingAtivo]);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={styles.title}>ACOMPANHAR PEDIDO</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Indicador de atualização em tempo real */}
        <View style={styles.pollingIndicator}>
          {isPolling ? (
            <>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.pollingText}>Atualizando...</Text>
            </>
          ) : (
            <>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={Colors.success}
              />
              <Text style={styles.pollingText}>
                Última atualização: {dataAtualizacao || "--:--"}
              </Text>
            </>
          )}
        </View>

        {/* Número do Pedido */}
        <View style={styles.pedidoInfo}>
          <Text style={styles.pedidoLabel}>PEDIDO</Text>
          <Text style={styles.pedidoNumero}>
            {pedido ? `#${pedido.id_pedido}` : "Carregando..."}
          </Text>
          {pedido?.referencia && (
            <Text style={styles.pedidoData}>Ref: {pedido.referencia}</Text>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.timelineContainer}>
          {PASSOS_DEFAULT.map((passo, index) => {
            const isCompleted = index + 1 <= currentStep;
            const isCurrent = index + 1 === currentStep;
            const isLast = index === PASSOS_DEFAULT.length - 1;

            return (
              <View key={passo.id} style={styles.timelineItem}>
                {/* Ponto e Linha */}
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.circle,
                      isCompleted && styles.circleCompleted,
                      isCurrent && styles.circleCurrent,
                    ]}
                  >
                    {isCompleted && (
                      <Ionicons
                        name="checkmark"
                        size={12}
                        color={Colors.white}
                      />
                    )}
                  </View>
                  {!isLast && (
                    <View
                      style={[styles.line, isCompleted && styles.lineCompleted]}
                    />
                  )}
                </View>

                {/* Conteúdo */}
                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.stepTitle,
                      isCompleted && styles.stepTitleCompleted,
                    ]}
                  >
                    {passo.titulo}
                  </Text>
                  <Text style={styles.stepDescription}>{passo.descricao}</Text>
                  {isCompleted && (
                    <Text style={styles.stepDate}>{passo.data}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Informações de Pagamento */}
        {pedido?.pagamento && (
          <View style={styles.entregaInfo}>
            <Text style={styles.entregaTitle}>PAGAMENTO</Text>
            <View style={styles.entregaCard}>
              <Text style={styles.entregaText}>
                Referência: {pedido.pagamento.referencia_pagamento}
              </Text>
              <Text style={styles.entregaText}>
                Estado: {pedido.pagamento.estado_pagamento}
              </Text>
              <Text style={styles.entregaText}>
                Total a Pagar: {pedido.pagamento.total_pagar}
              </Text>
            </View>
          </View>
        )}

        {/* Produtos do Pedido */}
        <View style={styles.produtosInfo}>
          <Text style={styles.produtosTitle}>PRODUTOS</Text>
          {isLoadingEncomenda ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : pedido?.itens && pedido.itens.length > 0 ? (
            <View style={styles.produtosContainer}>
              {pedido.itens.map((item, index) => (
                <View key={item.id_produto || index} style={styles.produtoCard}>
                  <Image
                    source={{ uri: item.imagem }}
                    style={styles.produtoImagem}
                  />
                  <View style={styles.produtoInfo}>
                    <Text style={styles.produtoNome} numberOfLines={2}>
                      {item.nome_produto}
                    </Text>
                    {/* Variantes do produto */}
                    <View style={styles.variantesContainer}>
                      <View style={styles.varianteBadge}>
                        <Text style={styles.varianteTexto}>
                          {item.cor} / {item.tamanho} (x{item.quantidade})
                        </Text>
                      </View>
                    </View>
                    <View style={styles.produtoFooter}>
                      <Text style={styles.produtoQuantidade}>
                        Qtd: {item.quantidade}
                      </Text>
                      <Text style={styles.produtoPreco}>
                        {formatPrice(item.subtotal)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
          )}
          {pedido && (
            <>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValor}>
                  {formatPrice(pedido.subtotal)}
                </Text>
              </View>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Taxa de Entrega:</Text>
                <Text style={styles.totalValor}>
                  {formatPrice(pedido.taxa_entrega)}
                </Text>
              </View>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>IVA:</Text>
                <Text style={styles.totalValor}>{formatPrice(pedido.iva)}</Text>
              </View>
              <View
                style={[
                  styles.totalContainer,
                  {
                    borderTopWidth: 1,
                    borderTopColor: Colors.lightGray,
                    paddingTop: Spacing.sm,
                  },
                ]}
              >
                <Text style={[styles.totalLabel, { fontSize: FontSizes.md }]}>
                  Total:
                </Text>
                <Text style={[styles.totalValor, { fontSize: FontSizes.lg }]}>
                  {formatPrice(
                    pedido.subtotal + pedido.taxa_entrega + pedido.iva,
                  )}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Botão de Contacto */}
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons
            name="chatbubbles-outline"
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.contactText}>Contactar Apoio ao Cliente</Text>
        </TouchableOpacity>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
  placeholder: {
    width: 24,
  },
  pollingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  pollingText: {
    fontSize: FontSizes.xs,
    color: Colors.secondary,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  pedidoInfo: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  pedidoLabel: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    letterSpacing: 1,
  },
  pedidoNumero: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
    marginTop: Spacing.xs,
  },
  pedidoData: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    marginTop: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.lightGray,
    textAlign: "center",
    paddingVertical: Spacing.lg,
  },
  timelineContainer: {
    marginBottom: Spacing.xl,
  },
  timelineItem: {
    flexDirection: "row",
  },
  timelineLeft: {
    alignItems: "center",
    marginRight: Spacing.md,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  circleCompleted: {
    backgroundColor: Colors.success,
  },
  circleCurrent: {
    backgroundColor: Colors.primary,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: Spacing.xs,
  },
  lineCompleted: {
    backgroundColor: Colors.success,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: Spacing.lg,
  },
  stepTitle: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.secondary,
  },
  stepTitleCompleted: {
    color: Colors.primary,
  },
  stepDescription: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    marginTop: 2,
  },
  stepDate: {
    fontSize: FontSizes.xs,
    color: Colors.secondary,
    marginTop: Spacing.xs,
  },
  entregaInfo: {
    marginBottom: Spacing.xl,
  },
  entregaTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  entregaCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: Spacing.md,
  },
  entregaText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    lineHeight: 22,
  },
  produtosInfo: {
    marginBottom: Spacing.xl,
  },
  produtosTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  produtosContainer: {
    gap: Spacing.md,
  },
  produtoCard: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    padding: Spacing.sm,
  },
  produtoImagem: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
  },
  produtoInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: "center",
  },
  produtoNome: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 2,
  },
  variantesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  varianteBadge: {
    backgroundColor: Colors.lightGray,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  varianteTexto: {
    fontSize: FontSizes.xs,
    color: Colors.secondary,
  },
  produtoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  produtoQuantidade: {
    fontSize: FontSizes.xs,
    color: Colors.secondary,
  },
  produtoPreco: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.primary,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  totalLabel: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.secondary,
    marginRight: Spacing.sm,
  },
  totalValor: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.primary,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
  },
  contactText: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
});
