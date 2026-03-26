/**
 * FAST - Tema Minimalista para E-commerce de Moda Esportiva
 * Mercado: Angola (Kwanza - Kz)
 * Cores: Preto (#000000), Branco (#FFFFFF), Cinza (#888888, #E0E0E0)
 */

import { Platform } from "react-native";
import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

// Cores principais do FAST
export const FASTColors = {
  // Cores principais
  primary: "#000000", // Preto - Destaques, botões, texto principal
  background: "#FFFFFF", // Branco - Fundo e superfícies
  secondary: "#888888", // Cinza - Textos secundários, placeholders, bordas
  lightGray: "#E0E0E0", // Cinza claro - Bordas finas, detalhes

  // Cores de feedback (apenas para componentes específicos)
  success: "#4ADE80", // Verde - Sucesso
  error: "#F87171", // Vermelho - Erro
  warning: "#FACC15", // Amarelo - Alerta

  // Transparências
  transparent: "transparent",
  white: "#FFFFFF",
  black: "#000000",
};

// Cores para light/dark mode
export const ThemeColors = {
  light: {
    primary: "#000000",
    background: "#FFFFFF",
    secondary: "#888888",
    lightGray: "#E0E0E0",
    text: "#000000",
  },
  dark: {
    primary: "#FFFFFF",
    background: "#000000",
    secondary: "#AAAAAA",
    lightGray: "#333333",
    text: "#FFFFFF",
  },
};

// Espaçamentos
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Tamanhos de fonte
export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Fontes do sistema
export const Fonts = Platform.select({
  ios: {
    sans: "System",
    rounded: "System",
    mono: "System",
  },
  android: {
    sans: "Roboto",
    rounded: "Roboto",
    mono: "Roboto",
  },
  default: {
    sans: "sans-serif",
    rounded: "sans-serif",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    rounded:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Tema Light para React Native Paper
export const LightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: FASTColors.primary,
    background: FASTColors.background,
    surface: FASTColors.background,
    onPrimary: FASTColors.white,
    onBackground: FASTColors.primary,
    onSurface: FASTColors.primary,
    outline: FASTColors.lightGray,
    surfaceVariant: FASTColors.lightGray,
    error: FASTColors.error,
  },
};

// Tema Dark para React Native Paper
export const DarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: FASTColors.white,
    background: FASTColors.black,
    surface: FASTColors.black,
    onPrimary: FASTColors.black,
    onBackground: FASTColors.white,
    onSurface: FASTColors.white,
    outline: "#333333",
    surfaceVariant: "#1A1A1A",
    error: FASTColors.error,
  },
};

// Função utilitária para formatar preços em Kwanza Angolano
export const formatPrice = (value: number): string => {
  return `Kz ${value.toLocaleString("pt-AO")}`;
};

// Função para formatar preço com IVA (14%)
export const formatPriceWithIVA = (value: number): string => {
  const iva = value * 0.14;
  const total = value + iva;
  return formatPrice(Math.round(total));
};

// Exportar cores como padrão
export const Colors = FASTColors;
