# Testes de Carga para o Renderizador Progressivo

Este diretório contém as ferramentas e scripts para testar o desempenho do renderizador progressivo com templates extremamente grandes e diversos casos de uso.

## Visão Geral

O sistema de testes de carga é composto por quatro componentes principais:

1. **Template Generator** (`template-generator.js`): Gera templates HTML extremamente grandes com diferentes níveis de complexidade e características para teste.

2. **Load Test Runner** (`load-test-runner.js`): Executa testes de carga com os templates gerados, medindo tempo de renderização, uso de memória e outros indicadores.

3. **Extreme Template Test Runner** (`extreme-template-test-runner.js`): Especializado em testes de templates particularmente grandes e complexos, com análise avançada.

4. **Load Test Analyzer** (`load-test-analyzer.js`): Analisa os resultados dos testes para identificar gargalos, padrões e oportunidades de otimização.

5. **CLI de Testes de Carga** (`cli-load-test.js`): Interface de linha de comando para executar os testes e análises facilmente.

## Requisitos

- Node.js v14.0.0 ou superior
- Dependências instaladas via NPM

## Instalação

```bash
# Instale as dependências necessárias
npm install commander mathjs jsdom
```

## Uso do CLI

O script CLI (`cli-load-test.js`) fornece uma interface amigável para executar todos os tipos de testes:

```bash
# Modo padrão (testes básicos)
node tests/performance/cli-load-test.js

# Modo extremo (testes com templates extremamente grandes)
node tests/performance/cli-load-test.js --mode extreme

# Analisar resultados existentes
node tests/performance/cli-load-test.js --mode analyze --output ./results

# Testar um template específico
node tests/performance/cli-load-test.js --template extreme-large

# Ajuda e mais opções
node tests/performance/cli-load-test.js --help
```

### Opções do CLI

| Opção                  | Descrição                                                     | Padrão      |
|------------------------|-----------------------------------------------------------------|------------|
| `-m, --mode <mode>`    | Modo de teste (extreme, standard, analyze)                      | standard   |
| `-t, --template <n>`   | Nome específico de template para testar                         |            |
| `-o, --output <dir>`   | Diretório de saída para resultados                              | auto       |
| `-i, --iterations <n>` | Número de iterações para cada teste                             | 3          |
| `-f, --force-regenerate` | Forçar regeneração de templates                               | false      |
| `-v, --verbose`        | Saída detalhada                                                 | false      |
| `-c, --compare`        | Comparar diferentes estratégias de renderização                 | true       |
| `--memory-test`        | Executar testes específicos de consumo de memória               | false      |
| `--concurrency <n>`    | Número de execuções concorrentes para testes de carga           | 2          |
| `--load-only`          | Apenas carregar e analisar resultados existentes                | false      |

## Templates de Teste

Os templates gerados para testes variam em complexidade:

- **extreme-large**: ~500 componentes
- **ultra-large**: ~1000 componentes
- **monster-large**: ~2000 componentes
- **edge-cases**: ~500 componentes com padrões desafiadores

## Relatórios e Análises

O sistema gera vários relatórios detalhados:

1. **HTML Dashboard** (`analysis-dashboard.html`): Visualização interativa dos resultados
2. **Relatório Markdown** (`analysis-summary.md`): Resumo e recomendações em formato de texto
3. **Dados JSON** (`analysis-full.json`): Dados completos para análise personalizada

## Exemplos de Código

### Gerando Templates

```javascript
const TemplateGenerator = require('./template-generator');

async function generateTemplates() {
  const generator = new TemplateGenerator();
  await generator.initialize();
  
  // Gerar template com ~500 componentes
  await generator.generateLargeTemplate('my-template', 500);
}
```

### Executando Testes

```javascript
const LoadTestRunner = require('./load-test-runner');

async function runTests() {
  const runner = new LoadTestRunner({
    iterations: 5,
    compareRenderers: true
  });
  
  await runner.initialize();
  await runner.testTemplatePerformance('extreme-large.html');
}
```

### Analisando Resultados

```javascript
const LoadTestAnalyzer = require('./load-test-analyzer');

async function analyzeResults() {
  const analyzer = new LoadTestAnalyzer({
    inputDir: './test-results',
    outputDir: './analysis'
  });
  
  await analyzer.initialize();
  await analyzer.loadResults();
  const analysis = await analyzer.analyzeResults();
  
  console.log('Recomendações prioritárias:', analysis.optimizationPriorities);
}
```

## Interpretação dos Resultados

Os relatórios de análise incluem:

- **Comparação de Renderizadores**: Avaliação dos diferentes métodos de renderização
- **Gargalos de Desempenho**: Identificação de padrões problemáticos
- **Métricas de Correlação**: Relação entre tamanho, componentes e desempenho
- **Recomendações Priorizadas**: Sugestões concretas para otimização

## Resolução de Problemas

Se encontrar erros durante a execução dos testes:

1. Verifique se todas as dependências estão instaladas
2. Use a opção `--verbose` para obter mais detalhes sobre o erro
3. Confira se há limitações de memória que possam afetar os testes extremos

Para testes que falham consistentemente com templates extremamente grandes, tente reduzir o parâmetro `componentMultiplier` no arquivo `template-generator.js`.

## Próximos Passos

- [ ] Implementar suporte para testes distribuídos
- [ ] Adicionar mais métricas de desempenho avançadas
- [ ] Integrar com ferramentas de CI/CD
- [ ] Desenvolver mecanismo de referência automática para otimizações
