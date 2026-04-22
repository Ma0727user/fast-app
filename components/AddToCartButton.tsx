/**
 * FAST - Add to Cart Button
 * Botão com estado de sucesso temporário ao adicionar produto ao carrinho
 * Inclui animação de escala e haptic feedback
 */

import { Colors, FontSizes, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface AddToCartButtonProps {
  onPress: () => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  showLabel?: boolean;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  onPress,
  disabled = false,
  size = "medium",
  showLabel = false,
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handlePress = () => {
    if (disabled || isAdded) return;

    // Haptic feedback - vibração ao toque (similar a botão físico)
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Executar a ação de adicionar ao carrinho
    onPress();

    // Animação de feedback visual
    setIsAdded(true);

    // Animação de escala (efeito de mola/squeeze)
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Animação de opacity para transição suave do texto
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Resetar após 3 segundos
    timeoutRef.current = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        setIsAdded(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);
  };

  // Determinar tamanhos baseado no size prop
  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          button: styles.buttonSmall,
          icon: 16,
          text: FontSizes.xs,
          paddingVertical: Spacing.xs,
          paddingHorizontal: Spacing.sm,
        };
      case "large":
        return {
          button: styles.buttonLarge,
          icon: 24,
          text: FontSizes.lg,
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.xl,
        };
      default:
        return {
          button: styles.buttonMedium,
          icon: 20,
          text: FontSizes.md,
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.md,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <Animated.View
      style={[
        styles.container,
        sizeStyles.button,
        isAdded && styles.buttonSuccess,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || isAdded}
        style={styles.touchable}
        activeOpacity={0.8}
      >
        <View style={styles.content}>
          <Animated.View style={{ opacity: fadeAnim }}>
            {isAdded ? (
              <View style={styles.successContent}>
                <Ionicons
                  name="checkmark-circle"
                  size={sizeStyles.icon}
                  color={Colors.white}
                />
                <Text
                  style={[
                    styles.buttonText,
                    { fontSize: sizeStyles.text },
                    isAdded && styles.buttonTextSuccess,
                  ]}
                >
                  {showLabel ? "Adicionado!" : ""}
                </Text>
              </View>
            ) : (
              <View style={styles.normalContent}>
                <Ionicons
                  name="cart-outline"
                  size={sizeStyles.icon}
                  color={Colors.white}
                />
                {showLabel && (
                  <Text
                    style={[styles.buttonText, { fontSize: sizeStyles.text }]}
                  >
                    Adicionar
                  </Text>
                )}
              </View>
            )}
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 0,
    overflow: "hidden",
  },
  touchable: {
    flex: 1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  normalContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  successContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  buttonTextSuccess: {
    color: Colors.white,
  },
  // Sizes
  buttonSmall: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  buttonMedium: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  buttonLarge: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  // Success state
  buttonSuccess: {
    backgroundColor: Colors.success,
  },
});
