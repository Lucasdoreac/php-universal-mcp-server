# Site Design System

O Site Design System é um componente do PHP Universal MCP Server que fornece ferramentas robustas para criar, gerenciar e personalizar a aparência visual de sites e lojas de e-commerce.

## Funcionalidades Principais

- **Motor de Templates Flexível**: Sistema de templates baseado em Handlebars com suporte a componentes reutilizáveis
- **Sistema de Temas Personalizáveis**: Gerenciamento de temas com suporte a versionamento e customização
- **Componentes Visuais Reutilizáveis**: Biblioteca de componentes para cabeçalhos, rodapés, produtos e mais
- **Preview em Tempo Real**: Visualização de alterações antes da publicação
- **API Unificada**: Interface única para diferentes plataformas (Hostinger, WooCommerce, Shopify)
- **Criação de Assets Otimizados**: Geração de CSS e JavaScript otimizados para performance

## Estrutura do Módulo

```
modules/design/
├── components/         # Componentes visuais reutilizáveis
│   ├── header/         # Componentes de cabeçalho
│   ├── footer/         # Componentes de rodapé
│   ├── product/        # Componentes de produto
│   ├── cart/           # Componentes de carrinho
│   └── ui/              # Componentes de interface geral
├── controllers/       # Controladores para operações de design
├── models/            # Modelos de dados para temas e componentes
├── services/          # Serviços para gerenciamento e renderização
├── templates/         # Biblioteca de templates pré-definidos
│   ├── ecommerce/      # Templates específicos para e-commerce
│   ├── blog/           # Templates para blogs e conteúdo
│   └── landing/         # Templates para landing pages
├── themes/            # Sistema de temas
└── index.js           # Ponto de entrada do módulo
```

## Serviços Implementados

### TemplateRenderer

Serviço para renderização de templates com suporte a componentes e variáveis de tema.

```javascript
const templateRenderer = new TemplateRenderer({
  templatesDir: 'path/to/templates',
  componentsDir: 'path/to/components',
  cache: cacheInstance
});

// Renderizar um template
const html = await templateRenderer.renderTemplate('modern-shop', data, {
  category: 'ecommerce',
  components: ['header/modern-header', 'product/product-card']
});
```

### ComponentManager

Serviço para gerenciar componentes reutilizáveis e suas configurações.

```javascript
const componentManager = new ComponentManager({
  componentsDir: 'path/to/components',
  templateRenderer: templateRendererInstance,
  cache: cacheInstance
});

// Listar componentes
const headerComponents = await componentManager.getComponentsByCategory('header');

// Renderizar um componente
const { html, css, js } = await componentManager.renderComponent(
  'modern-header',
  'header',
  { site: { name: 'Minha Loja' } },
  { logoAlignment: 'center' }
);
```

### ThemeManager

Serviço para gerenciar temas e personalizações visuais.

```javascript
const themeManager = new ThemeManager({
  themesDir: 'path/to/themes',
  templateRenderer: templateRendererInstance,
  cache: cacheInstance
});

// Obter tema de um site
const theme = await themeManager.getSiteTheme('site123');

// Personalizar tema
const customizedTheme = await themeManager.customizeSiteTheme('site123', {
  colors: {
    primary: '#3498db',
    secondary: '#2ecc71'
  }
});
```

### PreviewService

Serviço para geração e gerenciamento de previews de alterações de design.

```javascript
const previewService = new PreviewService({
  templateRenderer: templateRendererInstance,
  themeManager: themeManagerInstance,
  cache: cacheInstance
});

// Criar um preview
const preview = await previewService.createPreview('site123', {
  colors: { primary: '#e74c3c' }
});

// Renderizar um preview
const previewHtml = await previewService.renderPreview(preview.id);

// Aplicar um preview
const result = await previewService.applyPreview(preview.id);
```

## Como Usar

### Inicialização do Módulo

