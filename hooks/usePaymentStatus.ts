/**
 * FAST - usePaymentStatus Hook
 * Hook personalizado para verificação automática de status de pagamento
 * Implementa polling com timeout, retry automático e gerenciamento de estados
 */

import { useCallback, useEffect, useRef, useState } from "react";

// Tipos para o status do pagamento
export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
}

// Interface para o último status conhecido
export interface LastKnownStatus {
  timestamp: number;
  status: PaymentStatus;
}

// Interface para histórico de verificações
export interface VerificationHistory {
  timestamp: number;
  status: PaymentStatus;
  response?: any;
}

// Interface para os parâmetros do hook
interface UsePaymentStatusParams {
  paymentId: string;
  pollingInterval?: number;
  maxTimeout?: number;
  onStatusChange?: (status: PaymentStatus) => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onTimeout?: () => void;
}

// Interface para o retorno do hook
interface UsePaymentStatusReturn {
  // Estados
  loading: boolean;
  paymentStatus: PaymentStatus;
  error: string | null;
  tempoRestante: number;
  ultimoStatusConhecido: LastKnownStatus | null;
  verificationHistory: VerificationHistory[];
  isPolling: boolean;

  // Funções públicas
  startPolling: () => void;
  pausePolling: () => void;
  restartPolling: () => void;
  checkPaymentNow: () => Promise<void>;
  resetStatus: () => void;
}

// Configurações padrão
const DEFAULT_POLLING_INTERVAL = 5000; // 5 segundos
const DEFAULT_MAX_TIMEOUT = 120000; // 2 minutos

// Configurações de retry com exponential backoff
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

