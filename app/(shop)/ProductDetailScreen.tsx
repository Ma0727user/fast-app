/**
 * FAST - Product Detail Screen
 * Detalhes do produto com galeria, seletor de tamanho e cor multiselect
 */

import { Button } from "@/components/ui/Button";
import { Colors, FontSizes, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const TAMANHOS = ["XS", "S", "M", "L", "XL", "XXL"];

const CORES = [
  { id: "1", name: "Preto", color: "#000000" },
  { id: "2", name: "Branco", color: "#FFFFFF", border: true },
  { id: "3", name: "Cinza", color: "#888888" },
  { id: "4", name: "Vermelho", color: "#DC2626" },
  { id: "5", name: "Azul", color: "#2563EB" },
  { id: "6", name: "Verde", color: "#16A34A" },
];

// Galeria de imagens do produto
const IMAGENS_PRODUTO = [
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=700&fit=crop",
  "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=700&fit=crop",
  "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=700&fit=crop",
  "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&h=700&fit=crop",
];

export default function ProductDetailScreen() {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const toggleColor = (colorId: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorId)
        ? prev.filter((id) => id !== colorId)
        : [...prev, colorId],
    );
  };

  const getSelectedColorNames = () => {
    return selectedColors
      .map((id) => CORES.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  const handleAddToCart = () => {
    router.push("/(tabs)/CarrinhoScreen");
  };

  return (
    <SafeAreaView style={styles.container}>
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
          <FlatList
            data={IMAGENS_PRODUTO}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImageIndex(index);
            }}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.productImage} />
            )}
          />
          {/* Indicadores de imagem */}
          <View style={styles.pagination}>
            {IMAGENS_PRODUTO.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  activeImageIndex === index && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Informações do Produto */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName}>KIMBOLA</Text>
          <Text style={styles.productPrice}>Kz 15.000</Text>

          <Text style={styles.description}>
            T-shirt desportiva de alta performance, desenvolvida com tecido
            técnico respirável para máximo conforto durante o treino. Ideal para
            atividades físicas e uso quotidiano.
          </Text>

          {/* Seletor de Tamanho */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TAMANHO</Text>
            <View style={styles.sizeContainer}>
              {TAMANHOS.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeButton,
                    selectedSize === size && styles.sizeButtonSelected,
                  ]}
                  onPress={() => setSelectedSize(size)}
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

          {/* Seletor de Cor - Multiselect */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>COR (SELECIONE UMA OU MAIS)</Text>
            <View style={styles.colorContainer}>
              {CORES.map((cor) => (
                <TouchableOpacity
                  key={cor.id}
                  style={[
                    styles.colorButton,
                    { backgroundColor: cor.color },
                    cor.border && styles.colorButtonBorder,
                    selectedColors.includes(cor.id) &&
                      styles.colorButtonSelected,
                  ]}
                  onPress={() => toggleColor(cor.id)}
                >
                  {selectedColors.includes(cor.id) && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={
                        cor.color === "#FFFFFF" ? Colors.primary : Colors.white
                      }
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {selectedColors.length > 0 && (
              <Text style={styles.colorName}>
                Selecionado: {getSelectedColorNames()}
              </Text>
            )}
            {selectedColors.length === 0 && (
              <Text style={styles.colorName}>Nenhuma cor selecionada</Text>
            )}
          </View>
        </View>
      </ScrollView>

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
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  colorButtonBorder: {
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
  footerButton: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
});