```javascript
const { DesignSystem } = require('./modules/design');

// Inicializar o Design System
const designSystem = new DesignSystem({
  providerManager,
  cache: cacheInstance
});

// Registrar métodos da API no servidor MCP
designSystem.registerApiMethods(mcpServer);
```

### Operações Básicas

```javascript
// Listar templates disponíveis
const templates = await designSystem.getTemplates({ category: 'ecommerce' });

// Aplicar um template
const result = await designSystem.applyTemplate('site123', 'modern-shop');

// Personalizar cores e tipografia
const customization = await designSystem.customize('site123', {
  colors: {
    primary: '#3498db',
    secondary: '#2ecc71',
    accent: '#e74c3c'
  },
  typography: {
    headingFont: 'Montserrat'
  }
});

// Gerar preview de alterações
const preview = await designSystem.preview('site123', {
  colors: {
    primary: '#9b59b6'
  }
});

// Publicar alterações
const published = await designSystem.publish('site123');
```

## Modelos de Dados

### Theme

O modelo `Theme` representa a configuração visual de um site, incluindo cores, tipografia, espaçamentos e mais.

```javascript
const theme = new Theme({
  id: 'theme_123',
  name: 'Tema Azul',
  description: 'Um tema moderno com tons de azul',
  colors: {
    primary: '#3498db',
    secondary: '#2ecc71',
    accent: '#e74c3c',
    background: '#ffffff',
    text: '#333333'
  },
  typography: {
    headingFont: 'Montserrat, sans-serif',
    bodyFont: 'Open Sans, sans-serif',
    baseFontSize: '16px'
  },
  // Outras propriedades...
});
```

### Template

O modelo `Template` representa um design completo para um site ou loja.

```javascript
const template = new Template({
  id: 'modern-shop',
  name: 'Modern Shop',
  description: 'Template moderno para lojas virtuais',
  category: 'ecommerce',
  theme: themeData,
  preview: 'preview.png',
  components: ['header/modern-header', 'product/product-card'],
  // Outras propriedades...
});
```

## Integração com Provedores

O Site Design System foi projetado para funcionar com diferentes provedores (Hostinger, WooCommerce, Shopify) através do ProviderManager. Cada provedor pode implementar suas próprias operações específicas de design:

```javascript
// Exemplo de implementação em um provedor
class WooCommerceProvider {
  // ...
  
  async updateSiteTheme(siteId, theme) {
    // Lógica específica para WooCommerce
  }
  
  async publishSiteTheme(siteId, theme) {
    // Lógica específica para WooCommerce
  }
}
```

## Personalização de Componentes

Cada componente suporta opções de personalização definidas em seu arquivo `config.json`:

```javascript
// Exemplo de configuração de um componente
{
  "id": "modern-header",
  "name": "Cabeçalho Moderno",
  "options": [
    {
      "type": "color",
      "id": "backgroundColor",
      "name": "Cor de Fundo",
      "default": "#ffffff"
    },
    {
      "type": "select",
      "id": "logoAlignment",
      "name": "Alinhamento do Logo",
      "default": "left",
      "options": [
        { "value": "left", "label": "Esquerda" },
        { "value": "center", "label": "Centro" }
      ]
    }
  ]
}
```

## Performance e Otimização

O Site Design System inclui recursos para otimização de performance:

- **Cache**: Suporte a caching em todos os serviços para redução de acesso ao disco
- **Bundling**: Criação de pacotes CSS/JS otimizados para redução de requisições
- **Lazy Loading**: Carregamento sob demanda de componentes e templates
- **Versionamento**: Controle de versões para facilitar rollbacks e comparações

## Próximos Passos

- Implementar mais templates e componentes
- Adicionar suporte a customização via interface visual
- Expandir opções de personalização para componentes
- Implementar sistema de análise de acesso e engajamento
- Adicionar suporte a resposta adaptativa para dispositivos móveis

## Documentação Adicional

Para mais detalhes sobre o Site Design System, consulte a [documentação completa](../../docs/site-design-system.md).