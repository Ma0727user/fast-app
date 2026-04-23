# FAST - Conceito da Aplicação

## 📱 Visão Geral

**FAST** é uma aplicação de **e-commerce (loja online)** moderna, desenvolvida como uma solução multiplataforma (iOS, Android e Web) utilizando Expo e React Native. A aplicação permite aos utilizadores navegar, pesquisar, comprar produtos e acompanhar suas encomendas.

---

## 🎯 Objetivo Principal

Proporcionar uma experiência de compra rápida, intuitiva e segura através de uma plataforma mobile-first que se conecta a um backend robusto para gerir produtos, carrinho, pagamentos e encomendas.

---

## 🏗️ Arquitetura da Aplicação

### Frontend (Cliente)
- **Framework**: React Native com Expo
- **Linguagem**: TypeScript
- **Gerenciamento de Estado**: Zustand
- **Navegação**: Expo Router (file-based routing)
- **Requisições HTTP**: Axios
- **UI Components**: React Native Paper

### Backend (Servidor)
- **Framework**: Spring Boot (API REST)
- **Autenticação**: Token Authorization
- **Base URL**: `https://fast.appteste.info/v1`

---

## 🔑 Funcionalidades Principais

### 1. **Autenticação e Gestão de Utilizador**
- Login/Signup
- Verificação de conta
- Edição de perfil
- Recuperação de senha

### 2. **Catálogo de Produtos**
- Navegação por categorias
- Pesquisa de produtos
- Visualização detalhada de produtos
- Filtros e ordenação

### 3. **Carrinho de Compras**
- Adicionar/remover produtos
- Ajustar quantidades
- Resumo do carrinho
- Persistência de dados (AsyncStorage)

### 4. **Checkout e Pagamento**
- Informações de entrega
- Seleção de método de pagamento
- Transferência bancária
- Confirmação de compra

### 5. **Gestão de Encomendas**
- Acompanhamento de status
- Histórico de compras
- Detalhes da encomenda

### 6. **Notificações**
- Alertas de compra
- Atualizações de encomenda
- Feedback de ações

### 7. **Informações**
- FAQ
- Política de Privacidade
- Termos e Condições

---

## 📁 Estrutura do Projeto

```
FAST/
├── app/                          # Telas e rotas (Expo Router)
│   ├── (tabs)/                   # Abas principais da aplicação
│   │   ├── index.tsx             # Home (banner, categorias, produtos)
│   │   ├── CarrinhoScreen.tsx    # Carrinho de compras
│   │   ├── CategoriasScreen.tsx  # Categorias
│   │   ├── PesquisarScreen.tsx   # Pesquisa
│   │   ├── PerfilScreen.tsx      # Perfil do utilizador
│   │   └── NotificacoesScreen.tsx# Notificações
│   ├── (checkout)/               # Fluxo de checkout
│   │   ├── DadosEntregaScreen.tsx
│   │   ├── MetodoPagamentoScreen.tsx
│   │   ├── TransferenciaScreen.tsx
│   │   └── PaymentConfirmationScreen.tsx
│   ├── (orders)/                 # Gestão de encomendas
│   │   ├── MinhasEncomendasScreen.tsx
│   │   └── StatusEncomendaScreen.tsx
│   ├── (profile)/                # Perfil do utilizador
│   │   └── EditarPerfilScreen.tsx
│   ├── (shop)/                   # Loja
│   │   ├── ProductDetailScreen.tsx
│   │   └── ProductGridScreen.tsx
│   ├── (info)/                   # Informações
│   │   ├── FaqScreen.tsx
│   │   ├── PoliticaPrivacidade.tsx
│   │   └── TermosECondicoes.tsx
│   ├── login.tsx                 # Autenticação
│   ├── signup.tsx
│   └── verificacao.tsx
├── components/                   # Componentes reutilizáveis
│   ├── AddToCartButton.tsx
│   ├── ModalAdicionarCarrinho.tsx
│   ├── ModalFeedback.tsx
│   ├── ModalPesquisa.tsx
│   ├── Toast.tsx
│   └── ui/                       # Componentes base
├── services/                     # Chamadas à API
│   ├── api.ts                    # Instância Axios configurada
│   ├── authService.ts            # Autenticação
│   ├── produtoService.ts         # Produtos
│   ├── carrinhoService.ts        # Carrinho
│   ├── encomendaService.ts       # Encomendas
│   └── uploadService.ts          # Upload de ficheiros
├── store/                        # Gerenciamento de estado (Zustand)
│   └── useStore.ts
├── constants/                    # Constantes e temas
│   ├── theme.ts                  # Cores, fontes, espaçamento
│   └── env.ts                    # Variáveis de ambiente
├── hooks/                        # Custom React Hooks
├── types/                        # Tipos TypeScript
└── assets/                       # Imagens e ícones
```

