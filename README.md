# Stara Despesas (OCR)

App mobile de gestão de despesas: o colaborador fotografa a nota, o OCR devolve os campos em texto, ele ajusta o que for preciso (inclusive removendo itens que não devem ser reembolsados) e agrupa tudo em relatórios — por exemplo, uma viagem de 4 dias — que são enviados por API para aprovação do gestor.

> **Estado atual:** autenticação, OCR e API estão **mockados**. Toda a arquitetura já está pronta para a integração real (ver [Trocar mock por API real](#trocar-mock-por-api-real)).

## Stack

| Camada | Tecnologia |
|---|---|
| App | Expo SDK 57, React Native 0.86 (New Architecture), React 19 + React Compiler, TypeScript estrito |
| Navegação | Expo Router (rotas protegidas com `Stack.Protected`, abas nativas) |
| Dados locais | `expo-sqlite` + Drizzle ORM (migrations tipadas) |
| Sincronização | Outbox próprio (fila persistida) + `expo-network` |
| Estado | TanStack Query v5 (dados) + Zustand (sessão/UI) |
| Validação | Zod (respostas da API, formulários, sessão) |
| Segurança | `expo-secure-store` (Keychain/Keystore), `expo-crypto` (UUIDs) |
| i18n | i18next + `expo-localization` (pt-BR e en) |
| Testes | Jest + jest-expo |

## Como rodar

```bash
npm install
cp .env.example .env.local   # opcional; por padrão usa mocks
npx expo start               # abre no Expo Go ou em um development build
```

No modo mock, entre com **qualquer e-mail válido e senha com 6+ caracteres**.

| Script | O que faz |
|---|---|
| `npm test` | Testes unitários |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (inclui a regra de dependências da clean architecture) |
| `npm run validate` | typecheck + testes + lint |
| `npm run db:generate` | Gera migration após alterar `src/infra/database/schema.ts` |
| `npm run doctor` | `expo-doctor` |

## Arquitetura

Clean architecture no mesmo estilo do `app-stara-ai`: **cada ação do app é uma classe que implementa `UseCase<Input, Output>` e expõe `execute()`**.

```ts
const expense = await removeExpenseItemUseCase.execute({ expenseId, itemId, reason: 'Bebida alcoólica' });
```

```
src/
├── core/            # Contratos base: UseCase, erros, Clock/IdGenerator/Logger
├── domain/          # Regras de negócio — TypeScript puro (sem React/Expo)
│   ├── entities/        Expense, ExpenseReport, AuditEntry, User…
│   ├── shared/          Money (centavos + moeda), datas
│   ├── services/        ReportSummaryCalculator
│   ├── repositories/    Interfaces (ExpenseRepository, SyncQueue…)
│   ├── gateways/        Interfaces externas (OcrGateway, AuthGateway…)
│   └── usecases/        auth/ expense/ report/ sync/ — uma classe por ação
├── infra/           # Implementações: SQLite/Drizzle, SecureStore, FileSystem, HTTP, mocks
├── di/container.ts  # Composition root — único lugar que conhece as implementações
├── presentation/    # Componentes, hooks (React Query), stores (Zustand), tema, i18n
└── app/             # Rotas do Expo Router (somente telas)
```

Regra de dependência: `app → presentation → domain ← infra`. O ESLint **bloqueia** imports de React/Expo/infra dentro de `src/domain` e `src/core`.

### Fluxo principal

1. **Captura (home)** → *Escanear* (câmera), *Arquivos* (PDF ou imagem), *Imagens* (galeria) ou *Colar* (imagem da área de transferência). Todas passam pelo `CaptureReceiptUseCase`, que copia o comprovante para a área privada do app, cria a despesa como *aguardando leitura* e enfileira o OCR. O sino da home reúne avisos: decisões do gestor, notas ilegíveis e falhas de envio.
2. **Sync** → com internet o `SyncEngine` processa na hora; sem internet a operação fica no SQLite e é enviada quando a conexão voltar (também ao reabrir o app e periodicamente, com backoff exponencial + jitter).
3. **OCR** → upload + leitura em etapas retomáveis; o resultado é validado com Zod e aplicado à despesa. Se o usuário já preencheu manualmente, os dados dele são mantidos.
4. **Edição** → corrigir/adicionar/remover itens recalcula o total (desconto proporcional) e grava **histórico de auditoria** (quem, quando, de → para, motivo), que o gestor verá na aprovação.
5. **Relatório** → agrupa despesas de vários dias (ex.: viagem), mostra totais por dia/categoria e saldo do adiantamento. Na aba Despesas, a visão **Semana** cria um relatório com as despesas avulsas da semana.
6. **Aprovação** → o relatório pode ser editado até ser aprovado (alterações pós-envio ficam destacadas no histórico). Aprovado, relatório e despesas ficam imutáveis.

### Regras de negócio cobertas por testes

- Remover item recalcula o total, mantém o item visível como "removido" e registra motivo e valor anterior.
- Desconto da nota é aplicado proporcionalmente aos itens mantidos.
- Edição de item recalcula `quantidade × preço` e grava o diff.
- Bloqueio total após aprovação; acesso negado a despesas de outro usuário.
- Fila offline: backoff, erro permanente (DEAD), nota ilegível, envio do relatório aguardando OCR, e **nenhuma edição perdida** se o usuário alterar a despesa durante um envio.

## Segurança

- Tokens somente no Keychain/Keystore (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`), nunca em SQLite/AsyncStorage.
- Logout apaga banco local e fotos (e avisa se houver dados não enviados).
- Toda resposta da API passa por schema Zod antes de virar entidade; erros técnicos nunca chegam à UI.
- HTTPS obrigatório, timeout, renovação de token única em 401, `Idempotency-Key` em todas as escritas.
- Fotos sem EXIF (sem localização), validação de tipo e tamanho, Android `allowBackup: false`.
- Logger redige campos sensíveis; console desativado em produção.

## Trocar mock por API real

1. Defina no `.env.local` / EAS: `EXPO_PUBLIC_USE_MOCKS=false` e `EXPO_PUBLIC_API_URL=https://…`.
2. Ajuste os endpoints e DTOs em `src/infra/gateways/http/*` e `src/infra/http/dto.ts` ao contrato do backend (os atuais são provisórios).
3. Nenhum caso de uso, entidade ou tela precisa mudar.

## Pendências / decisões em aberto

- **Contrato da API e do OCR** (campos definitivos) — hoje são lidos todos os campos.
- **Fluxo de reprovação** — o status `REJECTED` existe, mas por ora bloqueia o relatório.
- **Telas do gestor** — previstas para um app web; o perfil `MANAGER` já existe no domínio.
- **Provedor de identidade** (ex.: OAuth2 + PKCE como no app da IA).
- **Criptografia do SQLite** (SQLCipher via `useSQLCipher`, exige development build).
- **Monitoramento** (Sentry/Datadog) — ponto de integração no `ConsoleLogger`.
- **Bundle id** definitivo (`app.config.ts`) e fontes Montserrat da identidade STARA.
