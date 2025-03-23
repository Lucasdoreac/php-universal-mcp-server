# Guia de Componentes Bootstrap

O PHP Universal MCP Server inclui um conjunto poderoso de componentes Bootstrap para facilitar a criação de interfaces web modernas e responsivas. Este guia cobre o uso e a personalização dos componentes disponíveis.

## Índice

- [Introdução](#introdução)
- [Modal](#modal)
- [Accordion](#accordion)
- [Gallery](#gallery)
- [Templates Completos](#templates-completos)
- [Customização Avançada](#customização-avançada)

## Introdução

Os componentes Bootstrap do PHP Universal MCP Server são construídos sobre o Bootstrap 5 e fornecem funcionalidades avançadas para sites e e-commerces. Todos os componentes são totalmente responsivos e podem ser facilmente personalizados.

Para usar um componente em seu template, inclua-o na configuração do template:

```javascript
module.exports = {
  name: "Meu Template Personalizado",
  components: [
    "bootstrap/modal/bs-product-modal",
    "bootstrap/accordion/bs-accordion",
    "bootstrap/gallery/bs-gallery"
  ],
  // ...outras configurações
};
```

## Modal

### bs-product-modal

O componente `bs-product-modal` fornece um modal para visualização rápida de produtos em lojas e-commerce.

#### Uso Básico

```handlebars
{{> bootstrap/modal/bs-product-modal product=productData options=modalOptions}}
```

Onde `productData` é um objeto com informações do produto e `modalOptions` são as opções de configuração do modal.

#### Opções Disponíveis

| Opção | Tipo | Descrição | Valor Padrão |
|-------|------|-----------|--------------|
| id | string | ID do modal | "product-modal" |
| size | string | Tamanho do modal (sm, lg, xl) | "lg" |
| showGallery | boolean | Exibir galeria de imagens adicionais | true |
| fullscreen | boolean | Modal em tela cheia em dispositivos móveis | false |
| centered | boolean | Centralizar modal verticalmente | true |
| showClose | boolean | Exibir botão de fechar | true |
| animationDuration | number | Duração da animação em milissegundos | 300 |
| scrollable | boolean | Permitir rolagem dentro do modal | true |

#### Exemplo

```javascript
// Dados do produto
const product = {
  id: "123",
  title: "Camiseta Premium",
  price: 79.90,
  salePrice: 59.90,
  description: "Camiseta premium 100% algodão.",
  mainImage: "/images/products/camiseta-1.jpg",
  gallery: [
    "/images/products/camiseta-2.jpg",
    "/images/products/camiseta-3.jpg"
  ],
  sku: "CMST-123",
  stock: 15,
  variations: [
    {
      name: "Cor",
      options: ["Preto", "Branco", "Azul"]
    },
    {
      name: "Tamanho",
      options: ["P", "M", "G", "GG"]
    }
  ]
};

// Opções do modal
const modalOptions = {
  id: "camiseta-modal",
  size: "xl",
  theme: {
    headerBg: "#f8f9fa",
    footerBg: "#f1f3f5"
  },
  addToCartButton: {
    text: "Adicionar ao Carrinho",
    customClass: "btn-primary btn-lg"
  }
};
```

#### Abrir o Modal Programaticamente

```javascript
// HTML do botão que abre o modal
<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#camiseta-modal">
  Visualização Rápida
</button>

// JavaScript para abrir o modal programaticamente
const productModal = new bootstrap.Modal(document.getElementById('camiseta-modal'));
productModal.show();
```

## Accordion

### bs-accordion

O componente `bs-accordion` fornece um accordion flexível para FAQs, categorias e conteúdo expansível.

#### Uso Básico

```handlebars
{{> bootstrap/accordion/bs-accordion items=accordionItems options=accordionOptions}}
```

#### Opções Disponíveis

| Opção | Tipo | Descrição | Valor Padrão |
|-------|------|-----------|--------------|
| id | string | ID do accordion | "bs-accordion" |
| alwaysOpen | boolean | Permite múltiplos itens abertos simultaneamente | false |
| flush | boolean | Estilo flush (sem bordas externas e arredondamento) | false |
| iconPosition | string | Posição do ícone de expansão (start, end) | "end" |
| expandFirstItem | boolean | Expandir o primeiro item automaticamente | false |
| useIcons | boolean | Usar ícones personalizados para itens | false |
| iconCollapsed | string | Ícone Bootstrap para estado colapsado | "plus" |
| iconExpanded | string | Ícone Bootstrap para estado expandido | "dash" |

#### Exemplo

```javascript
// Itens do accordion
const accordionItems = [
  {
    title: "Como faço para rastrear meu pedido?",
    content: "Você pode rastrear seu pedido acessando 'Minha Conta' e clicando em 'Meus Pedidos'. Lá você encontrará o status atual e o código de rastreamento.",
    icon: "truck",
    isOpen: true
  },
  {
    title: "Qual a política de devolução?",
    content: "Aceitamos devoluções em até 30 dias após a compra. O produto deve estar na embalagem original e sem sinais de uso.",
    icon: "arrow-return-left"
  },
  {
    title: "Vocês enviam para todo o Brasil?",
    content: "Sim, enviamos para todos os estados brasileiros. Os prazos e custos de entrega variam conforme a região.",
    icon: "geo-alt",
    badge: {
      text: "Popular",
      class: "bg-success"
    }
  }
];

// Opções do accordion
const accordionOptions = {
  id: "faq-accordion",
  alwaysOpen: true,
  useIcons: true,
  theme: {
    headerBg: "#f8f9fa",
    headerColor: "#212529",
    iconColor: "#0d6efd"
  }
};
```

## Gallery

### bs-gallery

O componente `bs-gallery` fornece uma galeria de imagens responsiva para produtos e portfólios.

#### Uso Básico

```handlebars
{{> bootstrap/gallery/bs-gallery images=galleryImages options=galleryOptions}}
```

#### Opções Disponíveis

| Opção | Tipo | Descrição | Valor Padrão |
|-------|------|-----------|--------------|
| id | string | ID da galeria | "bs-gallery" |
| layout | string | Estilo de layout (grid, masonry, carousel, thumbnails) | "grid" |
| columns | object | Número de colunas em diferentes breakpoints | { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 } |
| gap | number | Espaçamento entre as imagens (em pixels) | 10 |
| aspectRatio | string | Proporção das imagens (1x1, 4x3, 16x9, auto) | "auto" |
| lightbox | boolean | Habilitar lightbox ao clicar nas imagens | true |
| captions | boolean | Exibir legendas nas imagens | true |
| captionPosition | string | Posição das legendas (bottom, overlay, hover) | "bottom" |
| hoverEffect | string | Efeito ao passar o mouse (none, zoom, fade, overlay) | "zoom" |
| roundedCorners | boolean | Usar cantos arredondados nas imagens | true |

#### Exemplo

```javascript
// Imagens da galeria
const galleryImages = [
  {
    src: "/images/gallery/product-1.jpg",
    thumbnail: "/images/gallery/product-1-thumb.jpg",
    alt: "Produto 1",
    title: "Produto 1",
    caption: "Descrição detalhada do produto 1",
    tags: ["Destaque", "Novo"]
  },
  {
    src: "/images/gallery/product-2.jpg",
    thumbnail: "/images/gallery/product-2-thumb.jpg",
    alt: "Produto 2",
    title: "Produto 2",
    caption: "Descrição detalhada do produto 2",
    tags: ["Destaque"]
  },
  // Mais imagens...
];

// Filtros para a galeria
const filters = ["Todos", "Destaque", "Novo", "Promoção"];

// Opções da galeria
const galleryOptions = {
  id: "products-gallery",
  layout: "masonry",
  lightbox: true,
  captions: true,
  captionPosition: "hover",
  hoverEffect: "zoom"
};
```

## Templates Completos

### bs-blog

O template `bs-blog` fornece um blog completo e responsivo.

#### Uso Básico

```javascript
// Em seu arquivo de configuração
const template = {
  id: "blog-template",
  template: "bootstrap/bs-blog",
  data: {
    blogInfo: { /* informações do blog */ },
    posts: [ /* array de posts */ ],
    categories: [ /* categorias */ ],
    tags: [ /* tags */ ]
  },
  options: {
    layout: "standard",
    sidebar: "right",
    postsPerPage: 6,
    // ...outras opções
  }
};
```

### bs-landing

O template `bs-landing` fornece uma landing page altamente customizável.

```javascript
// Em seu arquivo de configuração
const template = {
  id: "landing-template",
  template: "bootstrap/bs-landing",
  data: {
    siteInfo: { /* informações do site */ },
    hero: { /* conteúdo da seção hero */ },
    features: [ /* recursos */ ],
    // ...outros dados
  },
  options: {
    layout: "standard",
    colorScheme: "primary",
    sections: {
      hero: true,
      features: true,
      about: true,
      // ...outras seções
    },
    // ...outras opções
  }
};
```

## Customização Avançada

### Temas Personalizados

Você pode criar temas personalizados para os componentes Bootstrap através do `BootstrapAdapter`:

```javascript
const BootstrapAdapter = require('./modules/design/services/BootstrapAdapter');

// Criar tema personalizado
const theme = {
  colors: {
    primary: '#3f51b5',
    secondary: '#f50057',
    success: '#4caf50',
    background: '#ffffff',
    text: '#212121'
  },
  typography: {
    bodyFont: '"Roboto", sans-serif',
    headingFont: '"Montserrat", sans-serif',
    baseFontSize: '16px'
  },
  borders: {
    radius: '0.5rem',
    buttonRadius: '2rem'
  },
  components: {
    buttons: {
      padding: {
        vertical: '0.75rem',
        horizontal: '1.5rem'
      }
    },
    card: {
      background: '#ffffff',
      borderRadius: '0.5rem'
    }
  }
};

// Gerar variáveis CSS
const adapter = new BootstrapAdapter();
const cssVariables = adapter.generateCssVariables(theme);
```

### Integrando com Sistemas Existentes

Para integrar os componentes Bootstrap com sistemas existentes:

1. Inclua o CSS e JS do Bootstrap em seu sistema
2. Importe os componentes necessários
3. Adaptação dos estilos para corresponder ao design existente

```javascript
// Exemplo de integração com um sistema existente
const BootstrapTemplateRenderer = require('./modules/design/services/BootstrapTemplateRenderer');

// Criar instância do renderizador
const renderer = new BootstrapTemplateRenderer({
  templatesDir: './templates',
  componentsDir: './components',
  bootstrapVersion: '5.3.0'
});

// Renderizar template com componentes Bootstrap
async function renderPage() {
  const html = await renderer.renderTemplate('my-page', {
    title: 'Minha Página',
    content: 'Conteúdo da página',
    theme: customTheme
  }, {
    components: [
      'bootstrap/navbar/bs-navbar',
      'bootstrap/modal/bs-product-modal',
      'bootstrap/footer/bs-footer'
    ]
  });
  
  return html;
}
```

Para mais informações sobre personalização e integração, consulte a documentação completa na pasta `docs/design/`.