// Função para calcular delay com exponential backoff
const calculateBackoffDelay = (retryCount: number): number => {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(2, retryCount);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

export const usePaymentStatus = ({
  paymentId,
  pollingInterval = DEFAULT_POLLING_INTERVAL,
  maxTimeout = DEFAULT_MAX_TIMEOUT,
  onStatusChange,
  onSuccess,
  onError,
  onTimeout,
}: UsePaymentStatusParams): UsePaymentStatusReturn => {
  // Estados do hook
  const [loading, setLoading] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    PaymentStatus.PENDING,
  );
  const [error, setError] = useState<string | null>(null);
  const [tempoRestante, setTempoRestante] = useState<number>(maxTimeout);
  const [ultimoStatusConhecido, setUltimoStatusConhecido] =
    useState<LastKnownStatus | null>(null);
  const [verificationHistory, setVerificationHistory] = useState<
    VerificationHistory[]
  >([]);
  const [isPolling, setIsPolling] = useState<boolean>(false);

  // Refs para gerenciamento de intervalo e timeouts
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const paymentIdRef = useRef<string>(paymentId);

  // Atualizar a referência do paymentId quando mudar
  useEffect(() => {
    paymentIdRef.current = paymentId;
  }, [paymentId]);

  // Função para verificar o status do pagamento
  const checkPaymentStatus = useCallback(
    async (isManualCheck: boolean = false): Promise<void> => {
      if (!paymentIdRef.current) {
        setError("ID de pagamento não fornecido");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Simular chamada à API de verificação de pagamento
        // Substituir com chamada real à API quando necessário
        const response = await verificarPagamentoAPI(paymentIdRef.current);

        if (!isMountedRef.current) return;

        const newStatus = mapResponseToStatus(response.status);

        // Atualizar histórico de verificações
        const historyEntry: VerificationHistory = {
          timestamp: Date.now(),
          status: newStatus,
          response: response,
        };

        setVerificationHistory((prev) => [...prev, historyEntry]);

        // Atualizar último status conhecido
        setUltimoStatusConhecido({
          timestamp: Date.now(),
          status: newStatus,
        });

        // Resetar contador de retry em caso de sucesso
        retryCountRef.current = 0;

        // Callback de mudança de status
        if (newStatus !== paymentStatus) {
          setPaymentStatus(newStatus);
          onStatusChange?.(newStatus);
        }

        // Se pagamento confirmado ou falhou, parar polling
        if (newStatus === PaymentStatus.PAID) {
          stopPolling();
          onSuccess?.();
        } else if (
          newStatus === PaymentStatus.FAILED ||
          newStatus === PaymentStatus.EXPIRED
        ) {
          stopPolling();
          setError(
            newStatus === PaymentStatus.FAILED
              ? "Pagamento falhou"
              : "Pagamento expirou",
          );
          onError?.(
            newStatus === PaymentStatus.FAILED
              ? "Pagamento falhou"
              : "Pagamento expirou",
          );
        }
      } catch (err: any) {
        if (!isMountedRef.current) return;

        // Tratamento de erro com retry automático
        if (retryCountRef.current < RETRY_CONFIG.maxRetries) {
          const delay = calculateBackoffDelay(retryCountRef.current);
          retryCountRef.current += 1;

          console.log(
            `[usePaymentStatus] Retry ${retryCountRef.current}/${RETRY_CONFIG.maxRetries} em ${delay}ms`,
          );

          setTimeout(() => {
            if (isMountedRef.current && isPolling) {
              checkPaymentStatus(isManualCheck);
            }
          }, delay);
        } else {
          // Máximo de retries atingido
          setError(err.message || "Erro ao verificar pagamento");
          onError?.(err.message || "Erro ao verificar pagamento");
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [paymentStatus, isPolling, onStatusChange, onSuccess, onError],
  );

  // Função para iniciar o polling
  const startPolling = useCallback(() => {
    if (isPolling) return;

    console.log(
      "[usePaymentStatus] Iniciando polling para paymentId:",
      paymentIdRef.current,
    );

    setIsPolling(true);
    setPaymentStatus(PaymentStatus.PENDING);
    setError(null);
    setTempoRestante(maxTimeout);
    retryCountRef.current = 0;

    // Primeira verificação imediata
    checkPaymentStatus();

    // Configurar intervalo de polling
    pollingIntervalRef.current = setInterval(() => {
      if (isMountedRef.current && tempoRestante > 0) {
        checkPaymentStatus();
        setTempoRestante((prev) => Math.max(0, prev - pollingInterval));
      }
    }, pollingInterval);

    // Configurar timeout
    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && isPolling) {
        console.log("[usePaymentStatus] Timeout atingido");
        stopPolling();
        setPaymentStatus(PaymentStatus.EXPIRED);
        onTimeout?.();
      }
    }, maxTimeout);
  }, [
    isPolling,
    maxTimeout,
    pollingInterval,
    checkPaymentStatus,
    tempoRestante,
    onTimeout,
  ]);

  // Função para pausar o polling
  const pausePolling = useCallback(() => {
    console.log("[usePaymentStatus] Pausando polling");
    setIsPolling(false);

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Função para reiniciar o polling
  const restartPolling = useCallback(() => {
    console.log("[usePaymentStatus] Reiniciando polling");
    pausePolling();
    setTempoRestante(maxTimeout);
    setPaymentStatus(PaymentStatus.PENDING);
    setError(null);
    setVerificationHistory([]);
    startPolling();
  }, [pausePolling, maxTimeout, startPolling]);

  // Função para verificar manualmente agora
  const checkPaymentNow = useCallback(async () => {
    console.log("[usePaymentStatus] Verificação manual");
    retryCountRef.current = 0;
    await checkPaymentStatus(true);
  }, [checkPaymentStatus]);

  // Função para resetar o status
  const resetStatus = useCallback(() => {
    console.log("[usePaymentStatus] Resetando status");
    pausePolling();
    setPaymentStatus(PaymentStatus.PENDING);
    setError(null);
    setTempoRestante(maxTimeout);
    setUltimoStatusConhecido(null);
    setVerificationHistory([]);
    setIsPolling(false);
  }, [pausePolling, maxTimeout]);

  // Função para parar o polling
  const stopPolling = useCallback(() => {
    setIsPolling(false);

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup ao desmontar o componente
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      console.log("[usePaymentStatus] Cleanup - desmontando hook");

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    // Estados
    loading,
    paymentStatus,
    error,
    tempoRestante,
    ultimoStatusConhecido,
    verificationHistory,
    isPolling,

    // Funções públicas
    startPolling,
    pausePolling,
    restartPolling,
    checkPaymentNow,
    resetStatus,
  };
};

// Função simulada para verificar pagamento (substituir com API real)
const verificarPagamentoAPI = async (
  paymentId: string,
): Promise<{ status: string }> => {
  // Simular delay de rede
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Simular resposta - em produção, substituir com chamada real
  // Exemplo: const response = await fetch(`${API_URL}/pagamentos/${paymentId}/status`);

  // Retornar status simulado para teste
  return {
    status: "PENDING", // ou "PAID", "FAILED", "EXPIRED"
  };
};

// Função para mapear resposta da API para PaymentStatus
const mapResponseToStatus = (apiStatus: string): PaymentStatus => {
  const statusMap: Record<string, PaymentStatus> = {
    PENDING: PaymentStatus.PENDING,
    PENDENTE: PaymentStatus.PENDING,
    PAID: PaymentStatus.PAID,
    PAGO: PaymentStatus.PAID,
    SUCCESS: PaymentStatus.PAID,
    FAILED: PaymentStatus.FAILED,
    FALHOU: PaymentStatus.FAILED,
    ERROR: PaymentStatus.FAILED,
    EXPIRED: PaymentStatus.EXPIRED,
    EXPIRADO: PaymentStatus.EXPIRED,
  };

  return statusMap[apiStatus.toUpperCase()] || PaymentStatus.PENDING;
};

export default usePaymentStatus;
