/**
 * FAST - Tipos Compartilhados
 * Tipos de dados usados em toda a aplicação
 */

// ============================================
// PRODUTO
// ============================================

export interface Produto {
  id: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  // Campos para API do carrinho
  idProduto?: number;
  idVariacao?: number;
}

export interface ItemCarrinho extends Produto {
  quantity: number;
}

// ============================================
// USUÁRIO
// ============================================

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  addresses: Endereco[];
}

export interface Endereco {
  id: string;
  street: string;
  city: string;
  province: string;
  reference?: string;
}

// ============================================
// PEDIDO / ENCOMENDA
// ============================================

export type StatusPedido =
  | "Confirmado"
  | "Em Preparação"
  | "A Caminho"
  | "Entregue";

export interface Pedido {
  id: string;
  numero: string;
  data: string;
  total: number;
  status: StatusPedido;
  items: ItemCarrinho[];
}

export interface VariacaoProduto {
  cor: string;
  tamanho: string;
  quantidade: number;
}

export interface ItemPedido {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  imagem: string;
  variantes: VariacaoProduto[];
}

// ============================================
// PAGAMENTO
// ============================================

export type TipoPagamento = "referencia" | "cartao";

export interface DadosPagamento {
  entidade: string;
  referencia: string;
  total: number;
  idPedido: number;
  referenciaPagamento: string;
}

// ============================================
// API RESPONSE
// ============================================

export interface ApiResponse<T> {
  status: "sucesso" | "erro";
  encontrado: boolean;
  mensagem: string;
  dados: T | null;
}

export default {};
