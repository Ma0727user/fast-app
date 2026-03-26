/**
 * FAST - Minhas Encomendas Screen
 * Lista de pedidos com filtros - Parte das Tabs
 */

import { Skeleton } from "@/components/ui/Skeleton";
import { Colors, FontSizes, formatPrice, Spacing } from "@/constants/theme";
import {
  Encomenda,
  getEncomendas,
  mapEncomendasToApp,
} from "@/services/encomendaService";
import { useStore } from "@/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type StatusPedido =
  | "Todos"
  | "Confirmado"
  | "Em Preparação"
  | "A Caminho"
  | "Entregue";

const STATUS_OPCOES: StatusPedido[] = [
  "Todos",
  "Confirmado",
  "Em Preparação",
  "A Caminho",
  "Entregue",
];

const ORDENAR_DATA = [
  { label: "Mais Recentes", value: "recente" },
  { label: "Mais Antigos", value: "antigo" },
];

const { width } = Dimensions.get("window");

const getStatusColor = (status: string) => {
  switch (status) {
    case "Entregue":
      return Colors.success;
    case "Confirmado":
      return Colors.primary;
    case "Em Preparação":
      return Colors.warning;
    case "A Caminho":
      return "#3B82F6";
    default:
      return Colors.secondary;
  }
};

const mapApiStatusToDisplay = (status: string): StatusPedido => {
  switch (status) {
    case "Pendente":
    case "Confirmado":
      return "Confirmado";
    case "Em Preparação":
      return "Em Preparação";
    case "A caminho":
      return "A Caminho";
    case "Entregue":
      return "Entregue";
    default:
      return "Confirmado";
  }
};

