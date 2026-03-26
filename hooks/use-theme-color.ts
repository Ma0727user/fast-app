/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, ThemeColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName?: keyof typeof ThemeColors.light,
) {
  const theme = useColorScheme() ?? "light";
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else if (colorName && ThemeColors[theme][colorName]) {
    return ThemeColors[theme][colorName];
  } else {
    // Fallback para cores principais
    return Colors.primary;
  }
}
