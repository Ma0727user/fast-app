/**
 * FAST - Produto Service
 * Serviço para consumo de produtos, categorias e banners
 */

import { API_AUTH_TOKEN, API_BASE_URL } from "@/constants/env";
import * as SecureStore from "expo-secure-store";

// ============================================
// CONFIGURAÇÃO
// ============================================

const BASE_URL = API_BASE_URL;
const AUTH_TOKEN = API_AUTH_TOKEN;

// ============================================
// TIPOS
// ============================================

export interface Categoria {
  num_produtos: number;
  id_categoria: number;
  imagem_categoria: string;
  nome_categoria: string;
}

export interface Variacao {
  id: number;
  cor: string;
  tamanho: string;
  preco: number;
  stock: number;
}

export interface ProdutoDetalhe {
  id_produto: number;
  nome_produto: string;
  descricao: string;
  peso: string | null;
  tamanho: string | null;
  modelo: string | null;
  imagem1: string;
  imagem2: string;
  imagem3: string;
  imagem4: string;
  id_categoriafk: number;
  id_subcategoriafk: number;
  last_update: string;
  subtitulo: string;
  preco: number;
  preco_promo: number | null;
  id_lojafk: number;
  qtd_stock: number;
  id_usuariofk: number;
  data_registo: string;
  nome_criador: string;
  estado_produto: string;
  Destaque: string;
  promocao: string;
  variacoes: Variacao[];
}

export interface ProdutoDetalheResponse {
  produto: ProdutoDetalhe;
}

export interface Banner {
  imagem: string;
  link: string;
  id_banner: number;
  nome_banner: string;
}

export interface HomeData {
  categorias: Categoria[];
  banners: Banner[];
}

export interface Produto {
  id: number;
  nome: string;
  preco: number;
  imagem_url: string;
  descricao?: string;
  categoria_id?: number;
  stock?: number;
}

// Tipo que o app espera (formato diferente da API)
export interface ProdutoApp {
  id: string;
  name: string;
  price: number;
  promotionalPrice?: number;
  image: string;
  category?: string;
}

// Mapper para converter produto da API para formato do app
const mapToProdutoApp = (produto: Produto): ProdutoApp => ({
  id: String(produto.id),
  name: produto.nome,
  price: produto.preco,
  image: produto.imagem_url,
  category: produto.categoria_id ? String(produto.categoria_id) : undefined,
});

// ============================================
// SERVIÇOS
// ============================================

/**
 * Busca dados da home (categorias e banners)
 */
