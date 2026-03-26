/**
 * FAST - Auth Service
 * Serviço de autenticação com backend Spring Boot
 * Usando fetch em vez de axios para melhor compatibilidade com Expo Go
 */

import {
  API_AUTH_TOKEN,
  API_BASE_URL,
  APP_CONFIG,
  PLACEHOLDERS,
  STORAGE_KEYS,
} from "@/constants/env";
import * as SecureStore from "expo-secure-store";

// ============================================
// CONFIGURAÇÃO
// ============================================

const BASE_URL = API_BASE_URL;
const TOKEN_KEY = STORAGE_KEYS.jwtToken;
const USER_KEY = STORAGE_KEYS.userData;
const TOKEN_EXPIRY_KEY = STORAGE_KEYS.tokenExpiry;

// Tempo de expiração do token: 7 dias em milissegundos
const TOKEN_EXPIRY_MS = APP_CONFIG.tokenExpiryMs;

// Tempo mínimo antes de expirar para fazer refresh (1 dia)
const TOKEN_REFRESH_THRESHOLD_MS = APP_CONFIG.tokenRefreshThresholdMs;

// Token de autorização fixo do backend
const AUTH_TOKEN = API_AUTH_TOKEN;

// URL placeholder para imagens não disponíveis
const IMAGE_PLACEHOLDER = PLACEHOLDERS.imagePlaceholder;

// ============================================
// HELPER: Sanitiza URL de imagem
// ============================================

interface ImageResult {
  url: string;
  status: "disponivel" | "indisponivel";
}

/**
 * Sanitiza URL de imagem
 * - Verifica se URL é válida
 * - Converte URLs relativas para absolutas
 * - Retorna placeholder em caso de erro
 */
export function sanitizeImageUrl(url: string | null | undefined): ImageResult {
  // Verifica se URL é nula, vazia ou contém mensagem de erro
  if (!url || url === "" || url === "null" || url === "undefined") {
    return { url: IMAGE_PLACEHOLDER, status: "indisponivel" };
  }

  // Detecta mensagens de erro comuns
  const errorPatterns = ["erro", "busca", "error", "not found", "null"];
  const lowerUrl = url.toLowerCase();
  if (errorPatterns.some((pattern) => lowerUrl.includes(pattern))) {
    return { url: IMAGE_PLACEHOLDER, status: "indisponivel" };
  }

  // Verifica se URL é relativa (começa com /)
  if (url.startsWith("/")) {
    // Converte para URL absoluta
    return { url: `${BASE_URL}${url}`, status: "disponivel" };
  }

  // URL já é absoluta
  return { url, status: "disponivel" };
}

// ============================================
// HELPER: Normaliza respostas da API
// ============================================

interface ApiResponse<T> {
  status: "sucesso" | "erro";
  encontrado: boolean;
  mensagem: string;
  dados: T | null;
}

/**
 * Normaliza a resposta da API
 * Em caso de erro, retorna objeto amigável sem expor erros técnicos
 */
function normalizeApiResponse<T>(data: any, status: number): ApiResponse<T> {
  // Verifica se há erro HTTP
  if (status >= 400 || !data) {
    return {
      status: "sucesso",
      encontrado: false,
      mensagem: "Informação não encontrada",
      dados: null,
    };
  }

  // Verifica se há dados válidos
  if (data.data && Array.isArray(data.data) && data.data.length > 0) {
    return {
      status: "sucesso",
      encontrado: true,
      mensagem: data.message || "Success",
      dados: data.data,
    };
  }

  // Verifica mensagem de erro genérica
  const errorMessages = ["Erro em busca", "null", "undefined", "erro"];
  if (
    data.message &&
    errorMessages.some((msg) =>
      data.message.toLowerCase().includes(msg.toLowerCase()),
    )
  ) {
    return {
      status: "sucesso",
      encontrado: false,
      mensagem: "Informação não encontrada",
      dados: null,
    };
  }

  // Caso padrão: sem dados
  return {
    status: "sucesso",
    encontrado: false,
    mensagem: data.message || "Informação não encontrada",
    dados: null,
  };
}

