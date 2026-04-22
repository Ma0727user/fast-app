/**
 * FAST - Encomenda Service
 * Serviço de gerenciamento de encomendas com Spring Boot
 */

import { ItemCarrinho } from "@/store/useStore";
import api, { ApiResponse } from "./api";

// ============================================
// TIPOS
// ============================================

/**
 * Item de produto na encomenda (enviado para API)
 */
export interface EncomendaItem {
  id: number;
  quantidade: number;
}

/**
 * Endereço de entrega (enviado para API)
 */
export interface EncomendaEndereco {
  rua: string;
  cidade: string;
  provincia: string;
  referencia?: string;
}

/**
 * Dados completos para criar encomenda (JSON enviado ao Spring Boot)
 */
export interface CriarEncomendaRequest {
  produtos: EncomendaItem[];
  endereco: EncomendaEndereco;
  metodoPagamento: "TRANSFERENCIA" | "MULTICAIXA" | "DINHEIRO";
}

/**
 * Status da encomenda (confirmado pelo backend)
 */
export type StatusEncomenda =
  | "PENDENTE"
  | "CONFIRMADO"
  | "EM_PREPARACAO"
  | "A_CAMINHO"
  | "ENTREGUE"
  | "CANCELADO";

/**
 * Item da encomenda (recebido da API)
 */
export interface EncomendaItemResponse {
  id: number;
  produtoId: number;
  produtoNome: string;
  produtoImagem: string;
  preco: number;
  quantidade: number;
}

/**
 * Encomenda retornada pela API (formato real)
 * API retorna: { "total": "13698.24", "estado": "A caminho", "id_compra": 138, ... }
 */
export interface Encomenda {
  id_compra: number;
  id_usuario: number;
  data_compra: string;
  estado: string;
  total: string;
}

export interface EncomendaDetalhe {
  id_compra: number;
  id_usuario: number;
  data_compra: string;
  estado: string;
  total: string;
  subtotal: string;
  imposto: string;
  taxa_entrega: string;
  codigo_encomenda: string;
  itens: EncomendaItemDetail[];
  imagem_compra?: string;
}

export interface EncomendaItemDetail {
  preco: number;
  nome_produto: string;
  imagem: string;
  quantidade: number;
}

/**
 * Mapeia status da API real para formato do app
 * A API pode retornar estado com aspas extras: '"Em preparação"'
 */
const mapEstadoToStatus = (estado: string): string => {
  // Limpar aspas extras que a API pode enviar
  const estadoLimpo = estado.replace(/"/g, "").trim();

  const estadoMap: Record<string, string> = {
    Pendente: "Confirmado",
    Confirmado: "Confirmado",
    "Em Preparação": "Em Preparação",
    "Em preparação": "Em Preparação",
    "Em Preparacao": "Em Preparação",
    "A caminho": "A Caminho",
    "A Caminho": "A Caminho",
    A: "A Caminho",
    Entregue: "Entregue",
    E: "Entregue",
    Cancelado: "Cancelado",
  };
  return estadoMap[estadoLimpo] || "Confirmado";
};

/**
 * Encomenda mapeada para formato do app (legacy - manter para compatibilidade)
 */
export interface EncomendaLegacy {
  id: number;
  numero: string;
  data: string;
  status: StatusEncomenda;
  total: number;
  items: EncomendaItemResponse[];
  endereco: EncomendaEndereco;
  metodoPagamento: string;
  comprovativoUrl?: string;
}

/**
 * Encomenda mapeada para o formato do app
 */
export interface EncomendaApp {
  id: string;
  numero: string;
  data: string;
  status: "Confirmado" | "Em Preparação" | "A Caminho" | "Entregue";
  total: number;
  items: ItemCarrinho[];
  endereco: EncomendaEndereco;
}

// ============================================
// MAPEAMENTO DE STATUS
// ============================================

/**
 * Mapeia status do Spring Boot para formato do app
 */
const mapStatus = (status: StatusEncomenda): string => {
  const statusMap: Record<StatusEncomenda, string> = {
    PENDENTE: "Confirmado",
    CONFIRMADO: "Confirmado",
    EM_PREPARACAO: "Em Preparação",
    A_CAMINHO: "A Caminho",
    ENTREGUE: "Entregue",
    CANCELADO: "Cancelado",
  };
  return statusMap[status] || "Confirmado";
};

/**
 * Mapeia status do app para formato do Spring Boot
 */
const mapStatusToApi = (status: string): StatusEncomenda => {
  const statusMap: Record<string, StatusEncomenda> = {
    Confirmado: "CONFIRMADO",
    "Em Preparação": "EM_PREPARACAO",
    "A Caminho": "A_CAMINHO",
    Entregue: "ENTREGUE",
  };
  return statusMap[status] || "PENDENTE";
};

// ============================================
// SERVIÇOS
// ============================================

/**
 * Cria uma nova encomenda
 * Envia JSON com lista de IDs, quantidades e endereço
 * @param items Itens do carrinho
 * @param endereco Endereço de entrega
 * @param metodoPagamento Método de pagamento
 * @returns Dados da encomenda criada
 */
export const criarEncomenda = async (
  items: ItemCarrinho[],
  endereco: EncomendaEndereco,
  metodoPagamento: "TRANSFERENCIA" | "MULTICAIXA" | "DINHEIRO",
): Promise<Encomenda> => {
  try {
    // Mapear itens do carrinho para formato da API
    const produtos: EncomendaItem[] = items.map((item) => ({
      id: parseInt(item.id, 10),
      quantidade: item.quantity,
    }));

    const request: CriarEncomendaRequest = {
      produtos,
      endereco,
      metodoPagamento,
    };

    const response = await api.post<ApiResponse<Encomenda>>(
      "/encomendas",
      request,
    );
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error("Dados inválidos. Verifique os itens e endereço.");
    } else if (error.response?.status === 401) {
      throw new Error("Sessão expirada. Faça login novamente.");
    } else if (!error.response) {
      throw new Error("Erro de conexão. Verifique sua internet.");
    }
    throw new Error(error.response?.data?.message || "Erro ao criar encomenda");
  }
};

