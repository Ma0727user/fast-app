/**
 * FAST - Product Grid Screen
 * Grid de produtos por categoria com filtros
 */

import { ModalAdicionarCarrinho } from "@/components/ModalAdicionarCarrinho";
import { Colors, FontSizes, formatPrice, Spacing } from "@/constants/theme";
import { getHomeData } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
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

// Dados mockados como fallback
const PRODUTOS_FALLBACK: Produto[] = [
  {
    id: "1",
    name: "KIMBOLA",
    price: 15000,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=300&fit=crop",
    categoria: "HOMEM",
  },
  {
    id: "2",
    name: "TRAINER PRO",
    price: 28500,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=300&fit=crop",
    categoria: "MULHER",
  },
  {
    id: "3",
    name: "RUNNER ZIP",
    price: 22000,
    image:
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=200&h=300&fit=crop",
    categoria: "HOMEM",
  },
  {
    id: "4",
    name: "FLEX WEAVE",
    price: 18400,
    image:
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=200&h=300&fit=crop",
    categoria: "ACESSÓRIOS",
  },
  {
    id: "5",
    name: "SPORT LUX",
    price: 32000,
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=300&fit=crop",
    categoria: "MULHER",
  },
  {
    id: "6",
    name: "URBAN FIT",
    price: 19500,
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=300&fit=crop",
    categoria: "HOMEM",
  },
];

const CATEGORIAS = ["TODOS", "HOMEM", "MULHER", "ACESSÓRIOS", "EQUIPAMENTOS"];
const ORDENAR_PRECO = [
  { label: "Padrão", value: "default" },
  { label: "Menor Preço", value: "asc" },
  { label: "Maior Preço", value: "desc" },
];