// ============================================
// TIPOS
// ============================================

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo: string;
  addresses: Address[];
}

export interface Address {
  id: string;
  street: string;
  city: string;
  province: string;
  reference?: string;
}

// ============================================
// SERVIÇOS
// ============================================

/**
 * Realiza login no backend Spring Boot
 */
export const login = async (
  telemovel: string,
  password: string,
): Promise<User> => {
  try {
    // Criar URLSearchParams para formato form-urlencoded
    const body = new URLSearchParams();
    body.append("telemovel", telemovel);
    body.append("password", password);

    console.log("Fazendo login para:", telemovel);
    console.log("URL:", `${BASE_URL}/auth/login`);

    // Fazer request usando fetch
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        Authorization: AUTH_TOKEN,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    console.log("Response status:", response.status);

    // Verificar status da resposta
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          "Credenciais inválidas. Verifique o telemóvel e senha.",
        );
      } else if (response.status === 403) {
        throw new Error("Acesso proibido. Contacte o suporte.");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      }
    }

    // Parsear resposta
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data));

    // Verificarprimeiro mensagem de erro na resposta
    if (data.message && data.message.toLowerCase().includes("falhou")) {
      throw new Error(
        data.message || "Credenciais inválidas. Verifique o telemóvel e senha.",
      );
    }

    // Verificar se a resposta contém dados do usuário
    // Suporta tanto array (login) quanto objeto (registro)
    let userData;
    if (Array.isArray(data.data)) {
      if (data.data.length === 0) {
        throw new Error(data.message || "Login falhou! Sem dados do usuário.");
      }
      userData = data.data[0];
    } else if (data.data && typeof data.data === "object") {
      userData = data.data;
    } else {
      throw new Error(data.message || "Login falhou! Dados inválidos.");
    }

    // O token JWT pode ser gerado localmente baseado no ID do usuário
    const token = `${AUTH_TOKEN}_${userData.id}_${Date.now()}`;

    // Salvar token com data de expiração (7 dias)
    const expiryDate = Date.now() + TOKEN_EXPIRY_MS;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, String(expiryDate));

    // Mapear dados do usuário para formato do app
    const user: User = {
      id: String(userData.id),
      name: userData.nome,
      email: userData.email || "",
      phone: userData.telefone,
      photo: userData.foto,
      addresses: [],
    };

    // Armazenar dados do usuário
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

    console.log("Login bem-sucedido para:", user.name);
    return user;
  } catch (error: any) {
    console.error("Erro no login:", error);

    // Tratamento de erros específico para autenticação
    if (error.message.includes("Credenciais")) {
      throw error;
    } else if (error.message.includes("Network request failed")) {
      throw new Error("Erro de conexão. Verifique sua internet.");
    }
    throw new Error(error.message || "Erro ao realizar login");
  }
};

/**
 * Realiza registro de novo usuário no backend Spring Boot
 * Retorna os dados do usuário para verificação posterior
 */