---

## 🔄 Fluxo de Dados

### Fluxo de Compra
```
Home (visualizar produtos)
    ↓
Detalhe do Produto (selecionar variações)
    ↓
Adicionar ao Carrinho (salvar localmente)
    ↓
Carrinho (revisar itens)
    ↓
Checkout (dados de entrega)
    ↓
Pagamento (transferência bancária)
    ↓
Confirmação (pedido criado)
    ↓
Minhas Encomendas (acompanhar status)
```

### Fluxo de Autenticação
```
Splash Screen
    ↓
Login/Signup (criar conta)
    ↓
Verificação (confirmar email)
    ↓
Home (autenticado)
```

---

## 🛠️ Tecnologias Utilizadas

| Categoria | Tecnologia |
|-----------|-----------|
| **Framework** | Expo 54.x, React 19.1, React Native 0.81 |
| **Linguagem** | TypeScript |
| **Estado** | Zustand 5.x |
| **Navegação** | Expo Router 6.x |
| **HTTP** | Axios 1.13 |
| **Armazenamento** | AsyncStorage, SecureStore (Expo) |
| **UI Components** | React Native Paper 5.x |
| **Animações** | Reanimated 4.x |
| **Ícones** | Expo Vector Icons |
| **Video** | Expo AV |
| **Segurança** | Expo SecureStore, Authorization Headers |

---

## 🔐 Segurança

- **Token de Autorização**: Todas as requisições incluem um token de autorização no header
- **HTTPS**: Comunicação encriptada com o backend
- **SecureStore**: Dados sensíveis armazenados de forma segura
- **AsyncStorage**: Cache local para dados não-sensíveis

---

## 📊 Padrões e Convenções

### Nomenclatura
- **Screens**: `*Screen.tsx` (ex: `LoginScreen.tsx`)
- **Componentes**: `PascalCase.tsx` (ex: `AddToCartButton.tsx`)
- **Hooks**: `use*` (ex: `usePaymentStatus.ts`)
- **Services**: `*Service.ts` (ex: `produtoService.ts`)

### Estrutura de Pasta por Features
- Cada feature tem sua própria pasta em `app/`
- Layout hierarchy com `_layout.tsx`
- Screens relacionadas agrupadas em pastas

### Tipagem
- Todos os componentes tipados com TypeScript
- Interfaces definidas em `types/index.ts`
- Tipos reutilizáveis para dados da API

---

## 🚀 Fluxo de Desenvolvimento

### Setup Inicial
```bash
npm install
npx expo start
```

### Development
- Editar ficheiros em `app/` para adicionar novas telas
- Usar hot reload automático do Expo
- Testar em Android Emulator, iOS Simulator ou Expo Go

### Build
```bash
npm run android   # Build para Android
npm run ios       # Build para iOS
npm run web       # Build para Web
```

---

## 📱 Plataformas Suportadas

- ✅ **iOS** (iPad e iPhone)
- ✅ **Android** (com ícone adaptativo)
- ✅ **Web** (output estático)

---

## 🎨 Tema e Identidade

- **Modo escuro/claro**: Automático (detecta preferência do sistema)
- **Cores**: Definidas em `constants/theme.ts`
- **Tipografia**: Fontes otimizadas para mobile
- **Ícones**: Biblioteca Expo Vector Icons

---

## 🔗 API Backend

**Base URL**: `https://fast.appteste.info/v1`

### Endpoints Principais
- `POST /auth/login` - Autenticação
- `POST /auth/register` - Criação de conta
- `GET /produtos` - Lista de produtos
- `POST /carrinho` - Operações no carrinho
- `POST /pedidos` - Criação de pedidos
- `GET /encomendas` - Histórico de encomendas

---

## 📝 Próximos Passos

- [ ] Implementação de pagamento integrado (Stripe/PayPal)
- [ ] Sistema de avaliações de produtos
- [ ] Wishlist/Favoritos
- [ ] Chat com suporte
- [ ] Programa de pontos/fidelização
- [ ] Push notifications
- [ ] Análise de dados (Firebase Analytics)

---

## 📞 Suporte

Para mais informações sobre tecnologias específicas:
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Guide](https://docs.expo.dev/router/introduction/)
- [Zustand Store](https://github.com/pmndrs/zustand)
