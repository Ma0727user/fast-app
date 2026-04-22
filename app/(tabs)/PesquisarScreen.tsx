/**
 * FAST - Pesquisar Screen
 * Tela de pesquisa de produtos
 */

import { ModalAdicionarCarrinho } from "@/components/ModalAdicionarCarrinho";
import { Skeleton } from "@/components/ui/Skeleton";
import { Colors, FontSizes, formatPrice, Spacing } from "@/constants/theme";
import { getHomeData } from "@/services/authService";
import { useStore } from "@/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface Produto {
  id: string;
  id_categoriafk?: number;
  name: string;
  price: number;
  promotionalPrice?: number;
  image: string;
  categoria: string;
}

export default function PesquisarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  const [todosProdutos, setTodosProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(
    null,
  );

  // Carregar produtos da API
  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      setIsLoading(true);
      const data = await getHomeData();

      if (data) {
        let todosProdutosApi = (data.produtos || []).map((p: any) => ({
          id: String(p.id_produto),
          id_categoriafk: p.id_categoria,
          name: p.nome_produto,
          price: p.preco,
          promotionalPrice: p.preco_promo || undefined,
          image: p.imagem1 || p.imagem || "",
          categoria: p.nome_categoria || "",
        }));

        // Remover duplicados
        const uniqueProdutos = todosProdutosApi.filter(
          (p: any, index: number, self: any[]) =>
            index === self.findIndex((t: any) => t.id === p.id),
        );

        setTodosProdutos(uniqueProdutos);
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setTodosProdutos([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar produtos pela pesquisa
  const produtosFiltrados = useMemo(() => {
    let produtos = [...todosProdutos];

    // Filtrar por termo de pesquisa
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      produtos = produtos.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.categoria.toLowerCase().includes(query),
      );
    }

    return produtos;
  }, [todosProdutos, searchQuery]);

  const handleComprar = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setModalVisible(true);
  };

  const handleAdicionarAoCarrinho = (
    quantidade: number,
    tamanho: string,
    cor: string,
  ) => {
    console.log("Adicionado ao carrinho:", {
      produto: produtoSelecionado,
      quantidade,
      tamanho,
      cor,
    });
    setModalVisible(false);
  };

  const renderProduto = ({ item }: { item: Produto }) => (
    <View style={styles.gridCard}>
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: "/(tabs)/ProductDetailScreen",
            params: { id: item.id },
          });
        }}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.gridImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <View style={styles.gridInfo}>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(tabs)/ProductDetailScreen",
              params: { id: item.id },
            })
          }
        >
          <Text style={styles.gridNome}>{item.name}</Text>
          <Text style={styles.gridCategoria}>{item.categoria}</Text>
          <Text style={styles.gridPreco}>
            {formatPrice(item.promotionalPrice || item.price)}
          </Text>
        </TouchableOpacity>
      </View>
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
        <Text style={styles.title}>PESQUISAR</Text>
        {isAuthenticated && (
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
        )}
      </View>

      {/* Campo de Pesquisa */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.secondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Encontre o produto ideal"
            placeholderTextColor={Colors.lightGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={Colors.secondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contador de resultados */}
      {searchQuery.length > 0 && (
        <View style={styles.resultadosInfo}>
          <Text style={styles.resultadosText}>
            {produtosFiltrados.length} resultado(s) para &quot;{searchQuery}
            &quot;
          </Text>
        </View>
      )}

      {/* Grid de Produtos */}
      {isLoading ? (
        <View style={styles.gridContainer}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={styles.gridCard}>
              <Skeleton width="100%" height={180} borderRadius={12} />
              <View style={{ marginTop: Spacing.sm }}>
                <Skeleton width="80%" height={14} borderRadius={4} />
                <Skeleton
                  width="50%"
                  height={12}
                  borderRadius={4}
                  style={{ marginTop: 4 }}
                />
                <Skeleton
                  width="40%"
                  height={16}
                  borderRadius={4}
                  style={{ marginTop: 4 }}
                />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={produtosFiltrados}
          renderItem={renderProduto}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="search-outline"
                size={60}
                color={Colors.lightGray}
              />
              <Text style={styles.emptyText}>
                {searchQuery.length > 0
                  ? "Nenhum produto encontrado"
                  : "Digite um termo para pesquisar"}
              </Text>
            </View>
          }
        />
      )}

      {/* Modal Adicionar ao Carrinho */}
      <ModalAdicionarCarrinho
        visible={modalVisible}
        produto={produtoSelecionado}
        onClose={() => setModalVisible(false)}
        onAdicionar={handleAdicionarAoCarrinho}
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
  title: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.primary,
    padding: 0,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  resultadosInfo: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  resultadosText: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
  },
  gridContainer: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  gridCard: {
    width: (width - Spacing.md * 2 - Spacing.sm) / 2,
  },
  gridImage: {
    width: "100%",
    height: 180,
    backgroundColor: Colors.lightGray,
    marginBottom: Spacing.sm,
    borderRadius: 0,
  },
  gridInfo: {
    paddingHorizontal: 2,
  },
  gridNome: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  gridCategoria: {
    fontSize: FontSizes.xs,
    color: Colors.secondary,
    marginTop: 2,
  },
  gridPreco: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: "700",
    marginTop: 4,
  },
  comprarButtonSmall: {
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  comprarButtonTextSmall: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontWeight: "600",
    letterSpacing: 1,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: Spacing.xxl * 2,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.lightGray,
    marginTop: Spacing.md,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    padding: Spacing.xs,
  },
  notificationButton: {
    padding: Spacing.xs,
  },
});
