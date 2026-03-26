/**
 * FAST - Upload Service
 * Serviço de upload de comprovativos (Multipart/FormData)
 */

import api, { ApiResponse } from "./api";

// ============================================
// TIPOS
// ============================================

/**
 * Resultado do upload
 */
export interface UploadResponse {
  url: string;
  filename: string;
  tamanho: number;
}

/**
 * Informações do arquivo para upload
 */
export interface FileInfo {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

// ============================================
// SERVIÇOS
// ============================================

/**
 * Envia comprovativo de pagamento via FormData (Multipart)
 * @param encomendaId ID da encomenda
 * @param fileInfo Informações do arquivo (URI, tipo, nome)
 * @returns URL do comprovativo enviado
 */
export const uploadComprovativo = async (
  encomendaId: string,
  fileInfo: FileInfo,
): Promise<UploadResponse> => {
  try {
    // Criar FormData para upload multipart
    const formData = new FormData();

    // Adicionar o arquivo ao FormData
    // O nome 'file' deve coincidir com o parâmetro do endpoint Spring Boot
    formData.append("file", {
      uri: fileInfo.uri,
      type: fileInfo.type || "image/jpeg",
      name: fileInfo.name || "comprovativo.jpg",
    } as any);

    // Adicionar ID da encomenda
    formData.append("encomendaId", encomendaId);

    const response = await api.post<ApiResponse<UploadResponse>>(
      "/upload/comprovativo",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 60 segundos para upload
      },
    );

    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error("Arquivo inválido. Envie JPG, PNG ou PDF até 5MB.");
    } else if (error.response?.status === 413) {
      throw new Error("Arquivo muito grande. Máximo 5MB.");
    } else if (error.response?.status === 401) {
      throw new Error("Sessão expirada. Faça login novamente.");
    } else if (!error.response) {
      throw new Error("Erro de conexão. Verifique sua internet.");
    }
    throw new Error(
      error.response?.data?.message || "Erro ao enviar comprovativo",
    );
  }
};

/**
 * Envia imagem de produto (Multipart)
 * @param produtoId ID do produto
 * @param fileInfo Informações do arquivo
 * @returns URL da imagem
 */
export const uploadImagemProduto = async (
  produtoId: string,
  fileInfo: FileInfo,
): Promise<UploadResponse> => {
  try {
    const formData = new FormData();

    formData.append("file", {
      uri: fileInfo.uri,
      type: fileInfo.type || "image/jpeg",
      name: fileInfo.name || "produto.jpg",
    } as any);

    formData.append("produtoId", produtoId);

    const response = await api.post<ApiResponse<UploadResponse>>(
      "/upload/produto",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data.data;
  } catch (error: any) {
    throw new Error("Erro ao enviar imagem do produto.");
  }
};

/**
 * Envia foto de perfil do usuário (Multipart)
 * @param fileInfo Informações do arquivo
 * @returns URL da foto de perfil
 */
export const uploadFotoPerfil = async (
  fileInfo: FileInfo,
): Promise<UploadResponse> => {
  try {
    const formData = new FormData();

    formData.append("file", {
      uri: fileInfo.uri,
      type: fileInfo.type || "image/jpeg",
      name: fileInfo.name || "perfil.jpg",
    } as any);

    const response = await api.post<ApiResponse<UploadResponse>>(
      "/upload/perfil",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data.data;
  } catch (error: any) {
    throw new Error("Erro ao enviar foto de perfil.");
  }
};

/**
 * Valida o arquivo antes do upload
 * @param fileInfo Informações do arquivo
 * @returns true se válido
 */
export const validarArquivo = (
  fileInfo: FileInfo,
): { valido: boolean; erro?: string } => {
  // Verificar tamanho máximo (5MB)
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB em bytes

  if (fileInfo.size && fileInfo.size > MAX_SIZE) {
    return { valido: false, erro: "Arquivo muito grande. Máximo 5MB." };
  }

  // Verificar tipo de arquivo
  const tiposPermitidos = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ];
  if (!tiposPermitidos.includes(fileInfo.type)) {
    return {
      valido: false,
      erro: "Tipo de arquivo não permitido. Use JPG, PNG ou PDF.",
    };
  }

  return { valido: true };
};

export default {
  uploadComprovativo,
  uploadImagemProduto,
  uploadFotoPerfil,
  validarArquivo,
};
