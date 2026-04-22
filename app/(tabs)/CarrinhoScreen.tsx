/**
 * FAST - Carrinho Screen
 * Lista de itens, resumo financeiro e botão de checkout
 */

import { Toast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { Colors, FontSizes, formatPrice, Spacing } from "@/constants/theme";
import { getStoreData } from "@/services/authService";
import { AuthError, salvarCarrinho } from "@/services/carrinhoService";
import { useStore } from "@/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CarrinhoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    cart,
    user,
    isAuthenticated,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
  } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastVariant, setToastVariant] = useState<
    "success" | "error" | "warning" | "info"
  >("warning");
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (
    variant: "success" | "error" | "warning" | "info",
    message: string,
  ) => {
    setToastVariant(variant);
    setToastMessage(message);
    setToastVisible(true);
  };

  // IVA dinâmico da API /dadosloja
  const [ivaPercentagem, setIvaPercentagem] = useState(0);

  useEffect(() => {
    getStoreData()
      .then((data) => {
        if (data) setIvaPercentagem(data.iva_percentagem || 0);
      })
      .catch(() => {});
  }, []);

  // Calcular subtotal (taxa de entrega será definida em DadosEntregaScreen)
  const subtotal = getCartTotal();
  const iva = Math.round(subtotal * (ivaPercentagem / 100));
  const total = subtotal + iva;

  // Função para salvar o carrinho no backend
  const handleFinalizar = async () => {
    // Verificar autenticação usando user E isAuthenticated
    if (!user || !isAuthenticated) {
      showToast(
        "warning",
        "Precisas estar logado para finalizar a compra. Entra ou cria uma conta!",
      );
      setTimeout(() => router.push("/login"), 2000);
      return;
    }

    if (cart.length === 0) {
      showToast(
        "info",
        "O teu carrinho está vazio. Adiciona produtos primeiro!",
      );
      return;
    }

    // Salvar no backend primeiro
    try {
      setIsLoading(true);

      // Converter itens do carrinho para o formato da API
      const itensAPI = cart.map((item) => ({
        id_produto: item.idProduto || parseInt(item.id, 10),
        quantidade: item.quantity,
        cor: item.color || "",
        tamanho: item.size || "",
        idVariacao: item.idVariacao || 0,
      }));

      console.log("[CarrinhoScreen] Salvando carrinho com itens:", itensAPI);

      // Verificar se o ID do usuário é válido
      const userId = parseInt(user.id, 10);
      if (isNaN(userId) || userId <= 0) {
        console.error("[CarrinhoScreen] ID do usuário inválido:", user.id);
        showToast("error", "Sessão inválida. Faz login novamente.");
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      // Salvar no backend
      const response = await salvarCarrinho(
        parseInt(user.id, 10),
        itensAPI,
        subtotal,
        1, // idEndereco - por enquanto fixo
        0, // taxaEntrega será definida em DadosEntregaScreen
        iva,
      );

      console.log("[CarrinhoScreen] Resposta do servidor:", response);

      // Se salvou com sucesso (status 200), ir para DadosEntregaScreen
      if (response.status === 200) {
        // Não limpa o carrinho ainda - só após pagamento confirmado
        router.push("/(checkout)/DadosEntregaScreen");
      } else {
        // Se a API retornar erro mas ainda assim queremos continuar
        console.log(
          "[CarrinhoScreen] Salvando localmente, continuando checkout...",
        );
        router.push("/(checkout)/DadosEntregaScreen");
      }
    } catch (error: any) {
      console.error("[CarrinhoScreen] Erro ao salvar carrinho:", error);

      // Tratar erro de autenticação específico
      if (error instanceof AuthError) {
        showToast("warning", "Precisas de fazer login para continuar.");
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      // Em caso de erro, ainda assim permite continuar para checkout
      showToast(
        "info",
        "Aviso: erro ao salvar carrinho. A encomenda será processada normalmente.",
      );
      router.push("/(checkout)/DadosEntregaScreen");
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: (typeof cart)[0] }) => (
    <View style={styles.itemCard}>
      <Image
        source={{ uri: item.image }}
        style={styles.itemImage}
        resizeMode="cover"
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDetails}>
          Tamanho: {item.size || "-"} | Cor: {item.color || "-"}
        </Text>
        <View style={styles.itemBottom}>
          <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() =>
                updateQuantity(item.id, Math.max(1, item.quantity - 1))
              }
            >
              <Text style={styles.quantityText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, item.quantity + 1)}
            >
              <Text style={styles.quantityText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromCart(item.id)}
      >
        <Text style={styles.removeText}>X</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>CARRINHO</Text>
        {isAuthenticated && (
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

      {/* Lista de Itens */}
      <FlatList
        data={cart}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>O seu carrinho está vazio</Text>
          </View>
        }
      />

      {/* Resumo Financeiro */}
      {cart.length > 0 && (
        <View style={styles.resumoContainer}>
          <View style={styles.resumoRow}>
            <Text style={styles.resumoLabel}>Subtotal</Text>
            <Text style={styles.resumoValue}>{formatPrice(subtotal)}</Text>
          </View>
          {ivaPercentagem > 0 && (
            <View style={styles.resumoRow}>
              <Text style={styles.resumoLabel}>IVA ({ivaPercentagem}%)</Text>
              <Text style={styles.resumoValue}>{formatPrice(iva)}</Text>
            </View>
          )}
          <View style={styles.resumoRow}>
            <Text style={styles.resumoLabel}>Taxa de Entrega</Text>
            <Text style={styles.resumoValue}>Definida na entrega</Text>
          </View>
          <View style={[styles.resumoRow, styles.resumoTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>

          {/* Botão Finalizar */}
          <Button
            title={isLoading ? "A processar..." : "Finalizar Encomenda"}
            onPress={handleFinalizar}
            disabled={isLoading}
          />
          {isLoading && (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={styles.loadingIndicator}
            />
          )}
        </View>
      )}

      {/* Padding bottom para safe area */}
      <View style={{ height: 60 }} />

      {/* Toast Snackbar */}
      <Toast
        visible={toastVisible}
        variant={toastVariant}
        message={toastMessage}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  notificationButton: {
    padding: Spacing.xs,
  },
  logo: {
    width: 100,
    height: 40,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.primary,
    textAlign: "center",
    marginTop: Spacing.sm,
    letterSpacing: 1,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 280,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.secondary,
  },
  itemCard: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 0,
  },
  itemImage: {
    width: 80,
    height: 100,
    backgroundColor: Colors.lightGray,
    borderRadius: 0,
  },
  itemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: Colors.primary,
  },
  itemDetails: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
  },
  itemBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemPrice: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.primary,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.primary,
  },
  quantityValue: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.primary,
    marginHorizontal: Spacing.sm,
    minWidth: 20,
    textAlign: "center",
  },
  removeButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  removeText: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.secondary,
  },
  resumoContainer: {
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    paddingBottom: Spacing.lg + 16,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  resumoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  resumoLabel: {
    fontSize: FontSizes.md,
    color: Colors.secondary,
  },
  resumoValue: {
    fontSize: FontSizes.md,
    color: Colors.primary,
  },
  resumoTotal: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  totalLabel: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.primary,
  },
  totalValue: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.primary,
  },
  loadingIndicator: {
    marginTop: Spacing.sm,
  },
});
