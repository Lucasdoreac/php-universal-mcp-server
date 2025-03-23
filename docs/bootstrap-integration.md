# Integração com Bootstrap

Este documento descreve como utilizar o suporte ao Bootstrap no Site Design System do PHP Universal MCP Server. A integração permite criar, personalizar e gerenciar sites e lojas de e-commerce utilizando o framework Bootstrap 5.x.

## Visão Geral

A integração com Bootstrap oferece os seguintes benefícios:

1. **Framework maduro e testado**: Bootstrap é uma biblioteca robusta e amplamente adotada
2. **Responsividade nativa**: Sistema de grid flexível adapta-se a qualquer dispositivo
3. **Componentes avançados**: Acesso a carousels, modals, offcanvas, toasts, etc.
4. **Ampla documentação**: Benefício da extensa documentação do Bootstrap
5. **Personalização via variáveis**: Customização do Bootstrap com o sistema de temas do Design System

## Arquitetura

A integração com Bootstrap é implementada através dos seguintes componentes:

- **BootstrapAdapter**: Converte temas do Design System para variáveis CSS e SASS do Bootstrap
- **BootstrapTemplateRenderer**: Extensão do TemplateRenderer com suporte a recursos específicos do Bootstrap
- **Componentes Bootstrap**: Implementações de componentes utilizando classes e padrões do Bootstrap
- **Templates Bootstrap**: Templates completos baseados no framework Bootstrap

## Como Habilitar o Bootstrap

Para usar o Bootstrap no Site Design System, você precisa habilitá-lo durante a inicialização:

```javascript
const { DesignSystem } = require('./modules/design');

// Opção 1: Habilitar durante a inicialização
const designSystem = new DesignSystem({
  providerManager,
  cache: cacheInstance,
  enableBootstrap: true,
  bootstrapVersion: '5.3.0' // opcional
});

// Opção 2: Habilitar após a inicialização
const designSystem = new DesignSystem({
  providerManager,
  cache: cacheInstance
});

designSystem.enableBootstrapSupport({
  version: '5.3.0'
});
```

## Usando Templates Bootstrap

Os templates Bootstrap estão disponíveis na categoria `bootstrap` e podem ser aplicados como qualquer outro template:

```javascript
// Aplicar um template Bootstrap
await designSystem.applyTemplate('site123', 'bs-ecommerce');

// Personalizar o template Bootstrap
await designSystem.customize('site123', {
  colors: {
    primary: '#3498db',
    secondary: '#2ecc71',
    accent: '#e74c3c'
  },
  typography: {
    headingFont: "'Montserrat', sans-serif",
    bodyFont: "'Roboto', sans-serif"
  }
});
```

## Componentes Bootstrap Disponíveis

Os componentes Bootstrap estão organizados em categorias:

### Navbar (bootstrap/navbar)

- **bs-navbar**: Barra de navegação responsiva com suporte a busca e ícones de ação

```javascript
// Exemplo de uso em um template
{% include 'bootstrap/navbar/bs-navbar' with {
  options: {
    variant: "navbar-dark bg-primary",
    containerFluid: false,
    enableSearch: true,
    enableAccount: true,
    enableCart: true
  }
} %}
```

### Produtos (bootstrap/product)

- **bs-product-card**: Cartão de produto responsivo com suporte a badges, avaliações e ações rápidas

```javascript
// Exemplo de uso em um template
{% for product in products.featured %}
<div class="col-md-3">
  {% include 'bootstrap/product/bs-product-card' with {
    product: product,
    options: {
      showBadges: true,
      showRatings: true,
      enableQuickView: true,
      showMainAddToCart: true
    }
  } %}
</div>
{% endfor %}
```

### Footer (bootstrap/footer)

- **bs-footer**: Rodapé responsivo com suporte a logo, links, newsletter e informações de contato

```javascript
// Exemplo de uso em um template
{% include 'bootstrap/footer/bs-footer' with {
  options: {
    bgClass: "bg-dark text-white",
    showSocialIcons: true,
    showNewsletter: true,
    showContact: true
  }
} %}
```

## Personalização do Bootstrap

O Site Design System converte automaticamente as configurações de tema para variáveis CSS do Bootstrap. A conversão segue estas regras:

### Cores

| Design System | Bootstrap |
|---------------|------------|
| colors.primary | --bs-primary |
| colors.secondary | --bs-secondary |
| colors.success | --bs-success |
| colors.info | --bs-info |
| colors.warning | --bs-warning |
| colors.danger / colors.accent | --bs-danger |
| colors.light | --bs-light |
| colors.dark | --bs-dark |
| colors.background | --bs-body-bg |
| colors.text | --bs-body-color |

### Tipografia

| Design System | Bootstrap |
|---------------|------------|
| typography.bodyFont | --bs-body-font-family |
| typography.headingFont | --bs-heading-font-family |
| typography.baseFontSize | --bs-body-font-size |

### Espaçamento, Bordas e Sombras

O sistema de espaçamento, bordas e sombras também é mapeado para as variáveis correspondentes do Bootstrap.

## Renderização de Templates Bootstrap

O `BootstrapTemplateRenderer` estende o renderizador padrão com recursos específicos para o Bootstrap:

```javascript
// Obter um renderizador Bootstrap
const bootstrapRenderer = designSystem.createBootstrapRenderer();

// Renderizar um template Bootstrap
const html = await bootstrapRenderer.renderTemplate('bs-ecommerce', data, {
  category: 'bootstrap',
  components: [
    'bootstrap/navbar/bs-navbar',
    'bootstrap/product/bs-product-card',
    'bootstrap/footer/bs-footer'
  ]
});
```

