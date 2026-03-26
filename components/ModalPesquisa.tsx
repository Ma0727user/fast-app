/**
 * FAST - Modal de Pesquisa
 * Modal moderno para pesquisa de produtos, categorias e subcategorias em tempo real
 */

import { Colors, FontSizes, formatPrice, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Função para normalizar texto (remover acentos)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

// ============================================
// TIPOS
// ============================================

interface Produto {
  id: string;
  name: string;
  price: number;
  promotionalPrice?: number;
  image: string;
  categoria?: string;
}

interface Categoria {
  id: string;
  nome: string;
  imagem?: string;
}

interface Subcategoria {
  id: string;
  nome: string;
  id_categoria: string;
}

interface SearchResult {
  type: "produto" | "categoria" | "subcategoria";
  data: Produto | Categoria | Subcategoria;
}

// ============================================
// PROPS
// ============================================

interface ModalPesquisaProps {
  visible: boolean;
  onClose: () => void;
  produtos?: ProdutoApp[];
  categorias?: { id: string; nome: string }[];
}

// Tipo para produto da API
interface ProdutoApp {
  id: string;
  name: string;
  description?: string;
  price: number;
  promotionalPrice?: number;
  image: string;
  category?: string;
}

// ============================================
// COMPONENTE
// ============================================

export const ModalPesquisa: React.FC<ModalPesquisaProps> = ({
  visible,
  onClose,
  produtos: produtosDaHome,
  categorias: categoriasDaHome,
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);

  // Produtos para pesquisar - use os da HomeScreen ou os carregados
  const todosProdutos = produtosDaHome || [];
  const todasCategorias = categoriasDaHome || [];

  // Limpar pesquisa quando o modal fechar
  useEffect(() => {
    if (!visible) {
      setSearchQuery("");
      setProdutos([]);
      setCategorias([]);
      setSubcategorias([]);
    }
  }, [visible]);

  // Pesquisar em tempo real quando o usuário digitar
  useEffect(() => {
    if (searchQuery.trim().length >= 1) {
      const timeoutId = setTimeout(() => {
        performSearch(searchQuery);
      }, 200); // Debounce de 200ms

      return () => clearTimeout(timeoutId);
    } else {
      setProdutos([]);
      setCategorias([]);
      setSubcategorias([]);
    }
  }, [searchQuery]);

  // Função de pesquisa - usa produtos reais da aplicação
  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    const q = normalizeText(query);

    try {
      // Simular delay mínimo para UX
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Usar os produtos da HomeScreen se disponíveis
      const produtosParaPesquisar: Produto[] = todosProdutos.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.promotionalPrice || p.price,
        promotionalPrice: p.promotionalPrice,
        image: p.image,
        categoria: p.category,
      }));

      // Filtrar produtos
      const produtosFiltrados = produtosParaPesquisar.filter(
        (p) =>
          normalizeText(p.name).includes(q) ||
          normalizeText(p.categoria || "").includes(q),
      );

      // Usar as categorias da HomeScreen ou as fixas
      const categoriasParaPesquisar = categoriasDaHome
        ? categoriasDaHome.map((c) => ({ id: c.id, nome: c.nome }))
        : [
            { id: "1", nome: "HOMEM" },
            { id: "2", nome: "MULHER" },
            { id: "3", nome: "ACESSÓRIOS" },
            { id: "4", nome: "EQUIPAMENTOS" },
          ];

      const categoriasFiltradas = categoriasParaPesquisar.filter((c) =>
        normalizeText(c.nome).includes(q),
      );

      // Subcategorias fixas
      const mockSubcategorias: Subcategoria[] = [
        { id: "1", nome: "CAMISOLAS", id_categoria: "1" },
        { id: "2", nome: "CALÇAS", id_categoria: "1" },
        { id: "3", nome: "SAIAS", id_categoria: "2" },
        { id: "4", nome: "VESTIDOS", id_categoria: "2" },
        { id: "5", nome: "CASAQUOS", id_categoria: "2" },
        { id: "6", nome: "BERMUDAS", id_categoria: "1" },
      ].filter((s) => normalizeText(s.nome).includes(q));

      setProdutos(produtosFiltrados);
      setCategorias(categoriasFiltradas);
      setSubcategorias(mockSubcategorias);
    } catch (error) {
      console.error("Erro na pesquisa:", error);
      setProdutos([]);
      setCategorias([]);
      setSubcategorias([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar resultados locais (fallback)
  const filteredResults = useCallback(() => {
    const results: SearchResult[] = [];
    const q = normalizeText(searchQuery);

    if (q.length < 1) return results;

    // Adicionar categorias
    categorias.forEach((cat) => {
      if (normalizeText(cat.nome).includes(q)) {
        results.push({ type: "categoria", data: cat });
      }
    });

    // Adicionar subcategorias
    subcategorias.forEach((sub) => {
      if (normalizeText(sub.nome).includes(q)) {
        results.push({ type: "subcategoria", data: sub });
      }
    });

    // Adicionar produtos
    produtos.forEach((prod) => {
      if (
        normalizeText(prod.name).includes(q) ||
        normalizeText(prod.categoria || "").includes(q)
      ) {
        results.push({ type: "produto", data: prod });
      }
    });

    return results;
  }, [searchQuery, categorias, subcategorias, produtos]);

  // Contagem de resultados
  const resultCount =
    produtos.length + categorias.length + subcategorias.length;

  // Navegar para produto
  const handleProdutoPress = (produto: Produto) => {
    onClose();
    router.push({
      pathname: "/(tabs)/ProductDetailScreen",
      params: { id: produto.id },
    });
  };

  // Navegar para categoria
  const handleCategoriaPress = (categoria: Categoria) => {
    onClose();
    router.push({
      pathname: "/(shop)/ProductGridScreen",
      params: { categoriaId: categoria.id, nome: categoria.nome },
    });
  };

  // Navegar para subcategoria
  const handleSubcategoriaPress = (subcategoria: Subcategoria) => {
    onClose();
    router.push({
      pathname: "/(shop)/ProductGridScreen",
      params: { subcategoriaId: subcategoria.id, nome: subcategoria.nome },
    });
  };

  // Renderizar item de produto
  const renderProdutoItem = ({ item }: { item: Produto }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleProdutoPress(item)}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.resultImage}
        resizeMode="cover"
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.categoria && (
          <Text style={styles.resultCategory}>{item.categoria}</Text>
        )}
        <Text style={styles.resultPrice}>
          {formatPrice(item.promotionalPrice || item.price)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.lightGray} />
    </TouchableOpacity>
  );

  // Renderizar item de categoria
  const renderCategoriaItem = ({ item }: { item: Categoria }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategoriaPress(item)}
    >
      <View style={styles.categoryIcon}>
        <Ionicons name="grid-outline" size={24} color={Colors.primary} />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.nome}</Text>
        <Text style={styles.categoryType}>Categoria</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.lightGray} />
    </TouchableOpacity>
  );

  // Renderizar item de subcategoria
  const renderSubcategoriaItem = ({ item }: { item: Subcategoria }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleSubcategoriaPress(item)}
    >
      <View style={styles.categoryIcon}>
        <Ionicons name="layers-outline" size={24} color={Colors.primary} />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.nome}</Text>
        <Text style={styles.categoryType}>Subcategoria</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.lightGray} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header do Modal */}
          <View style={styles.header}>
            <Text style={styles.title}>PESQUISAR</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Campo de Pesquisa */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons
                name="search"
                size={20}
                color={Colors.secondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="O que procura?"
                placeholderTextColor={Colors.lightGray}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
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

          {/* Resultados ou Estado Inicial */}
          {searchQuery.length < 1 ? (
            // Estado Inicial - Sugestões
            <View style={styles.initialState}>
              <Ionicons name="search" size={60} color={Colors.lightGray} />
              <Text style={styles.initialTitle}>
                Pesquise produtos, categorias
              </Text>
              <Text style={styles.initialSubtitle}>e subcategorias</Text>
            </View>
          ) : isLoading ? (
            // Carregando
            <View style={styles.loadingState}>
              <Ionicons name="sync" size={40} color={Colors.primary} />
              <Text style={styles.loadingText}>A pesquisar...</Text>
            </View>
          ) : resultCount === 0 ? (
            // Sem Resultados
            <View style={styles.emptyState}>
              <Ionicons
                name="search-outline"
                size={60}
                color={Colors.lightGray}
              />
              <Text style={styles.emptyTitle}>Nenhum resultado encontrado</Text>
              <Text style={styles.emptySubtitle}>
                Tente pesquisar por outro termo
              </Text>
            </View>
          ) : (
            // Resultados
            <FlatList
              data={filteredResults()}
              renderItem={({ item }) => {
                if (item.type === "produto") {
                  return renderProdutoItem({
                    item: item.data as Produto,
                  });
                } else if (item.type === "categoria") {
                  return renderCategoriaItem({
                    item: item.data as Categoria,
                  });
                } else {
                  return renderSubcategoriaItem({
                    item: item.data as Subcategoria,
                  });
                }
              }}
              keyExtractor={(item, index) => {
                const data = item.data as any;
                return `${item.type}-${data.id}-${index}`;
              }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.resultsList}
              ListHeaderComponent={
                <Text style={styles.resultCount}>
                  {resultCount} resultado{resultCount !== 1 ? "s" : ""}
                </Text>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// ESTILOS
// ============================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
  },
  container: {
    backgroundColor: Colors.background,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    maxHeight: "90%",
    minHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.lg,
    color: Colors.primary,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  initialState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  initialTitle: {
    fontSize: FontSizes.xl,
    fontWeight: "600",
    color: Colors.primary,
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  initialSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.secondary,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: FontSizes.md,
    color: Colors.secondary,
    marginTop: Spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: Colors.primary,
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.secondary,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  resultsList: {
    paddingBottom: Spacing.xxl,
  },
  resultCount: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  resultImage: {
    width: 60,
    height: 75,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
  },
  resultInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  resultName: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.primary,
  },
  resultCategory: {
    fontSize: FontSizes.xs,
    color: Colors.secondary,
    marginTop: 2,
  },
  resultPrice: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.primary,
    marginTop: 4,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    backgroundColor: Colors.lightGray + "20",
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  categoryName: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.primary,
  },
  categoryType: {
    fontSize: FontSizes.xs,
    color: Colors.secondary,
    marginTop: 2,
  },
});

export default ModalPesquisa;