export const register = async (
  nome: string,
  telemovel: string,
  password: string,
): Promise<{ success: boolean; message: string; userId?: number }> => {
  try {
    // Criar URLSearchParams para formato form-urlencoded
    const body = new URLSearchParams();
    body.append("nome", nome);
    body.append("telemovel", telemovel);
    body.append("password", password);

    console.log("Fazendo registro para:", telemovel);
    console.log("URL:", `${BASE_URL}/auth/registro`);

    // Fazer request usando fetch
    const response = await fetch(`${BASE_URL}/auth/registro`, {
      method: "POST",
      headers: {
        Authorization: AUTH_TOKEN,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    console.log("Response status:", response.status);

    // Verificar status da resposta
    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Dados inválidos. Verifique os campos.",
        );
      } else if (response.status === 409) {
        throw new Error("Este telemóvel já está registado.");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      }
    }

    // Parsear resposta
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data));

    // Verificar se a resposta contém dados do usuário
    if (!data.data || typeof data.data !== "object") {
      return {
        success: true,
        message:
          data.message || "Registro realizado! Verifique o seu telemóvel.",
        userId: undefined,
      };
    }

    const userData = data.data;

    // Guardar os dados temporários para verificação
    await SecureStore.setItemAsync(
      "pending_user",
      JSON.stringify({
        id: userData.id,
        nome: userData.nome,
        telemovel: userData.telemovel,
        foto: userData.foto,
      }),
    );

    return {
      success: true,
      message: data.message || "Registro realizado! Verifique o seu telemóvel.",
      userId: userData.id,
    };
  } catch (error: any) {
    console.error("Erro no registro:", error);

    // Tratamento de erros específico para autenticação
    if (error.message.includes("já está registado")) {
      throw error;
    } else if (error.message.includes("Network request failed")) {
      throw new Error("Erro de conexão. Verifique sua internet.");
    }
    throw new Error(error.message || "Erro ao realizar registro");
  }
};

/**
 * Verifica o código enviado por SMS
 */
export const verifyCode = async (
  telemovel: string,
  codigo: string,
): Promise<User> => {
  try {
    // Criar URLSearchParams para formato form-urlencoded
    const body = new URLSearchParams();
    body.append("telemovel", telemovel);
    body.append("codigo", codigo);

    console.log("Verificando código para:", telemovel);
    console.log("URL:", `${BASE_URL}/auth/verifica-codigo`);

    // Fazer request usando fetch
    const response = await fetch(`${BASE_URL}/auth/verifica-codigo`, {
      method: "POST",
      headers: {
        Authorization: AUTH_TOKEN,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    console.log("Response status:", response.status);

    // Verificar status da resposta
    if (!response.ok) {
      if (response.status === 400 || response.status === 401) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Código inválido.");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      }
    }

    // Parsear resposta
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data));

    // Verificar se a resposta contém dados do usuário
    if (!data.data || typeof data.data !== "object") {
      throw new Error(data.message || "Verificação falhou!");
    }

    const userData = data.data;

    // O token JWT pode ser gerado localmente baseado no ID do usuário
    const token = `${AUTH_TOKEN}_${userData.id}_${Date.now()}`;

    // Salvar token com data de expiração (7 dias)
    const expiryDate = Date.now() + TOKEN_EXPIRY_MS;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, String(expiryDate));

    // Mapear dados do usuário para formato do app
    const user: User = {
      id: String(userData.id || userData.id_user),
      name: userData.nome,
      email: userData.email || "",
      phone: userData.telemovel || userData.telefone,
      photo: userData.foto,
      addresses: [],
    };

    // Armazenar dados do usuário
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

    // Limpar dados temporários
    await SecureStore.deleteItemAsync("pending_user");

    console.log("Verificação bem-sucedida para:", user.name);
    return user;
  } catch (error: any) {
    console.error("Erro na verificação:", error);

    if (error.message.includes("Network request failed")) {
      throw new Error("Erro de conexão. Verifique sua internet.");
    }
    throw new Error(error.message || "Erro ao verificar código");
  }
};

/**
 * Envia código de recuperação de senha para o telemóvel
 * POST /auth/envia-codigo-recuperacao
 */
