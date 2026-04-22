/**
 * FAST - Product Grid Screen
 * Grid de produtos por categoria com filtros
 */

import { ModalAdicionarCarrinho } from "@/components/ModalAdicionarCarrinho";
import { Colors, FontSizes, formatPrice, Spacing } from "@/constants/theme";
import { getHomeData } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface Produto {
  id: string;
  id_categoriafk?: number;
  id_parceiro?: number | null;
  name: string;
  price: number;
  promotionalPrice?: number;
  image: string;
  categoria: string;
  parceiro?: string;
  homem?: boolean;
  mulher?: boolean;
  unissexo?: boolean;
  destaque?: boolean;
  produtoAngola?: boolean;
  desporto?: boolean;
}

// Dados mockados como fallback
const PRODUTOS_FALLBACK: Produto[] = [
  {
    id: "1",
    name: "KIMBOLA",
    price: 15000,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=300&fit=crop",
    categoria: "HOMEM",
  },
  {
    id: "2",
    name: "TRAINER PRO",
    price: 28500,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=300&fit=crop",
    categoria: "MULHER",
  },
  {
    id: "3",
    name: "RUNNER ZIP",
    price: 22000,
    image:
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=200&h=300&fit=crop",
    categoria: "HOMEM",
  },
  {
    id: "4",
    name: "FLEX WEAVE",
    price: 18400,
    image:
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=200&h=300&fit=crop",
    categoria: "ACESSÓRIOS",
  },
  {
    id: "5",
    name: "SPORT LUX",
    price: 32000,
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=300&fit=crop",
    categoria: "MULHER",
  },
  {
    id: "6",
    name: "URBAN FIT",
    price: 19500,
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=300&fit=crop",
    categoria: "HOMEM",
  },
];

const CATEGORIAS = ["TODOS", "HOMEM", "MULHER", "ACESSÓRIOS", "EQUIPAMENTOS"];
const SEXO = ["TODOS", "HOMEM", "MULHER", "UNISEXO"];
const OUTROS = ["TODOS", "NOVIDADES", "PRODUTO_ANGOLA", "DESPORTO"];
const ORDENAR_PRECO = [
  { label: "Padrão", value: "default" },
  { label: "Menor Preço", value: "asc" },
  { label: "Maior Preço", value: "desc" },
];

