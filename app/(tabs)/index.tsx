/**
 * FAST - Home Screen
 * Tela principal com banner e categorias
 */

import { ModalPesquisa } from "@/components/ModalPesquisa";
import { Skeleton } from "@/components/ui/Skeleton";
import { Colors, FontSizes, formatPrice, Spacing } from "@/constants/theme";
import {
    getHomeData,
    getParceiros,
    HomeData,
    Parceiro,
} from "@/services/authService";
import {
    getProdutos,
    getProdutosPromocionais,
    ProdutoApp,
} from "@/services/produtoService";
import { useStore } from "@/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { ResizeMode, Video } from "expo-av";
import { useRouter } from "expo-router";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
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
const NOVIDADE_GAP = Spacing.sm;
const ITEM_WIDTH = (width - Spacing.lg * 2 - NOVIDADE_GAP * 2) / 3;
const PARCEIRO_ITEM_WIDTH = width - Spacing.lg * 2;
const PARCEIRO_GAP = Spacing.sm;
const PARCEIRO_CARD_HEIGHT = 220;

// Tipos
interface Produto {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface ParceiroCarrosselItem extends Parceiro {
  carouselKey: string;
}

const sortProdutosMaisRecentes = (items: ProdutoApp[]): ProdutoApp[] => {
  return [...items].sort((a, b) => Number(b.id) - Number(a.id));
};

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
  const isAuthenticated = useStore((state) => state.isAuthenticated);
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
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estado para o carrossel de novidades
  const [currentNovidadeIndex, setCurrentNovidadeIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const parceirosFlatListRef = useRef<FlatList<ParceiroCarrosselItem>>(null);
  const parceiroIndexRef = useRef(0);

  // Dados do carrossel duplicados para efeito infinito
  const dadosCarrossel =
    produtosEmDestaque.length > 0
      ? [...produtosEmDestaque, ...produtosEmDestaque]
      : [];

  const parceirosCarrossel: ParceiroCarrosselItem[] =
    parceiros.length > 1
      ? [...parceiros, ...parceiros, ...parceiros].map((item, index) => ({
          ...item,
          carouselKey: `${item.id_parceiro}-${index}`,
        }))
      : parceiros.map((item, index) => ({
          ...item,
          carouselKey: `${item.id_parceiro}-${index}`,
        }));

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
        const offset = nextIndex * (ITEM_WIDTH + NOVIDADE_GAP);
        flatListRef.current?.scrollToOffset({
          offset,
          animated: true,
        });
        return nextIndex;
      });
    }, 4000); // 4 segundos para scroll mais suave

    return () => clearInterval(interval);
  }, [produtosEmDestaque.length]);

  useEffect(() => {
    if (parceiros.length <= 1) {
      parceiroIndexRef.current = 0;
      return;
    }

    const initialIndex = parceiros.length;
    parceiroIndexRef.current = initialIndex;

    const timeout = setTimeout(() => {
      parceirosFlatListRef.current?.scrollToOffset({
        offset: initialIndex * (PARCEIRO_ITEM_WIDTH + PARCEIRO_GAP),
        animated: false,
      });
    }, 50);

    return () => clearTimeout(timeout);
  }, [parceiros.length]);

  useEffect(() => {
    if (parceiros.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = parceiroIndexRef.current + 1;
      parceirosFlatListRef.current?.scrollToOffset({
        offset: nextIndex * (PARCEIRO_ITEM_WIDTH + PARCEIRO_GAP),
        animated: true,
      });
      parceiroIndexRef.current = nextIndex;
    }, 4000);

    return () => clearInterval(interval);
  }, [parceiros.length]);

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

        // Buscar parceiros em paralelo
        const parceirosDados = await getParceiros();
        setParceiros(parceirosDados);

        if (data) {
          setHomeData(data);

          // All products from API
          const produtosFormatados: ProdutoApp[] = sortProdutosMaisRecentes(
            data.produtos.map((p) => ({
              id: String(p.id_produto),
              name: p.nome_produto,
              description: p.descricao,
              price: p.preco,
              promotionalPrice: p.preco_promo || undefined,
              image: p.imagem1 || p.imagem || "",
              category: p.nome_categoria || "",
              sizes: [],
              colors: [],
              destaque: p.destaque === "sim",
              homem: p.homem,
              mulher: p.mulher,
              crianca: p.crianca,
              desporto: p.desporto,
              produtoAngola: p.produtoAngola,
            })),
          );
          setProdutos(produtosFormatados);

          // Products with destaque = "sim"
          const produtosDestaque = produtosFormatados.filter((p) => p.destaque);
          setProdutosEmDestaque(produtosDestaque);

          // Se a lista principal não retornou destaques, buscá-los separadamente e mesclá-los
          if (produtosDestaque.length === 0) {
            try {
              const promocoesExternas = await getProdutosPromocionais();
              if (promocoesExternas.length > 0) {
                const promoIds = new Set(promocoesExternas.map((p) => p.id));
                const produtosComDestaque = sortProdutosMaisRecentes([
                  ...promocoesExternas,
                  ...produtosFormatados.filter((p) => !promoIds.has(p.id)),
                ]);
                setProdutos(produtosComDestaque);
                setProdutosEmDestaque(promocoesExternas);
              }
            } catch {
              // mantém os dados já definidos
            }
          }
        } else {
          const [todosProdutos, promocoes] = await Promise.all([
            getProdutos({ tamanho: 20 }),
            getProdutosPromocionais(),
          ]);
          // Mesclar destaques na lista principal para aparecerem no grid de PRODUTOS também
          const promoIds = new Set(promocoes.map((p) => p.id));
          const produtosCompletos = sortProdutosMaisRecentes([
            ...promocoes,
            ...todosProdutos.filter((p) => !promoIds.has(p.id)),
          ]);
          setProdutos(produtosCompletos);
          setProdutosEmDestaque(
            promocoes.length > 0 ? promocoes : todosProdutos.slice(0, 8),
          );
        }
      } catch (err: any) {
        console.error("Erro ao carregar dados:", err);
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

  const exploreCategorias = useMemo(() => {
    const categorias = homeData?.categorias || [];
    if (categorias.length <= 4) return categorias;

    const embaralhadas = [...categorias].sort(() => Math.random() - 0.5);
    return embaralhadas.slice(0, 4);
  }, [homeData?.categorias]);

  // Produtos filtrados por tab (excluindo destaques — aparecem apenas em Novidades)
  const produtosSemDestaque = produtos.filter((p) => !p.destaque);
  const produtosFiltrados =
    categoriaSelecionada === "TODOS"
      ? produtosSemDestaque
      : produtosSemDestaque.filter((p) => {
          switch (categoriaSelecionada) {
            case "HOMEM":
              return p.homem === true;
            case "MULHER":
              return p.mulher === true;
            case "CRIANCA":
              return p.crianca === true;
            case "DESPORTO":
              return p.desporto === true;
            default:
              return true;
          }
        });

  const handleComprar = (produto: ProdutoApp) => {
    handleAddToCartWithFeedback(produto);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header fixo */}
      <View style={styles.headerFixed}>
        <View style={styles.headerLeft}>
          <Image
            source={require("@/assets/images/fast-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/ProdutoAngolaScreen")}
            style={styles.produtoAngolaButton}
          >
            <Image
              source={require("@/assets/images/produtoangola.jpeg")}
              style={styles.produtoAngolaImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => setSearchModalVisible(true)}
            style={styles.headerIconButton}
          >
            <Ionicons name="search-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
          {isAuthenticated && (
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
          )}
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

        {/* Banner - tipo Principal, Secundário e Video */}
        {!isLoading && (
          <FlatList
            data={(homeData?.banners || []).filter(
              (b: any) =>
                b.tipo === "Principal" ||
                b.tipo === "Secundário" ||
                b.tipo === "Secundario" ||
                b.tipo === "Video",
            )}
            renderItem={({ item }: any) => {
              const hasValidVideo =
                item.video &&
                !item.video.includes("/null") &&
                item.video.trim() !== "";
              const hasValidImage =
                item.imagem &&
                !item.imagem.includes("/null") &&
                item.imagem.trim() !== "";

              if (!hasValidVideo && !hasValidImage) return null;

              return (
                <TouchableOpacity style={styles.banner}>
                  {hasValidVideo ? (
                    <Video
                      source={{ uri: item.video }}
                      style={styles.bannerImage}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay
                      isLooping
                      isMuted
                    />
                  ) : (
                    <Image
                      source={{ uri: item.imagem }}
                      style={styles.bannerImage}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>
              );
            }}
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
                  style={[styles.novidadeCard, { marginRight: NOVIDADE_GAP }]}
                >
                  <Skeleton width={ITEM_WIDTH} height={140} borderRadius={0} />
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
              snapToInterval={ITEM_WIDTH + NOVIDADE_GAP}
              decelerationRate="fast"
              contentContainerStyle={styles.novidadeListContent}
              style={styles.novidadeList}
              onScroll={(event) => {
                const offsetX = event.nativeEvent.contentOffset.x;
                const newIndex = Math.round(
                  offsetX / (ITEM_WIDTH + NOVIDADE_GAP),
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
                  offsetX / (ITEM_WIDTH + NOVIDADE_GAP),
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

        {/* Categorias - 4 primeiras com UI em cards */}
        {!isLoading && exploreCategorias.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EXPLORE MAIS</Text>
            <View style={styles.categoriasGrid}>
              {exploreCategorias.map((cat: any) => (
                <TouchableOpacity
                  key={cat.id_categoria}
                  style={styles.categoriaGridItem}
                  onPress={() => {
                    router.push({
                      pathname: "/(shop)/ProductGridScreen",
                      params: {
                        categoria: cat.nome_categoria,
                        categoriaId: String(cat.id_categoria),
                      },
                    });
                  }}
                >
                  {cat.foto_categoria ? (
                    <Image
                      source={{ uri: cat.foto_categoria }}
                      style={styles.categoriaGridImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.categoriaGridSemImagem}>
                      <Ionicons
                        name="grid-outline"
                        size={30}
                        color={Colors.lightGray}
                      />
                    </View>
                  )}
                  <View style={styles.categoriaGridOverlay} />
                  <View style={styles.categoriaGridContent}>
                    <Text style={styles.categoriaGridNome}>
                      {cat.nome_categoria.toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
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
                    borderRadius={0}
                    style={{ marginRight: Spacing.xs }}
                  />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.categoriasWrapper}>
              <FlatList
                data={[
                  { id: "TODOS", name: "TODOS" },
                  { id: "HOMEM", name: "HOMEM" },
                  { id: "MULHER", name: "MULHER" },
                  { id: "CRIANCA", name: "CRIANÇA" },
                  { id: "DESPORTO", name: "DESPORTO" },
                ]}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoriaButton,
                      categoriaSelecionada === item.id &&
                        styles.categoriaButtonActive,
                    ]}
                    onPress={() => {
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
                  <Skeleton width="100%" height={180} borderRadius={0} />
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

        {/* Parceiros - Carrossel */}
        {isLoading && (
          <View style={styles.section}>
            <Skeleton
              width={120}
              height={20}
              style={{ marginBottom: Spacing.md, marginLeft: Spacing.lg }}
            />
            <View style={styles.parceirosCarousel}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.parceiroGridItem}>
                  <Skeleton
                    width="100%"
                    height={PARCEIRO_CARD_HEIGHT}
                    borderRadius={0}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {!isLoading && parceiros.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PARCEIROS</Text>
            <FlatList
              ref={parceirosFlatListRef}
              data={parceirosCarrossel}
              keyExtractor={(item) => item.carouselKey}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.parceirosCarousel}
              snapToAlignment="start"
              snapToInterval={PARCEIRO_ITEM_WIDTH + PARCEIRO_GAP}
              decelerationRate="fast"
              onMomentumScrollEnd={(event) => {
                if (parceiros.length <= 1) return;

                const offsetX = event.nativeEvent.contentOffset.x;
                const rawIndex = Math.round(
                  offsetX / (PARCEIRO_ITEM_WIDTH + PARCEIRO_GAP),
                );

                if (rawIndex < parceiros.length) {
                  const adjustedIndex = rawIndex + parceiros.length;
                  parceirosFlatListRef.current?.scrollToOffset({
                    offset:
                      adjustedIndex * (PARCEIRO_ITEM_WIDTH + PARCEIRO_GAP),
                    animated: false,
                  });
                  parceiroIndexRef.current = adjustedIndex;
                  return;
                }

                if (rawIndex >= parceiros.length * 2) {
                  const adjustedIndex = rawIndex - parceiros.length;
                  parceirosFlatListRef.current?.scrollToOffset({
                    offset:
                      adjustedIndex * (PARCEIRO_ITEM_WIDTH + PARCEIRO_GAP),
                    animated: false,
                  });
                  parceiroIndexRef.current = adjustedIndex;
                  return;
                }

                parceiroIndexRef.current = rawIndex;
              }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.parceiroGridItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    router.push({
                      pathname: "/(shop)/ProductGridScreen",
                      params: {
                        parceiro: item.nomeparceiro,
                        parceiroId: String(item.id_parceiro),
                      },
                    });
                  }}
                >
                  <Image
                    source={{ uri: item.foto_parceiro }}
                    style={styles.parceiroGridImage}
                    resizeMode="cover"
                  />
                  <View style={styles.parceiroGridOverlay} />
                  <View style={styles.parceiroGridContent}>
                    <Text style={styles.parceiroGridNome} numberOfLines={2}>
                      {item.nomeparceiro.toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
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
  produtoAngolaButton: {
    marginLeft: 8,
  },
  produtoAngolaImage: {
    width: 68,
    height: 68,
    borderRadius: 6,
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
    borderRadius: 0,
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
    marginRight: NOVIDADE_GAP,
  },
  novidadeImage: {
    width: ITEM_WIDTH,
    height: 140,
    backgroundColor: Colors.lightGray,
    marginBottom: Spacing.sm,
    borderRadius: 0,
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
    borderRadius: 0,
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
    borderRadius: 0,
  },
  addCartButtonSmall: {
    backgroundColor: Colors.primary,
    padding: Spacing.xs,
    borderRadius: 0,
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
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
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
  categoriasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.lg,
    justifyContent: "space-between",
  },
  categoriaGridItem: {
    width: (width - Spacing.lg * 2 - Spacing.xs) / 2,
    height: 130,
    borderRadius: 0,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  categoriaGridImage: {
    width: "100%",
    height: "100%",
  },
  categoriaGridSemImagem: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
  },
  categoriaGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  categoriaGridContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
  },
  categoriaGridNome: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 1,
  },
  categoriaGridInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  categoriaGridNumProdutos: {
    fontSize: FontSizes.xs,
    color: Colors.white,
  },
  exploreList: {
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
  },
  exploreCategoryBlock: {
    paddingTop: Spacing.sm,
  },
  exploreCategoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  exploreCategoryName: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 0.6,
  },
  exploreSubcategoriesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  exploreSubcategoryChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    backgroundColor: Colors.background,
    borderRadius: 0,
  },
  exploreSubcategoryText: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    fontWeight: "500",
  },
  exploreSeparator: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginTop: Spacing.sm,
  },
  parceirosCarousel: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  parceiroGridItem: {
    width: PARCEIRO_ITEM_WIDTH,
    height: PARCEIRO_CARD_HEIGHT,
    marginRight: PARCEIRO_GAP,
    overflow: "hidden",
    borderRadius: 0,
    backgroundColor: Colors.lightGray,
  },
  parceiroGridImage: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
  },
  parceiroGridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  parceiroGridContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
  },
  parceiroGridNome: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 1,
  },
});
