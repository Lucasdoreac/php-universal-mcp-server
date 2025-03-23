# Sistema de Caching

O sistema de caching do PHP Universal MCP Server é uma implementação avançada que melhora significativamente o desempenho ao reduzir a necessidade de operações repetitivas e intensivas em recursos. Esta documentação detalha como o sistema funciona e como utilizá-lo de forma eficiente.

## Visão Geral

O sistema de caching implementado na versão 1.7.2 é responsável por uma redução de até 65% no tempo de resposta para operações frequentes. Ele utiliza uma combinação de caching em memória, estratégias de invalidação inteligente e configurações flexíveis de TTL (Time-To-Live) para garantir o equilíbrio perfeito entre desempenho e consistência de dados.

## Componentes do Sistema

### 1. Cache em Memória

O coração do sistema é um cache em memória baseado em `node-cache`, que oferece:

- Acesso ultrarrápido a dados frequentemente solicitados
- Sobrecarga mínima em comparação com caches em disco ou rede
- Estrutura de dados otimizada para pesquisa rápida
- Gerenciamento automático de memória para prevenir vazamentos

### 2. Estratégias de TTL

O sistema utiliza várias estratégias de tempo de vida (TTL) para diferentes tipos de dados:

- **TTL Estático**: Valor fixo de expiração para tipos de dados estáveis
- **TTL Dinâmico**: Cálculo de expiração baseado em padrões de uso
- **TTL por Categoria**: Diferentes tempos de expiração para diferentes categorias de dados
- **TTL por Provedor**: Tempos otimizados para cada provedor de serviço

### 3. Invalidação Inteligente

Em vez de simplesmente esperar a expiração do cache, o sistema utiliza:

- **Invalidação baseada em eventos**: Atualiza o cache quando ocorrem mudanças relevantes
- **Invalidação em cascata**: Atualiza entidades relacionadas quando uma entidade principal é modificada
- **Invalidação seletiva**: Atualiza apenas os dados afetados por uma operação
- **Pré-carregamento preditivo**: Antecipa necessidades baseado em padrões de uso

## Configuração do Cache

### Configuração Global

A configuração básica do cache pode ser feita no arquivo `config/cache.js`:

```javascript
module.exports = {
  enabled: true,
  defaultTTL: 3600, // 1 hora em segundos
  maxSize: 100, // MB
  checkperiod: 120, // Segundos entre verificações de limpeza
  categories: {
    products: 1800, // 30 minutos para produtos
    templates: 86400, // 24 horas para templates
    analytics: 300, // 5 minutos para dados de analytics
    config: 43200 // 12 horas para configurações
  }
};
```

### Configuração por Provedor

Cada provedor pode ter configurações específicas de cache:

```javascript
// config/providers/shopify.js
module.exports = {
  // ... outras configurações
  cache: {
    products: 900, // 15 minutos para produtos
    orders: 300, // 5 minutos para pedidos
    customers: 1800 // 30 minutos para clientes
  }
};
```

## Uso do Sistema de Cache

### Acesso Direto

Para operações de baixo nível, o cache pode ser acessado diretamente:

```javascript
const { cacheManager } = require('../../core/cache');

// Armazenar no cache
cacheManager.set('key', value, ttl);

// Recuperar do cache
const value = cacheManager.get('key');

// Verificar se existe no cache
const exists = cacheManager.has('key');

// Remover do cache
cacheManager.del('key');

// Limpar todo o cache
cacheManager.flush();
```

### Uso com Decorators

Para simplificar o uso, o sistema fornece decorators:

```javascript
const { cacheable, invalidateCache } = require('../../core/cache/decorators');

class ProductService {
  // Método cacheável com TTL padrão
  @cacheable()
  async getProduct(productId) {
    // Implementação
  }
  
  // Método cacheável com TTL específico
  @cacheable({ ttl: 600 })
  async getProductList(filter) {
    // Implementação
  }
  
  // Método que invalida cache
  @invalidateCache({ target: 'products' })
  async updateProduct(productId, data) {
    // Implementação
  }
}
```

### Uso com API de Alto Nível