### Helpers adicionais do Handlebars

O renderer Bootstrap adiciona helpers extras ao Handlebars para facilitar o uso de recursos do Bootstrap:

- **bsCol**: Helper para gerar classes do grid Bootstrap
  ```handlebars
  <div class="{{bsCol xs=12 md=6 lg=4}}">...</div>
  <!-- Gera: <div class="col-12 col-md-6 col-lg-4">...</div> -->
  ```

- **ifScreenSize**: Helper para renderização condicional baseada em breakpoints
  ```handlebars
  {{#ifScreenSize 'md' 'lt' 'lg'}}
    <!-- Conteúdo exibido apenas em dispositivos menores que lg -->
  {{/ifScreenSize}}
  ```

- **bsIcon**: Helper para gerar ícones do Bootstrap
  ```handlebars
  {{bsIcon 'cart' class='fs-4 text-primary'}}
  <!-- Gera: <i class="bi bi-cart fs-4 text-primary"></i> -->
  ```

## Templates Bootstrap Disponíveis

Os seguintes templates Bootstrap estão disponíveis:

- **bs-ecommerce**: Template de loja virtual completo
- **bs-blog**: Template para blogs e sites de conteúdo (em desenvolvimento)
- **bs-landing**: Template para landing pages (em desenvolvimento)

## Integração com Claude Desktop

O Site Design System permite comandos para gerenciar templates Bootstrap via Claude Desktop:

```
# Comandos para templates Bootstrap
aplicar template bs-ecommerce para site-123
personalizar site-123 com cores #3498db para primary e #2ecc71 para secondary
visualizar alterações para site-123
publicar alterações para site-123
```

## Criação de Componentes Bootstrap Personalizados

Você pode criar novos componentes Bootstrap seguindo a estrutura padrão:

```
components/bootstrap/CATEGORIA/NOME-DO-COMPONENTE/
├── index.html       # Markup HTML usando classes Bootstrap
├── style.css       # Estilos adicionais (mínimo possível)
├── script.js       # JavaScript para funcionalidades específicas
└── config.json      # Configurações e personalizações
```

Melhores práticas para componentes Bootstrap:

1. Use as classes nativas do Bootstrap sempre que possível
2. Minimize o CSS personalizado
3. Aproveite os componentes integrados do Bootstrap
4. Siga as diretrizes de acessibilidade do Bootstrap
5. Suporte responsividade usando o sistema de grid

## Considerações de Performance

Para otimizar a performance dos templates Bootstrap:

1. **Carregue apenas o necessário**: Use o CSS e JavaScript mínimos do Bootstrap
2. **Use o cache efetivamente**: Aproveite o caching para evitar regeneração de CSS
3. **Minificação para produção**: Minifique todos os recursos para ambiente de produção
4. **Lazy loading de componentes**: Carregue componentes apenas quando necessário

## Migração de Templates Existentes para Bootstrap

Para migrar templates existentes para Bootstrap:

1. **Identifique equivalentes**: Mapeie componentes existentes para equivalentes Bootstrap
2. **Adapte o HTML**: Modifique o markup para usar classes Bootstrap
3. **Simplifique o CSS**: Remova CSS redundante já fornecido pelo Bootstrap
4. **Atualize os temas**: Adapte o tema para usar variáveis Bootstrap

## Exemplos Completos

### Aplicação de Template Bootstrap e Personalização

```javascript
const { DesignSystem } = require('./modules/design');

// Inicializar Design System com suporte a Bootstrap
const designSystem = new DesignSystem({
  providerManager,
  cache,
  enableBootstrap: true
});

// Aplicar template Bootstrap
await designSystem.applyTemplate('site123', 'bs-ecommerce');

// Personalizar o tema
await designSystem.customize('site123', {
  colors: {
    primary: '#3498db',
    secondary: '#2ecc71',
    accent: '#e74c3c'
  },
  typography: {
    headingFont: "'Poppins', sans-serif",
    bodyFont: "'Roboto', sans-serif"
  },
  bootstrap: {
    navbar: {
      style: 'navbar-dark bg-primary',
      enableSearch: true
    },
    footer: {
      style: 'bg-dark text-white'
    }
  }
});

// Obter CSS do Bootstrap personalizado
const result = await designSystem.designController.getCurrentTheme({
  siteId: 'site123'
});

// Obter CSS Bootstrap para usar na página
const bootstrapCss = result.data.bootstrapCss;
```

### Renderização de Template Bootstrap

```javascript
// Criar um renderizador Bootstrap
const renderer = designSystem.createBootstrapRenderer();

// Renderizar um template com dados
const html = await renderer.renderTemplate('bs-ecommerce', {
  site: {
    name: 'Minha Loja',
    description: 'Descrição da loja',
    logo: '/assets/images/logo.png'
  },
  theme: themeData,
  products: {
    featured: productsList
  },
  navigation: navItems
}, {
  category: 'bootstrap',
  components: [
    'bootstrap/navbar/bs-navbar',
    'bootstrap/product/bs-product-card',
    'bootstrap/footer/bs-footer'
  ]
});
```

## Integração com Provedores

A integração do Bootstrap funciona com todos os provedores suportados (Hostinger, WooCommerce, Shopify) através do ProviderManager. Cada provedor pode ter implementações específicas para aplicar os temas Bootstrap.

## Próximos Passos

- Desenvolvimento de mais templates Bootstrap (blog, landing page, portfolio)
- Criação de componentes avançados (carousels, galerias, formulários customizados)
- Integração com plugins populares do Bootstrap
- Ferramentas de customização visual para temas Bootstrap
- Implementação de preview em tempo real para personalizações