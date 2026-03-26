/**
 * FAST - Carrinho Service
 * Serviço para gerenciar o carrinho com backend Spring Boot
 */

import { API_AUTH_TOKEN, API_BASE_URL } from "@/constants/env";
import * as SecureStore from "expo-secure-store";

// ============================================
// CONFIGURAÇÃO
// ============================================

const BASE_URL = API_BASE_URL;

// ============================================
// TIPOS
// ============================================

export interface ItemCarrinhoAPI {
  id_produto: number;
  quantidade: number;
  cor: string;
  tamanho: string;
  idVariacao: number;
}

export interface CarrinhoRequest {
  id_user: number;
  itens: ItemCarrinhoAPI[];
  subtotal: number;
  idEndereco: number;
  taxaEntrega: number;
  iva: number;
}

export interface CarrinhoResponse {
  message: string;
  idPedido?: number;
  referencia?: string;
  status: number;
  // Formato antigo com data
  data?: {
    id_pedido?: number;
    referencia?: string;
    pagamento?: {
      referencia_pagamento?: string;
      entidade?: string;
    };
  };
}

// ============================================
// HELPER: Obtém o token JWT do usuário logado
// ============================================

/**
 * Obtém o token JWT do usuário logado
 * Primeiro tenta pelo Zustand store, depois pelo SecureStore
 * @returns Token JWT ou null se não estiver logado
 */
export const getUserToken = async (): Promise<string | null> => {
  try {
    // Primeiro tentar obter do Zustand store (mais confiável em memória)
    try {
      const { useStore } = await import("@/store/useStore");
      const state = useStore.getState();

      // Verificar tanto authToken quanto isAuthenticated
      if (state.authToken && state.isAuthenticated) {
        console.log(
          "[getUserToken] Token obtido do Zustand store, isAuthenticated:",
          state.isAuthenticated,
        );
        return state.authToken;
      }

      // Se tem user mas não tem authToken ainda assim considerar autenticado
      if (state.user && state.isAuthenticated) {
        console.log(
          "[getUserToken] Usuário autenticado no Zustand, mas sem token",
        );
      }
    } catch (e) {
      console.log("[getUserToken] Erro ao obter do Zustand:", e);
    }

    // Fallback para SecureStore
    try {
      const token = await SecureStore.getItemAsync("jwt_token");
      if (!token) {
        console.log("[getUserToken] Nenhum token encontrado no SecureStore");
        return null;
      }

      const trimmedToken = token.trim();
      if (!trimmedToken) {
        console.log("[getUserToken] Token vazio encontrado");
        return null;
      }

      console.log(
        "[getUserToken] Token encontrado no SecureStore, comprimento:",
        trimmedToken.length,
      );
      return trimmedToken;
    } catch (secureError) {
      console.log("[getUserToken] SecureStore não disponível:", secureError);
    }

    return null;
  } catch (error) {
    console.error("[getUserToken] Erro ao recuperar token:", error);
    return null;
  }
};

/**
 * Verifica se o usuário está autenticado
 * @returns true se o usuário tem token válido
 */
export const isUserAuthenticated = async (): Promise<boolean> => {
  const token = await getUserToken();
  return token !== null;
};

// ============================================
// ERROS DE AUTENTICAÇÃO
// ============================================

/**
 * Erro específico para falhas de autenticação
 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Verifica se a resposta indica erro de autenticação (401)
 * @param response Fetch response object
 * @returns true se for erro de autenticação
 */
export const isAuthError = (response: Response): boolean => {
  return response.status === 401 || response.status === 403;
};

/**
 * Lida com erro de resposta da API
 * @param response Fetch response object
 * @throws AuthError se for erro de autenticação
 */
export const handleApiError = async (response: Response): Promise<void> => {
  if (isAuthError(response)) {
    // Tentar extrair mensagem de erro do corpo
    try {
      const errorData = await response.json();
      const message =
        errorData.message || "Sem autorização. Faça login para continuar.";
      throw new AuthError(message);
    } catch {
      throw new AuthError("Sem autorização. Faça login para continuar.");
    }
  }
};

/**
 * Salva o carrinho no backend
 * POST /carrinho/salvar
 *
 * @throws AuthError se o usuário não estiver autenticado (401)
 */
