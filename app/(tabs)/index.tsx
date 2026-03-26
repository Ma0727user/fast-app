/**
 * FAST - Home Screen
 * Tela principal com banner e categorias
 */

import { ModalPesquisa } from "@/components/ModalPesquisa";
import { Skeleton } from "@/components/ui/Skeleton";
import { Colors, FontSizes, formatPrice, Spacing } from "@/constants/theme";
import { getHomeData, HomeData } from "@/services/authService";
import {
  getProdutos,
  getProdutosPromocionais,
  ProdutoApp,
} from "@/services/produtoService";
import { useStore } from "@/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Largura fixa para cada item do carrossel de novidades (3 itens por tela)
const ITEM_WIDTH = (width - Spacing.lg * 2 - Spacing.md * 2) / 3;

// Tipos
interface Produto {
  id: string;
  name: string;
  price: number;
  image: string;
}

// Banner fixo
const BANNERS = [
  {
    id: "1",
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=450&fit=crop",
  },
  {
    id: "2",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop",
  },
];

const CATEGORIAS = [
  { id: "1", name: "HOMEM", slug: "homem" },
  { id: "2", name: "MULHER", slug: "mulher" },
  { id: "3", name: "ACESSÓRIOS", slug: "acessorios" },
  { id: "4", name: "EQUIPAMENTOS", slug: "equipamentos" },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addToCart = useStore((state) => state.addToCart);
  const cart = useStore((state) => state.cart);
  const getCartItemCount = useStore((state) => state.getCartItemCount);
  const [cartCount, setCartCount] = useState(0);

  // Atualizar contagem do carrinho quando mudar ou tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      setCartCount(getCartItemCount());
    }, [cart, getCartItemCount]),
  );

  // Estados para dados da API
  const [produtos, setProdutos] = useState<ProdutoApp[]>([]);
  const [produtosEmDestaque, setProdutosEmDestaque] = useState<ProdutoApp[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estado para o carrossel de novidades
  const [currentNovidadeIndex, setCurrentNovidadeIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Dados do carrossel duplicados para efeito infinito
  const dadosCarrossel =
    produtosEmDestaque.length > 0
      ? [...produtosEmDestaque, ...produtosEmDestaque]
      : [];

  // Auto-scroll para o carrossel de novidades
  useEffect(() => {
    if (produtosEmDestaque.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentNovidadeIndex((prev) => {
        const nextIndex = prev + 1;
        // Quando chega ao final do primeiro conjunto, volta ao início sem animação
        if (nextIndex >= produtosEmDestaque.length) {
          // Pequeno delay para resetar suavemente
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({
              offset: 0,
              animated: false,
            });
          }, 50);
          return 0;
        }
        // Calcula o offset para scroll suave
        const offset = nextIndex * (ITEM_WIDTH + Spacing.md);
        flatListRef.current?.scrollToOffset({
          offset,
          animated: true,
        });
        return nextIndex;
      });
    }, 4000); // 4 segundos para scroll mais suave

    return () => clearInterval(interval);
  }, [produtosEmDestaque.length]);

  // Estados para dados da API de lista principal
  const [homeData, setHomeData] = useState<HomeData | null>(null);

  // Estado para rastrear produtos adicionados recentemente
  const [produtosAdicionados, setProdutosAdicionados] = useState<Set<string>>(
    new Set(),
  );

  // Função para adicionar produto ao carrinho com feedback visual
  const handleAddToCartWithFeedback = (produto: ProdutoApp) => {
    // Adicionar ao carrinho
    addToCart({
      id: produto.id,
      name: produto.name,
      price: produto.promotionalPrice || produto.price,
      image: produto.image,
      size: "",
      color: "",
      idProduto: parseInt(produto.id, 10),
      idVariacao: undefined,
    });

    // Adicionar ao conjunto de produtos adicionados
    setProdutosAdicionados((prev) => new Set([...prev, produto.id]));

    // Remover após 4.5 segundos
    setTimeout(() => {
      setProdutosAdicionados((prev) => {
        const newSet = new Set(prev);
        newSet.delete(produto.id);
        return newSet;
      });
    }, 4500);
  };

  // Estado para modal de pesquisa (global)
  const isSearchModalVisible = useStore((state) => state.isSearchModalVisible);
  const setSearchModalVisible = useStore(
    (state) => state.setSearchModalVisible,
  );

  // Estado para categoria selecionada (inicia com TODOS)
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<string>("TODOS");

  // Função para carregar dados da API
  const carregarDados = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          if (produtos.length === 0 && produtosEmDestaque.length === 0) {
            setIsLoading(true);
          }
        }

        const data = await getHomeData();

        if (data) {
          setHomeData(data);
          const produtosFormatados: ProdutoApp[] = data.produtos_normais.map(
            (p) => ({
              id: String(p.id_produto),
              name: p.nome_produto,
              description: p.descricao,
              price: p.preco,
              promotionalPrice: p.preco_promo || undefined,
              image: p.imagem || "",
              category: "",
              sizes: [],
              colors: [],
            }),
          );
          setProdutos(produtosFormatados);

          const novidadesFormatados: ProdutoApp[] = data.lista_novidades.map(
            (p) => ({
              id: String(p.id_produto),
              name: p.nome_produto,
              description: p.descricao,
              price: p.preco,
              promotionalPrice: p.preco_promo || undefined,
              image: p.imagem || "",
              category: "",
              sizes: [],
              colors: [],
            }),
          );
          setProdutosEmDestaque(novidadesFormatados);
        } else {
          const [todosProdutos, promocoes] = await Promise.all([
            getProdutos({ tamanho: 20 }),
            getProdutosPromocionais(),
          ]);
          setProdutos(todosProdutos);
          setProdutosEmDestaque(
            promocoes.length > 0 ? promocoes : todosProdutos.slice(0, 8),
          );
        }
      } catch (err: any) {
        console.error("Erro ao carregar dados:", err);
        // Não mostrar erro, apenas arrays vazios
        setProdutos([]);
        setProdutosEmDestaque([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [produtos.length, produtosEmDestaque.length],
  );

  // Carregar dados ao montar o componente
  useEffect(() => {
    if (produtos.length === 0 && produtosEmDestaque.length === 0) {
      carregarDados();
    }
  }, []);

  // Função Pull to Refresh
  const onRefresh = useCallback(() => {
    carregarDados(true);
  }, [carregarDados]);

  const mapToProduto = (produtoApp: ProdutoApp): Produto => ({
    id: produtoApp.id,
    name: produtoApp.name,
    price: produtoApp.promotionalPrice || produtoApp.price,
    image: produtoApp.image,
  });

  // Categorias com opção TODOS
  const categoriasData = [
    { id: "TODOS", name: "TODOS", slug: "todos" },
    ...(homeData?.categorias?.map((c) => ({
      id: String(c.id_categoria),
      name: c.nome_categoria.toUpperCase(),
      slug: c.nome_categoria,
    })) || CATEGORIAS),
  ];

  // Produtos filtrados por categoria
  console.log("Categoria selecionada:", categoriaSelecionada);
  console.log("Total produtos:", produtos.length);
  const produtosFiltrados =
    categoriaSelecionada === "TODOS"
      ? produtos
      : produtos.filter((p) => {
          const cat = p.category?.toUpperCase() || "";
          return cat === categoriaSelecionada;
        });
  console.log("Produtos filtrados:", produtosFiltrados.length);

  const handleComprar = (produto: ProdutoApp) => {
    handleAddToCartWithFeedback(produto);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Header fixo */}
      <View style={styles.headerFixed}>
        <Image
          source={require("@/assets/images/fast-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => setSearchModalVisible(true)}
            style={styles.headerIconButton}
          >
            <Ionicons name="search-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/NotificacoesScreen")}
            style={styles.headerIconButton}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ScrollView apenas para o conteúdo rolável */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        nestedScrollEnabled={true}
      >
        {/* Banner Skeleton */}
        {isLoading && (
          <View style={styles.banner}>
            <Skeleton width={width} height={width * 0.5625} borderRadius={0} />
          </View>
        )}

        {/* Banner */}
        {!isLoading && (
          <FlatList
            data={(homeData?.banners as any) || BANNERS}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.banner}>
                <Image
                  source={{ uri: item.imagem || item.image }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
            keyExtractor={(item: any) => String(item.id_banner || item.id)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.bannerList}
            nestedScrollEnabled={true}
          />
        )}

        {/* Novidades - Carrossel Horizontal com 3 produtos visíveis */}
        {isLoading && (
          <View style={styles.section}>
            <Skeleton
              width={120}
              height={20}
              style={{ marginBottom: Spacing.md, marginLeft: Spacing.lg }}
            />
            <FlatList
              data={[1, 2, 3, 4, 5, 6]}
              renderItem={() => (
                <View
                  style={[styles.novidadeCard, { marginRight: Spacing.md }]}
                >
                  <Skeleton width={ITEM_WIDTH} height={140} borderRadius={8} />
                  <View style={{ marginTop: Spacing.sm }}>
                    <Skeleton
                      width={ITEM_WIDTH * 0.7}
                      height={14}
                      borderRadius={4}
                    />
                    <Skeleton
                      width={ITEM_WIDTH * 0.5}
                      height={16}
                      borderRadius={4}
                      style={{ marginTop: 8 }}
                    />
                  </View>
                </View>
              )}
              keyExtractor={(item) => String(item)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.novidadeListContent}
              nestedScrollEnabled={true}
            />
          </View>
        )}

        {!isLoading && produtosEmDestaque.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOVIDADES</Text>
            <FlatList
              ref={flatListRef}
              data={dadosCarrossel}
              renderItem={({ item }: { item: ProdutoApp }) => (
                <View style={styles.novidadeCard}>
                  <View style={styles.imageContainer}>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/ProductDetailScreen",
                          params: { id: item.id },
                        })
                      }
                    >
                      <Image
                        source={{ uri: item.image }}
                        style={styles.novidadeImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                    {item.promotionalPrice &&
                      item.promotionalPrice < item.price && (
                        <View style={styles.promocaoBadge}>
                          <Text style={styles.promocaoText}>PROMOÇÃO</Text>
                        </View>
                      )}
                  </View>
                  <View style={styles.novidadeInfo}>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/ProductDetailScreen",
                          params: { id: item.id },
                        })
                      }
                      style={styles.novidadeTextContainer}
                    >
                      <Text style={styles.novidadeNome} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.novidadePreco}>
                        {formatPrice(item.promotionalPrice || item.price)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              keyExtractor={(item: ProdutoApp, index: number) =>
                `${item.id}-${index}`
              }
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled={false}
              snapToInterval={ITEM_WIDTH + Spacing.md}
              decelerationRate="fast"
              contentContainerStyle={styles.novidadeListContent}
              style={styles.novidadeList}
              onScroll={(event) => {
                const offsetX = event.nativeEvent.contentOffset.x;
                const newIndex = Math.round(
                  offsetX / (ITEM_WIDTH + Spacing.md),
                );
                if (newIndex !== currentNovidadeIndex) {
                  // Apenas atualiza se estiver dentro do primeiro conjunto
                  if (newIndex < produtosEmDestaque.length) {
                    setCurrentNovidadeIndex(newIndex);
                  }
                }
              }}
              scrollEventThrottle={16}
              onMomentumScrollEnd={(event) => {
                const offsetX = event.nativeEvent.contentOffset.x;
                const newIndex = Math.round(
                  offsetX / (ITEM_WIDTH + Spacing.md),
                );
                // Quando chega ao final do primeiro conjunto, volta ao início
                if (
                  newIndex >= produtosEmDestaque.length &&
                  produtosEmDestaque.length > 0
                ) {
                  flatListRef.current?.scrollToOffset({
                    offset: 0,
                    animated: false,
                  });
                  setCurrentNovidadeIndex(0);
                } else if (
                  newIndex >= 0 &&
                  newIndex < produtosEmDestaque.length
                ) {
                  setCurrentNovidadeIndex(newIndex);
                }
              }}
              nestedScrollEnabled={true}
            />
            <View style={styles.paginationDots}>
              {produtosEmDestaque.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentNovidadeIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Sem Novidades */}
        {!isLoading && produtosEmDestaque.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOVIDADES</Text>
            <View style={styles.emptySection}>
              <Ionicons
                name="cube-outline"
                size={40}
                color={Colors.lightGray}
              />
              <Text style={styles.emptySectionText}>Em breve</Text>
            </View>
          </View>
        )}

        {/* Categorias */}
        <View style={styles.section}>
          {isLoading ? (
            <View style={styles.categoriasWrapper}>
              <View
                style={{
                  flexDirection: "row",
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.sm,
                }}
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton
                    key={i}
                    width={70}
                    height={36}
                    borderRadius={8}
                    style={{ marginRight: Spacing.xs }}
                  />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.categoriasWrapper}>
              <FlatList
                data={categoriasData}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoriaButton,
                      categoriaSelecionada === item.id &&
                        styles.categoriaButtonActive,
                    ]}
                    onPress={() => {
                      console.log("Categoria clicada:", item.id);
                      setCategoriaSelecionada(item.id);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoriaButtonText,
                        categoriaSelecionada === item.id &&
                          styles.categoriaButtonTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriasList}
                nestedScrollEnabled={true}
              />
            </View>
          )}
        </View>

        {/* Produtos Grid */}
        {isLoading && (
          <View style={styles.section}>
            <Skeleton
              width={100}
              height={20}
              style={{ marginBottom: Spacing.md, marginLeft: Spacing.lg }}
            />
            <View style={styles.gridContainer}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <View key={i} style={styles.gridCard}>
                  <Skeleton width="100%" height={180} borderRadius={12} />
                  <View style={{ marginTop: Spacing.sm }}>
                    <Skeleton width="100%" height={14} borderRadius={4} />
                    <Skeleton
                      width="50%"
                      height={16}
                      borderRadius={4}
                      style={{ marginTop: 8 }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {!isLoading && produtosFiltrados.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PRODUTOS</Text>
            <FlatList
              data={produtosFiltrados.slice(0, 16)}
              renderItem={({ item }) => (
                <View style={styles.gridCard}>
                  <View style={styles.imageContainer}>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/ProductDetailScreen",
                          params: { id: item.id },
                        })
                      }
                    >
                      <Image
                        source={{ uri: item.image }}
                        style={styles.gridImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                    {item.promotionalPrice &&
                      item.promotionalPrice < item.price && (
                        <View style={styles.promocaoBadge}>
                          <Text style={styles.promocaoText}>PROMOÇÃO</Text>
                        </View>
                      )}
                  </View>
                  <View style={styles.gridInfo}>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/ProductDetailScreen",
                          params: { id: item.id },
                        })
                      }
                      style={styles.gridTextContainer}
                    >
                      <Text style={styles.gridNome}>{item.name}</Text>
                      <Text style={styles.gridPreco}>
                        {formatPrice(item.promotionalPrice || item.price)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              keyExtractor={(item) => item.id}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.gridContainer}
              nestedScrollEnabled={true}
            />
          </View>
        )}

        {/* Sem Produtos */}
        {!isLoading &&
          produtos.length > 0 &&
          produtosFiltrados.length === 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PRODUTOS</Text>
              <View style={styles.emptySection}>
                <Ionicons
                  name="search-outline"
                  size={40}
                  color={Colors.lightGray}
                />
                <Text style={styles.emptySectionText}>
                  Não há produtos nesta categoria
                </Text>
              </View>
            </View>
          )}

        {!isLoading && produtos.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PRODUTOS</Text>
            <View style={styles.emptySection}>
              <Ionicons
                name="cube-outline"
                size={40}
                color={Colors.lightGray}
              />
              <Text style={styles.emptySectionText}>
                Não há produtos disponíveis
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Modal de Pesquisa */}
      <ModalPesquisa
        visible={isSearchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        produtos={produtos}
        categorias={
          homeData?.categorias?.map((c) => ({
            id: String(c.id_categoria),
            nome: c.nome_categoria.toUpperCase(),
          })) || CATEGORIAS.map((c) => ({ id: c.id, nome: c.name }))
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
  headerFixed: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconButton: {
    marginLeft: Spacing.md,
  },
  logo: {
    width: 100,
    height: 40,
  },
  bannerList: {
    marginBottom: Spacing.lg,
  },
  banner: {
    width: width,
    height: width * 0.5625,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  categoriasList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  categoriasWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray + "40",
  },
  categoriaButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.xs,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  categoriaButtonText: {
    color: Colors.secondary,
    fontSize: FontSizes.sm,
    fontWeight: "500",
    letterSpacing: 1,
  },
  categoriaButtonActive: {
    backgroundColor: Colors.primary,
  },
  categoriaButtonTextActive: {
    color: Colors.white,
    fontWeight: "700",
  },
  categoriaDivider: {
    height: 1,
    backgroundColor: Colors.lightGray + "40",
    marginTop: Spacing.md,
    marginHorizontal: Spacing.lg,
  },
  destaqueList: {
    paddingHorizontal: Spacing.lg,
  },
  carouselContainer: {
    paddingHorizontal: Spacing.lg,
  },
  // Estilos para o carrossel de novidades com FlatList horizontal
  novidadeList: {
    marginBottom: Spacing.sm,
  },
  novidadeListContent: {
    paddingHorizontal: Spacing.lg,
  },
  novidadeCard: {
    width: ITEM_WIDTH,
    marginRight: Spacing.md,
  },
  novidadeImage: {
    width: ITEM_WIDTH,
    height: 140,
    backgroundColor: Colors.lightGray,
    marginBottom: Spacing.sm,
    borderRadius: 8,
  },
  novidadeInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  novidadeTextContainer: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  novidadeNome: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
    color: Colors.primary,
    lineHeight: 14,
  },
  novidadePreco: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.secondary,
    marginTop: 2,
  },
  destaqueCard: {
    width: 140,
    marginRight: Spacing.md,
  },
  destaqueImage: {
    width: 140,
    height: 180,
    backgroundColor: Colors.lightGray,
    marginBottom: Spacing.sm,
    borderRadius: 12,
  },
  imageContainer: {
    position: "relative",
  },
  promocaoBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  promocaoText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  destaqueInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  destaqueTextContainer: {
    flex: 1,
  },
  destaqueNome: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  destaquePreco: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    marginTop: 2,
  },
  addCartButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.xs,
    borderRadius: 8,
  },
  addCartButtonSmall: {
    backgroundColor: Colors.primary,
    padding: Spacing.xs,
    borderRadius: 6,
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.lightGray,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  emptySection: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.lightGray + "30",
    borderRadius: 12,
  },
  emptySectionText: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.secondary,
  },
  gridContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gridTextContainer: {
    flex: 1,
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
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
});