/**
 * Lista todas as encomendas do usuário
 * @param userId ID do usuário logado
 * @returns Lista de encomendas
 */
export const getEncomendas = async (userId: string): Promise<Encomenda[]> => {
  try {
    const response = await api.get(`/encomendas/${userId}`);
    // API retorna { data: [...], message, status }
    const responseData = response.data;
    if (responseData.data && Array.isArray(responseData.data)) {
      return responseData.data as Encomenda[];
    }
    return [];
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }
    throw new Error("Erro ao carregar encomendas.");
  }
};

/**
 * Busca uma encomenda pelo ID
 * @param id ID da encomenda
 * @returns Dados da encomenda
 */
export const getEncomendaById = async (id: string): Promise<Encomenda> => {
  try {
    const response = await api.get<ApiResponse<Encomenda>>(`/encomendas/${id}`);
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error("Encomenda não encontrada.");
    }
    throw new Error("Erro ao carregar encomenda.");
  }
};

/**
 * Busca detalhes completos de uma encomenda pelo ID
 * @param id ID da encomenda (id_compra)
 * @returns Dados detalhados da encomenda
 */
export const getEncomendaDetalheById = async (
  id: string,
): Promise<EncomendaDetalhe> => {
  try {
    const response = await api.get(`/encomenda/${id}`);
    // API retorna { data: [{ ... }], message, status } — pegar primeiro elemento
    const responseData = response.data;
    if (
      responseData.data &&
      Array.isArray(responseData.data) &&
      responseData.data.length > 0
    ) {
      return responseData.data[0] as EncomendaDetalhe;
    }
    throw new Error("Encomenda não encontrada.");
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error("Encomenda não encontrada.");
    }
    throw new Error(error.message || "Erro ao carregar detalhes da encomenda.");
  }
};

/**
 * Busca status atual de uma encomenda (para polling)
 * @param id ID da encomenda
 * @returns Status atual
 */
export const getStatusEncomenda = async (
  id: string,
): Promise<StatusEncomenda> => {
  try {
    const response = await api.get<ApiResponse<{ status: StatusEncomenda }>>(
      `/encomendas/${id}/status`,
    );
    return response.data.data.status;
  } catch (error: any) {
    throw new Error("Erro ao verificar status.");
  }
};

/**
 * Cancela uma encomenda
 * @param id ID da encomenda
 */
export const cancelarEncomenda = async (id: string): Promise<void> => {
  try {
    await api.delete<ApiResponse<void>>(`/encomendas/${id}`);
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error("Encomenda não pode ser cancelada.");
    }
    throw new Error("Erro ao cancelar encomenda.");
  }
};

// ============================================
// TIPOS - DETALHE DO PEDIDO (API /pedido/{id})
// ============================================

/**
 * Item do pedido detalhado (da API /pedido/{id})
 */