export const sendRecoveryCode = async (
  telemovel: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    // Criar URLSearchParams para formato form-urlencoded
    const body = new URLSearchParams();
    body.append("telemovel", telemovel);

    console.log("Enviando código de recuperação para:", telemovel);
    console.log("URL:", `${BASE_URL}/auth/envia-codigo-recuperacao`);

    // Fazer request usando fetch
    const response = await fetch(`${BASE_URL}/auth/envia-codigo-recuperacao`, {
      method: "POST",
      headers: {
        Authorization: AUTH_TOKEN,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    console.log("Response status:", response.status);

    // Parsear resposta
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data));

    // O endpoint retorna sempre 200, mas a mensagem indica sucesso ou fracasso
    if (data.message && data.message.includes("verificado")) {
      return {
        success: true,
        message: data.message,
      };
    } else {
      return {
        success: false,
        message: data.message || "Número de telemóvel não verificado",
      };
    }
  } catch (error: any) {
    console.error("Erro ao enviar código de recuperação:", error);

    if (error.message.includes("Network request failed")) {
      throw new Error("Erro de conexão. Verifique sua internet.");
    }
    throw new Error(error.message || "Erro ao enviar código de recuperação");
  }
};

/**
 * Verifica o código de recuperação de senha
 * POST /auth/verifica-codigo-recuperacao
 */
export const verifyRecoveryCode = async (
  telemovel: string,
  codigo: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    // Criar URLSearchParams para formato form-urlencoded
    const body = new URLSearchParams();
    body.append("telemovel", telemovel);
    body.append("codigo", codigo);

    console.log("Verificando código de recuperação para:", telemovel);
    console.log("URL:", `${BASE_URL}/auth/verifica-codigo-recuperacao`);

    // Fazer request usando fetch
    const response = await fetch(
      `${BASE_URL}/auth/verifica-codigo-recuperacao`,
      {
        method: "POST",
        headers: {
          Authorization: AUTH_TOKEN,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      },
    );

    console.log("Response status:", response.status);

    // Verificar status da resposta
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Código inválido.");
    }

    // Parsear resposta
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data));

    return {
      success: true,
      message: data.message || "Código verificado com sucesso",
    };
  } catch (error: any) {
    console.error("Erro na verificação de recuperação:", error);

    if (error.message.includes("Network request failed")) {
      throw new Error("Erro de conexão. Verifique sua internet.");
    }
    throw new Error(error.message || "Erro ao verificar código");
  }
};

/**
 * Edita o perfil do usuário
 * PUT /auth/editar-perfil
 */
export const updateProfile = async (
  userId: number,
  nome: string,
  email: string,
  telemovel: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    // Criar URLSearchParams para formato form-urlencoded
    const body = new URLSearchParams();
    body.append("id", String(userId));
    body.append("nome", nome);
    body.append("email", email);
    body.append("telemovel", telemovel);

    console.log("Atualizando perfil para:", telemovel);
    console.log("URL:", `${BASE_URL}/auth/editar-perfil`);

    // Fazer request usando fetch
    const response = await fetch(`${BASE_URL}/auth/editar-perfil`, {
      method: "PUT",
      headers: {
        Authorization: AUTH_TOKEN,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    console.log("Response status:", response.status);

    // Verificar status da resposta
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erro ao atualizar perfil.");
    }

    // Parsear resposta
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data));

    return {
      success: true,
      message: data.message || "Perfil atualizado com sucesso",
    };
  } catch (error: any) {
    console.error("Erro ao atualizar perfil:", error);

    if (error.message.includes("Network request failed")) {
      throw new Error("Erro de conexão. Verifique sua internet.");
    }
    throw new Error(error.message || "Erro ao atualizar perfil");
  }
};

export interface StoreData {
  taxa_servico: string;
  iban: string;
  nome_loja: string;
  titular: string;
}

export interface DeliveryZone {
  id_zona: number;
  nome_zona: string;
  preco: string;
}

export interface FaqItem {
  pergunta: string;
  resposta: string;
}

export interface Banner {
  id_banner: number;
  nome_banner: string;
  imagem: string;
}

export interface Categoria {
  id_categoria: number;
  nome_categoria: string;
  imagem_categoria: string;
  num_produtos: number;
}