export default function ProductGridScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Debug: Log dos params recebidos
  console.log("[ProductGridScreen] Params recebidos:", params);

  const categoriaParam = Array.isArray(params.categoria)
    ? params.categoria[0]
    : params.categoria || "PRODUTOS";
  const categoriaIdParam = params.categoriaId
    ? Number(params.categoriaId)
    : null;

  console.log("[ProductGridScreen] categoriaParam:", categoriaParam);
  console.log(
    "[ProductGridScreen] categoriaIdParam:",
    categoriaIdParam,
    "tipo:",
    typeof categoriaIdParam,
  );

  const [todosProdutos, setTodosProdutos] = useState<Produto[]>([]);
  const [categoriasApi, setCategoriasApi] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Usar categorias da API se disponíveis, senão usar padrão
  const categoriasFiltro =
    categoriasApi.length > 0
      ? ["TODOS", ...categoriasApi.map((c) => c.nome_categoria)]
      : CATEGORIAS;

  // State para categoria selecionada - inicia com base no parâmetro
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>(
    categoriaIdParam ? categoriaParam : "TODOS",
  );
  const [ordemPreco, setOrdemPreco] = useState("default");
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(
    null,
  );

  // Carregar produtos e categorias da API
  useEffect(() => {
    carregarProdutos();
  }, [categoriaIdParam]);

  // Atualizar categoria selecionada quando categoriaIdParam mudar
  useEffect(() => {
    if (categoriaIdParam && categoriasApi.length > 0) {
      // Encontrar o nome da categoria pelo ID
      const categoriaEncontrada = categoriasApi.find(
        (c) => c.id_categoria === categoriaIdParam,
      );
      if (categoriaEncontrada) {
        setCategoriaSelecionada(categoriaEncontrada.nome_categoria);
      }
    }
  }, [categoriaIdParam, categoriasApi]);

  const carregarProdutos = async () => {
    try {
      setIsLoading(true);
      console.log(
        "[ProductGridScreen] Carregando produtos para categoriaId:",
        categoriaIdParam,
      );

      // Sempre buscar dados da home que contém todos os produtos
      const data = await getHomeData();

      if (data) {
        // Guardar categorias da API
        if (data.categorias) {
          setCategoriasApi(data.categorias);
        }

        // Combinar produtos normais e novidades
        let todosProdutosApi = [
          ...(data.produtos_normais || []).map((p: any) => ({
            id: String(p.id_produto),
            id_categoriafk: p.id_categoriafk,
            name: p.nome_produto,
            price: p.preco,
            promotionalPrice: p.preco_promo || undefined,
            image: p.imagem || "",
            categoria: p.nome_categoria || "",
          })),
          ...(data.lista_novidades || []).map((p: any) => ({
            id: String(p.id_produto),
            id_categoriafk: p.id_categoriafk,
            name: p.nome_produto,
            price: p.preco,
            promotionalPrice: p.preco_promo || undefined,
            image: p.imagem || "",
            categoria: p.nome_categoria || "",
          })),
        ];

        // Se tem ID da categoria, filtrar localmente
        if (categoriaIdParam) {
          console.log(
            "[ProductGridScreen] Filtrando produtos por categoriaId:",
            categoriaIdParam,
          );
          console.log(
            "[ProductGridScreen] Tipo do categoriaIdParam:",
            typeof categoriaIdParam,
          );
          todosProdutosApi = todosProdutosApi.filter((p: any) => {
            console.log(
              "[ProductGridScreen] Produto id_categoriafk:",
              p.id_categoriafk,
              "tipo:",
              typeof p.id_categoriafk,
            );
            return p.id_categoriafk === Number(categoriaIdParam);
          });
          console.log(
            "[ProductGridScreen] Produtos encontrados:",
            todosProdutosApi.length,
          );
        }

        // Remover duplicados
        const uniqueProdutos = todosProdutosApi.filter(
          (p: any, index: number, self: any[]) =>
            index === self.findIndex((t: any) => t.id === p.id),
        );

        setTodosProdutos(uniqueProdutos);
      } else {
        setTodosProdutos(PRODUTOS_FALLBACK);
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setTodosProdutos(PRODUTOS_FALLBACK);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar e ordenar produtos
  const produtosFiltrados = useMemo(() => {
    let produtos = [...todosProdutos];

    // Se não tem produtos da API, usar fallback
    if (produtos.length === 0 && isLoading === false) {
      produtos = PRODUTOS_FALLBACK;
    }

    // Filtrar por categoria
    if (categoriaSelecionada !== "TODOS") {
      produtos = produtos.filter((p) => p.categoria === categoriaSelecionada);
    }

    // Ordenar por preço
    if (ordemPreco === "asc") {
      produtos.sort(
        (a, b) =>
          (a.promotionalPrice || a.price) - (b.promotionalPrice || b.price),
      );
    } else if (ordemPreco === "desc") {
      produtos.sort(
        (a, b) =>
          (b.promotionalPrice || b.price) - (a.promotionalPrice || a.price),
      );
    }

    return produtos;
  }, [todosProdutos, categoriaSelecionada, ordemPreco, isLoading]);

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
    // Fechar o modal e permanecer na mesma tela
    setModalVisible(false);
  };

  const renderProduto = ({ item }: { item: Produto }) => (
    <View style={styles.gridCard}>
      <TouchableOpacity
        onPress={() => {
          console.log(
            "[ProductGridScreen] Clicou no produto:",
            item.id,
            item.name,
          );
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
          <Text style={styles.gridPreco}>
            {formatPrice(item.promotionalPrice || item.price)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.comprarButtonSmall}
          onPress={() => handleComprar(item)}
        >
          <Text style={styles.comprarButtonTextSmall}>COMPRAR</Text>
        </TouchableOpacity>
      </View>
    </View>
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
        <Text style={styles.title}>{categoriaParam.toUpperCase()}</Text>
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

      {/* Filtros - só mostra se filtrosVisiveis for true */}
      {filtrosVisiveis && (
        <View style={styles.filtrosContainer}>
          {/* Categorias */}
          <View style={styles.filtroSection}>
            <Text style={styles.filtroLabel}>CATEGORIA</Text>
            <FlatList
              data={categoriasFiltro}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.filtroChip,
                    categoriaSelecionada === item && styles.filtroChipActive,
                  ]}
                  onPress={() => setCategoriaSelecionada(item)}
                >
                  <Text
                    style={[
                      styles.filtroChipText,
                      categoriaSelecionada === item &&
                        styles.filtroChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Ordenar por preço */}
          <View style={styles.filtroSection}>
            <Text style={styles.filtroLabel}>ORDENAR POR</Text>
            <View style={styles.precoOrdenarContainer}>
              {ORDENAR_PRECO.map((opcao) => (
                <TouchableOpacity
                  key={opcao.value}
                  style={[
                    styles.precoOrdenarButton,
                    ordemPreco === opcao.value &&
                      styles.precoOrdenarButtonActive,
                  ]}
                  onPress={() => setOrdemPreco(opcao.value)}
                >
                  <Text
                    style={[
                      styles.precoOrdenarText,
                      ordemPreco === opcao.value &&
                        styles.precoOrdenarTextActive,
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
          {produtosFiltrados.length} produto(s) encontrado(s)
        </Text>
      </View>

      {/* Grid de Produtos */}
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
            <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
          </View>
        }
      />

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
  precoOrdenarContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  precoOrdenarButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  precoOrdenarButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  precoOrdenarText: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
  },
  precoOrdenarTextActive: {
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
  gridContainer: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  gridCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
  },
  gridImage: {
    width: "100%",
    height: 180,
    backgroundColor: Colors.lightGray,
    marginBottom: Spacing.sm,
    borderRadius: 12,
  },
  gridInfo: {
    paddingHorizontal: 2,
  },
  gridNome: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  gridPreco: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    marginTop: 2,
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
  },
});
