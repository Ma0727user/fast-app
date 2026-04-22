/**
 * FAST - Modal Adicionar ao Carrinho
 * Modal para selecionar tamanho, cor e quantidade do produto
 */

import { Colors, FontSizes, formatPrice, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Produto {
  id: string;
  name: string;
  price: number;
  image: string;
  // Campos para API do carrinho
  idProduto?: number;
  idVariacao?: number;
}

interface ModalAdicionarCarrinhoProps {
  visible: boolean;
  produto: Produto | null;
  onClose: () => void;
  onAdicionar: (
    quantidade: number,
    tamanho: string,
    cor: string,
    idProduto?: number,
    idVariacao?: number,
  ) => void;
}

const TAMANHOS = ["XS", "S", "M", "L", "XL", "XXL"];
const CORES = [
  { name: "Preto", color: "#000000" },
  { name: "Branco", color: "#FFFFFF" },
  { name: "Cinza", color: "#808080" },
  { name: "Azul", color: "#0000FF" },
  { name: "Vermelho", color: "#FF0000" },
];

interface CorSelecao {
  name: string;
  color: string;
}

export const ModalAdicionarCarrinho: React.FC<ModalAdicionarCarrinhoProps> = ({
  visible,
  produto,
  onClose,
  onAdicionar,
}) => {
  const [quantidade, setQuantidade] = useState(1);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState("M");
  const [corSelecionada, setCorSelecionada] = useState<CorSelecao | null>(null);
  const [coresSelecionadas, setCoresSelecionadas] = useState<CorSelecao[]>([]);
  const [selectCoresAberto, setSelectCoresAberto] = useState(false);
  const [tipoSelecao, setTipoSelecao] = useState<"single" | "multi">("single");

  const handleAdicionar = () => {
    const corFinal =
      tipoSelecao === "single"
        ? corSelecionada?.name || ""
        : coresSelecionadas.map((c) => c.name).join(", ");
    onAdicionar(
      quantidade,
      tamanhoSelecionado,
      corFinal,
      produto?.idProduto,
      produto?.idVariacao,
    );
    setQuantidade(1);
    setTamanhoSelecionado("M");
    setCorSelecionada(null);
    setCoresSelecionadas([]);
  };

  const toggleCorSelection = (cor: CorSelecao) => {
    const jaSelecionada = coresSelecionadas.find((c) => c.name === cor.name);
    if (jaSelecionada) {
      setCoresSelecionadas(
        coresSelecionadas.filter((c) => c.name !== cor.name),
      );
    } else {
      setCoresSelecionadas([...coresSelecionadas, cor]);
    }
  };

  const aumentarQuantidade = () => setQuantidade((prev) => prev + 1);
  const diminuirQuantidade = () =>
    setQuantidade((prev) => (prev > 1 ? prev - 1 : 1));

  if (!produto) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>ADICIONAR AO CARRINHO</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Produto Info */}
            <View style={styles.produtoInfo}>
              <Image
                source={{ uri: produto.image }}
                style={styles.produtoImage}
              />
              <View style={styles.produtoDetails}>
                <Text style={styles.produtoNome}>{produto.name}</Text>
                <Text style={styles.produtoPreco}>
                  {formatPrice(produto.price)}
                </Text>
              </View>
            </View>

            {/* Tamanho */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>TAMANHO</Text>
              <View style={styles.tamanhosContainer}>
                {TAMANHOS.map((tamanho) => (
                  <TouchableOpacity
                    key={tamanho}
                    style={[
                      styles.tamanhoButton,
                      tamanho === tamanhoSelecionado &&
                        styles.tamanhoButtonSelected,
                    ]}
                    onPress={() => setTamanhoSelecionado(tamanho)}
                  >
                    <Text
                      style={[
                        styles.tamanhoText,
                        tamanho === tamanhoSelecionado &&
                          styles.tamanhoTextSelected,
                      ]}
                    >
                      {tamanho}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Cor - Select / MultiSelect */}
            <View style={styles.section}>
              <View style={styles.selectHeader}>
                <Text style={styles.sectionTitle}>COR</Text>
                <View style={styles.tipoSelecaoContainer}>
                  <TouchableOpacity
                    style={[
                      styles.tipoSelecaoButton,
                      tipoSelecao === "single" &&
                        styles.tipoSelecaoButtonActive,
                    ]}
                    onPress={() => {
                      setTipoSelecao("single");
                      setSelectCoresAberto(true);
                    }}
                  >
                    <Text
                      style={[
                        styles.tipoSelecaoText,
                        tipoSelecao === "single" &&
                          styles.tipoSelecaoTextActive,
                      ]}
                    >
                      Única
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.tipoSelecaoButton,
                      tipoSelecao === "multi" && styles.tipoSelecaoButtonActive,
                    ]}
                    onPress={() => {
                      setTipoSelecao("multi");
                      setSelectCoresAberto(true);
                    }}
                  >
                    <Text
                      style={[
                        styles.tipoSelecaoText,
                        tipoSelecao === "multi" && styles.tipoSelecaoTextActive,
                      ]}
                    >
                      Múltipla
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Select Simples */}
              {tipoSelecao === "single" && (
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setSelectCoresAberto(!selectCoresAberto)}
                >
                  {corSelecionada ? (
                    <View style={styles.selectValue}>
                      <View
                        style={[
                          styles.selectCorCircle,
                          { backgroundColor: corSelecionada.color },
                        ]}
                      />
                      <Text style={styles.selectValueText}>
                        {corSelecionada.name}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.selectPlaceholder}>
                      Selecione uma cor
                    </Text>
                  )}
                  <Ionicons
                    name={selectCoresAberto ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={Colors.secondary}
                  />
                </TouchableOpacity>
              )}

              {/* Opções do Select Simples */}
              {tipoSelecao === "single" && selectCoresAberto && (
                <View style={styles.selectOptions}>
                  {CORES.map((cor) => (
                    <TouchableOpacity
                      key={cor.name}
                      style={[
                        styles.selectOption,
                        corSelecionada?.name === cor.name &&
                          styles.selectOptionSelected,
                      ]}
                      onPress={() => {
                        setCorSelecionada(cor);
                        setSelectCoresAberto(false);
                      }}
                    >
                      <View
                        style={[
                          styles.selectCorCircle,
                          { backgroundColor: cor.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.selectOptionText,
                          corSelecionada?.name === cor.name &&
                            styles.selectOptionTextSelected,
                        ]}
                      >
                        {cor.name}
                      </Text>
                      {corSelecionada?.name === cor.name && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={Colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* MultiSelect */}
              {tipoSelecao === "multi" && (
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setSelectCoresAberto(!selectCoresAberto)}
                >
                  {coresSelecionadas.length > 0 ? (
                    <View style={styles.selectValue}>
                      <Text style={styles.selectValueText}>
                        {coresSelecionadas.length} cor(es) selecionada(s)
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.selectPlaceholder}>
                      Toque para selecionar cores
                    </Text>
                  )}
                  <Ionicons
                    name={selectCoresAberto ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={Colors.secondary}
                  />
                </TouchableOpacity>
              )}

              {/* Opções do MultiSelect - Sempre visível no modo multi */}
              {tipoSelecao === "multi" && (
                <View
                  style={[
                    styles.selectOptions,
                    !selectCoresAberto && styles.selectOptionsFechado,
                  ]}
                >
                  <Text style={styles.selectOptionsHint}>
                    Toque nas cores para selecionar:
                  </Text>
                  {CORES.map((cor) => {
                    const isSelected = coresSelecionadas.some(
                      (c) => c.name === cor.name,
                    );
                    return (
                      <TouchableOpacity
                        key={cor.name}
                        style={[
                          styles.selectOption,
                          isSelected && styles.selectOptionSelected,
                        ]}
                        onPress={() => toggleCorSelection(cor)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            isSelected && styles.checkboxSelected,
                          ]}
                        >
                          {isSelected && (
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color={Colors.white}
                            />
                          )}
                        </View>
                        <View
                          style={[
                            styles.selectCorCircle,
                            { backgroundColor: cor.color },
                          ]}
                        />
                        <Text
                          style={[
                            styles.selectOptionText,
                            isSelected && styles.selectOptionTextSelected,
                          ]}
                        >
                          {cor.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Cores Selecionadas (MultiSelect) */}
              {tipoSelecao === "multi" && coresSelecionadas.length > 0 && (
                <View style={styles.coresSelecionadasContainer}>
                  {coresSelecionadas.map((cor) => (
                    <View key={cor.name} style={styles.corSelecionadaTag}>
                      <View
                        style={[
                          styles.selectCorCircleSmall,
                          { backgroundColor: cor.color },
                        ]}
                      />
                      <Text style={styles.corSelecionadaText}>{cor.name}</Text>
                      <TouchableOpacity
                        onPress={() => toggleCorSelection(cor)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color={Colors.secondary}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Quantidade */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>QUANTIDADE</Text>
              <View style={styles.quantidadeContainer}>
                <TouchableOpacity
                  style={styles.quantidadeButton}
                  onPress={diminuirQuantidade}
                >
                  <Ionicons name="remove" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.quantidadeText}>{quantidade}</Text>
                <TouchableOpacity
                  style={styles.quantidadeButton}
                  onPress={aumentarQuantidade}
                >
                  <Ionicons name="add" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Botão Adicionar */}
          <TouchableOpacity
            style={styles.adicionarButton}
            onPress={handleAdicionar}
          >
            <Text style={styles.adicionarButtonText}>
              ADICIONAR - {formatPrice(produto.price * quantidade)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
  produtoInfo: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
  },
  produtoImage: {
    width: 80,
    height: 100,
    borderRadius: 0,
    backgroundColor: Colors.lightGray,
  },
  produtoDetails: {
    marginLeft: Spacing.md,
    justifyContent: "center",
  },
  produtoNome: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.primary,
  },
  produtoPreco: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  tamanhosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tamanhoButton: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  tamanhoButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tamanhoText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  tamanhoTextSelected: {
    color: Colors.white,
  },
  coresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  corButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 2,
    borderRadius: 0,
    gap: Spacing.sm,
  },
  corButtonSelected: {
    borderColor: Colors.primary,
  },
  corCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  corText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
  },
  // Estilos do Select
  selectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  tipoSelecaoContainer: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  tipoSelecaoButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  tipoSelecaoButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tipoSelecaoText: {
    fontSize: FontSizes.xs,
    color: Colors.secondary,
  },
  tipoSelecaoTextActive: {
    color: Colors.white,
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 0,
    backgroundColor: Colors.white,
  },
  selectValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  selectValueText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
  },
  selectPlaceholder: {
    fontSize: FontSizes.sm,
    color: Colors.lightGray,
  },
  selectOptions: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 0,
    backgroundColor: Colors.white,
    maxHeight: 200,
  },
  selectOptionsFechado: {
    display: "none",
  },
  selectOptionsHint: {
    fontSize: FontSizes.xs,
    color: Colors.lightGray,
    padding: Spacing.sm,
    fontStyle: "italic",
  },
  selectOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    gap: Spacing.sm,
  },
  selectOptionSelected: {
    backgroundColor: Colors.primary + "10",
  },
  selectOptionText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.primary,
  },
  selectOptionTextSelected: {
    fontWeight: "600",
  },
  selectCorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  selectCorCircleSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  coresSelecionadasContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  corSelecionadaTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.lightGray,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
  },
  corSelecionadaText: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
  },
  quantidadeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  quantidadeButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  quantidadeText: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: Colors.primary,
    minWidth: 30,
    textAlign: "center",
  },
  adicionarButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: 0,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  adicionarButtonText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
