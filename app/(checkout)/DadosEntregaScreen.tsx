/**
 * FAST - Dados de Entrega Screen
 * Formulário de endereço de entrega com opções de entrega
 */

import { Button } from "@/components/ui/Button";
import { Colors, FontSizes, formatPrice, Spacing } from "@/constants/theme";
import { getDeliveryZones } from "@/services/authService";
import { useStore } from "@/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TipoEntrega = "loja" | "domicilio";

interface Endereco {
  id: string;
  nome: string;
  endereco: string;
  provincia: string;
  preco: number;
}

// Dados mockados - serão substituídos pelas zonas de entrega da API
// const ENDERECOS: Endereco[] = [];

const LOJAS = [
  {
    id: "1",
    nome: "FAST - Benfica",
    endereco: "Rua Principal, Benfica",
    preco: 0,
  },
  {
    id: "2",
    nome: "FAST - Centro",
    endereco: "Av. 4 de Fevereiro, Centro",
    preco: 0,
  },
];

// Dados mockados do carrinho
const ITENS_CARRINHO = [
  {
    id: "1",
    name: "KIMBOLA",
    price: 15000,
    quantity: 1,
  },
  {
    id: "2",
    name: "TRAINER PRO",
    price: 28500,
    quantity: 2,
  },
];