export interface Produto {
  id_produto: number;
  nome_produto: string;
  descricao: string;
  preco: number;
  preco_promo: number | null;
  promocao: string;
  destaque: string;
  imagem: string;
  qtd_stock: number;
}

export interface HomeData {
  banners: Banner[];
  categorias: Categoria[];
  produtos_normais: Produto[];
  lista_novidades: Produto[];
}

/**
 * Busca dados da loja
 * GET /dadosloja
 */
export const getStoreData = async (): Promise<StoreData | null> => {
  try {
    console.log("Buscando dados da loja...");
    console.log("URL:", `${BASE_URL}/dadosloja`);

    // Fazer request usando fetch
    const response = await fetch(`${BASE_URL}/dadosloja`, {
      method: "GET",
      headers: {
        Authorization: AUTH_TOKEN,
      },
    });

    console.log("Response status:", response.status);

    // Verificar status da resposta
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erro ao buscar dados da loja.");
    }

    // Parsear resposta
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data));

    // Verificar se a resposta contém dados
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0] as StoreData;
    }

    return null;
  } catch (error: any) {
    console.error("Erro ao buscar dados da loja:", error);

    if (error.message.includes("Network request failed")) {
      throw new Error("Erro de conexão. Verifique sua internet.");
    }
    throw new Error(error.message || "Erro ao buscar dados da loja");
  }
};

/**
 * Busca zonas de entrega disponíveis
 * GET /zonasentrega
 */
export const getDeliveryZones = async (): Promise<DeliveryZone[]> => {
  try {
    console.log("Buscando zonas de entrega...");
    console.log("URL:", `${BASE_URL}/zonasentrega`);

    // Fazer request usando fetch
    const response = await fetch(`${BASE_URL}/zonasentrega`, {
      method: "GET",
      headers: {
        Authorization: AUTH_TOKEN,
      },
    });

    console.log("Response status:", response.status);

    // Verificar status da resposta
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erro ao buscar zonas de entrega.");
    }

    // Parsear resposta
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data));

    // Verificar se a resposta contém dados
    if (data.data && Array.isArray(data.data)) {
      return data.data as DeliveryZone[];
    }

    return [];
  } catch (error: any) {
    console.error("Erro ao buscar zonas de entrega:", error);

    if (error.message.includes("Network request failed")) {
      throw new Error("Erro de conexão. Verifique sua internet.");
    }
    throw new Error(error.message || "Erro ao buscar zonas de entrega");
  }
};

/**
 * Busca perguntas frequentes
 * GET /perguntasfrequentes
 */
export const getFaqs = async (): Promise<FaqItem[]> => {
  try {
    console.log("Buscando perguntas frequentes...");
    console.log("URL:", `${BASE_URL}/perguntasfrequentes`);

    // Fazer request usando fetch
    const response = await fetch(`${BASE_URL}/perguntasfrequentes`, {
      method: "GET",
      headers: {
        Authorization: AUTH_TOKEN,
      },
    });

    console.log("Response status:", response.status);

    // Verificar status da resposta
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erro ao buscar perguntas.");
    }

    // Parsear resposta
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data));

    // Verificar se a resposta contém dados
    if (data.data && Array.isArray(data.data)) {
      return data.data as FaqItem[];
    }

    return [];
  } catch (error: any) {
    console.error("Erro ao buscar perguntas frequentes:", error);
    // Retorna array vazio em caso de erro para não mostrar erro
    return [];
  }
};

/**
 * Busca dados principais para a tela Home
 * GET /listaprincipal
 */
