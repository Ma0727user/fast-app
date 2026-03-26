/**
 * FAST - Configurações de Ambiente
 * Configurações centralizadas para a aplicação
 *
 * NOTA: Para produção, considere usar:
 * - expo-secure-store para dados sensíveis (tokens JWT do usuário)
 * - Variáveis de ambiente do Expo (Constants.expoConfig.extra)
 * - Backend proxy para ocultar chaves de API
 */

import Constants from "expo-constants";

// ============================================
// CONFIGURAÇÃO DA API
// ============================================

// URL base da API
export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl || "https://fast.appteste.info/v1";

// Chave de autorização para a API (Header Authorization)
// Esta é uma chave pública usada nas requisições ao backend
// Não confunda com o token JWT de autenticação do usuário
export const API_AUTH_TOKEN =
  Constants.expoConfig?.extra?.apiAuthToken ||
  "78bf33c31f864f639bb0ddfdddfb4d93";

// ============================================
// CONFIGURAÇÕES DO APP
// ============================================

export const APP_CONFIG = {
  // Tempo de expiração do token JWT (7 dias em ms)
  tokenExpiryMs: 7 * 24 * 60 * 60 * 1000,

  // Tempo mínimo antes de expirar para fazer refresh (1 dia em ms)
  tokenRefreshThresholdMs: 24 * 60 * 60 * 1000,

  // Intervalo padrão para polling de status (15 segundos)
  defaultPollingIntervalMs: 15000,
};

// ============================================
// STORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
  jwtToken: "jwt_token",
  tokenExpiry: "token_expiry",
  userData: "user_data",
};

// ============================================
// PLACEHOLDERS
// ============================================

export const PLACEHOLDERS = {
  // URL placeholder para imagens não disponíveis
  imagePlaceholder: "https://via.placeholder.com/300x400.png?text=Sem+Foto",

  // Entidade de pagamento padrão (Multibanco)
  defaultEntity: "012888",
};

export default {
  API_BASE_URL,
  API_AUTH_TOKEN,
  APP_CONFIG,
  STORAGE_KEYS,
  PLACEHOLDERS,
};
