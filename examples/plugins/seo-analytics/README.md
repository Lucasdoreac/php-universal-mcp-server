# SEO Analytics Plugin

Plugin para análise de SEO de sites e e-commerce para o PHP Universal MCP Server.

## Funcionalidades

- Análise automática de SEO para produtos
- Análise de páginas web
- Geração de relatórios de SEO para o site
- Dashboard visual com métricas e gráficos
- Sugestões de otimização

## Instalação

```
plugins install seo-analytics
```

## Comandos do Claude Desktop

```
# Analisar SEO de um produto
seo analisar produto <site-id> <produto-id>

# Analisar SEO de uma página
seo analisar pagina <site-id> <url>

# Gerar relatório de SEO do site
seo relatorio <site-id>

# Visualizar dashboard de SEO
seo dashboard <site-id>
```

## Configuração

O plugin pode ser configurado com os seguintes parâmetros:

```javascript
{
  "minTitleLength": 50,       // Comprimento mínimo recomendado para títulos
  "minDescriptionLength": 160, // Comprimento mínimo recomendado para descrições
  "minImagesPerProduct": 3,    // Número mínimo recomendado de imagens por produto
  "keywordDensity": 2          // Densidade de palavras-chave recomendada (porcentagem)
}
```

## API

### seo.analyzeProduct

Analisa o SEO de um produto específico.

**Parâmetros:**
- `productId`: ID do produto
- `siteId`: ID do site

**Resposta:**
```json
{
  "success": true,
  "data": {
    "productId": "123",
    "productName": "Nome do Produto",
    "timestamp": "2025-03-23T15:30:45.123Z",
    "scores": {
      "title": 8,
      "description": 9,
      "images": 7,
      "keywords": 8,
      "total": 8.2
    },
    "suggestions": [
      {
        "type": "images",
        "message": "Adicione mais imagens ao produto. Mínimo recomendado: 3 imagens."
      }
    ],
    "details": {
      "titleLength": 45,
      "descriptionLength": 180,
      "imageCount": 2,
      "recommendedTitleLength": 50,
      "recommendedDescriptionLength": 160,
      "recommendedImageCount": 3
    }
  }
}
```

### seo.analyzePage

Analisa o SEO de uma página web.

**Parâmetros:**
- `url`: URL da página
- `siteId`: ID do site

### seo.generateReport

Gera um relatório de SEO para o site.

**Parâmetros:**
- `siteId`: ID do site

### seo.dashboard

Gera um dashboard visual de SEO para o site.

**Parâmetros:**
- `siteId`: ID do site

## Exemplos de Uso

```javascript
// Analisar produto
const analysis = await server.callMethod('seo.analyzeProduct', {
  productId: '123',
  siteId: 'site-456'
});

// Gerar dashboard
const dashboard = await server.callMethod('seo.dashboard', {
  siteId: 'site-456'
});
```

## Hooks

O plugin registra os seguintes hooks:

- `product:created` - Analisa automaticamente novos produtos
- `product:updated` - Atualiza a análise quando um produto é atualizado