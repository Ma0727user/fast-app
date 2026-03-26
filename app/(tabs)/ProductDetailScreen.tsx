/**
 * FAST - Product Detail Screen
 * Detalhes do produto com galeria, seletor de tamanho e cor
 */

import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Colors, FontSizes, Spacing } from "@/constants/theme";
import { sanitizeImageUrl } from "@/services/authService";
import {
  getProdutoById,
  ProdutoDetalhe,
  Variacao,
} from "@/services/produtoService";
import { useStore } from "@/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface CorSelecao {
  name: string;
  color: string;
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const addToCart = useStore((state) => state.addToCart);

  const [produto, setProduto] = useState<ProdutoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Lista de imagens disponíveis
  const [imagens, setImagens] = useState<string[]>([]);

  // Extrair IDs únicos de variações (cores e tamanhos)
  const [coresDisponiveis, setCoresDisponiveis] = useState<string[]>([]);
  const [tamanhosDisponiveis, setTamanhosDisponiveis] = useState<string[]>([]);

  // Variação selecionada
  const [variacaoSelecionada, setVariacaoSelecionada] =
    useState<Variacao | null>(null);

  // Fetch produto da API
  useEffect(() => {
    const fetchProduto = async () => {
      try {
        setLoading(true);
        setError(null);

        const produtoId = params.id ? parseInt(params.id as string, 10) : null;

        console.log("[ProductDetailScreen] produtoId recebido:", produtoId);
        console.log("[ProductDetailScreen] params.id:", params.id);

        if (!produtoId) {
          console.log("[ProductDetailScreen] Sem ID - usando produto exemplo");
          // Produto de exemplo para teste quando não há ID
          const produtoExemplo = await getProdutoById(173);
          setProduto(produtoExemplo);
        } else {
          console.log("[ProductDetailScreen] Buscando produto ID:", produtoId);
          const data = await getProdutoById(produtoId);
          console.log("[ProductDetailScreen] Produto carregado:", data);
          setProduto(data);
        }
      } catch (err: any) {
        console.error("[ProductDetailScreen] Erro ao carregar produto:", err);
        setError(err.message || "Erro ao carregar produto");
      } finally {
        setLoading(false);
      }
    };

    fetchProduto();
  }, [params.id]);

  // Processar dados quando produto carrega
  useEffect(() => {
    if (produto) {
      // Processar imagens usando sanitizeImageUrl
      const imgs: string[] = [];

      const img1Result = sanitizeImageUrl(produto.imagem1);
      if (img1Result.status === "disponivel") imgs.push(img1Result.url);

      const img2Result = sanitizeImageUrl(produto.imagem2);
      if (img2Result.status === "disponivel") imgs.push(img2Result.url);

      const img3Result = sanitizeImageUrl(produto.imagem3);
      if (img3Result.status === "disponivel") imgs.push(img3Result.url);

      const img4Result = sanitizeImageUrl(produto.imagem4);
      if (img4Result.status === "disponivel") imgs.push(img4Result.url);

      // Se não houver imagens, usar placeholder
      if (imgs.length === 0) {
        imgs.push("https://via.placeholder.com/400x500?text=Sem+Imagem");
      }

      setImagens(imgs);

      // Extrair cores e tamanhos únicos das variações
      if (produto.variacoes && produto.variacoes.length > 0) {
        const cores = [...new Set(produto.variacoes.map((v) => v.cor))];
        const tamanhos = [...new Set(produto.variacoes.map((v) => v.tamanho))];

        setCoresDisponiveis(cores);
        setTamanhosDisponiveis(tamanhos);

        // Selecionar primeiro por padrão
        if (cores.length > 0) setSelectedColor(cores[0]);
        if (tamanhos.length > 0) setSelectedSize(tamanhos[0]);
      }
    }
  }, [produto]);

  // Atualizar variação selecionada quando cor ou tamanho muda
  useEffect(() => {
    if (produto?.variacoes && selectedColor && selectedSize) {
      const variacao = produto.variacoes.find(
        (v) => v.cor === selectedColor && v.tamanho === selectedSize,
      );
      setVariacaoSelecionada(variacao || null);
    }
  }, [selectedColor, selectedSize, produto]);

  // Mapear cor para código de cor
  const getCorHex = (corName: string): string => {
    const cores: Record<string, string> = {
      preto: "#000000",
      branco: "#FFFFFF",
      cinza: "#808080",
      azul: "#0000FF",
      vermelho: "#FF0000",
      verde: "#008000",
      amarelo: "#FFFF00",
      laranja: "#FFA500",
      rosa: "#FFC0CB",
      roxo: "#800080",
      marrom: "#8B4513",
    };
    return cores[corName.toLowerCase()] || "#808080";
  };

  // Verificar se tem promoção
  const temPromocao =
    produto && produto.preco_promo && produto.preco_promo < produto.preco;

  // Calcular preço atual
  const precoAtual = variacaoSelecionada
    ? variacaoSelecionada.preco
    : (temPromocao ? produto?.preco_promo : produto?.preco) || 0;

  const precoOriginal = temPromocao ? produto?.preco : null;

  const handleAddToCart = () => {
    const hasVariacoes = produto?.variacoes && produto.variacoes.length > 0;
    if (!variacaoSelecionada && hasVariacoes) {
      alert("Por favor, selecione tamanho e cor");
      return;
    }

    // Adicionar ao carrinho no store
    addToCart({
      id: String(produto?.id_produto),
      name: produto?.nome_produto || "",
      price: precoAtual,
      image: produto?.imagem1 || "",
      size: selectedSize,
      color: selectedColor,
      idProduto: produto?.id_produto,
      idVariacao: variacaoSelecionada?.id,
    });

    // O feedback visual é fornecido pelo componente AddToCartButton
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header Skeleton */}
          <View style={styles.header}>
            <Skeleton width={24} height={24} borderRadius={4} />
            <Skeleton width={24} height={24} borderRadius={4} />
          </View>

          {/* Image Gallery Skeleton */}
          <Skeleton width={width} height={width * 1.17} borderRadius={0} />

          {/* Info Skeleton */}
          <View style={styles.infoContainer}>
            <Skeleton
              width={width * 0.7}
              height={32}
              borderRadius={4}
              style={{ marginBottom: Spacing.sm }}
            />
            <Skeleton
              width={width * 0.4}
              height={24}
              borderRadius={4}
              style={{ marginBottom: Spacing.sm }}
            />
            <Skeleton
              width="100%"
              height={60}
              borderRadius={4}
              style={{ marginBottom: Spacing.sm }}
            />
            <Skeleton
              width={width * 0.5}
              height={16}
              borderRadius={4}
              style={{ marginBottom: Spacing.md }}
            />

            {/* Size selector skeleton */}
            <Skeleton
              width={100}
              height={20}
              borderRadius={4}
              style={{ marginBottom: Spacing.sm }}
            />
            <View
              style={{
                flexDirection: "row",
                gap: Spacing.sm,
                marginBottom: Spacing.lg,
              }}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} width={48} height={48} borderRadius={4} />
              ))}
            </View>

            {/* Color selector skeleton */}
            <Skeleton
              width={80}
              height={20}
              borderRadius={4}
              style={{ marginBottom: Spacing.sm }}
            />
            <View
              style={{
                flexDirection: "row",
                gap: Spacing.sm,
                marginBottom: Spacing.lg,
              }}
            >
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} width={80} height={40} borderRadius={8} />
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Footer Button Skeleton */}
        <View style={styles.footerButton}>
          <Skeleton width="100%" height={50} borderRadius={8} />
        </View>
      </View>
    );
  }

  if (error || !produto) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={Colors.secondary}
        />
        <Text style={styles.errorText}>
          {error || "Produto não encontrado"}
        </Text>
        <View style={styles.errorButtonContainer}>
          <Button title="Voltar" onPress={() => router.back()} />
        </View>
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/CarrinhoScreen")}
          >
            <Ionicons name="cart-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Galeria de Imagens */}
        <View style={styles.galleryContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {imagens.map((item, index) => (
              <Image
                key={index}
                source={{ uri: item }}
                style={styles.productImage}
              />
            ))}
          </ScrollView>

          {/* Badge de Promoção */}
          {temPromocao && (
            <View style={styles.promocaoBadge}>
              <Text style={styles.promocaoText}>PROMOÇÃO</Text>
            </View>
          )}

          {/* Indicadores de imagem */}
          {imagens.length > 1 && (
            <View style={styles.pagination}>
              {imagens.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    activeImageIndex === index && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Informações do Produto */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{produto.nome_produto}</Text>

          {/* Preço */}
          <View style={styles.priceContainer}>
            <Text
              style={[
                styles.productPrice,
                temPromocao ? styles.productPricePromo : undefined,
              ]}
            >
              {precoAtual.toFixed(2)} Kz
            </Text>
            {precoOriginal && (
              <Text style={styles.productPriceOriginal}>
                {precoOriginal.toFixed(2)} Kz
              </Text>
            )}
          </View>

          {/* Subtítulo */}
          {produto.subtitulo && (
            <Text style={styles.subtitulo}>{produto.subtitulo}</Text>
          )}

          {/* Descrição */}
          <Text style={styles.description}>{produto.descricao}</Text>

          {/* Stock */}
          <View style={styles.stockContainer}>
            <Ionicons
              name={
                variacaoSelecionada && variacaoSelecionada.stock > 0
                  ? "checkmark-circle"
                  : "close-circle"
              }
              size={20}
              color={
                variacaoSelecionada && variacaoSelecionada.stock > 0
                  ? Colors.success
                  : Colors.error
              }
            />
            <Text
              style={[
                styles.stockText,
                variacaoSelecionada && variacaoSelecionada.stock > 0
                  ? styles.stockAvailable
                  : styles.stockUnavailable,
              ]}
            >
              {variacaoSelecionada
                ? variacaoSelecionada.stock > 0
                  ? `Em stock (${variacaoSelecionada.stock})`
                  : "Fora de stock"
                : "Selecione tamanho e cor"}
            </Text>
          </View>

          {/* Seletor de Tamanho (se houver variações) */}
          {tamanhosDisponiveis.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>TAMANHO</Text>
              <View style={styles.sizeContainer}>
                {tamanhosDisponiveis.map((size) => {
                  // Verificar stock para esta combinação
                  const variacaoTamanho = produto?.variacoes?.find(
                    (v) => v.cor === selectedColor && v.tamanho === size,
                  );
                  const temStock = variacaoTamanho
                    ? variacaoTamanho.stock > 0
                    : false;

                  return (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.sizeButton,
                        selectedSize === size && styles.sizeButtonSelected,
                        !temStock && styles.sizeButtonDisabled,
                      ]}
                      onPress={() => temStock && setSelectedSize(size)}
                      disabled={!temStock}
                    >
                      <Text
                        style={[
                          styles.sizeText,
                          selectedSize === size && styles.sizeTextSelected,
                          !temStock && styles.sizeTextDisabled,
                        ]}
                      >
                        {size}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Seletor de Cor (se houver variações) */}
          {coresDisponiveis.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>COR</Text>
              <View style={styles.colorContainer}>
                {coresDisponiveis.map((cor) => {
                  // Verificar stock para esta combinação
                  const variacaoCor = produto?.variacoes?.find(
                    (v) => v.cor === cor && v.tamanho === selectedSize,
                  );
                  const temStock = variacaoCor ? variacaoCor.stock > 0 : false;

                  return (
                    <TouchableOpacity
                      key={cor}
                      style={[
                        styles.colorButton,
                        selectedColor === cor && styles.colorButtonSelected,
                        !temStock && styles.colorButtonDisabled,
                      ]}
                      onPress={() => temStock && setSelectedColor(cor)}
                      disabled={!temStock}
                    >
                      <View
                        style={[
                          styles.colorCircle,
                          { backgroundColor: getCorHex(cor) },
                          cor.toLowerCase() === "branco" &&
                            styles.colorCircleBorder,
                        ]}
                      />
                      <Text
                        style={[
                          styles.colorText,
                          selectedColor === cor && styles.colorTextSelected,
                        ]}
                      >
                        {cor.charAt(0).toUpperCase() + cor.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Botão Fixo no Rodapé */}
      <View style={styles.footerButton}>
        <Button
          title="PÔR NO CARRINHO"
          onPress={handleAddToCart}
          disabled={produto.variacoes?.length > 0 && !variacaoSelecionada}
        />
      </View>
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
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.secondary,
  },
  errorText: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    fontSize: FontSizes.md,
    color: Colors.error,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  errorButtonContainer: {
    width: 150,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  galleryContainer: {
    position: "relative",
  },
  productImage: {
    width: width,
    height: width * 1.17,
    backgroundColor: Colors.lightGray,
  },
  promocaoBadge: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 4,
  },
  promocaoText: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontWeight: "700",
  },
  pagination: {
    position: "absolute",
    bottom: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.lightGray,
  },
  paginationDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  infoContainer: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  productName: {
    fontSize: FontSizes.xxl,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 2,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  productPrice: {
    fontSize: FontSizes.xl,
    fontWeight: "600",
    color: Colors.primary,
  },
  productPricePromo: {
    color: Colors.error,
  },
  productPriceOriginal: {
    fontSize: FontSizes.md,
    color: Colors.lightGray,
    textDecorationLine: "line-through",
  },
  subtitulo: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    fontStyle: "italic",
    marginTop: Spacing.xs,
  },
  description: {
    fontSize: FontSizes.md,
    color: Colors.secondary,
    lineHeight: 22,
    marginTop: Spacing.md,
  },
  stockContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.lightGray + "30",
    borderRadius: 8,
  },
  stockText: {
    fontSize: FontSizes.sm,
  },
  stockAvailable: {
    color: Colors.success,
  },
  stockUnavailable: {
    color: Colors.error,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  sizeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  sizeButton: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  sizeButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sizeButtonDisabled: {
    backgroundColor: Colors.lightGray + "50",
    borderColor: Colors.lightGray + "50",
  },
  sizeText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  sizeTextSelected: {
    color: Colors.white,
  },
  sizeTextDisabled: {
    color: Colors.lightGray,
  },
  colorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  colorButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
  },
  colorButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  colorButtonDisabled: {
    opacity: 0.5,
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  colorCircleBorder: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  colorText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
  },
  colorTextSelected: {
    fontWeight: "600",
  },
  footerButton: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
});
