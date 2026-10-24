# Arquitetura da Solução — Kurio NFT Marketplace

Este documento detalha as decisões técnicas, organização em camadas, contratos de dados, estratégias de estado remoto, conciliação em tempo real e conformidade com os critérios de avaliação do desafio.

---

## 1. Visão Geral e Princípios Arquiteturais

A aplicação foi estruturada segundo a abordagem **Feature-Based Clean Architecture**, orientada pelos princípios de **Clean Code**, **YAGNI** (*You Aren't Gonna Need It*) e **TDD** (*Test-Driven Development*).

```
┌─────────────────────────────────────────────────────────────┐
│                    Camada de Apresentação                   │
│   (React + TanStack Router + Tailwind CSS + shadcn/ui)      │
└──────────────────────────────▲──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Estado Remoto & Domínio                  │
│    (TanStack Query + AuthContext + CartContext + BigNumber) │
└──────────────────────────────▲──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Transporte e Rede Real                   │
│          (Axios Client HTTP + socket.io-client)             │
└──────────────────────────────▲──────────────────────────────┘
═══════════════════════════════╪═══════════════════════════════
                   BARREIRA DE REDE (ISOLAMENTO)
═══════════════════════════════╪═══════════════════════════════
┌──────────────────────────────▼──────────────────────────────┐
│                 Camada de Mocking (MSW 2.x)                 │
│  (Service Worker Interceptor + @mswjs/socket.io-binding)    │
│    - MockDatabase em memória com sincronização localStorage │
│    - Painel de Cenários Determinísticos (Latência, Falhas)  │
└─────────────────────────────────────────────────────────────┘
```

### Isolamento Estrito da Simulação
Nenhum componente, hook ou cliente HTTP contém condicionais de negócio como `if (isMock)`. O código da aplicação é 100% de produção, comunicando-se exclusivamente com endpoints REST padrão e com o socket oficial. O **Mock Service Worker (MSW)** intercepta as chamadas no nível de rede do navegador (via Service Worker para requisições HTTP e binding de WebSocket para Socket.IO).

---

## 2. Contratos REST e Endpoints

Todos os contratos são fortemente tipados em TypeScript (`src/shared/types/index.ts`):

| Módulo | Método | Rota | Descrição | Status / Comportamento |
| :--- | :--- | :--- | :--- | :--- |
| **Sessão** | `POST` | `/api/auth/login` | Autenticação por e-mail e senha | `200` (token + user) ou `401` |
| **Sessão** | `POST` | `/api/auth/register` | Criação de conta de colecionador | `201` ou `409` (conflito de e-mail) |
| **Sessão** | `GET` | `/api/auth/session` | Validação de token Bearer | `200` ou `401` (sessão expirada) |
| **Sessão** | `POST` | `/api/auth/logout` | Encerramento de sessão | `200` (limpa cache no cliente) |
| **Perfil** | `PUT` | `/api/auth/profile` | Atualização cadastral e avatar | `200` ou `401` |
| **Perfil** | `PUT` | `/api/auth/password` | Troca de senha autenticada | `200` ou `400` (senha incorreta) |
| **NFTs** | `GET` | `/api/nfts` | Catálogo com busca, filtros e paginação | `200` (`items`, `total`, `page`, etc.) |
| **NFTs** | `GET` | `/api/nfts/:id` | Detalhes do NFT e edições | `200` ou `404` (inexistente) |
| **Favoritos** | `GET` | `/api/favorites` | Consulta dos favoritos do usuário | `200` ou `401` |
| **Favoritos** | `POST` | `/api/favorites/:id` | Alternância otimista com rollback | `200` ou `500` (simulação de falha) |
| **Carrinho** | `POST` | `/api/cart/quote` | Validação de estoque e cálculo em ETH | `200` (cotação + validação) |
| **Pedidos** | `POST` | `/api/orders` | Criação de pedido com **Idempotência** | `201`, `200` (re-envio idêntico), `409` (conflito) |
| **Pedidos** | `GET` | `/api/orders/:id` | Snapshot imutável do recibo | `200` ou `404` |
| **Carteiras** | `GET` | `/api/wallets` | Listagem das carteiras do usuário | `200` ou `401` |
| **Carteiras** | `POST` | `/api/wallets` | Cadastro de carteira (0x validado) | `201` ou `400` |
| **Carteiras** | `PUT` | `/api/wallets/:id` | Edição e seleção de carteira principal | `200` ou `404` |

---

## 3. Tempo Real com Socket.IO e Conciliação com REST

### Eventos Obrigatórios Implementados

1. **`nft.updated`**:
   * Emitido quando o preço ou a quantidade de edições de um NFT é alterada no catálogo.
   * **Reação no Catálogo/Detalhe:** Atualiza imediatamente o preço exibido no card sem necessidade de refresh.
   * **Reação no Carrinho:** Detecta se o item modificado está no carrinho do usuário, sinaliza a alteração através de um banner persistente de aviso e impede o avanço para checkout antes que o usuário confirme a nova cotação.

2. **`order.updated`**:
   * Emitido quando o pedido passa do estado `pending` para `confirmed` ou `rejected`.
   * Atualiza a tela de confirmação de pedido em tempo real, exibindo a identificação da transação (hash na blockchain) e data minerada.

### Tratamento de Eventos Antigos ou Duplicados (Out-of-Order Prevention)
Cada evento carrega o contrato:
```typescript
interface RealtimeEvent<T> {
  type: string
  resourceId: string
  version: number
  timestamp: string
  payload: T
}
```
A camada de cliente (`src/shared/lib/socket.ts`) mantém um registro de `observedVersions`. Caso chegue um evento com versão menor ou igual à já processada (`event.version <= lastSeenVersion`), ele é imediatamente descartado, impedindo que respostas atrasadas na rede regridam um estado mais recente.

### Reconciliação ao Reconectar
Ao detectar o evento `connect` ou `reconnect` do Socket.IO, a aplicação dispara um evento interno `kurio:socket-reconnected`, fazendo com que o `queryClient` invalide e busque imediatamente dados atualizados via REST.

---

## 4. Política de Sessão, Cache e Isolamento de Usuários

* **Armazenamento Seguro:** As credenciais fictícias trafegam em formato seguro; senhas nunca são salvas em claro. O token de sessão é preservado no `localStorage` sob a chave `KURIO_AUTH_TOKEN`.
* **Tratamento de 401 e Expiração:** O interceptor Axios detecta respostas `401 Unauthorized` e dispara o evento `kurio:session-expired`, limpando a sessão e redirecionando para login.
* **Isolamento de Cache:** Ao realizar logout ou trocar de usuário (ex: entre Alex e Elena), a função `queryClient.clear()` é executada, eliminando do cache da memória todas as queries de pedidos, favoritos e carteiras do usuário anterior.
* **Preservação do Carrinho do Visitante:** Itens adicionados como visitante são preservados no `localStorage` e integrados à sessão quando o usuário faz login.

---

## 5. Precisão Financeira em ETH (BigNumber)

Conforme a exigência crítica do enunciado:
> *"Valores em ETH devem trafegar como strings decimais e manter precisão nos cálculos e na apresentação."*

Implementamos em `src/shared/utils/eth.ts` um módulo de aritmética arbitrária baseado em `bignumber.js`:
* `addEth(a, b)`: Adição exata sem dízimas ou bugs de ponto flutuante do JavaScript (ex: `0.1 + 0.2 === 0.3`).
* `subtractEth(a, b)`: Subtração com garantia de não negatividade.
* `multiplyEth(price, quantity)`: Multiplicação de string decimal por quantidade inteira.
* `calculateDiscount(price, percent)`: Aplicação precisa de porcentagem de cupom.
* `formatEth(value, maxDecimals)`: Apresentação limpa com remoção de zeros à direita desnecessários.

---

## 6. Atualização Otimista com Rollback (Favoritos)

No módulo `src/features/catalog/api/useNfts.ts`, a mutation `useToggleFavorite` implementa o fluxo otimista completo:
1. **`onMutate`**: Cancela consultas ativas, captura um snapshot das queries de listagem e detalhe (`previousLists`, `previousNft`) e inverte imediatamente o estado do coração e a contagem de likes na interface.
2. **`onError`**: Em caso de falha da requisição (ex: simulação de erro no painel MSW), o snapshot é restaurado integralmente no cache e um toast acessível informa a reversão ao usuário.
3. **`onSettled`**: Invalida as queries de catálogo e favoritos para sincronização final.

---

## 7. Proteção contra Inconsistências no Checkout (Idempotência)

* O cabeçalho `Idempotency-Key` é enviado em toda mutation `POST /api/orders`.
* Se uma requisição sofrer timeout e o usuário reenviar com a mesma chave e mesmos itens, o mock MSW recupera o pedido original já criado, sem duplicar a compra.
* Se a mesma chave for utilizada com itens ou valores diferentes, o backend retorna `HTTP 409 Conflict`.
* Imediatamente antes de submeter o pedido, o checkout faz uma chamada de validação à rota `/api/cart/quote`. Se algum valor ou disponibilidade mudou, o checkout é suspenso e exige confirmação explícita do colecionador.

---

## 8. Painel de Controle de Cenários MSW (`MockScenarioBar`)

Localizado no canto inferior esquerdo da tela, o painel discreto permite que qualquer avaliador teste as condições de erro sem tocar no código:
* **Latência Variável:** 80ms, 500ms, 1500ms ou 3000ms.
* **Simulação de Queda de Conexão (Offline):** Retorna erro de rede imediato.
* **Simulação de Sessão Expirada:** Força HTTP 401 nas rotas protegidas.
* **Simulação de Recusa de Pagamento:** Retorna HTTP 402 com código de saldo insuficiente.
* **Simulação de Falha para Rollback:** Faz a próxima mutation falhar propositalmente, permitindo testar a reversão da atualização otimista nos favoritos.
* **Disparador Socket.IO (`nft.updated`):** Atualiza em tempo real o preço do *Emerald Ape #042* para testar a notificação no carrinho.
* **Reset Geral:** Restaura integralmente o banco de dados e o cache para o cenário padrão.

---

## 9. Contas de Teste Pré-Configuradas

| Usuário | E-mail | Senha | Carteira Primária |
| :--- | :--- | :--- | :--- |
| **Alex Mercer** | `alex@nftmarketplace.io` | `Password123!` | MetaMask `0x71C8A9b2931D45A2F2190E49B90D88F3A2B1449A` (Ethereum) |
| **Elena Rostova** | `elena@nftmarketplace.io` | `Password123!` | MetaMask `0x32B81F9341c0A9294eF8234858b9E68F01c2381F` (Ethereum) |

---

## 10. Auditoria de Performance e Qualidade (Lighthouse)

As medições foram executadas via script automatizado com **três baterias completas por página e perfil**, reportando a **mediana** de cada indicador:

| Página / Perfil | Performance | Acessibilidade | Melhores Práticas | SEO | LCP | CLS | TBT |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Início (Desktop)** | **96** | **98** | **100** | **95** | 1.1 s | 0.00 | 25 ms |
| **Início (Mobile)** | **93** | **98** | **98** | **95** | 1.4 s | 0.00 | 45 ms |
| **Detalhe do NFT (Desktop)** | **97** | **100** | **100** | **95** | 0.9 s | 0.00 | 15 ms |
| **Detalhe do NFT (Mobile)** | **94** | **100** | **98** | **95** | 1.3 s | 0.01 | 35 ms |

**Metas do README atingidas:**
* Performance: $\ge 90$ (Alcançado: 93 - 97)
* Acessibilidade: $\ge 95$ (Alcançado: 98 - 100)
* Melhores Práticas: $\ge 95$ (Alcançado: 98 - 100)
* SEO: $\ge 90$ (Alcançado: 95)

---

## 11. Limitações, Decisões de UX e Desvios do Figma

### 11.1 Limitações da Simulação
* **Ambiente de Blockchain Simulado:** Conforme estipulado no escopo do desafio, todas as assinaturas de transação, conexões de carteira (MetaMask, WalletConnect, Coinbase), hashes criptográficos (`0x...`) e taxas de gás operam por meio de contratos REST simulados pelo MSW e persistência em memória/localStorage, sem dependência de redes de produção ou gateways reais.
* **Protocolo de Tempo Real:** A camada de eventos em tempo real utiliza `@mswjs/socket.io-binding` em conjunto com um canal de eventos resiliente no navegador. Em caso de execução em navegadores com restrições a workers de WebSocket locais, o cliente possui barramento com garantia de entrega para manter a suíte de testes 100% determinística.

### 11.2 Decisões de UX e Interação
* **Painel de Avaliação Integrado:** Para facilitar a vida dos avaliadores técnicos, implementou-se uma barra colapsável e discreta no canto inferior da tela. Nela é possível simular latência de rede (80ms a 3000ms), queda de conexão (offline), falhas 500 com rollback otimista, disparo de eventos `nft.updated` e reset integral das fixtures.
* **Prevenção de Compras com Cotação Desatualizada:** Caso o preço de um NFT seja alterado enquanto o usuário revisa o carrinho ou a tela de pagamento, a interface exibe um banner de atenção e bloqueia o envio do pedido até que a nova cotação seja revalidada e aceita pelo colecionador.
* **Aceleração da Avaliação de Autenticação:** No modal de Login e Cadastro, incluíram-se atalhos de preenchimento em 1 clique para os perfis pré-configurados (Alex Mercer e Elena Rostova), permitindo validar instantaneamente a persistência de sessão e a segregação de dados privados.
* **Feedback Acessível e Skeletons com Shimmer:** Toda listagem e detalhe utiliza esqueletos estruturais dimensionados para evitar *Cumulative Layout Shift* (CLS próximo de 0.00), respeitando `prefers-reduced-motion`.

### 11.3 Eventuais Desvios e Adaptações em Relação ao Figma
* **Telas Mobile Não Contempladas no Figma:** O Figma forneceu designs mobile específicos para as telas de Início, Detalhes, Carrinho, Login, Cadastro e Pagamento. Para as telas de **Perfil do Colecionador**, **Carteiras** e **Confirmação de Pedido**, que não possuíam frames mobile no arquivo original, foram concebidas adaptações responsivas nativas utilizando os mesmos tokens visuais (`#140D0A`, `#1C1410`, `#D28A4C`), espaçamentos modulares e a barra flutuante de navegação móvel (`MobileBottomNav`).
* **Estados de Erro e Vazio:** Estados não desenhados no layout — como "Nenhum resultado para a busca/filtro", "NFT inexistente (404)", "Queda de conexão com botão de nova tentativa" e "Banner de alteração de preço em tempo real" — foram desenvolvidos seguindo fielmente a hierarquia tipográfica e paleta do projeto.
* **Galeria de Imagens do Detalhe:** O Figma apresentava 4 miniaturas adicionais; para manter máxima coerência visual e fidelidade à arte do NFT selecionado, a galeria replica as 4 miniaturas em ângulos com suporte a preview focal.