export const getHomeData = async (): Promise<HomeData> => {
  try {
    const response = await fetch(`${BASE_URL}/principal`, {
      method: "GET",
      headers: {
        Authorization: AUTH_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      throw new Error("Dados não encontrados");
    }

    return data.data[0];
  } catch (error: any) {
    console.error("Erro ao buscar dados da home:", error);
    throw new Error(error.message || "Erro ao carregar dados");
  }
};

/**
 * Lista todos os produtos
 * @param params - Parâmetros opcionais (tamanho = número de produtos)
 */
export const getProdutos = async (params?: {
  tamanho?: number;
}): Promise<ProdutoApp[]> => {
  try {
    const token = await SecureStore.getItemAsync("jwt_token");

    let url = `${BASE_URL}/produtos`;
    if (params?.tamanho) {
      url += `?tamanho=${params.tamanho}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: token || AUTH_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const data = await response.json();
    return (data.data || []).map(mapToProdutoApp);
  } catch (error: any) {
    console.error("Erro ao buscar produtos:", error);
    throw new Error(error.message || "Erro ao carregar produtos");
  }
};

/**
 * Busca produto por ID
 */
export const getProdutoById = async (id: number): Promise<any> => {
  try {
    const token = await SecureStore.getItemAsync("jwt_token");

    console.log("[getProdutoById] Buscando produto ID:", id);
    console.log("[getProdutoById] URL:", `${BASE_URL}/produtos/${id}`);

    const response = await fetch(`${BASE_URL}/produtos/${id}`, {
      method: "GET",
      headers: {
        Authorization: token || AUTH_TOKEN,
        "Content-Type": "application/json",
      },
    });

    console.log("[getProdutoById] Response status:", response.status);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Produto não encontrado");
      }
      throw new Error(`Erro ${response.status}`);
    }

    const apiResponse = await response.json();
    console.log(
      "[getProdutoById] Dados brutos:",
      JSON.stringify(apiResponse, null, 2),
    );

    // A API retorna diferentes formatos:
    // 1. { detalheproduto: {...}, message, status }
    // 2. { data: { campos do produto }, message, status }
    // Precisamos verificar qual formato existe

    let produtoData = apiResponse.detalheproduto || apiResponse.data;

    if (!produtoData) {
      throw new Error("Produto não encontrado");
    }

    // Normalizar campos do produto
    const produtoNormalizado = {
      id_produto: produtoData.id_produto || produtoData.id,
      nome_produto: produtoData.nome_produto || produtoData.nome,
      descricao: produtoData.descricao || "",
      peso: produtoData.peso || null,
      tamanho: produtoData.tamanho || null,
      modelo: produtoData.modelo || null,
      imagem1: produtoData.imagem || produtoData.imagem1 || "",
      imagem2: produtoData.imagem2 || "",
      imagem3: produtoData.imagem3 || "",
      imagem4: produtoData.imagem4 || "",
      id_categoriafk:
        produtoData.id_categoriafk || produtoData.categoria_id || 0,
      id_subcategoriafk: produtoData.id_subcategoriafk || 0,
      last_update: produtoData.last_update || produtoData.data_registo || "",
      subtitulo: produtoData.subtitulo || produtoData.subttulo || "",
      preco: produtoData.preco || 0,
      preco_promo: produtoData.preco_promo || null,
      id_lojafk: produtoData.id_lojafk || 0,
      qtd_stock: produtoData.qtd_stock || produtoData.stock || 0,
      id_usuariofk: produtoData.id_usuariofk || 0,
      data_registo: produtoData.data_registo || "",
      nome_criador: produtoData.nome_criador || "",
      estado_produto: produtoData.estado_produto || "",
      Destaque: produtoData.Destaque || produtoData.destaque || "",
      promocao: produtoData.promocao || produtoData.promocao || "",
      // Normalizar variações - a API retorna id_variacao, preco, stock podem não existir
      variacoes: (produtoData.variacoes || []).map((v: any) => ({
        id: v.id_variacao || v.id,
        cor: v.cor || "",
        tamanho: v.tamanho || "",
        preco: v.preco || produtoData.preco || 0,
        stock: v.stock || v.qtd_stock || 0,
      })),
    };

    console.log("[getProdutoById] Produto normalizado:", produtoNormalizado);
    return produtoNormalizado;
  } catch (error: any) {
    console.error("[getProdutoById] Erro:", error);
    throw new Error(error.message || "Erro ao carregar produto");
  }
};

/**
 * Busca produtos por categoria
 */
export const getProdutosPorCategoria = async (
  categoriaId: number,
): Promise<Produto[]> => {
  try {
    const token = await SecureStore.getItemAsync("jwt_token");

    console.log(
      "[getProdutosPorCategoria] Buscando produtos para categoria ID:",
      categoriaId,
    );
    console.log(
      "[getProdutosPorCategoria] URL:",
      `${BASE_URL}/produtos/categoria/${categoriaId}`,
    );

    const response = await fetch(
      `${BASE_URL}/produtos/categoria/${categoriaId}`,
      {
        method: "GET",
        headers: {
          Authorization: token || AUTH_TOKEN,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("[getProdutosPorCategoria] Response status:", response.status);

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const data = await response.json();
    console.log(
      "[getProdutosPorCategoria] Dados recebidos:",
      JSON.stringify(data, null, 2).substring(0, 500),
    );
    return data.data || [];
  } catch (error: any) {
    console.error("[getProdutosPorCategoria] Erro:", error);
    throw new Error(error.message || "Erro ao carregar produtos");
  }
};

/**
 * Busca produtos em promoção
 */
export const getProdutosPromocao = async (): Promise<ProdutoApp[]> => {
  try {
    const token = await SecureStore.getItemAsync("jwt_token");

    const response = await fetch(`${BASE_URL}/produtos/promocao`, {
      method: "GET",
      headers: {
        Authorization: token || AUTH_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const data = await response.json();
    return (data.data || []).map(mapToProdutoApp);
  } catch (error: any) {
    console.error("Erro ao buscar promoções:", error);
    throw new Error(error.message || "Erro ao carregar promoções");
  }
};

/**
 * Interface para resultados de pesquisa
 */
export interface PesquisaResult {
  produtos: {
    id_produto: number;
    nome_produto: string;
    preco: number;
    preco_promo: number | null;
    imagem: string;
    nome_categoria: string;
  }[];
  categorias: {
    id_categoria: number;
    nome_categoria: string;
    imagem_categoria: string;
  }[];
  subcategorias: {
    id_subcategoria: number;
    nome_subcategoria: string;
    id_categoriafk: number;
  }[];
}

/**
 * Busca produtos, categorias e subcategorias por termo de pesquisa
 */
export const pesquisar = async (query: string): Promise<PesquisaResult> => {
  try {
    const token = await SecureStore.getItemAsync("jwt_token");

    const response = await fetch(
      `${BASE_URL}/pesquisa?q=${encodeURIComponent(query)}`,
      {
        method: "GET",
        headers: {
          Authorization: token || AUTH_TOKEN,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const data = await response.json();
    return {
      produtos: data.produtos || [],
      categorias: data.categorias || [],
      subcategorias: data.subcategorias || [],
    };
  } catch (error: any) {
    console.error("Erro na pesquisa:", error);
    throw new Error(error.message || "Erro ao pesquisar");
  }
};

// Alias para compatibilidade
export const getProdutosPromocionais = getProdutosPromocao;

export default {
  getHomeData,
  getProdutos,
  getProdutoById,
  getProdutosPorCategoria,
  getProdutosPromocao,
  pesquisar,
};
