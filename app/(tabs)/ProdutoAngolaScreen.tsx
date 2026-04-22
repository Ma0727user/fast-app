/**
 * FAST - Produto Angola Screen
 * Tela para produtos de Angola com banner específico
 */

import { Skeleton } from "@/components/ui/Skeleton";
import { Colors, FontSizes, formatPrice, Spacing } from "@/constants/theme";
import { Banner, getHomeData, HomeData } from "@/services/authService";
import { useStore } from "@/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface ProdutoItem {
  id: string;
  name: string;
  price: number;
  promotionalPrice?: number;
  image: string;
  produtoAngola?: boolean;
}

export default function ProdutoAngolaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addToCart = useStore((state) => state.addToCart);

  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [produtosAngola, setProdutosAngola] = useState<ProdutoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      const data = await getHomeData();
      if (data) {
        setHomeData(data);

        // Filter products where produtoAngola = true
        const produtosFormatados: ProdutoItem[] = data.produtos
          .filter((p: any) => p.produtoAngola === true)
          .map((p: any) => ({
            id: String(p.id_produto),
            name: p.nome_produto,
            price: p.preco,
            promotionalPrice: p.preco_promo || undefined,
            image: p.imagem1 || p.imagem || "",
            produtoAngola: p.produtoAngola,
          }));

        setProdutosAngola(produtosFormatados);
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (produto: ProdutoItem) => {
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
  };

  // Get banner with tipo = "imagem produto angola"
  const bannerAngola = homeData?.banners?.find(
    (b: Banner) => b.tipo === "imagem produto angola",
  );

  // Get categories that have produtoAngola products
  const categoriasComProdutosAngola =
    homeData?.categorias?.filter((cat: any) => {
      const produtosDaCategoria = homeData.produtos?.filter(
        (p: any) =>
          p.id_categoria === cat.id_categoria && p.produtoAngola === true,
      );
      return produtosDaCategoria && produtosDaCategoria.length > 0;
    }) || [];

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
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PRODUTO ANGOLA</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner Produto Angola */}
        {isLoading ? (
          <Skeleton width={width} height={200} borderRadius={0} />
        ) : bannerAngola?.imagem ? (
          <Image
            source={{ uri: bannerAngola.imagem }}
            style={styles.banner}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <Text style={styles.bannerPlaceholderText}>PRODUTO ANGOLA</Text>
          </View>
        )}

        {/* Categorias */}
        {/* Produtos Angola */}
        {!isLoading && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PRODUTOS</Text>
            {produtosAngola.length > 0 ? (
              <FlatList
                data={produtosAngola}
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
              />
            ) : (
              <View style={styles.emptySection}>
                <Ionicons name="cube-outline" size={40} color={Colors.white} />
                <Text style={styles.emptySectionText}>
                  Não há produtos Angola disponíveis
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "#0a0a0a",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: "700",
    letterSpacing: 1,
  },
  banner: {
    width: width,
    height: 200,
  },
  bannerPlaceholder: {
    width: width,
    height: 200,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  bannerPlaceholderText: {
    color: Colors.white,
    fontSize: FontSizes.xl,
    fontWeight: "700",
    letterSpacing: 2,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 1,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  categoriasList: {
    paddingHorizontal: Spacing.lg,
  },
  categoriaCard: {
    width: 140,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: Spacing.sm,
  },
  categoriaImage: {
    width: "100%",
    height: "100%",
  },
  categoriaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  categoriaNome: {
    position: "absolute",
    bottom: Spacing.xs,
    left: Spacing.xs,
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontWeight: "700",
    letterSpacing: 1,
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
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
  },
  gridImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#1a1a1a",
    marginBottom: Spacing.sm,
    borderRadius: 0,
  },
  imageContainer: {
    position: "relative",
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
    color: Colors.white,
  },
  gridPreco: {
    fontSize: FontSizes.sm,
    color: Colors.white,
    marginTop: 2,
  },
  emptySection: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    marginHorizontal: Spacing.lg,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
  },
  emptySectionText: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.white,
  },
});