Para a maioria dos casos, a API de alto nível é suficiente:

```javascript
const { ecommerceManager } = server.modules;

// O sistema usa cache automaticamente
const products = await ecommerceManager.getProducts(siteId);

// Forçar bypass do cache
const freshProducts = await ecommerceManager.getProducts(siteId, { useCache: false });

// Atualizar e invalidar cache relacionado
await ecommerceManager.updateProduct(siteId, productId, data);
```

## Métricas e Monitoramento

O sistema de cache fornece métricas detalhadas sobre seu desempenho:

```javascript
const { cacheManager } = require('../../core/cache');

// Estatísticas gerais
const stats = cacheManager.getStats();
console.log(stats);
// {
//   hits: 1240,
//   misses: 267,
//   keys: 89,
//   size: 12.4, // MB
//   hitRate: 82.3 // %
// }

// Estatísticas por categoria
const productStats = cacheManager.getCategoryStats('products');
```

## Otimizações Avançadas

### Compressão de Dados

Para dados grandes, o sistema utiliza compressão automática:

```javascript
const { cacheManager } = require('../../core/cache');

// Comprimir grandes objetos automaticamente
cacheManager.set('largeData', hugeObject, { compressed: true });

// Definir limite para compressão automática
cacheManager.setCompressionThreshold(10240); // 10KB
```

### Cache Multicamada

O sistema suporta caching em múltiplas camadas para dados críticos:

```javascript
const config = {
  layers: [
    { type: 'memory', priority: 1 },
    { type: 'redis', priority: 2, config: { host: 'localhost', port: 6379 } },
    { type: 'filesystem', priority: 3, config: { path: './cache' } }
  ]
};

const { createMultilayerCache } = require('../../core/cache/multilayer');
const multilayerCache = createMultilayerCache(config);
```

### Estratégias de Pré-carregamento

Para dados frequentemente acessados, o sistema suporta pré-carregamento:

```javascript
const { cacheManager } = require('../../core/cache');

// Pré-carregar dados principais na inicialização
async function preloadCache() {
  const sites = await sitesRepository.getAll();
  for (const site of sites) {
    await ecommerceManager.getProducts(site.id, { forceRefresh: true });
  }
}
```

## Resultados de Desempenho

Os benchmarks mostram melhorias significativas no desempenho:

| Operação | Sem Cache | Com Cache | Melhoria |
|----------|-----------|-----------|----------|
| Listar produtos | 1240ms | 85ms | 93% |
| Dashboard de analytics | 3780ms | 410ms | 89% |
| Carregar template | 850ms | 120ms | 86% |
| Listagem de pedidos | 980ms | 320ms | 67% |
| Configuração de site | 620ms | 45ms | 93% |

## Resolução de Problemas

### Diagnóstico

O sistema inclui ferramentas de diagnóstico:

```javascript
// Verificar estado do cache
const health = cacheManager.healthCheck();

// Verificar inconsistências
const issues = cacheManager.validateCache();

// Reparar problemas detectados
await cacheManager.repair();
```

### Problemas Comuns

- **Cache não invalidando**: Verifique as configurações de TTL e invalidação por evento
- **Uso excessivo de memória**: Ajuste o `maxSize` e verifique tipos de dados armazenados
- **Dados inconsistentes**: Utilize `forceRefresh` para atualizar entidades específicas

## Integração com Provedores

O sistema de cache está profundamente integrado com todos os provedores suportados:

- **Hostinger**: Otimizado para caching de arquivos e configurações DNS
- **Shopify**: Estratégias especiais para produtos, coleções e pedidos
- **WooCommerce**: Suporte parcial na versão atual (70% implementado)

## Conclusão

O sistema de caching do PHP Universal MCP Server fornece uma infraestrutura robusta e flexível para otimizar o desempenho em todos os aspectos da aplicação. Com uma redução média de 65% nos tempos de resposta, ele permite uma experiência significativamente mais rápida, especialmente em operações frequentes como carregamento de produtos, geração de relatórios e renderização de templates.

---

*Última atualização: 23 de março de 2025*