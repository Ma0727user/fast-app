/**
 * FAST - Skeleton Loading Component
 * Componente de loading esqueleto para melhor UX durante carregamento
 */

import { Colors, Spacing } from "@/constants/theme";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const widthStyle =
    typeof width === "string"
      ? ({ width } as ViewStyle)
      : ({ width } as ViewStyle);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          ...widthStyle,
          height,
          borderRadius,
        },
        {
          opacity: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.7],
          }),
        },
        style,
      ]}
    />
  );
};

// ============================================
// SKELETONS PRÉ-FORMATADOS
// ============================================

// Skeleton para card de produto
export const SkeletonProdutoCard: React.FC = () => (
  <View style={styles.produtoCard}>
    <Skeleton height={120} borderRadius={12} />
    <View style={styles.produtoInfo}>
      <Skeleton width="80%" height={14} style={{ marginTop: Spacing.sm }} />
      <Skeleton width="50%" height={14} style={{ marginTop: Spacing.xs }} />
      <Skeleton width="30%" height={16} style={{ marginTop: Spacing.sm }} />
    </View>
  </View>
);

// Skeleton para item de lista
export const SkeletonListaItem: React.FC = () => (
  <View style={styles.listaItem}>
    <Skeleton width={60} height={60} borderRadius={8} />
    <View style={styles.listaItemInfo}>
      <Skeleton width="70%" height={14} />
      <Skeleton width="50%" height={12} style={{ marginTop: Spacing.xs }} />
      <Skeleton width="30%" height={14} style={{ marginTop: Spacing.xs }} />
    </View>
  </View>
);

// Skeleton para banner
export const SkeletonBanner: React.FC = () => (
  <Skeleton height={180} borderRadius={12} />
);

// Skeleton para categoria
export const SkeletonCategoria: React.FC = () => (
  <View style={styles.categoria}>
    <Skeleton width={60} height={60} borderRadius={30} />
    <Skeleton width={50} height={12} style={{ marginTop: Spacing.xs }} />
  </View>
);

// Skeleton para texto (múltiplas linhas)
export const SkeletonTexto: React.FC<{ linhas?: number }> = ({
  linhas = 3,
}) => (
  <View style={styles.textoContainer}>
    {Array.from({ length: linhas }).map((_, index) => (
      <Skeleton
        key={index}
        width={index === linhas - 1 ? "60%" : "100%"}
        height={12}
        style={{ marginBottom: Spacing.xs }}
      />
    ))}
  </View>
);

// Skeleton para botão
export const SkeletonBotao: React.FC = () => (
  <Skeleton height={48} borderRadius={24} />
);

// ============================================
// CONTAINERS DE SKELETON
// ============================================

// Grid de produtos
export const SkeletonProdutoGrid: React.FC<{ numeroItens?: number }> = ({
  numeroItens = 6,
}) => (
  <View style={styles.grid}>
    {Array.from({ length: numeroItens }).map((_, index) => (
      <SkeletonProdutoCard key={index} />
    ))}
  </View>
);

// Lista de pedidos
export const SkeletonListaPedidos: React.FC<{ numeroItens?: number }> = ({
  numeroItens = 3,
}) => (
  <View>
    {Array.from({ length: numeroItens }).map((_, index) => (
      <View key={index} style={{ marginBottom: Spacing.md }}>
        <SkeletonListaItem />
      </View>
    ))}
  </View>
);

// Tela de detalhes
export const SkeletonDetalhesProduto: React.FC = () => (
  <View style={styles.detalhesContainer}>
    <Skeleton height={300} borderRadius={0} />
    <View style={styles.detalhesInfo}>
      <Skeleton width="80%" height={24} />
      <Skeleton width="40%" height={20} style={{ marginTop: Spacing.md }} />
      <SkeletonTexto linhas={4} />
      <View style={styles.detalhesBotoes}>
        <SkeletonBotao />
        <Skeleton width={48} height={48} borderRadius={24} />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.lightGray,
  },
  produtoCard: {
    flex: 1,
    margin: Spacing.xs,
  },
  produtoInfo: {
    paddingTop: Spacing.sm,
  },
  listaItem: {
    flexDirection: "row",
    padding: Spacing.sm,
    alignItems: "center",
  },
  listaItemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  categoria: {
    alignItems: "center",
    marginHorizontal: Spacing.sm,
  },
  textoContainer: {
    marginTop: Spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.sm,
  },
  detalhesContainer: {
    flex: 1,
  },
  detalhesInfo: {
    padding: Spacing.lg,
  },
  detalhesBotoes: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
});

export default Skeleton;
