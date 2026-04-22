/**
 * FAST - Minhas Encomendas Screen
 * Lista de pedidos com filtros
 */

import { Colors, FontSizes, formatPrice, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    FlatList,
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

// Dados mockados
const PEDIDOS = [
  {
    id: "1",
    numero: "PED-2026-001",
    data: "2026-03-05",
    dataFormatada: "05/03/2026",
    total: 42000,
    status: "Entregue" as StatusPedido,
    imagem:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=80&h=100&fit=crop",
    itens: 2,
  },
  {
    id: "2",
    numero: "PED-2026-002",
    data: "2026-03-04",
    dataFormatada: "04/03/2026",
    total: 28500,
    status: "Confirmado" as StatusPedido,
    imagem:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=100&fit=crop",
    itens: 1,
  },
  {
    id: "3",
    numero: "PED-2026-003",
    data: "2026-03-03",
    dataFormatada: "03/03/2026",
    total: 15000,
    status: "Em Preparação" as StatusPedido,
    imagem:
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=80&h=100&fit=crop",
    itens: 1,
  },
  {
    id: "4",
    numero: "PED-2026-004",
    data: "2026-03-02",
    dataFormatada: "02/03/2026",
    total: 56700,
    status: "A Caminho" as StatusPedido,
    imagem:
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=80&h=100&fit=crop",
    itens: 3,
  },
  {
    id: "5",
    numero: "PED-2026-005",
    data: "2026-02-28",
    dataFormatada: "28/02/2026",
    total: 32000,
    status: "Entregue" as StatusPedido,
    imagem:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=80&h=100&fit=crop",
    itens: 2,
  },
];

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

const getStatusColor = (status: string) => {
  switch (status) {
    case "Entregue":
      return Colors.success;
    case "Confirmado":
      return Colors.primary;
    case "Em Preparação":
      return Colors.warning;
    case "A Caminho":
      return "#3B82F6"; // Azul
    default:
      return Colors.secondary;
  }
};

export default function MinhasEncomendasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [statusSelecionado, setStatusSelecionado] =
    useState<StatusPedido>("Todos");
  const [ordemData, setOrdemData] = useState("recente");
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);

  // Filtrar e ordenar pedidos
  const pedidosFiltrados = useMemo(() => {
    let pedidos = [...PEDIDOS];

    // Filtrar por status
    if (statusSelecionado !== "Todos") {
      pedidos = pedidos.filter((p) => p.status === statusSelecionado);
    }

    // Ordenar por data
    pedidos.sort((a, b) => {
      const dataA = new Date(a.data).getTime();
      const dataB = new Date(b.data).getTime();
      return ordemData === "recente" ? dataB - dataA : dataA - dataB;
    });

    return pedidos;
  }, [statusSelecionado, ordemData]);

  const renderPedido = ({ item }: { item: (typeof PEDIDOS)[0] }) => (
    <TouchableOpacity
      style={styles.pedidoCard}
      onPress={() => router.push("/(orders)/StatusEncomendaScreen")}
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
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

      {/* Filtros */}
      {filtrosVisiveis && (
        <View style={styles.filtrosContainer}>
          {/* Filtro por Status */}
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

          {/* Ordenar por Data */}
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

      {/* Contador de resultados */}
      <View style={styles.resultadosInfo}>
        <Text style={styles.resultadosText}>
          {pedidosFiltrados.length} encomenda(s) encontrada(s)
        </Text>
      </View>

      {/* Lista de Pedidos */}
      <FlatList
        data={pedidosFiltrados}
        renderItem={renderPedido}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={60} color={Colors.lightGray} />
            <Text style={styles.emptyText}>Não tem pedidos ainda</Text>
          </View>
        }
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
    borderRadius: 0,
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
    borderRadius: 0,
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
  pedidoImagem: {
    width: 60,
    height: 75,
    borderRadius: 0,
    backgroundColor: Colors.lightGray,
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
  verDetalhesButton: {
    padding: Spacing.xs,
  },
});
