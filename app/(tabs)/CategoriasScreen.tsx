/**
 * FAST - Categorias Screen
 * Grid de categorias com imagens e contagem de produtos
 */

import { Colors, FontSizes, Spacing } from "@/constants/theme";
import { getHomeData, sanitizeImageUrl } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

interface CategoriaItem {
  id: string;
  idNumerico: number;
  name: string;
  image: string;
  numProdutos: number;
}

export default function CategoriasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("[CategoriasScreen] Iniciando carregamento de categorias...");
      const data = await getHomeData();

      console.log(
        "[CategoriasScreen] Dados recebidos:",
        JSON.stringify(data, null, 2),
      );

      if (data?.categorias && data.categorias.length > 0) {
        console.log(
          "[CategoriasScreen] Categorias encontradas:",
          data.categorias.length,
        );
        // Mapear categorias da API
        const categoriasFormatadas: CategoriaItem[] = data.categorias.map(
          (cat) => {
            const imageResult = sanitizeImageUrl(cat.imagem_categoria);
            return {
              id: String(cat.id_categoria),
              idNumerico: cat.id_categoria,
              name: cat.nome_categoria,
              image: imageResult.url,
              numProdutos: cat.num_produtos || 0,
            };
          },
        );
        console.log(
          "[CategoriasScreen] Categorias formatadas:",
          categoriasFormatadas,
        );
        setCategorias(categoriasFormatadas);
      } else {
        console.log("[CategoriasScreen] Sem categorias no data - data:", data);
        setCategorias([]);
      }
    } catch (err: any) {
      console.error("[CategoriasScreen] Erro ao carregar categorias:", err);
      console.error("[CategoriasScreen] Stack trace:", err.stack);
      setError(err.message || "Erro ao carregar categorias");
      setCategorias([]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategoria = ({ item }: { item: CategoriaItem }) => (
    <TouchableOpacity
      style={styles.categoriaCard}
      onPress={() => {
        console.log(
          "[CategoriasScreen] Clicou na categoria:",
          item.name,
          "ID:",
          item.idNumerico,
          "tipo:",
          typeof item.idNumerico,
        );
        router.push({
          pathname: "/(shop)/ProductGridScreen",
          params: {
            categoria: item.name,
            categoriaId: String(item.idNumerico),
          },
        });
      }}
    >
      {/* Imagem de fundo */}
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={styles.categoriaImagem}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.categoriaSemImagem}>
          <Ionicons name="grid-outline" size={40} color={Colors.lightGray} />
        </View>
      )}

      {/* Overlay escuro para legibilidade */}
      <View style={styles.categoriaOverlay} />

      {/* Conteúdo sobre a imagem */}
      <View style={styles.categoriaConteudo}>
        <Text style={styles.categoriaNome}>{item.name.toUpperCase()}</Text>
        <View style={styles.categoriaInfo}>
          <Ionicons name="cube-outline" size={14} color={Colors.white} />
          <Text style={styles.categoriaNumProdutos}>
            {item.numProdutos} produto{item.numProdutos !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.loadingText}>A carregar categorias...</Text>
      </View>
    );
  }

  if (error || categorias.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { paddingTop: insets.top },
        ]}
      >
        <Ionicons
          name="folder-open-outline"
          size={64}
          color={Colors.lightGray}
        />
        <Text style={styles.emptyTitle}>Sem Categorias</Text>
        <Text style={styles.emptyText}>
          {error || "Não há categorias disponíveis neste momento."}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("@/assets/images/fast-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>CATEGORIAS</Text>
      </View>

      {/* Grid de Categorias */}
      <FlatList
        data={categorias}
        renderItem={renderCategoria}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      />

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
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.secondary,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: "600",
    color: Colors.primary,
    marginTop: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.secondary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  logo: {
    width: 100,
    height: 40,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.primary,
    textAlign: "center",
    marginTop: Spacing.sm,
    letterSpacing: 1,
  },
  gridContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  categoriaCard: {
    width: (width - Spacing.md * 2 - Spacing.sm) / 2,
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.lightGray,
  },
  categoriaImagem: {
    width: "100%",
    height: "100%",
  },
  categoriaSemImagem: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
  },
  categoriaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  categoriaConteudo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
  },
  categoriaNome: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  categoriaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  categoriaNumProdutos: {
    fontSize: FontSizes.xs,
    color: Colors.white,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