export default function MinhasEncomendasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useStore();

  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [encomendasMapped, setEncomendasMapped] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusSelecionado, setStatusSelecionado] =
    useState<StatusPedido>("Todos");
  const [ordemData, setOrdemData] = useState("recente");
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);

  const carregarEncomendas = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Obter ID do usuário do store
      const userId = user?.id || "1";
      const data = await getEncomendas(userId);
      setEncomendas(data);
      // Mapear para formato do app
      const mapped = mapEncomendasToApp(data);
      setEncomendasMapped(mapped);
    } catch (err) {
      console.error("Erro ao carregar encomendas:", err);
      setEncomendas([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarEncomendas();
  }, [carregarEncomendas]);

  const onRefresh = useCallback(() => {
    carregarEncomendas(true);
  }, [carregarEncomendas]);

  const pedidosFiltrados = useMemo(() => {
    let pedidos = encomendasMapped.map((e) => ({
      id: e.id,
      numero: e.numero,
      data: e.data,
      dataFormatada: e.data ? new Date(e.data).toLocaleDateString("pt-BR") : "",
      total: typeof e.total === "string" ? parseFloat(e.total) : e.total,
      status: e.status,
      itens: 1,
    }));

    if (statusSelecionado !== "Todos") {
      pedidos = pedidos.filter((p) => p.status === statusSelecionado);
    }

    pedidos.sort((a, b) => {
      const dataA = new Date(a.data).getTime();
      const dataB = new Date(b.data).getTime();
      return ordemData === "recente" ? dataB - dataA : dataA - dataB;
    });

    return pedidos;
  }, [encomendasMapped, statusSelecionado, ordemData]);

  const renderPedido = ({
    item,
  }: {
    item: {
      id: string;
      numero: string;
      dataFormatada: string;
      total: number;
      status: StatusPedido;
      itens: number;
    };
  }) => (
    <TouchableOpacity
      style={styles.pedidoCard}
      onPress={() =>
        router.push({
          pathname: "/(tabs)/StatusEncomendaScreen",
          params: { id: item.id },
        })
      }
      activeOpacity={0.7}
    >
      <View style={styles.pedidoInfo}>
        <View style={styles.pedidoHeader}>
          <Text style={styles.pedidoNumero}>{item.numero}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.pedidoData}>{item.dataFormatada}</Text>
        <View style={styles.pedidoFooter}>
          <Text style={styles.pedidoItens}>{item.itens} item(s)</Text>
          <Text style={styles.pedidoTotal}>{formatPrice(item.total)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.secondary} />
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={styles.title}>MEUS PEDIDOS</Text>
        <TouchableOpacity
          onPress={() => setFiltrosVisiveis(!filtrosVisiveis)}
          style={styles.filterButton}
        >
          <Ionicons
            name="filter"
            size={24}
            color={filtrosVisiveis ? Colors.primary : Colors.secondary}
          />
        </TouchableOpacity>
      </View>

      {filtrosVisiveis && (
        <View style={styles.filtrosContainer}>
          <View style={styles.filtroSection}>
            <Text style={styles.filtroLabel}>ESTADO DO PEDIDO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {STATUS_OPCOES.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filtroChip,
                    statusSelecionado === status && styles.filtroChipActive,
                  ]}
                  onPress={() => setStatusSelecionado(status)}
                >
                  <Text
                    style={[
                      styles.filtroChipText,
                      statusSelecionado === status &&
                        styles.filtroChipTextActive,
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filtroSection}>
            <Text style={styles.filtroLabel}>ORDENAR POR DATA</Text>
            <View style={styles.ordenarContainer}>
              {ORDENAR_DATA.map((opcao) => (
                <TouchableOpacity
                  key={opcao.value}
                  style={[
                    styles.ordenarButton,
                    ordemData === opcao.value && styles.ordenarButtonActive,
                  ]}
                  onPress={() => setOrdemData(opcao.value)}
                >
                  <Text
                    style={[
                      styles.ordenarText,
                      ordemData === opcao.value && styles.ordenarTextActive,
                    ]}
                  >
                    {opcao.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      <View style={styles.resultadosInfo}>
        <Text style={styles.resultadosText}>
          {isLoading
            ? "Carregando..."
            : `${pedidosFiltrados.length} encomenda(s) encontrada(s)`}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.pedidoCard}>
              <View style={styles.pedidoInfo}>
                <View style={styles.pedidoHeader}>
                  <Skeleton width={120} height={16} borderRadius={4} />
                  <Skeleton width={70} height={20} borderRadius={4} />
                </View>
                <Skeleton
                  width={80}
                  height={14}
                  borderRadius={4}
                  style={{ marginTop: Spacing.xs }}
                />
                <View style={[styles.pedidoFooter, { marginTop: Spacing.sm }]}>
                  <Skeleton width={60} height={12} borderRadius={4} />
                  <Skeleton width={80} height={16} borderRadius={4} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={pedidosFiltrados}
          renderItem={renderPedido}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="cube-outline"
                size={60}
                color={Colors.lightGray}
              />
              <Text style={styles.emptyText}>Não tem pedidos ainda</Text>
            </View>
          }
        />
      )}
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
  placeholder: {
    width: 24,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
  filterButton: {
    padding: Spacing.xs,
  },
  filtrosContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  filtroSection: {
    marginBottom: Spacing.md,
  },
  filtroLabel: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
    color: Colors.secondary,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  filtroChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    marginRight: Spacing.sm,
  },
  filtroChipActive: {
    backgroundColor: Colors.primary,
  },
  filtroChipText: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
  },
  filtroChipTextActive: {
    color: Colors.white,
    fontWeight: "600",
  },
  ordenarContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  ordenarButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  ordenarButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  ordenarText: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
  },
  ordenarTextActive: {
    color: Colors.white,
    fontWeight: "600",
  },
  resultadosInfo: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  resultadosText: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: Spacing.xxl * 2,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.lightGray,
    marginTop: Spacing.md,
  },
  pedidoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  pedidoInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  pedidoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  pedidoNumero: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
    color: Colors.white,
  },
  pedidoData: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    marginBottom: Spacing.xs,
  },
  pedidoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pedidoItens: {
    fontSize: FontSizes.xs,
    color: Colors.lightGray,
  },
  pedidoTotal: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.primary,
  },
});