export default function DadosEntregaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cart = useStore((state) => state.cart);

  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("domicilio");
  const [enderecoSelecionado, setEnderecoSelecionado] =
    useState<Endereco | null>(null);
  const [lojaSelecionada, setLojaSelecionada] = useState<
    (typeof LOJAS)[0] | null
  >(null);
  const [zonasEntrega, setZonasEntrega] = useState<Endereco[]>([]);
  const [loadingZonas, setLoadingZonas] = useState(true);
  const [ivaPercentagem, setIvaPercentagem] = useState(0);

  // Buscar zonas de entrega ao iniciar
  useEffect(() => {
    const fetchZonas = async () => {
      try {
        const zonas = await getDeliveryZones();
        // Converter zonas da API para formato de endereço
        const enderecos: Endereco[] = zonas.map((zona) => ({
          id: String(zona.id_zona),
          nome: zona.nome_zona.trim(),
          endereco: zona.nome_zona.trim(),
          provincia: "Luanda",
          preco: parseFloat(zona.preco_taxa_entrega) || 0,
        }));
        setZonasEntrega(enderecos);
      } catch (error) {
        console.error("Erro ao buscar zonas de entrega:", error);
      } finally {
        setLoadingZonas(false);
      }
    };
    fetchZonas();
  }, []);

  // Calcular subtotal do carrinho real
  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  const taxaEntrega =
    tipoEntrega === "domicilio"
      ? enderecoSelecionado?.preco || 0
      : lojaSelecionada?.preco || 0;

  const iva = Math.round(subtotal * (ivaPercentagem / 100));
  const total = subtotal + iva + taxaEntrega;

  // Texto do tipo de entrega selecionado
  const textoEntregaSelecionada =
    tipoEntrega === "domicilio"
      ? enderecoSelecionado
        ? `Domicílio - ${enderecoSelecionado.nome}`
        : "Domicílio"
      : lojaSelecionada
        ? `Loja - ${lojaSelecionada.nome.replace("FAST - ", "")}`
        : "Loja";

  const handleNext = () => {
    // Passar dados do endereço selecionado via router params
    router.push({
      pathname: "/(checkout)/ResumoCompraScreen",
      params: {
        tipoEntrega,
        idEndereco:
          tipoEntrega === "domicilio"
            ? enderecoSelecionado?.id
            : lojaSelecionada?.id || "1",
        endereco:
          tipoEntrega === "domicilio"
            ? enderecoSelecionado?.endereco
            : lojaSelecionada?.endereco || "",
        provincia:
          tipoEntrega === "domicilio"
            ? enderecoSelecionado?.provincia
            : "Luanda",
        referencia:
          tipoEntrega === "domicilio"
            ? enderecoSelecionado?.nome
            : lojaSelecionada?.nome || "",
        taxaEntrega: String(taxaEntrega),
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>DADOS DE ENTREGA</Text>
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
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Tipo de Entrega */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              SELECIONE UMA OPÇÃO DE ENTREGA
            </Text>

            <TouchableOpacity
              style={[
                styles.tipoEntregaCard,
                tipoEntrega === "domicilio" && styles.tipoEntregaCardActive,
              ]}
              onPress={() => {
                setTipoEntrega("domicilio");
                setLojaSelecionada(null);
              }}
            >
              <View style={styles.tipoEntregaIcon}>
                <Ionicons
                  name="bicycle-outline"
                  size={28}
                  color={
                    tipoEntrega === "domicilio" ? Colors.white : Colors.primary
                  }
                />
              </View>
              <View style={styles.tipoEntregaInfo}>
                <Text
                  style={[
                    styles.tipoEntregaTitulo,
                    tipoEntrega === "domicilio" &&
                      styles.tipoEntregaTituloActive,
                  ]}
                >
                  Entrega em Domicílio
                </Text>
                <Text style={styles.tipoEntregaDesc}>
                  Entregamos no seu endereço
                </Text>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  tipoEntrega === "domicilio" && styles.radioCircleActive,
                ]}
              >
                {tipoEntrega === "domicilio" && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Opções de Entrega */}
          {
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SELECIONE UM ENDEREÇO</Text>
              {loadingZonas ? (
                <Text style={styles.enderecoTexto}>A carregar zonas...</Text>
              ) : zonasEntrega.length === 0 ? (
                <Text style={styles.enderecoTexto}>
                  Nenhuma zona disponível
                </Text>
              ) : (
                zonasEntrega.map((endereco) => (
                  <TouchableOpacity
                    key={endereco.id}
                    style={[
                      styles.enderecoCard,
                      enderecoSelecionado?.id === endereco.id &&
                        styles.enderecoCardActive,
                    ]}
                    onPress={() => setEnderecoSelecionado(endereco)}
                  >
                    <View style={styles.enderecoInfo}>
                      <Text style={styles.enderecoNome}>{endereco.nome}</Text>
                      <Text style={styles.enderecoTexto}>
                        {endereco.endereco}
                      </Text>
                    </View>
                    <Text style={styles.enderecoPreco}>
                      {formatPrice(endereco.preco)}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          }
        </ScrollView>

        {/* Resumo Financeiro */}
        <View
          style={[
            styles.resumoContainer,
            { paddingBottom: Spacing.lg + 20 + insets.bottom },
          ]}
        >
          <View style={styles.resumoRow}>
            <Text style={styles.resumoLabel}>Subtotal</Text>
            <Text style={styles.resumoValue}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.resumoRow}>
            <Text style={styles.resumoLabel}>IVA (14%)</Text>
            <Text style={styles.resumoValue}>{formatPrice(iva)}</Text>
          </View>
          <View style={styles.resumoRow}>
            <Text style={styles.resumoLabel}>Taxa de Entrega</Text>
            <Text style={styles.resumoValue}>
              {taxaEntrega === 0 ? "Grátis" : formatPrice(taxaEntrega)}
            </Text>
          </View>
          <View style={styles.resumoRow}>
            <Text style={styles.resumoLabel}>Entrega</Text>
            <Text style={styles.resumoValue}>{textoEntregaSelecionada}</Text>
          </View>
          <View style={[styles.resumoRow, styles.resumoTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>

          <Button
            title="Continuar"
            onPress={handleNext}
            disabled={tipoEntrega === "domicilio" && !enderecoSelecionado}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
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
    width: 32,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 280,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: Spacing.md,
    letterSpacing: 1,
  },
  tipoEntregaCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    marginBottom: Spacing.md,
  },
  tipoEntregaCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  tipoEntregaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  tipoEntregaInfo: {
    flex: 1,
  },
  tipoEntregaTitulo: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.primary,
  },
  tipoEntregaTituloActive: {
    color: Colors.white,
  },
  tipoEntregaDesc: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    marginTop: 2,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleActive: {
    borderColor: Colors.white,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.white,
  },
  enderecoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    marginBottom: Spacing.sm,
  },
  enderecoCardActive: {
    borderColor: Colors.primary,
  },
  enderecoInfo: {
    flex: 1,
  },
  enderecoNome: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.primary,
  },
  enderecoTexto: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    marginTop: 2,
  },
  enderecoProvincia: {
    fontSize: FontSizes.xs,
    color: Colors.lightGray,
    marginTop: 2,
  },
  enderecoPreco: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.primary,
  },
  resumoContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    paddingBottom: Spacing.lg + 20,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  resumoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  resumoLabel: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
  },
  resumoValue: {
    fontSize: FontSizes.sm,
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
});
