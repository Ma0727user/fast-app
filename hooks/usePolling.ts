/**
 * FAST - usePolling Hook
 * Hook para atualização de status em tempo real (polling)
 */

import {
    getStatusEncomenda,
    StatusEncomenda,
} from "@/services/encomendaService";
import { useCallback, useEffect, useRef, useState } from "react";

// ============================================
// TIPOS
// ============================================

interface UsePollingOptions {
  /** Intervalo entre requisições em milissegundos (padrão: 15000 = 15s) */
  interval?: number;
  /** Se deve iniciar automaticamente (padrão: true) */
  autoStart?: boolean;
}

interface UsePollingReturn {
  /** Status atual */
  status: StatusEncomenda | null;
  /** Se está carregando */
  isLoading: boolean;
  /** Erro atual */
  error: string | null;
  /** Se o polling está ativo */
  isPolling: boolean;
  /** Função para iniciar o polling */
  start: () => void;
  /** Função para parar o polling */
  stop: () => void;
  /** Função para forçar uma atualização */
  refresh: () => Promise<void>;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook para polling de status de encomenda
 * Recomendado: intervalo de 10-15 segundos
 *
 * @example
 * const { status, isPolling, start, stop } = usePolling({
 *   interval: 15000, // 15 segundos
 *   autoStart: true,
 * });
 */
export const usePolling = (
  encomendaId: string | null,
  options: UsePollingOptions = {},
): UsePollingReturn => {
  const {
    interval = 15000, // 15 segundos - ideal para跟踪encomendas
    autoStart = true,
  } = options;

  const [status, setStatus] = useState<StatusEncomenda | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Ref para armazenar o interval ID
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // Ref para verificar se o componente está montado
  const isMountedRef = useRef(true);

  /**
   * Função para buscar o status atual
   */
  const fetchStatus = useCallback(async () => {
    if (!encomendaId) return;

    try {
      setIsLoading(true);
      setError(null);

      const newStatus = await getStatusEncomenda(encomendaId);

      if (isMountedRef.current) {
        setStatus(newStatus);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message || "Erro ao verificar status");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [encomendaId]);

  /**
   * Inicia o polling
   */
  const start = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsPolling(true);

    // Primeira execução imediata
    fetchStatus();

    // Configurar intervalo
    intervalRef.current = setInterval(() => {
      fetchStatus();
    }, interval);
  }, [fetchStatus, interval]);

  /**
   * Para o polling
   */
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  /**
   * Força uma atualização imediata
   */
  const refresh = useCallback(async () => {
    await fetchStatus();
  }, [fetchStatus]);

  // Efeito para iniciar/parar polling
  useEffect(() => {
    isMountedRef.current = true;

    if (autoStart && encomendaId) {
      start();
    }

    return () => {
      isMountedRef.current = false;
      stop();
    };
  }, [encomendaId, autoStart, start, stop]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    status,
    isLoading,
    error,
    isPolling,
    start,
    stop,
    refresh,
  };
};

export default usePolling;