export const getHomeData = async (): Promise<HomeData | null> => {
  try {
    console.log("[getHomeData] Buscando dados da home...");
    console.log("[getHomeData] URL:", `${BASE_URL}/listaprincipal`);

    // Fazer request usando fetch
    const response = await fetch(`${BASE_URL}/listaprincipal`, {
      method: "GET",
      headers: {
        Authorization: AUTH_TOKEN,
      },
    });

    console.log("[getHomeData] Response status:", response.status);

    // Verificar status da resposta
    if (!response.ok) {
      const errorData = await response.json();
      console.log("[getHomeData] Erro response:", errorData);
      throw new Error(errorData.message || "Erro ao buscar dados.");
    }

    // Parsear resposta
    const data = await response.json();
    console.log(
      "[getHomeData] Response data (raw):",
      JSON.stringify(data, null, 2).substring(0, 500),
    );
    console.log(
      "[getHomeData] data.data keys:",
      data.data ? Object.keys(data.data) : "null",
    );

    // Verificar se a resposta contém dados
    if (data.data) {
      console.log(
        "[getHomeData] categorias no data.data:",
        data.data.categorias
          ? `${data.data.categorias.length} itens`
          : "undefined",
      );
      return data.data as HomeData;
    }

    console.log("[getHomeData] Sem dados - retornando null");
    return null;
  } catch (error: any) {
    console.error("[getHomeData] Erro ao buscar dados da home:", error);
    // Retorna null em caso de erro
    return null;
  }
};

/**
 * Realiza logout removendo tokens do SecureStore
 */
export const logout = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    throw error;
  }
};

/**
 * Verifica se o token ainda é válido (não expirou)
 */
export const isTokenValid = async (): Promise<boolean> => {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) return false;

    const expiryStr = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
    if (!expiryStr) return false;

    const expiryDate = parseInt(expiryStr, 10);
    const agora = Date.now();

    // Verificar se não expirou
    if (agora > expiryDate) {
      // Token expirado, limpar
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erro ao verificar validade do token:", error);
    return false;
  }
};

/**
 * Verifica se o token está perto de expirar e renova automaticamente
 * Chamado ao abrir o app para estender a sessão do usuário
 * @returns true se token foi refreshado ou ainda válido
 */
export const checkAndRefreshToken = async (): Promise<boolean> => {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) return false;

    const expiryStr = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
    if (!expiryStr) return false;

    const expiryDate = parseInt(expiryStr, 10);
    const agora = Date.now();
    const tempoRestante = expiryDate - agora;

    // Se já expirou, limpar e retornar false
    if (tempoRestante <= 0) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      return false;
    }

    // Se está perto de expirar (menos de 1 dia), estender automaticamente
    if (tempoRestante < TOKEN_REFRESH_THRESHOLD_MS) {
      const novaDataExpiracao = agora + TOKEN_EXPIRY_MS;
      await SecureStore.setItemAsync(
        TOKEN_EXPIRY_KEY,
        String(novaDataExpiracao),
      );
      console.log("Token automaticamente estendido por mais 7 dias");
    }

    return true;
  } catch (error) {
    console.error("Erro ao verificar/atualizar token:", error);
    return false;
  }
};

/**
 * Verifica se o usuário está autenticado (com validação de expiração)
 */
export const isAuthenticated = async (): Promise<boolean> => {
  return await isTokenValid();
};

/**
 * Recupera o token JWT atual
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error("Erro ao recuperar token:", error);
    return null;
  }
};

/**
 * Recupera os dados do usuário logado
 */
export const getUser = async (): Promise<User | null> => {
  try {
    const userData = await SecureStore.getItemAsync(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Erro ao recuperar dados do usuário:", error);
    return null;
  }
};

/**
 * Atualiza os dados do usuário no storage
 */
export const updateUser = async (user: User): Promise<void> => {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Erro ao atualizar dados do usuário:", error);
    throw error;
  }
};

export default {
  login,
  register,
  verifyCode,
  logout,
  sendRecoveryCode,
  verifyRecoveryCode,
  updateProfile,
  getStoreData,
  getDeliveryZones,
  getFaqs,
  getHomeData,
  sanitizeImageUrl,
  isAuthenticated,
  isTokenValid,
  checkAndRefreshToken,
  getToken,
  getUser,
  updateUser,
};
