# Guia da Solução — Instruções de Execução e Avaliação

## 🌐 Links da Entrega
* **Aplicação em Produção (Vercel)**: [https://frontend-challenge-rho-bice.vercel.app](https://frontend-challenge-rho-bice.vercel.app)
* **Repositório GitHub**: [https://github.com/GuilhermeFriedrichS/frontend-challenge](https://github.com/GuilhermeFriedrichS/frontend-challenge)

---

### 1. Requisitos de Ambiente
* **Node.js**: v20+ ou v22+
* **npm**: v10+

### 2. Instalação e Execução Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (com MSW e Socket.IO ativos)
npm run dev

# Acesse no navegador:
# http://localhost:3000
```

### 3. Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento Vite na porta 3000 |
| `npm run build` | Compila o bundle de produção TypeScript + Vite em `dist/` |
| `npm run preview` | Serve o build compilado localmente na porta 4173 |
| `npm run typecheck` | Executa a verificação estrita de tipos com `tsc --noEmit` |
| `npm run lint` | Executa a verificação estática de tipos e linter |
| `npm run test` | Executa a suíte de testes unitários com Vitest |
| `npm run test:e2e` | Executa os testes de ponta a ponta com Playwright em modo headless |
| `npm run test:e2e:ui` | Abre o painel interativo do Playwright para inspeção visual |
| `npm run audit:lighthouse` | Executa 3 baterias Lighthouse completas e extrai medianas |

### 4. Deploy em Produção (Vercel, Netlify, Cloudflare Pages)

O projeto já inclui as configurações completas de roteamento SPA (`vercel.json` e `public/_redirects`), garantindo que refresh e links diretos para qualquer rota (`/cart`, `/checkout`, `/nft/:id`, `/profile`, `/wallets`) funcionem com HTTP 200:

* **URL Pública Publicada**: [https://frontend-challenge-rho-bice.vercel.app](https://frontend-challenge-rho-bice.vercel.app)
* **Vercel**:
  1. Conecte o repositório ou execute `npx vercel`
  2. Framework Preset: **Vite**
  3. Build Command: `npm run build`
  4. Output Directory: `dist`
* **Netlify**:
  1. Conecte o repositório ou execute `npx netlify deploy --prod`
  2. Build Command: `npm run build`
  3. Publish Directory: `dist`
* **Mocks no Deploy**: A camada MSW e Socket.IO mock permanecem ativas por padrão no bundle de produção para permitir que os avaliadores testem todas as funcionalidades sem backend privado.

### 5. Variáveis de Ambiente
Crie um arquivo `.env` na raiz caso queira desativar mocks (padrão é ativo):
```env
VITE_ENABLE_MOCKS=true
```

### 6. Credenciais de Teste Pré-Configuradas

| Usuário | E-mail | Senha | Função |
| :--- | :--- | :--- | :--- |
| **Alex Mercer** | `alex@nftmarketplace.io` | `Password123!` | Colecionador com favoritos e pedidos prévios |
| **Elena Rostova** | `elena@nftmarketplace.io` | `Password123!` | Curadora com carteiras e favoritos isolados |

*(Dica: No modal de login há botões rápidos para preencher qualquer uma das contas em 1 clique).*

### 7. Seleção de Cenários, Falhas e Reset (Painel de Avaliação)

O aplicativo conta com o **Painel de Avaliação (MSW & Socket.IO)** fixado no canto inferior esquerdo da tela. Através dele, qualquer avaliador pode simular latência, falhas controladas e eventos em tempo real:

#### 1. Seleção e Controle de Latência
* No painel, selecione entre: **80ms (Normal)**, **500ms (Moderada)**, **1500ms (Lenta)** ou **3000ms (Extrema)**.
* **Resultado:** Todas as consultas exibirão os **skeletons com shimmer effect**, permitindo avaliar as transições sem layout shift.

#### 2. Atualização Otimista com Rollback (Favoritos)
* No painel, clique em **"Simular Falha na Próxima Ação (Rollback)"**.
* Em seguida, clique no ícone de coração de qualquer NFT (no catálogo ou no detalhe).
* **Resultado esperado:** O coração é marcado instantaneamente (otimista), mas ao receber o erro 500 da simulação, a interface faz rollback automático e exibe um toast acessível informando a falha.

#### 3. Alteração de Preço em Tempo Real (Socket.IO)
* Adicione o NFT *Emerald Ape #042* ao carrinho e abra a página `/cart`.
* No painel, clique em **"Disparar nft.updated via Socket"**.
* **Resultado esperado:** O socket emite o evento versionado. O carrinho detecta a alteração, exibe um banner de alerta destacando o novo valor e **bloqueia o avanço para checkout** até que o usuário confirme a cotação atualizada.

#### 4. Queda de Rede e Recuperação (Offline)
* No painel, marque a opção **"Simular Queda de Rede"**.
* Tente navegar para o detalhe de um NFT ou atualizar a página.
* **Resultado esperado:** A interface exibe feedback de falha de conexão com botão de **"Tentar novamente"**. Desmarque a opção no painel e clique em tentar novamente para recuperar o estado.

#### 5. Simulação de Pagamento Recusado
* No painel, marque a opção **"Simular Pagamento Recusado"**.
* Avance para a tela de pagamento `/checkout` e clique em **"Confirmar compra"**.
* **Resultado esperado:** A API simula recusa por saldo insuficiente (HTTP 402), preservando os itens no carrinho para nova tentativa.

#### 6. Simulação de Sessão Expirada
* No painel, marque a opção **"Simular Sessão Expirada (401)"**.
* Tente acessar `/profile`, `/wallets` ou submeter um checkout.
* **Resultado esperado:** O cliente detecta o 401, limpa o token de sessão e redireciona com feedback para login.

#### 7. Cupom Inválido ou Válido
* No carrinho, digite qualquer código aleatório (ex: `TESTE`) e clique em **Aplicar** -> exibe erro *"Cupom inválido ou expirado"*.
* Digite o código oficial **`WELCOME10`** e clique em **Aplicar** -> aplica 10% de desconto com recálculo preciso em ETH.

#### 8. Conflito de Cadastro
* Abra o modal de cadastro e tente registrar com o e-mail `alex@nftmarketplace.io`.
* **Resultado esperado:** A API retorna HTTP 409 Conflict informando que a conta já existe.

#### 9. Idempotência no Checkout (Anti-duplicação)
* Na página de pagamento, múltiplos envios utilizam o cabeçalho `Idempotency-Key` único para recuperar o mesmo pedido sem duplicar compras ou gerar cobranças extras.

#### 10. Reset Geral dos Dados (Restaurar Cenário Padrão)
* No painel, clique no botão **"Resetar Banco para Padrão"**.
* **Resultado:** Limpa o `localStorage`, reverte preços, pedidos, edições, favoritos e carteiras para as fixtures originais limpas.

---

Para detalhes completos de arquitetura, contratos e relatórios Lighthouse, consulte [`ARCHITECTURE.md`](./ARCHITECTURE.md).