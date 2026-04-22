/**
 * FAST - Status da Encomenda Screen
 * Timeline visual do acompanhamento do pedido
 * Busca dados reais da API
 */

import { Colors, FontSizes, formatPrice, Spacing } from "@/constants/theme";
import {
    atualizaEncomendaEstado,
    getEncomendaById,
    StatusEncomenda,
} from "@/services/encomendaService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// ============================================
// MAPEAMENTO DE STATUS
// ============================================

const PASSOS = [
  {
    id: "1",
    titulo: "Pedido Confirmado",
    descricao: "O seu pedido foi recebido",
  },
  {
    id: "2",
    titulo: "Em Preparação",
    descricao: "A sua encomenda está a ser preparada",
  },
  {
    id: "3",
    titulo: "A Caminho",
    descricao: "A sua encomenda foi enviada",
  },
  {
    id: "4",
    titulo: "Entregue",
    descricao: "A sua encomenda foi entregue",
  },
];

// Mapeia status da API para índice do passo
const getStepIndex = (status: StatusEncomenda | null): number => {
  if (!status) return 0;

  const statusMap: Record<string, number> = {
    PENDENTE: 0,
    CONFIRMADO: 0,
    EM_PREPARACAO: 1,
    A_CAMINHO: 2,
    ENTREGUE: 3,
    CANCELADO: -1,
  };

  return statusMap[status] ?? 0;
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function StatusEncomendaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const encomendaId = params.id as string;

  const [encomenda, setEncomenda] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Atualizar estado da encomenda
  const atualizarEstadoEncomenda = async (novoEstado: string) => {
    try {
      const idNum = parseInt(encomendaId, 10);
      await atualizaEncomendaEstado(idNum, novoEstado);
      // Recarrega dados após atualização
      const data = await getEncomendaById(encomendaId);
      setEncomenda(data);
    } catch (err: any) {
      console.error("[StatusEncomenda] Erro ao atualizar:", err);
    }
  };

  // Função para buscar dados da encomenda
  const fetchEncomenda = useCallback(async () => {
    if (!encomendaId) {
      setError("ID da encomenda não encontrado");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getEncomendaById(encomendaId);
      setEncomenda(data);
    } catch (err: any) {
      console.error("[StatusEncomenda] Erro:", err);
      setError(err.message || "Erro ao carregar encomenda");
    } finally {
      setLoading(false);
    }
  }, [encomendaId]);

  // Buscar dados ao abrir e fazer polling a cada 15 segundos
  useEffect(() => {
    fetchEncomenda();
    const interval = setInterval(fetchEncomenda, 15000);
    return () => clearInterval(interval);
  }, [fetchEncomenda]);

  // Determina o passo atual baseado no estado da API
  const getStepFromEstado = (estado: string | null): number => {
    if (!estado) return 0;
    const estadoUpper = estado.toUpperCase().replace(/"/g, "");
    if (estadoUpper === "E") return 4;
    if (estadoUpper === "A") return 3;
    if (estadoUpper.includes("PENDENTE") || estadoUpper.includes("CONFIRMADO"))
      return 1;
    if (
      estadoUpper.includes("EM PREPARA") ||
      estadoUpper.includes("PREPARAÇÃO")
    )
      return 2;
    if (estadoUpper.includes("A CAMINHO") || estadoUpper.includes("CAMINHO"))
      return 3;
    if (estadoUpper.includes("ENTREGUE")) return 4;
    if (estadoUpper.includes("CANCELADO")) return 0;
    return 1;
  };

  const currentStep = encomenda ? getStepFromEstado(encomenda.estado) : 0;

  // Formata data
  const formatData = (dataString: string): string => {
    if (!dataString) return "";
    try {
      const date = new Date(dataString);
      return (
        date.toLocaleDateString("pt-AO") +
        " " +
        date.toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" })
      );
    } catch {
      return dataString;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>ACOMPANHAR PEDIDO</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>A carregar encomenda...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={Colors.error}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setLoading(true);
                getEncomendaById(encomendaId)
                  .then(setEncomenda)
                  .catch((err) => setError(err.message))
                  .finally(() => setLoading(false));
              }}
            >
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Order Details */}
        {!loading && !error && encomenda && (
          <>
            {/* Número do Pedido */}
            <View style={styles.pedidoInfo}>
              <Text style={styles.pedidoLabel}>PEDIDO</Text>
              <Text style={styles.pedidoNumero}>
                {encomenda.codigo_encomenda ||
                  encomenda.numero ||
                  `PED-${encomenda.id_compra}`}
              </Text>
              <Text style={styles.statusAtual}>
                {encomenda.estado?.replace(/"/g, "") || "Confirmado"}
              </Text>
            </View>

            {/* Timeline */}
            <View style={styles.timelineContainer}>
              {PASSOS.map((passo, index) => {
                const isCompleted = index + 1 <= currentStep;
                const isCurrent = index + 1 === currentStep;
                const isLast = index === PASSOS.length - 1;

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
                          style={[
                            styles.line,
                            isCompleted && styles.lineCompleted,
                          ]}
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
                      <Text style={styles.stepDescription}>
                        {passo.descricao}
                      </Text>
                      {isCompleted && encomenda.data && (
                        <Text style={styles.stepDate}>
                          {formatData(encomenda.data)}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Informações de Entrega */}
            {encomenda.endereco && (
              <View style={styles.entregaInfo}>
                <Text style={styles.entregaTitle}>DADOS DE ENTREGA</Text>
                <View style={styles.entregaCard}>
                  <Text style={styles.entregaText}>
                    {encomenda.endereco.rua || ""}
                  </Text>
                  <Text style={styles.entregaText}>
                    {encomenda.endereco.cidade}
                    {encomenda.endereco.provincia
                      ? `, ${encomenda.endereco.provincia}`
                      : ""}
                    , Angola
                  </Text>
                  {encomenda.endereco.referencia && (
                    <Text style={styles.entregaText}>
                      Ref: {encomenda.endereco.referencia}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Produtos do Pedido */}
            {encomenda.items && encomenda.items.length > 0 && (
              <View style={styles.produtosInfo}>
                <Text style={styles.produtosTitle}>PRODUTOS</Text>
                <View style={styles.produtosContainer}>
                  {encomenda.items.map((item: any) => (
                    <View
                      key={item.id || item.produtoId}
                      style={styles.produtoCard}
                    >
                      <Image
                        source={{ uri: item.produtoImagem || item.imagem }}
                        style={styles.produtoImagem}
                      />
                      <View style={styles.produtoInfo}>
                        <Text style={styles.produtoNome} numberOfLines={2}>
                          {item.produtoNome || item.nome}
                        </Text>
                        <View style={styles.produtoFooter}>
                          <Text style={styles.produtoQuantidade}>
                            Qtd: {item.quantidade}
                          </Text>
                          <Text style={styles.produtoPreco}>
                            {formatPrice((item.preco || 0) * item.quantidade)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValor}>
                    {formatPrice(encomenda.total || 0)}
                  </Text>
                </View>
              </View>
            )}

            {/* Botão de Contacto */}
            <TouchableOpacity style={styles.contactButton}>
              <Ionicons
                name="chatbubbles-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.contactText}>Contactar Apoio ao Cliente</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.error,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  retryButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
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
  scrollContent: {
    padding: Spacing.lg,
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
  statusAtual: {
    fontSize: FontSizes.md,
    color: Colors.warning,
    fontWeight: "600",
    marginTop: Spacing.xs,
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
    borderRadius: 0,
    padding: Spacing.sm,
  },
  produtoImagem: {
    width: 70,
    height: 70,
    borderRadius: 0,
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
  produtoVariante: {
    fontSize: FontSizes.xs,
    color: Colors.secondary,
    marginBottom: Spacing.xs,
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