export default function ProductGridScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Debug: Log dos params recebidos
  console.log("[ProductGridScreen] Params recebidos:", params);

  const categoriaParam = Array.isArray(params.categoria)
    ? params.categoria[0]
    : params.categoria || "PRODUTOS";
  const filtroParam = Array.isArray(params.filtro)
    ? params.filtro[0]
    : params.filtro || null;
  const categoriaIdParam = params.categoriaId
    ? Number(params.categoriaId)
    : null;
  const parceiroIdParam = params.parceiroId ? Number(params.parceiroId) : null;
  const parceiroParam = Array.isArray(params.parceiro)
    ? params.parceiro[0]
    : params.parceiro || null;
  const parceiroIdValido =
    parceiroIdParam !== null && !Number.isNaN(parceiroIdParam)
      ? parceiroIdParam
      : null;
  const parceiroNomeNormalizado = String(parceiroParam || "")
    .trim()
    .toLowerCase();
  const filtroParceiroAtivo =
    parceiroIdValido !== null || parceiroNomeNormalizado.length > 0;

  console.log("[ProductGridScreen] categoriaParam:", categoriaParam);
  console.log(
    "[ProductGridScreen] categoriaIdParam:",
    categoriaIdParam,
    "tipo:",
    typeof categoriaIdParam,
  );
  console.log(
    "[ProductGridScreen] parceiroIdParam:",
    parceiroIdValido,
    "tipo:",
    typeof parceiroIdValido,
  );

  const [todosProdutos, setTodosProdutos] = useState<Produto[]>([]);
  const [categoriasApi, setCategoriasApi] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Usar categorias da API se disponíveis, senão usar padrão
  const categoriasFiltro =
    categoriasApi.length > 0
      ? ["TODOS", ...categoriasApi.map((c) => c.nome_categoria)]
      : CATEGORIAS;

  // State para categoria selecionada - inicia com base no parâmetro
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>(
    categoriaIdParam ? categoriaParam : "TODOS",
  );
  const [sexoSelecionado, setSexoSelecionado] = useState<string>("TODOS");
  const [outroSelecionado, setOutroSelecionado] = useState<string>("TODOS");
  const [ordemPreco, setOrdemPreco] = useState("default");
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(
    null,
  );

  // Carregar produtos e categorias da API
  useEffect(() => {
    carregarProdutos();
  }, [categoriaIdParam, parceiroIdValido, parceiroNomeNormalizado]);

  // Atualizar categoria selecionada quando categoriaIdParam mudar
  useEffect(() => {
    if (categoriaIdParam && categoriasApi.length > 0) {
      // Encontrar o nome da categoria pelo ID
      const categoriaEncontrada = categoriasApi.find(
        (c) => c.id_categoria === categoriaIdParam,
      );
      if (categoriaEncontrada) {
        setCategoriaSelecionada(categoriaEncontrada.nome_categoria);
      }
    }
  }, [categoriaIdParam, categoriasApi]);

  useEffect(() => {
    const filtroInicial = String(filtroParam || "").toLowerCase();

    if (!categoriaIdParam) {
      setCategoriaSelecionada("TODOS");
    }

    switch (filtroInicial) {
      case "novidades":
        setOutroSelecionado("NOVIDADES");
        setSexoSelecionado("TODOS");
        break;
      case "homem":
        setSexoSelecionado("HOMEM");
        setOutroSelecionado("TODOS");
        break;
      case "mulher":
        setSexoSelecionado("MULHER");
        setOutroSelecionado("TODOS");
        break;
      case "unissexo":
        setSexoSelecionado("UNISEXO");
        setOutroSelecionado("TODOS");
        break;
      case "produto_angola":
        setOutroSelecionado("PRODUTO_ANGOLA");
        setSexoSelecionado("TODOS");
        break;
      case "desporto":
        setOutroSelecionado("DESPORTO");
        setSexoSelecionado("TODOS");
        break;
      default:
        setSexoSelecionado("TODOS");
        setOutroSelecionado("TODOS");
        break;
    }
  }, [filtroParam, categoriaIdParam]);

  const carregarProdutos = async () => {
    try {
      setIsLoading(true);
      console.log(
        "[ProductGridScreen] Carregando produtos para categoriaId:",
        categoriaIdParam,
      );

      // Sempre buscar dados da home que contém todos os produtos
      const data = await getHomeData();

      if (data) {
        // Guardar categorias da API
        if (data.categorias) {
          setCategoriasApi(data.categorias);
        }

        // Combinar produtos da API
        let todosProdutosApi = (data.produtos || []).map((p: any) => ({
          id: String(p.id_produto),
          id_categoriafk: p.id_categoria,
          name: p.nome_produto,
          price: p.preco,
          promotionalPrice: p.preco_promo || undefined,
          image: p.imagem1 || p.imagem || "",
          categoria: p.nome_categoria || "",
          id_parceiro:
            p.id_parceiro ??
            p.id_parceirofk ??
            p.id_parceiro_fk ??
            p.parceiro_id ??
            null,
          parceiro: p.nome_parceiro || p.parceiro || p.nomeparceiro || "",
          homem: p.homem,
          mulher: p.mulher,
          unissexo: p.unissexo,
          destaque: p.destaque === "sim",
          produtoAngola: p.produtoAngola,
          desporto: p.desporto,
        }));

        // Se veio da navegação por parceiro, filtrar por ID e/ou nome do parceiro
        if (filtroParceiroAtivo) {
          todosProdutosApi = todosProdutosApi.filter((p: any) => {
            const idProdutoParceiro = Number(p.id_parceiro);
            const parceiroProdutoNome = String(p.parceiro || "")
              .trim()
              .toLowerCase();

            if (
              parceiroIdValido !== null &&
              idProdutoParceiro === parceiroIdValido
            ) {
              return true;
            }

            if (
              parceiroNomeNormalizado.length > 0 &&
              parceiroProdutoNome.length > 0 &&
              parceiroProdutoNome.includes(parceiroNomeNormalizado)
            ) {
              return true;
            }

            return false;
          });
        }

        // Se tem ID da categoria, filtrar localmente
        if (categoriaIdParam) {
          console.log(
            "[ProductGridScreen] Filtrando produtos por categoriaId:",
            categoriaIdParam,
          );
          console.log(
            "[ProductGridScreen] Tipo do categoriaIdParam:",
            typeof categoriaIdParam,
          );
          todosProdutosApi = todosProdutosApi.filter((p: any) => {
            console.log(
              "[ProductGridScreen] Produto id_categoriafk:",
              p.id_categoriafk,
              "tipo:",
              typeof p.id_categoriafk,
            );
            return p.id_categoriafk === Number(categoriaIdParam);
          });
          console.log(
            "[ProductGridScreen] Produtos encontrados:",
            todosProdutosApi.length,
          );
        }

        // Remover duplicados
        const uniqueProdutos = todosProdutosApi.filter(
          (p: any, index: number, self: any[]) =>
            index === self.findIndex((t: any) => t.id === p.id),
        );

        setTodosProdutos(uniqueProdutos);
      } else {
        setTodosProdutos(filtroParceiroAtivo ? [] : PRODUTOS_FALLBACK);
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setTodosProdutos(filtroParceiroAtivo ? [] : PRODUTOS_FALLBACK);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar e ordenar produtos
  const produtosFiltrados = useMemo(() => {
    let produtos = [...todosProdutos];

    // Se não tem produtos da API, usar fallback
    if (produtos.length === 0 && isLoading === false && !filtroParceiroAtivo) {
      produtos = PRODUTOS_FALLBACK;
    }

    // Filtrar por categoria
    if (categoriaSelecionada !== "TODOS") {
      produtos = produtos.filter((p) => p.categoria === categoriaSelecionada);
    }

    // Filtrar por sexo
    if (sexoSelecionado !== "TODOS") {
      produtos = produtos.filter((p) => {
        switch (sexoSelecionado) {
          case "HOMEM":
            return p.homem === true;
          case "MULHER":
            return p.mulher === true;
          case "UNISEXO":
            return p.unissexo === true;
          default:
            return true;
        }
      });
    }

    // Filtrar por outros (novidades, produto angola, desporto)
    if (outroSelecionado !== "TODOS") {
      produtos = produtos.filter((p) => {
        switch (outroSelecionado) {
          case "NOVIDADES":
            return p.destaque === true;
          case "PRODUTO_ANGOLA":
            return p.produtoAngola === true;
          case "DESPORTO":
            return p.desporto === true;
          default:
            return true;
        }
      });
    }

    // Ordenar por preço
    if (ordemPreco === "asc") {
      produtos.sort(
        (a, b) =>
          (a.promotionalPrice || a.price) - (b.promotionalPrice || b.price),
      );
    } else if (ordemPreco === "desc") {
      produtos.sort(
        (a, b) =>
          (b.promotionalPrice || b.price) - (a.promotionalPrice || a.price),
      );
    }

    return produtos;
  }, [
    todosProdutos,
    categoriaSelecionada,
    sexoSelecionado,
    outroSelecionado,
    ordemPreco,
    isLoading,
    filtroParceiroAtivo,
  ]);

  const handleComprar = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setModalVisible(true);
  };

  const handleAdicionarAoCarrinho = (
    quantidade: number,
    tamanho: string,
    cor: string,
  ) => {
    console.log("Adicionado ao carrinho:", {
      produto: produtoSelecionado,
      quantidade,
      tamanho,
      cor,
    });
    // Fechar o modal e permanecer na mesma tela
    setModalVisible(false);
  };

  const limparFiltros = () => {
    setCategoriaSelecionada(categoriaIdParam ? categoriaParam : "TODOS");
    setSexoSelecionado("TODOS");
    setOutroSelecionado("TODOS");
    setOrdemPreco("default");
  };

  const renderProduto = ({ item }: { item: Produto }) => (
    <View style={styles.gridCard}>
      <TouchableOpacity
        onPress={() => {
          console.log(
            "[ProductGridScreen] Clicou no produto:",
            item.id,
            item.name,
          );
          router.push({
            pathname: "/(tabs)/ProductDetailScreen",
            params: { id: item.id },
          });
        }}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.gridImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <View style={styles.gridInfo}>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(tabs)/ProductDetailScreen",
              params: { id: item.id },
            })
          }
        >
          <Text style={styles.gridNome}>{item.name}</Text>
          <Text style={styles.gridPreco}>
            {formatPrice(item.promotionalPrice || item.price)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        <Text style={styles.title}>
          {String(parceiroParam || categoriaParam).toUpperCase()}
        </Text>
        <TouchableOpacity
          onPress={() => setFiltrosVisiveis(!filtrosVisiveis)}
          style={[
            styles.filterButton,
            filtrosVisiveis && styles.filterButtonActive,
          ]}
        >
          <Ionicons
            name={filtrosVisiveis ? "close-outline" : "options-outline"}
            size={20}
            color={filtrosVisiveis ? Colors.white : Colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Filtros - só mostra se filtrosVisiveis for true */}
      {filtrosVisiveis && (
        <View style={styles.filtrosContainer}>
          <View style={styles.filtrosTopbar}>
            <Text style={styles.filtrosTitle}>FILTRAR PRODUTOS</Text>
            <TouchableOpacity
              onPress={limparFiltros}
              style={styles.limparFiltrosButton}
            >
              <Text style={styles.limparFiltrosText}>Limpar</Text>
            </TouchableOpacity>
          </View>

          {/* Categorias */}
          <View style={styles.filtroSection}>
            <Text style={styles.filtroLabel}>CATEGORIA</Text>
            <FlatList
              data={categoriasFiltro}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.filtroListContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.filtroChip,
                    categoriaSelecionada === item && styles.filtroChipActive,
                  ]}
                  onPress={() => setCategoriaSelecionada(item)}
                >
                  <Text
                    style={[
                      styles.filtroChipText,
                      categoriaSelecionada === item &&
                        styles.filtroChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Sexo */}
          <View style={styles.filtroSection}>
            <Text style={styles.filtroLabel}>SEXO</Text>
            <FlatList
              data={SEXO}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.filtroListContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.filtroChip,
                    sexoSelecionado === item && styles.filtroChipActive,
                  ]}
                  onPress={() => setSexoSelecionado(item)}
                >
                  <Text
                    style={[
                      styles.filtroChipText,
                      sexoSelecionado === item && styles.filtroChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Outros filtros */}
          <View style={styles.filtroSection}>
            <Text style={styles.filtroLabel}>OUTROS</Text>
            <FlatList
              data={OUTROS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.filtroListContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.filtroChip,
                    outroSelecionado === item && styles.filtroChipActive,
                  ]}
                  onPress={() => setOutroSelecionado(item)}
                >
                  <Text
                    style={[
                      styles.filtroChipText,
                      outroSelecionado === item && styles.filtroChipTextActive,
                    ]}
                  >
                    {item.replace("_", " ")}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Ordenar por preço */}
          <View style={styles.filtroSection}>
            <Text style={styles.filtroLabel}>ORDENAR POR</Text>
            <View style={styles.precoOrdenarContainer}>
              {ORDENAR_PRECO.map((opcao) => (
                <TouchableOpacity
                  key={opcao.value}
                  style={[
                    styles.precoOrdenarButton,
                    ordemPreco === opcao.value &&
                      styles.precoOrdenarButtonActive,
                  ]}
                  onPress={() => setOrdemPreco(opcao.value)}
                >
                  <Text
                    style={[
                      styles.precoOrdenarText,
                      ordemPreco === opcao.value &&
                        styles.precoOrdenarTextActive,
                    ]}
                  >
                    {opcao.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Contador de resultados */}
      <View style={styles.resultadosInfo}>
        <Text style={styles.resultadosText}>
          {produtosFiltrados.length} produto(s) encontrado(s)
        </Text>
      </View>

      {/* Grid de Produtos */}
      <FlatList
        data={produtosFiltrados}
        renderItem={renderProduto}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="search-outline"
              size={60}
              color={Colors.lightGray}
            />
            <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
          </View>
        }
      />

      {/* Modal Adicionar ao Carrinho */}
      <ModalAdicionarCarrinho
        visible={modalVisible}
        produto={produtoSelecionado}
        onClose={() => setModalVisible(false)}
        onAdicionar={handleAdicionarAoCarrinho}
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
  title: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filtrosContainer: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  filtrosTopbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  filtrosTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
  limparFiltrosButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  limparFiltrosText: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
    color: Colors.secondary,
  },
  filtroSection: {
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: Spacing.md,
  },
  filtroLabel: {
    fontSize: FontSizes.xs,
    fontWeight: "700",
    color: Colors.secondary,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  filtroListContent: {
    paddingRight: Spacing.xs,
  },
  filtroChip: {
    minHeight: 36,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: 0,
    backgroundColor: Colors.white,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    justifyContent: "center",
  },
  filtroChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filtroChipText: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
    color: Colors.secondary,
    letterSpacing: 0.4,
  },
  filtroChipTextActive: {
    color: Colors.white,
    fontWeight: "600",
  },
  precoOrdenarContainer: {
    flexDirection: "row",
    gap: Spacing.xs,
    flexWrap: "wrap",
  },
  precoOrdenarButton: {
    minHeight: 36,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    backgroundColor: Colors.white,
    justifyContent: "center",
  },
  precoOrdenarButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  precoOrdenarText: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
    color: Colors.secondary,
    letterSpacing: 0.4,
  },
  precoOrdenarTextActive: {
    color: Colors.white,
    fontWeight: "600",
  },
  resultadosInfo: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  resultadosText: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
  },
  gridContainer: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  gridCard: {
    width: (width - Spacing.md * 2 - Spacing.sm) / 2,
  },
  gridImage: {
    width: "100%",
    height: 180,
    backgroundColor: Colors.lightGray,
    marginBottom: Spacing.sm,
    borderRadius: 0,
  },
  gridInfo: {
    paddingHorizontal: 2,
  },
  gridNome: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  gridPreco: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    marginTop: 2,
  },
  comprarButtonSmall: {
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    borderRadius: 0,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  comprarButtonTextSmall: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontWeight: "600",
    letterSpacing: 1,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: Spacing.xxl * 2,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.lightGray,
    marginTop: Spacing.md,
  },
});
