# Sistema de Testes de Integração para Renderizadores Avançados

Este diretório contém testes de integração para o Sistema Avançado de Renderização do PHP Universal MCP Server. 

## Estrutura

Os testes estão organizados da seguinte forma:

- **advanced-rendering-system.test.js**: Testes para o sistema de renderização avançada como um todo.
- **edge-case-optimizer-advanced.test.js**: Testes para o otimizador avançado de edge cases.
- **smart-renderer.test.js**: Testes para o renderizador inteligente que seleciona a melhor estratégia.
- **streaming-renderer.test.js**: Testes para o renderizador streaming para templates extremamente grandes.

## Execução dos Testes

### Execução Individual

Para executar um teste específico:

```bash
npx mocha tests/integration/renderers/smart-renderer.test.js
```

### Execução Completa

Para executar todos os testes de integração do sistema de renderização de uma vez:

```bash
node tests/scripts/run-advanced-rendering-tests.js
```

Esse script:

1. Executa todos os testes de integração
2. Coleta métricas detalhadas de desempenho
3. Compara com execuções anteriores para detectar regressões
4. Gera relatórios detalhados em múltiplos formatos (JSON, HTML, CSV)
5. Salva histórico para acompanhamento de tendências

### Opções de Execução

O script `run-advanced-rendering-tests.js` aceita as seguintes opções:

- `--parallel`: Executa testes em paralelo (mais rápido, mas pode gerar resultados menos precisos para métricas de performance)
- `--max-parallel=N`: Define o número máximo de testes executados simultaneamente (padrão: 2)
- `--no-compare`: Desativa a comparação com execuções anteriores
- `--report-formats=json,html,csv`: Define os formatos de relatório a serem gerados
- `--history-limit=N`: Define o número máximo de execuções a serem mantidas no histórico (padrão: 10)

Exemplo:

```bash
node tests/scripts/run-advanced-rendering-tests.js --parallel --max-parallel=3 --report-formats=json,html
```

## Visualização no Claude Desktop

Para gerar visualizações dos resultados de testes que podem ser usadas como artifacts no Claude Desktop:

```bash
node tests/scripts/generate-claude-visualization.js
```

Por padrão, esse script gera visualizações para o relatório mais recente. Você pode especificar um relatório específico:

```bash
node tests/scripts/generate-claude-visualization.js --report tests/output/reports/seu-relatorio.json
```

Os artifacts gerados são salvos no diretório `tests/output/claude-artifacts/`.

## Interpretação dos Resultados

Os relatórios incluem:

### Métricas Principais

- **Testes Passados/Falhos**: Número total de testes que passaram ou falharam
- **Duração Total**: Tempo total de execução de todos os testes
- **Duração Média**: Tempo médio por teste
- **Teste Mais Lento**: O teste que levou mais tempo para executar
- **Taxa de Sucesso**: Porcentagem de testes que passaram

### Detecção de Regressões

O sistema detecta automaticamente regressões de performance com base nos seguintes limites:

- **Alerta**: Aumento de tempo de execução maior que 10%
- **Crítico**: Aumento de tempo de execução maior que 25%

As regressões detectadas são destacadas nos relatórios para facilitar a identificação de problemas.

### Melhorias

O sistema também destaca melhorias significativas:

- **Significativa**: Redução no tempo de execução maior que 10%

## Relatórios Gerados

Os relatórios são salvos no diretório `tests/output/reports/`:

- **JSON**: Contém todos os dados brutos para processamento automatizado
- **HTML**: Visualização interativa com gráficos e detalhes
- **CSV**: Formato tabular para importação em planilhas

## Histórico e Comparações

Os relatórios históricos são salvos para permitir comparações ao longo do tempo. As comparações mostram:

- Alterações na performance entre execuções
- Tendências ao longo do tempo
- Regressões e melhorias detectadas

As comparações são salvas no diretório `tests/output/reports/comparison/`.

## Integração com Claude Desktop

Usando o gerador de visualizações, você pode criar components React que podem ser usados como artifacts no Claude Desktop para visualização interativa dos resultados de teste.

Para usar a visualização no Claude Desktop:

1. Execute o script `generate-claude-visualization.js`
2. Copie o conteúdo do arquivo gerado `.jsx` para um artifact React no Claude Desktop
3. A visualização interativa permitirá navegar pelos resultados dos testes, ver métricas e identificar problemas

## Manutenção e Extensão

Para adicionar novos testes de integração:

1. Crie um novo arquivo `seu-componente.test.js` neste diretório
2. Adicione o arquivo à lista de testes em `run-advanced-rendering-tests.js`
3. Execute os testes para verificar integração

## Troubleshooting

Se você encontrar problemas ao executar os testes:

1. Verifique se todas as dependências do projeto estão instaladas: `npm install`
2. Certifique-se de que o ambiente de teste está configurado: `node tests/setup.js`
3. Para problemas específicos de um teste, execute-o individualmente para isolamento
4. Verifique os logs de erro detalhados nos relatórios gerados
