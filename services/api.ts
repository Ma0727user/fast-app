/**
 * FAST - API Configuration
 * Configuração Axios para comunicação com backend Spring Boot
 */

import { API_AUTH_TOKEN, API_BASE_URL } from "@/constants/env";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

// ============================================
// CONFIGURAÇÃO BASE
// ============================================

// URL base do backend Spring Boot
const BASE_URL = API_BASE_URL;

// Token de autorização fixo do backend
const AUTH_TOKEN = API_AUTH_TOKEN;

// Timeout das requisições (60 segundos - para redes móveis)
const TIMEOUT = 60000;

// ============================================
// CRIAÇÃO DA INSTÂNCIA AXIOS
// ============================================

const api = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Authorization: AUTH_TOKEN,
  },
});

// ============================================
// INTERCEPTADORES
// ============================================

api.interceptors.request.use(
  async (config: any) => {
    try {
      const token = await SecureStore.getItemAsync("jwt_token");
      if (token && config.headers) {
        // Usar token diretamente sem prefixo Bearer
        config.headers.Authorization = token;
      }
    } catch (error) {
      console.error("Erro ao recuperar token:", error);
    }
    return config;
  },
  (error: any) => Promise.reject(error),
);

api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          console.error("Erro 401: Não autorizado");
          handleUnauthorized();
          break;
        case 403:
          console.error("Erro 403: Acesso proibido");
          break;
        case 404:
          console.error("Erro 404: Recurso não encontrado");
          break;
        case 500:
          console.error("Erro 500: Erro interno do servidor");
          break;
        default:
          console.error(`Erro ${status}:`, data);
      }
    } else if (error.request) {
      console.error("Erro de conexão: Servidor indisponível");
    } else {
      console.error("Erro de configuração:", error.message);
    }
    return Promise.reject(error);
  },
);

// ============================================
// TRATAMENTO DE ERROS
// ============================================

const handleUnauthorized = async () => {
  try {
    await SecureStore.deleteItemAsync("jwt_token");
    await SecureStore.deleteItemAsync("refresh_token");
  } catch (error) {
    console.error("Erro ao limpar tokens:", error);
  }
};

// ============================================
// TIPOS DE ERRO API
// ============================================

export interface ApiError {
  message: string;
  code?: string;
  timestamp?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// ============================================
// EXPORTS
// ============================================

export { api, AUTH_TOKEN, BASE_URL };

export default api;
