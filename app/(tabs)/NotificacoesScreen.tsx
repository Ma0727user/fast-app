/**
 * FAST - Notificações Screen
 * Lista de notificações do utilizador
 */

import { Skeleton } from "@/components/ui/Skeleton";
import { Colors, FontSizes, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface Notificacao {
  id: string;
  tipo: "produto" | "novidade" | "pagamento" | "pedido";
  titulo: string;
  mensagem: string;
  data: string;
  lida: boolean;
  imagem?: string;
}

// Simulated API response (since there's no notification service)
// In production, replace with actual API call
const fetchNotificacoes = async (): Promise<Notificacao[]> => {
  // Simulated delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return [];
};

const getIconeTipo = (tipo: Notificacao["tipo"]) => {
  switch (tipo) {
    case "produto":
      return "bag-outline";
    case "novidade":
      return "sparkles-outline";
    case "pagamento":
      return "card-outline";
    case "pedido":
      return "cube-outline";
    default:
      return "notifications-outline";
  }
};

const getCorTipo = (tipo: Notificacao["tipo"]) => {
  switch (tipo) {
    case "produto":
      return Colors.primary;
    case "novidade":
      return "#FFD700";
    case "pagamento":
      return "#4CAF50";
    case "pedido":
      return Colors.secondary;
    default:
      return Colors.primary;
  }
};

export default function NotificacoesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const carregarNotificacoes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const data = await fetchNotificacoes();
      setNotificacoes(data);
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
      setNotificacoes([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarNotificacoes();
  }, [carregarNotificacoes]);

  const onRefresh = useCallback(() => {
    carregarNotificacoes(true);
  }, [carregarNotificacoes]);

  const renderNotificacao = ({ item }: { item: Notificacao }) => (
    <View
      style={[styles.notificacaoItem, !item.lida && styles.notificacaoNaoLida]}
    >
      <View
        style={[
          styles.iconeContainer,
          { backgroundColor: getCorTipo(item.tipo) + "20" },
        ]}
      >
        <Ionicons
          name={getIconeTipo(item.tipo) as any}
          size={22}
          color={getCorTipo(item.tipo)}
        />
      </View>
      <View style={styles.notificacaoContent}>
        <View style={styles.notificacaoHeader}>
          <Text style={styles.notificacaoTitulo}>{item.titulo}</Text>
          {!item.lida && <View style={styles.naoLidaBadge} />}
        </View>
        <Text style={styles.notificacaoMensagem}>{item.mensagem}</Text>
        <Text style={styles.notificacaoData}>{item.data}</Text>
      </View>
      {item.imagem && (
        <Image source={{ uri: item.imagem }} style={styles.notificacaoImagem} />
      )}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>NOTIFICAÇÕES</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Lista de Notificações */}
      {isLoading ? (
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.notificacaoItem}>
              <Skeleton width={44} height={44} borderRadius={22} />
              <View style={styles.notificacaoContent}>
                <Skeleton width={width * 0.5} height={16} borderRadius={4} />
                <Skeleton
                  width={width * 0.7}
                  height={14}
                  borderRadius={4}
                  style={{ marginTop: Spacing.xs }}
                />
                <Skeleton
                  width={80}
                  height={12}
                  borderRadius={4}
                  style={{ marginTop: Spacing.sm }}
                />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={notificacoes}
          renderItem={renderNotificacao}
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
                name="notifications-outline"
                size={60}
                color={Colors.lightGray}
              />
              <Text style={styles.emptyText}>Sem notificações</Text>
            </View>
          }
        />
      )}

      {/* Padding bottom para safe area */}
      <View style={{ height: 60 }} />
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
  placeholder: {
    width: 32,
  },
  listContent: {
    padding: Spacing.lg,
  },
  notificacaoItem: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  notificacaoNaoLida: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  iconeContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  notificacaoContent: {
    flex: 1,
  },
  notificacaoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notificacaoTitulo: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: Colors.primary,
  },
  naoLidaBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  notificacaoMensagem: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    marginTop: Spacing.xs,
  },
  notificacaoData: {
    fontSize: FontSizes.xs,
    color: Colors.lightGray,
    marginTop: Spacing.sm,
  },
  notificacaoImagem: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginLeft: Spacing.sm,
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
});
