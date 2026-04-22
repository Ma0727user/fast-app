/**
 * FAST - Perfil Screen
 * Perfil do utilizador com opções de gestão
 */

import { Toast, ToastVariant } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { Colors, FontSizes, Spacing } from "@/constants/theme";
import { deleteAccount } from "@/services/authService";
import { useStore } from "@/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OPCOES_PERFIL = [
  {
    id: "1",
    name: "Meus Pedidos",
    icon: "receipt-outline",
    route: "/(tabs)/MinhasEncomendasScreen",
  },
  {
    id: "2",
    name: "Editar Perfil",
    icon: "person-outline",
    route: "/(profile)/EditarPerfilScreen",
  },
  {
    id: "4",
    name: "Perguntas Frequentes",
    icon: "help-circle-outline",
    route: "/(info)/FaqScreen",
  },
  {
    id: "5",
    name: "Termos e Condições",
    icon: "document-text-outline",
    route: "/(info)/TermosECondicoes",
  },
  {
    id: "6",
    name: "Política de Privacidade",
    icon: "shield-checkmark-outline",
    route: "/(info)/PoliticaPrivacidade",
  },
];

export default function PerfilScreen() {
  const ACCOUNT_DELETE_TOAST_DURATION = 5000;

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useStore((state) => state.user);
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = React.useState(false);
  const [deletePassword, setDeletePassword] = React.useState("");
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);
  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastVariant, setToastVariant] =
    React.useState<ToastVariant>("success");
  const [toastMessage, setToastMessage] = React.useState("");
  const [toastDuration, setToastDuration] = React.useState(3000);
  const deleteRedirectTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const isGuest = !isAuthenticated || !user;

  React.useEffect(() => {
    return () => {
      if (deleteRedirectTimeoutRef.current) {
        clearTimeout(deleteRedirectTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (
    variant: ToastVariant,
    message: string,
    duration = 3000,
  ) => {
    setToastVariant(variant);
    setToastMessage(message);
    setToastDuration(duration);
    setToastVisible(true);
  };

  const handleOptionPress = (route: string) => {
    // Opções que requerem login
    const requiresAuth = [
      "/(tabs)/MinhasEncomendasScreen",
      "/(profile)/EditarPerfilScreen",
    ];
    if (isGuest && requiresAuth.includes(route)) {
      router.push("/login");
      return;
    }
    router.push(route as any);
  };

  const handleLogout = () => {
    useStore.getState().logout();
    router.replace("/(tabs)");
  };

  const openDeleteAccountModal = () => {
    setDeletePassword("");
    setIsDeleteModalVisible(true);
  };

  const closeDeleteAccountModal = () => {
    if (!isDeletingAccount) {
      setIsDeleteModalVisible(false);
      setDeletePassword("");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) {
      Alert.alert("Erro", "Utilizador não encontrado.");
      return;
    }

    if (!deletePassword.trim()) {
      Alert.alert("Senha obrigatória", "Insere a tua senha para continuar.");
      return;
    }

    const idUsuario = Number(user.id);
    if (Number.isNaN(idUsuario)) {
      Alert.alert("Erro", "ID de utilizador inválido.");
      return;
    }

    try {
      setIsDeletingAccount(true);
      const result = await deleteAccount(idUsuario, deletePassword.trim());

      await Promise.resolve(useStore.getState().logout());
      setIsDeleteModalVisible(false);
      setDeletePassword("");

      showToast(
        "success",
        result.message || "Conta eliminada com sucesso.",
        ACCOUNT_DELETE_TOAST_DURATION,
      );

      if (deleteRedirectTimeoutRef.current) {
        clearTimeout(deleteRedirectTimeoutRef.current);
      }

      deleteRedirectTimeoutRef.current = setTimeout(() => {
        router.replace("/login");
      }, ACCOUNT_DELETE_TOAST_DURATION + 350);
    } catch (error: any) {
      showToast(
        "error",
        error?.message || "Não foi possível eliminar a conta.",
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Image
            source={require("@/assets/images/fast-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          {!isGuest && (
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/NotificacoesScreen")}
              style={styles.notificationButton}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color={Colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        {isGuest ? (
          /* ---- MODO VISITANTE ---- */
          <View style={styles.guestSection}>
            <View style={styles.avatarContainer}>
              <Ionicons
                name="person-outline"
                size={48}
                color={Colors.secondary}
              />
            </View>
            <Text style={styles.guestTitle}>Bem-vindo à FAST</Text>
            <Text style={styles.guestSubtitle}>
              Entra ou cria uma conta para acompanhares as tuas encomendas e
              gerir o teu perfil.
            </Text>
            <View style={styles.guestButtons}>
              <Button title="ENTRAR" onPress={() => router.push("/login")} />
              <TouchableOpacity
                style={styles.guestRegisterButton}
                onPress={() => router.push("/signup")}
              >
                <Text style={styles.guestRegisterText}>CRIAR CONTA</Text>
              </TouchableOpacity>
            </View>

            {/* Opções públicas (FAQ, Termos) */}
            <View style={styles.opcoesContainer}>
              {OPCOES_PERFIL.filter((o) => ["4", "5"].includes(o.id)).map(
                (opcao) => (
                  <TouchableOpacity
                    key={opcao.id}
                    style={styles.opcaoItem}
                    onPress={() => handleOptionPress(opcao.route)}
                  >
                    <View style={styles.opcaoLeft}>
                      <Ionicons
                        name={opcao.icon as any}
                        size={22}
                        color={Colors.primary}
                      />
                      <Text style={styles.opcaoText}>{opcao.name}</Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Colors.secondary}
                    />
                  </TouchableOpacity>
                ),
              )}
            </View>

            <Text style={styles.version}>FAST v1.0.0</Text>
          </View>
        ) : (
          /* ---- MODO AUTENTICADO ---- */
          <>
            {/* Perfil Info */}
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={40} color={Colors.primary} />
              </View>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userPhone}>{user.phone}</Text>
            </View>

            {/* Opções */}
            <View style={styles.opcoesContainer}>
              {OPCOES_PERFIL.map((opcao) => (
                <TouchableOpacity
                  key={opcao.id}
                  style={styles.opcaoItem}
                  onPress={() => handleOptionPress(opcao.route)}
                >
                  <View style={styles.opcaoLeft}>
                    <Ionicons
                      name={opcao.icon as any}
                      size={22}
                      color={Colors.primary}
                    />
                    <Text style={styles.opcaoText}>{opcao.name}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.secondary}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Sair */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={22} color={Colors.error} />
              <Text style={styles.logoutText}>Sair</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteAccountButton}
              onPress={openDeleteAccountModal}
            >
              <Ionicons name="trash-outline" size={22} color={Colors.error} />
              <Text style={styles.deleteAccountText}>Remover conta</Text>
            </TouchableOpacity>

            {/* Versão */}
            <Text style={styles.version}>FAST v1.0.0</Text>
          </>
        )}
      </ScrollView>

      {/* Padding bottom para safe area */}
      <View style={{ height: 60 }} />

      <Modal
        animationType="fade"
        transparent
        visible={isDeleteModalVisible}
        onRequestClose={closeDeleteAccountModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Remover conta</Text>
            <Text style={styles.modalDescription}>
              Esta ação é permanente. Introduz a tua senha para confirmar.
            </Text>

            <TextInput
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Senha"
              secureTextEntry
              editable={!isDeletingAccount}
              style={styles.passwordInput}
              placeholderTextColor={Colors.secondary}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={closeDeleteAccountModal}
                disabled={isDeletingAccount}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={handleDeleteAccount}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.modalDeleteText}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast
        visible={toastVisible}
        variant={toastVariant}
        message={toastMessage}
        duration={toastDuration}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    left: Spacing.lg,
    padding: Spacing.xs,
  },
  notificationButton: {
    position: "absolute",
    right: Spacing.lg,
    padding: Spacing.xs,
  },
  logo: {
    width: 100,
    height: 40,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  userName: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    color: Colors.primary,
  },
  userPhone: {
    fontSize: FontSizes.md,
    color: Colors.secondary,
    marginTop: Spacing.xs,
  },
  opcoesContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  opcaoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  opcaoLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  opcaoText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    marginLeft: Spacing.md,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: FontSizes.md,
    color: Colors.error,
    fontWeight: "600",
    marginLeft: Spacing.sm,
  },
  deleteAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  deleteAccountText: {
    fontSize: FontSizes.md,
    color: Colors.error,
    fontWeight: "600",
    marginLeft: Spacing.sm,
    textDecorationLine: "underline",
  },
  version: {
    fontSize: FontSizes.xs,
    color: Colors.lightGray,
    textAlign: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  guestSection: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  guestTitle: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    color: Colors.primary,
    marginTop: Spacing.md,
  },
  guestSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  guestButtons: {
    width: "100%",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  guestRegisterButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
  },
  guestRegisterText: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.primary,
  },
  modalDescription: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    lineHeight: 20,
  },
  passwordInput: {
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.primary,
    backgroundColor: Colors.white,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  modalCancelButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  modalCancelText: {
    fontSize: FontSizes.md,
    color: Colors.secondary,
    fontWeight: "600",
  },
  modalDeleteButton: {
    minWidth: 110,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 10,
    backgroundColor: Colors.error,
  },
  modalDeleteText: {
    fontSize: FontSizes.md,
    color: Colors.white,
    fontWeight: "700",
  },
});
