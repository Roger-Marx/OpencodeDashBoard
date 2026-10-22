# OpenCode Monitor

Dashboard local do OpenCode: atividade, tokens, custo, modelos, agentes e ferramentas do
serviço que está rodando nesta máquina.

## Requisitos

- Node.js 20 ou superior
- OpenCode instalado, com o serviço em background ativo (`opencode service status`)

## Rodar

```bash
npm install
npm run dev
```

Abra <http://localhost:5173>. A atualização automática acontece a cada 30 segundos e pode
ser pausada na barra superior. O período pode ser alternado entre 7, 30, 90 dias e tudo.

Para gerar o build e servir localmente:

```bash
npm run build
npm run preview   # http://localhost:4173
```

Testes das funções de agregação:

```bash
npm test
```

## Como os dados chegam

O serviço do OpenCode exige autenticação e não libera CORS para o navegador. Por isso o
navegador nunca fala com ele diretamente. Um middleware do servidor Vite executa
`opencode api get` e entrega o JSON em `/oc-api/overview`:

| Rota do OpenCode | Uso no dashboard |
| --- | --- |
| `/api/info` | versão, PID, URL, capacidades e caminhos |
| `/api/experimental/session/stats` | totais, atividade diária, modelos e ferramentas |
| `/api/session` | série diária de sessões, tokens e custo, além da tabela de sessões |
| `/api/agent` | agentes carregados |
| `/api/session/active` | sessões em execução |
| `/api/location` | diretório do serviço |

Nada é gravado em disco e nenhum dado sai da máquina. As respostas ficam em cache de
memória por 10 segundos para evitar disparar o CLI a cada requisição.

### Série diária

`stats` entrega passos por dia, mas não tokens nem custo por dia. Essas duas séries são
calculadas a partir das sessões, agrupadas pelo **dia de criação**. Os totais dos cartões
vêm de `stats`, que é a agregação oficial do servidor. É por isso que o subtítulo do
gráfico de tokens deixa claro o critério de agrupamento.

## Configuração

Variáveis de ambiente opcionais:

| Variável | Padrão | Efeito |
| --- | --- | --- |
| `OPENCODE_BIN` | `opencode` | caminho do executável do OpenCode |
| `OC_MONITOR_CACHE_MS` | `10000` | tempo de cache das respostas do CLI |
| `OC_MONITOR_TIMEOUT_MS` | `30000` | timeout de cada chamada ao CLI |

## Estrutura

```
server/          bridge com o CLI (cache, validação, agregação do overview)
shared/          tipos compartilhados entre servidor e cliente
src/lib/         métricas puras, formatação e hook de dados
src/components/  cartões, gráficos, tabelas e painéis
```

## Limitações da v1

- Sem histórico próprio: o dashboard lê o que o serviço do OpenCode mantém.
- Custo e tokens por dia usam a data de criação da sessão.
- Não edita sessões, agentes nem configuração.
