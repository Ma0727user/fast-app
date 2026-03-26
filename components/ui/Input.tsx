/**
 * FAST - Componente Input
 * Input com bordas cinzas finas e quadradas
 */

import { Colors, FontSizes, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  error?: string;
  style?: ViewStyle;
  maxLength?: number;
  showPasswordToggle?: boolean; // Nova prop para mostrar botão de visualizar senha
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  secureTextEntry = false,
  error,
  style,
  maxLength,
  showPasswordToggle = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        <TextInput
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            showPasswordToggle && styles.inputWithToggle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={Colors.secondary}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={maxLength}
        />
        {showPasswordToggle && secureTextEntry && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={Colors.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

interface InputCodeProps {
  value: string;
  onChangeText: (text: string) => void;
  length?: number;
}

export const InputCode: React.FC<InputCodeProps> = ({
  value,
  onChangeText,
  length = 4,
}) => {
  return (
    <View style={styles.codeContainer}>
      <TextInput
        style={styles.codeInput}
        placeholder="0000"
        placeholderTextColor={Colors.secondary}
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        maxLength={length}
        textAlign="center"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    marginBottom: Spacing.xs,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  input: {
    width: "100%",
    height: 52,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.primary,
    backgroundColor: Colors.background,
  },
  inputWithToggle: {
    paddingRight: 50, // Espaço para o botão de toggle
  },
  inputFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: Colors.error,
  },
  toggleButton: {
    position: "absolute",
    right: Spacing.md,
    padding: Spacing.xs,
  },
  errorText: {
    fontSize: FontSizes.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  codeContainer: {
    alignItems: "center",
    marginVertical: Spacing.lg,
  },
  codeInput: {
    width: 120,
    height: 60,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    fontSize: FontSizes.xxl,
    fontWeight: "700",
    color: Colors.primary,
    textAlign: "center",
  },
});
