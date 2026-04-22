/**
 * FAST - Editar Perfil Screen
 * Formulário para editar informações do utilizador
 */

import { ModalFeedback } from "@/components/ModalFeedback";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Colors, FontSizes, Spacing } from "@/constants/theme";
import {
  getUser,
  updateUser as saveUserData,
  updateProfile,
} from "@/services/authService";
import { useStore } from "@/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function EditarPerfilScreen() {
  const router = useRouter();
  const setUser = useStore((state) => state.setUser);
  const insets = useSafeAreaInsets();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [userId, setUserId] = useState<number>(0);
  const [passwordAtual, setPasswordAtual] = useState("");
  const [novaPassword, setNovaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error" | "alert">(
    "error",
  );
  const [modalMessage, setModalMessage] = useState("");

  // Carregar dados do usuário ao iniciar e quando a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      const loadUserData = async () => {
        try {
          const user = await getUser();
          if (user) {
            setNome(user.name || "");
            setEmail(user.email || "");
            setTelefone(user.phone || "");
            setUserId(parseInt(user.id) || 0);
          }
        } catch (error) {
          console.error("Erro ao carregar dados do usuário:", error);
        }
      };
      loadUserData();
    }, []),
  );

  const showModal = (type: "success" | "error", message: string) => {
    setModalType(type);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      showModal("error", "Por favor, insira o seu nome");
      return;
    }
    if (!email.trim()) {
      showModal("error", "Por favor, insira o seu email");
      return;
    }
    if (!telefone.trim() || telefone.length < 9) {
      showModal("error", "Por favor, insira um telemóvel válido");
      return;
    }

    setLoading(true);
    try {
      const result = await updateProfile(userId, nome, email, telefone);

      if (result.success) {
        // Atualizar dados locais
        const currentUser = await getUser();
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            name: nome,
            email: email,
            phone: telefone,
          };
          await saveUserData(updatedUser);
          // Atualizar store Zustand
          setUser(updatedUser);
        }

        showModal("success", result.message);
        setTimeout(() => {
          router.back();
        }, 2000);
      } else {
        showModal("error", result.message);
      }
    } catch (error: any) {
      showModal("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>EDITAR PERFIL</Text>
          <TouchableOpacity 
            onPress={() => router.push("/(tabs)/NotificacoesScreen")}
            style={styles.notificationButton}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Informações Pessoais */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INFORMAÇÕES PESSOAIS</Text>
            <Input
              label="NOME COMPLETO"
              placeholder="Ex: João Manuel"
              value={nome}
              onChangeText={setNome}
            />
            <Input
              label="EMAIL"
              placeholder="Ex: joao.manuel@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <Input
              label="TELEMÓVEL"
              placeholder="Ex: 900 000 000"
              value={telefone}
              onChangeText={setTelefone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Repor Palavra-passe */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SEGURANÇA</Text>
            <TouchableOpacity
              style={styles.reporPasswordButton}
              onPress={() => router.push("/reporpasse")}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.reporPasswordText}>Repor Palavra-passe</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.secondary}
              />
            </TouchableOpacity>
          </View>

          {/* Alterar Palavra-passe */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ALTERAR PALAVRA-PASSE</Text>
            <Input
              label="PALAVRA-PASSE ATUAL"
              placeholder="••••••••"
              value={passwordAtual}
              onChangeText={setPasswordAtual}
              secureTextEntry
            />
            <Input
              label="NOVA PALAVRA-PASSE"
              placeholder="••••••••"
              value={novaPassword}
              onChangeText={setNovaPassword}
              secureTextEntry
            />
            <Input
              label="CONFIRMAR NOVA PALAVRA-PASSE"
              placeholder="••••••••"
              value={confirmarPassword}
              onChangeText={setConfirmarPassword}
              secureTextEntry
            />
          </View>
        </ScrollView>

        {/* Botão Fixo no Rodapé */}
        <View
          style={[
            styles.footerButton,
            { paddingBottom: Spacing.lg + insets.bottom },
          ]}
        >
          <Button
            title={loading ? "A GUARDAR..." : "Guardar Alterações"}
            onPress={handleSave}
            disabled={loading}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Modal de Feedback */}
      <ModalFeedback
        visible={modalVisible}
        variant={modalType}
        message={modalMessage}
        onConfirm={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  backButton: {
    padding: Spacing.xs,
  },
  notificationButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
  placeholder: {
    width: 60,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 160,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  reporPasswordButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    backgroundColor: Colors.white,
    gap: Spacing.sm,
  },
  reporPasswordText: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: "500",
  },
  footerButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
});
