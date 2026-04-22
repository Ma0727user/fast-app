/**
 * FAST - Product Detail Screen
 * Detalhes do produto com galeria, seletor de tamanho e cor multiselect
 */

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Colors, FontSizes, Spacing } from "@/constants/theme";
import { getProdutoById } from "@/services/produtoService";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const router = useRouter();
  const route = useRoute();
  const produtoId = route.params?.id;

  const [produto, setProduto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [personalizedText, setPersonalizedText] = useState("");

  useEffect(() => {
    const fetchProduto = async () => {
      if (!produtoId) {
        setError("ID do produto não fornecido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getProdutoById(Number(produtoId));
        setProduto(data);

        // Definir tamanho padrão (primeiro disponível) ou M
        if (data.variacoes && data.variacoes.length > 0) {
          setSelectedSize(data.variacoes[0].tamanho);
        } else {
          setSelectedSize("M");
        }

        // Definir cor padrão (primeira disponível)
        if (data.variacoes && data.variacoes.length > 0) {
          setSelectedColor(data.variacoes[0].cor);
        }
      } catch (err: any) {
        setError(err.message || "Erro ao carregar produto");
        console.error("Erro ao buscar produto:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduto();
  }, [produtoId]);

  const toggleColor = (cor: string) => {
    setSelectedColor(cor);
  };

  const toggleSize = (tamanho: string) => {
    setSelectedSize(tamanho);
  };

  const getUniqueColors = () => {
    if (!produto?.variacoes) return [];
    return [...new Set(produto.variacoes.map((v: any) => v.cor))];
  };

  const isUniqueColor = () => {
    return getUniqueColors().length === 1;
  };

  const isAccessory = () => {
    return produto?.tipoproduto === "ACESSORIOS";
  };

  const getSelectedVariation = () => {
    if (!produto?.variacoes) return null;
    if (isAccessory()) {
      // Para acessórios, busca apenas pela cor
      return produto.variacoes.find((v: any) => v.cor === selectedColor);
    }
    // Para outros produtos, busca por cor e tamanho
    return produto.variacoes.find(
      (v: any) => v.cor === selectedColor && v.tamanho === selectedSize,
    );
  };

  const getVariationImage = () => {
    const variation = getSelectedVariation();
    // Se a variação tiver uma imagem válida, use ela
    if (
      variation &&
      variation.imagem &&
      variation.imagem.trim() !== "" &&
      !variation.imagem.endsWith("/")
    ) {
      return variation.imagem;
    }
    // Caso contrário, use a imagem principal do produto
    return produto?.imagem1 || "";
  };

  const handleAddToCart = () => {
    if (!selectedColor) {
      alert("Por favor, selecione uma cor");
      return;
    }

    if (!isAccessory() && !selectedSize) {
      alert("Por favor, selecione tamanho e cor");
      return;
    }

    router.push("/(tabs)/CarrinhoScreen");
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Carregando...</Text>
        </View>
      ) : error ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text style={{ color: Colors.error, textAlign: "center" }}>
            {error}
          </Text>
          <Button title="Tentar Novamente" onPress={() => router.refresh()} />
        </View>
      ) : produto ? (
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
            <Image
              source={{ uri: getVariationImage() }}
              style={styles.productImage}
            />
            {/* Indicadores de imagem - simplificado para uma imagem por variação */}
            <View style={styles.pagination}>
              <View
                style={[styles.paginationDot, styles.paginationDotActive]}
              />
            </View>
          </View>

          {/* Informações do Produto */}
          <View style={styles.infoContainer}>
            <Text style={styles.productName}>
              {produto.nome_produto || produto.nome || "Produto"}
            </Text>
            <Text style={styles.productPrice}>
              Kz {(produto.preco || 0) / 100}.
              {(produto.preco || 0) % (100).toString().padStart(2, "0")}
            </Text>

            <Text style={styles.description}>{produto.descricao || ""}</Text>

            {/* Seletor de Tamanho - Apenas para produtos que não são acessórios */}
            {!isAccessory() && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>TAMANHO</Text>
                <View style={styles.sizeContainer}>
                  {/* Obter tamanhos únicos das variações */}
                  {[
                    ...new Set(produto.variacoes.map((v: any) => v.tamanho)),
                  ].map((size: string) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.sizeButton,
                        selectedSize === size && styles.sizeButtonSelected,
                      ]}
                      onPress={() => toggleSize(size)}
                    >
                      <Text
                        style={[
                          styles.sizeText,
                          selectedSize === size && styles.sizeTextSelected,
                        ]}
                      >
                        {size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Seletor de Cor */}
            <View style={styles.section}>
              <View style={styles.colorHeaderContainer}>
                <Text style={styles.sectionTitle}>COR</Text>
                {isUniqueColor() && (
                  <View style={styles.uniqueColorBadge}>
                    <Text style={styles.uniqueColorBadgeText}>Cor Única</Text>
                  </View>
                )}
              </View>
              <View style={styles.colorContainer}>
                {/* Obter variações únicas por cor */}
                {[
                  ...new Map(
                    produto.variacoes.map((v: any) => [
                      v.cor,
                      { cor: v.cor, imagem: v.imagem || produto.imagem1 || "" },
                    ]),
                  ).values(),
                ].map((variacao: any) => (
                  <TouchableOpacity
                    key={variacao.cor}
                    style={[
                      styles.colorButton,
                      selectedColor === variacao.cor &&
                        styles.colorButtonSelected,
                    ]}
                    onPress={() => toggleColor(variacao.cor)}
                  >
                    {/* Exibir a imagem da variação ou cor de fundo */}
                    {variacao.imagem && variacao.imagem.trim() !== "" ? (
                      <Image
                        source={{ uri: variacao.imagem }}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 0,
                          borderWidth: 1,
                          borderColor: Colors.lightGray,
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 0,
                          backgroundColor:
                            variacao.cor.toLowerCase().includes("hex") ||
                            variacao.cor.startsWith("#") ||
                            variacao.cor.match(/^rgb/) ||
                            variacao.cor.match(/^[0-9a-f]{6}$/i)
                              ? variacao.cor
                              : "#cccccc", // cor de fallback
                          borderWidth: 1,
                          borderColor: Colors.lightGray,
                        }}
                      />
                    )}
                    {selectedColor === variacao.cor && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={Colors.white}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              {selectedColor && (
                <Text style={styles.colorName}>
                  Selecionado: {selectedColor}
                </Text>
              )}
              {!selectedColor && (
                <Text style={styles.colorName}>Nenhuma cor selecionada</Text>
              )}
            </View>

            {/* Campo de Personalização */}
            {produto.personalizar === "sim" && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PERSONALIZAR</Text>
                <Text style={styles.personalizationNote}>
                  Adiciona um nome ou número para personalizar o teu produto
                  adidas ou criar o presente perfeito!
                </Text>
                <View style={styles.inputContainer}>
                  <Input
                    placeholder="Adicione seu texto aqui"
                    value={personalizedText}
                    onChangeText={setPersonalizedText}
                  />
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Produto não encontrado</Text>
        </View>
      )}

      {/* Botão Fixo no Rodapé */}
      <View style={styles.footerButton}>
        <Button title="Pôr no Carrinho" onPress={handleAddToCart} />
      </View>
    </SafeAreaView>
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
  galleryContainer: {
    position: "relative",
  },
  productImage: {
    width: width,
    height: width * 1.17,
    backgroundColor: Colors.lightGray,
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
  },
  productName: {
    fontSize: FontSizes.xxl,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 2,
  },
  productPrice: {
    fontSize: FontSizes.xl,
    fontWeight: "600",
    color: Colors.secondary,
    marginTop: Spacing.sm,
  },
  description: {
    fontSize: FontSizes.md,
    color: Colors.secondary,
    lineHeight: 22,
    marginTop: Spacing.md,
  },
  section: {
    marginTop: Spacing.lg,
  },
  colorHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  uniqueColorBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 4,
  },
  uniqueColorBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 0.5,
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
  sizeText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  sizeTextSelected: {
    color: Colors.white,
  },
  colorContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    flexWrap: "wrap",
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  colorButtonSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  colorName: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    marginTop: Spacing.sm,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  personalizedPreview: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    fontStyle: "italic",
    marginTop: Spacing.xs,
  },
  footerButton: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
});