export interface PedidoItem {
  preco: number;
  tamanho: string;
  nome_produto: string;
  subtotal: number;
  data_adicao: string;
  cor: string;
  imagem: string;
  id_carrinho: number;
  id_produto: number;
  quantidade: number;
}

/**
 * Dados do pagamento (da API /pedido/{id})
 */
export interface PedidoPagamento {
  data_criacao: string;
  referencia_pagamento: string;
  estado_pagamento: string;
  data_pagamento: string;
  total_pagar: string;
  id_pagamento: number;
}

/**
 * Detalhe completo do pedido (resposta da API /pedido/{id})
 */
export interface PedidoDetalhe {
  estado_pedido: string;
  data_pedido: string;
  itens: PedidoItem[];
  id_usuario: string;
  iva: number;
  subtotal: number;
  taxa_entrega: number;
  pagamento: PedidoPagamento;
  id_pedido: number;
  id_endereco: number;
  referencia: string;
}

/**
 * Busca detalhes de um pedido pelo ID
 * @param id ID do pedido
 * @returns Dados detalhados do pedido
 */
export const getPedidoById = async (id: string): Promise<PedidoDetalhe> => {
  try {
    const response = await api.get<ApiResponse<PedidoDetalhe>>(`/pedido/${id}`);
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error("Pedido não encontrado.");
    }
    throw new Error("Erro ao carregar detalhes do pedido.");
  }
};

/**
 * Mapeia lista de encomendas da API para formato do app
 * Formato API: { id_compra, id_usuario, data_compra, estado, total }
 */
export const mapEncomendasToApp = (encomendas: Encomenda[]): EncomendaApp[] => {
  return encomendas.map((encomenda) => {
    // Limpar aspas extras do estado
    const estadoLimpo = (encomenda.estado || "").replace(/"/g, "").trim();
    return {
      id: String(encomenda.id_compra),
      numero: `PED-${encomenda.id_compra}`,
      data: encomenda.data_compra,
      status: mapEstadoToStatus(estadoLimpo) as any,
      total: parseFloat(String(encomenda.total)),
      items: [],
      endereco: {
        rua: "",
        cidade: "",
        provincia: "",
      },
    };
  });
};

/**
 * Atualiza o estado de uma encomenda
 * @param id ID da encomenda (id_compra)
 * @param novoEstado Novo estado para a encomenda
 */
export const atualizaEncomendaEstado = async (
  id: number,
  novoEstado: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.post<ApiResponse<any>>(
      `/atualizaencomenda/${id}`,
      { estado_compra: novoEstado },
    );
    return {
      success: response.data.status === 200,
      message: response.data.message || "Estado atualizado com sucesso",
    };
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error("Estado inválido.");
    }
    throw new Error("Erro ao atualizar estado da encomenda.");
  }
};

/**
 * Confirma a entrega pelo cliente e permite anexar imagem da entrega.
 * O endpoint exige PUT em /atualizaencomenda/{id}.
 */
export const confirmarEntregaCliente = async (
  id: number,
  imagemUri?: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const formData = new FormData();
    formData.append("estado_compra", "E");

    if (imagemUri) {
      const nomeArquivo = imagemUri.split("/").pop() || `entrega-${id}.jpg`;
      const extensao = nomeArquivo.split(".").pop()?.toLowerCase();
      const mimeType =
        extensao === "png"
          ? "image/png"
          : extensao === "webp"
            ? "image/webp"
            : "image/jpeg";

      formData.append("imagem", {
        uri: imagemUri,
        name: nomeArquivo,
        type: mimeType,
      } as any);
    }

    const response = await api.put<ApiResponse<any>>(
      `/atualizaencomenda/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    const apiStatus = (response.data as any)?.status;
    const success =
      response.status >= 200 &&
      response.status < 300 &&
      (apiStatus === undefined || apiStatus === 200 || apiStatus === true);

    return {
      success,
      message:
        response.data?.message || "Entrega confirmada e atualizada com sucesso",
    };
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error("Dados inválidos para confirmar entrega.");
    }
    throw new Error("Erro ao confirmar entrega da encomenda.");
  }
};

export default {
  criarEncomenda,
  getEncomendas,
  getEncomendaById,
  getEncomendaDetalheById,
  getStatusEncomenda,
  cancelarEncomenda,
  getPedidoById,
  mapEncomendasToApp,
  atualizaEncomendaEstado,
  confirmarEntregaCliente,
};
