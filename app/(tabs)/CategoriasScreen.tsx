/**
 * FAST - Menu Screen
 * Duas categorias em destaque + lista de categorias com subcategorias em dropdown
 */

import { Colors, FontSizes, Spacing } from "@/constants/theme";
import {
    Categoria,
    getHomeData,
    Produto as ProdutoLoja,
    sanitizeImageUrl,
} from "@/services/authService";
import { useStore } from "@/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MenuScreen() {
  const router = useRouter();
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const insets = useSafeAreaInsets();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<ProdutoLoja[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pesquisa, setPesquisa] = useState("");
  const [abertos, setAbertos] = useState<Set<number>>(new Set());
  const [indiceDestaque, setIndiceDestaque] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    try {
      setIsLoading(true);
      const data = await getHomeData();
      const categoriasData = data?.categorias || [];
      setCategorias(categoriasData);
      setProdutos(data?.produtos || []);
      setAbertos(new Set());
    } catch {
      setCategorias([]);
      setProdutos([]);
      setAbertos(new Set());
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDropdown = (id: number) => {
    setAbertos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const irParaCategoria = (nome: string, id: number) => {
    router.push({
      pathname: "/(shop)/ProductGridScreen",
      params: { categoria: nome, categoriaId: String(id) },
    });
  };

  const irParaSubcategoria = (
    nomeCategoria: string,
    idCategoria: number,
    nomeSubcat: string,
    idSubcat: number,
  ) => {
    router.push({
      pathname: "/(shop)/ProductGridScreen",
      params: {
        categoria: nomeCategoria,
        categoriaId: String(idCategoria),
        subcategoria: nomeSubcat,
        subcategoriaId: String(idSubcat),
      },
    });
  };

  // Primeiras 2 categorias para os cards de destaque
  const categoriasDestaque = categorias.slice(0, 2);

  useEffect(() => {
    if (categoriasDestaque.length <= 1) return;

    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIndiceDestaque((prev) => (prev + 1) % categoriasDestaque.length);
      });
    }, 180000);

    return () => clearInterval(interval);
  }, [categoriasDestaque.length, fadeAnim]);

  useEffect(() => {
    if (indiceDestaque >= categoriasDestaque.length) {
      setIndiceDestaque(0);
    }
  }, [indiceDestaque, categoriasDestaque.length]);

  const termo = pesquisa.trim().toLowerCase();

  // Restantes para a lista de menu, filtradas pela pesquisa
  const categoriasMenu = categorias
    .slice(2)
    .filter(
      (c) =>
        termo.length === 0 ||
        c.nome_categoria.toLowerCase().includes(termo) ||
        (c.subcategorias || []).some((s) =>
          s.nome_subcategoria.toLowerCase().includes(termo),
        ),
    );

  const produtosMenu = produtos
    .filter(
      (p) =>
        termo.length > 0 &&
        (p.nome_produto.toLowerCase().includes(termo) ||
          p.nome_categoria.toLowerCase().includes(termo) ||
          p.nome_subcategoria.toLowerCase().includes(termo)),
    )
    .slice(0, 12);

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { paddingTop: insets.top },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>MENU</Text>
        {isAuthenticated && (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/NotificacoesScreen")}
            style={styles.notifButton}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={Colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Slider de categorias em destaque (1 por vez com fade) */}
        {categoriasDestaque.length > 0 && (
          <View style={styles.destaqueSliderContainer}>
            <Animated.View style={{ opacity: fadeAnim }}>
              <TouchableOpacity
                style={styles.destaqueCard}
                onPress={() =>
                  irParaCategoria(
                    categoriasDestaque[indiceDestaque].nome_categoria,
                    categoriasDestaque[indiceDestaque].id_categoria,
                  )
                }
              >
                {sanitizeImageUrl(
                  categoriasDestaque[indiceDestaque].foto_categoria,
                ).url ? (
                  <Image
                    source={{
                      uri: sanitizeImageUrl(
                        categoriasDestaque[indiceDestaque].foto_categoria,
                      ).url,
                    }}
                    style={styles.destaqueImagem}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.destaqueSemImagem}>
                    <Ionicons
                      name="grid-outline"
                      size={36}
                      color={Colors.lightGray}
                    />
                  </View>
                )}
                <View style={styles.destaqueOverlay} />
                <View style={styles.destaqueConteudo}>
                  <Text style={styles.destaqueNome}>
                    {categoriasDestaque[
                      indiceDestaque
                    ].nome_categoria.toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Campo de pesquisa */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={18}
            color={Colors.secondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Encontre produtos, categorias e mais"
            placeholderTextColor={Colors.secondary}
            value={pesquisa}
            onChangeText={setPesquisa}
          />
          {pesquisa.length > 0 && (
            <TouchableOpacity onPress={() => setPesquisa("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={Colors.secondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Links rápidos horizontais */}
        {termo.length === 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.linksRapidosContainer}
          >
            {[
              {
                label: "Novidades",
                onPress: () =>
                  router.push({
                    pathname: "/(shop)/ProductGridScreen",
                    params: { categoria: "Novidades", filtro: "novidades" },
                  }),
              },
              {
                label: "Homem",
                onPress: () =>
                  router.push({
                    pathname: "/(shop)/ProductGridScreen",
                    params: { categoria: "Homem", filtro: "homem" },
                  }),
              },
              {
                label: "Mulher",
                onPress: () =>
                  router.push({
                    pathname: "/(shop)/ProductGridScreen",
                    params: { categoria: "Mulher", filtro: "mulher" },
                  }),
              },
              {
                label: "Criança",
                onPress: () =>
                  router.push({
                    pathname: "/(shop)/ProductGridScreen",
                    params: { categoria: "Criança", filtro: "crianca" },
                  }),
              },
              {
                label: "Produto Angola",
                onPress: () => router.push("/(tabs)/ProdutoAngolaScreen"),
              },
            ].map((item, index) => (
              <View key={item.label} style={styles.linkRapidoItemWrap}>
                {index > 0 && <View style={styles.linkRapidoDivider} />}
                <TouchableOpacity
                  style={styles.linkRapidoButton}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkRapidoText}>{item.label}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Lista menu com dropdown de subcategorias */}
        <View style={styles.menuContainer}>
          {/* Resultados de produtos */}
          {termo.length > 0 && produtosMenu.length > 0 && (
            <>
              <View style={styles.divisor}>
                <Text style={styles.divisorLabel}>PRODUTOS</Text>
              </View>
              {produtosMenu.map((produto) => (
                <TouchableOpacity
                  key={String(produto.id_produto)}
                  style={styles.menuRow}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/ProductDetailScreen",
                      params: { id: String(produto.id_produto) },
                    })
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuNome}>{produto.nome_produto}</Text>
                  <Ionicons
                    name="chevron-forward-outline"
                    size={18}
                    color={Colors.secondary}
                  />
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Divisor categorias */}
          {categoriasMenu.length > 0 && (
            <View style={styles.divisor}>
              <Text style={styles.divisorLabel}>EXPLORE MAIS</Text>
            </View>
          )}

          {categoriasMenu.length === 0 &&
          produtosMenu.length === 0 &&
          termo.length > 0 ? (
            <View style={styles.emptyMenu}>
              <Ionicons
                name="search-outline"
                size={40}
                color={Colors.lightGray}
              />
              <Text style={styles.emptyText}>Nenhum resultado encontrado</Text>
            </View>
          ) : (
            categoriasMenu.map((cat) => {
              const isAberto = abertos.has(cat.id_categoria);
              const temSubcats = (cat.subcategorias || []).length > 0;
              const isUltimaCategoria =
                categoriasMenu[categoriasMenu.length - 1]?.id_categoria ===
                cat.id_categoria;

              return (
                <View key={cat.id_categoria} style={styles.menuItem}>
                  <TouchableOpacity
                    style={styles.menuRow}
                    onPress={() =>
                      temSubcats
                        ? toggleDropdown(cat.id_categoria)
                        : irParaCategoria(cat.nome_categoria, cat.id_categoria)
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.menuNome}>{cat.nome_categoria}</Text>
                    {temSubcats ? (
                      <Ionicons
                        name={
                          isAberto
                            ? "chevron-up-outline"
                            : "chevron-down-outline"
                        }
                        size={18}
                        color={Colors.secondary}
                      />
                    ) : (
                      <Ionicons
                        name="chevron-forward-outline"
                        size={18}
                        color={Colors.secondary}
                      />
                    )}
                  </TouchableOpacity>

                  {/* Subcategorias dropdown */}
                  {isAberto && temSubcats && (
                    <View style={styles.subcatContainer}>
                      {(cat.subcategorias || []).map((sub) => (
                        <TouchableOpacity
                          key={sub.id_subcategoria}
                          style={styles.subcatRow}
                          onPress={() =>
                            irParaSubcategoria(
                              cat.nome_categoria,
                              cat.id_categoria,
                              sub.nome_subcategoria,
                              sub.id_subcategoria,
                            )
                          }
                          activeOpacity={0.7}
                        >
                          <View style={styles.subcatDot} />
                          <Text style={styles.subcatNome}>
                            {sub.nome_subcategoria}
                          </Text>
                          <Ionicons
                            name="chevron-forward-outline"
                            size={14}
                            color={Colors.secondary}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {!isUltimaCategoria && <View style={styles.menuSeparator} />}
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
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
  notifButton: {
    padding: Spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },
  // Cards destaque
  destaqueSliderContainer: {
    marginBottom: Spacing.lg,
  },
  destaqueCard: {
    width: "100%",
    height: 180,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: Colors.lightGray,
  },
  destaqueImagem: {
    width: "100%",
    height: "100%",
  },
  destaqueSemImagem: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
  },
  destaqueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  destaqueConteudo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
  },
  destaqueNome: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // Pesquisa
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
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
  // Menu lista
  menuContainer: {
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: Colors.white,
  },
  menuItem: {
    marginBottom: Spacing.xs,
  },
  menuSeparator: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    marginHorizontal: Spacing.lg,
  },
  linksRapidosContainer: {
    paddingBottom: Spacing.md,
    alignItems: "center",
  },
  linkRapidoItemWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  linkRapidoDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.lightGray,
    marginHorizontal: Spacing.sm,
  },
  linkRapidoButton: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  linkRapidoText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  divisor: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs + 2,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.primary,
  },
  divisorLabel: {
    fontSize: FontSizes.xs,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 1,
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
  },
  menuNome: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.primary,
    flex: 1,
  },
  // Subcategorias
  subcatContainer: {
    backgroundColor: Colors.background,
    marginTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  subcatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg + Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  subcatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: Spacing.md,
  },
  subcatNome: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.primary,
  },
  emptyMenu: {
    alignItems: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.secondary,
  },
});