export const salvarCarrinho = async (
  idUser: number,
  itens: ItemCarrinhoAPI[],
  subtotal: number,
  idEndereco: number,
  taxaEntrega: number,
  iva: number,
): Promise<CarrinhoResponse> => {
  try {
    // O backend usa apenas a API_KEY estática (igual ao Postman)
    // Não usa token JWT do usuário
    const authHeader = API_AUTH_TOKEN;

    console.log("[salvarCarrinho] Authorization (igual Postman):", authHeader);
    console.log("[salvarCarrinho] ID do usuário:", idUser);

    const requestBody: CarrinhoRequest = {
      id_user: idUser,
      itens: itens,
      subtotal: subtotal,
      idEndereco: idEndereco,
      taxaEntrega: taxaEntrega,
      iva: iva,
    };

    console.log("[salvarCarrinho] Enviando carrinho:");
    console.log(JSON.stringify(requestBody, null, 2));

    console.log(
      "[salvarCarrinho] Fazendo request para:",
      `${BASE_URL}/carrinho/salvar`,
    );
    console.log("[salvarCarrinho] Authorization header:", authHeader);

    const response = await fetch(`${BASE_URL}/carrinho/salvar`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("[salvarCarrinho] Response status:", response.status);

    // Verificar erro de autenticação
    if (isAuthError(response)) {
      console.error(
        "[salvarCarrinho] ERRO 401/403 - Sem autorização do backend",
      );
      await handleApiError(response);
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[salvarCarrinho] Erro da API:", errorData);
      throw new Error(errorData.message || `Erro ${response.status}`);
    }

    const data = await response.json();
    console.log("[salvarCarrinho] Resposta:", data);
    return data;
  } catch (error: any) {
    // Se já for um AuthError, não modificar
    if (error instanceof AuthError) {
      throw error;
    }
    console.error("[salvarCarrinho] Erro:", error);
    throw new Error(error.message || "Erro ao salvar carrinho");
  }
};

/**
 * Busca o carrinho do usuário
 * GET /carrinho/{idUser}
 *
 * @throws AuthError se o usuário não estiver autenticado (401)
 */
export const getCarrinho = async (idUser: number): Promise<any> => {
  try {
    // O backend usa apenas a API_KEY estática (igual ao Postman)
    const authHeader = API_AUTH_TOKEN;

    console.log("[getCarrinho] Buscando carrinho para usuário:", idUser);
    console.log("[getCarrinho] Authorization:", authHeader);

    const response = await fetch(`${BASE_URL}/carrinho/${idUser}`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    console.log("[getCarrinho] Response status:", response.status);

    // Verificar erro de autenticação
    if (isAuthError(response)) {
      await handleApiError(response);
    }

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error: any) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error("[getCarrinho] Erro:", error);
    return [];
  }
};

export interface PagamentoResponse {
  id_compra: number;
  estado_pagamento: string;
  data_pagamento: string;
  referencia: string;
  total_pagar: string;
}

/**
 * Busca detalhes de um pedido específico
 * GET /pedido/{id}
 *
 * @throws AuthError se o usuário não estiver autenticado (401)
 */
export const getPedido = async (idPedido: number): Promise<any> => {
  try {
    // O backend usa apenas a API_KEY estática (igual ao Postman)
    const authHeader = API_AUTH_TOKEN;

    console.log("[getPedido] Buscando pedido:", idPedido);
    console.log("[getPedido] Authorization:", authHeader);

    const response = await fetch(`${BASE_URL}/pedido/${idPedido}`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    console.log("[getPedido] Response status:", response.status);

    // Verificar erro de autenticação
    if (isAuthError(response)) {
      await handleApiError(response);
    }

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const data = await response.json();
    console.log("[getPedido] Resposta:", data);
    return data;
  } catch (error: any) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error("[getPedido] Erro:", error);
    throw new Error(error.message || "Erro ao buscar pedido");
  }
};

/**
 * Verifica o estado do pagamento
 * POST /pagamento/verificar-estado?id_pedido={id}&referencia={ref}
 *
 * @param idPedido ID do pedido (obrigatório como query param)
 * @param referencia Referência de pagamento (obrigatório como query param)
 * @returns Dados do estado do pagamento
 * @throws AuthError se o usuário não estiver autenticado (401)
 */
export const verificarPagamento = async (
  idPedido: number,
  referencia: string,
): Promise<PagamentoResponse> => {
  try {
    // O backend usa apenas a API_KEY estática (igual ao Postman)
    const authHeader = API_AUTH_TOKEN;

    console.log(
      "[verificarPagamento] Verificando pagamento para id_pedido:",
      idPedido,
    );
    console.log("[verificarPagamento] Referência:", referencia);
    console.log("[verificarPagamento] Authorization:", authHeader);

    // O backend espera parâmetros como query params, não no body
    const url = `${BASE_URL}/pagamento/verificar-estado?id_pedido=${encodeURIComponent(
      idPedido,
    )}&referencia=${encodeURIComponent(referencia)}`;

    console.log("[verificarPagamento] URL:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    console.log("[verificarPagamento] Response status:", response.status);

    // Verificar erro de autenticação
    if (isAuthError(response)) {
      await handleApiError(response);
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Erro ${response.status}`);
    }

    const data = await response.json();
    console.log("[verificarPagamento] Resposta:", data);
    return data.data;
  } catch (error: any) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error("[verificarPagamento] Erro:", error);
    throw new Error(error.message || "Erro ao verificar pagamento");
  }
};

/**
 * Busca todos os itens do carrinho
 * GET /carrinho
 *
 * @throws AuthError se o usuário não estiver autenticado (401)
 */
export const getAllCarrinho = async (): Promise<any[]> => {
  try {
    // O backend usa apenas a API_KEY estática (igual ao Postman)
    const authHeader = API_AUTH_TOKEN;

    console.log("[getAllCarrinho] Buscando todos os itens do carrinho");
    console.log("[getAllCarrinho] Authorization:", authHeader);

    const response = await fetch(`${BASE_URL}/carrinho`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    console.log("[getAllCarrinho] Response status:", response.status);

    // Verificar erro de autenticação
    if (isAuthError(response)) {
      await handleApiError(response);
    }

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const data = await response.json();
    console.log("[getAllCarrinho] Resposta:", data);
    return data.data || [];
  } catch (error: any) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error("[getAllCarrinho] Erro:", error);
    return [];
  }
};

export default {
  salvarCarrinho,
  getCarrinho,
  getAllCarrinho,
  getPedido,
  verificarPagamento,
};
