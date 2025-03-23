# Documentação dos Componentes Bootstrap

Este documento descreve os componentes Bootstrap disponíveis no PHP Universal MCP Server e como utilizá-los em seus templates e aplicações.

## Índice

1. [Introdução](#introdução)
2. [Componentes Disponíveis](#componentes-disponíveis)
   - [bs-navbar](#bs-navbar)
   - [bs-footer](#bs-footer)
   - [bs-carousel](#bs-carousel)
   - [bs-modal](#bs-modal)
   - [bs-product-modal](#bs-product-modal)
   - [bs-accordion](#bs-accordion)
   - [bs-gallery](#bs-gallery)
   - [bs-product-card](#bs-product-card)
3. [Uso em Templates](#uso-em-templates)
4. [Personalização de Temas](#personalização-de-temas)
5. [Interface de Administração](#interface-de-administração)
6. [Exemplos](#exemplos)

## Introdução

Os componentes Bootstrap do PHP Universal MCP Server são construídos com base no Bootstrap 5, oferecendo elementos reutilizáveis e totalmente personalizáveis para a construção de sites e e-commerces. Cada componente pode ser configurado através de opções e pode receber dados dinâmicos para renderização.

### Estrutura de Componentes

Cada componente segue uma estrutura padrão:

```
components/bootstrap/[tipo]/[nome-componente]/
  |- config.json       # Configuração e metadados do componente
  |- index.html        # Template Handlebars do componente
  |- style.css         # Estilos específicos do componente
  |- script.js         # Scripts específicos (opcional)
```

## Componentes Disponíveis

### bs-navbar

Barra de navegação responsiva com suporte a menu de hambúrguer em dispositivos móveis.

#### Opções Principais

- `theme`: Tema da navbar ("light", "dark")
- `fixed`: Se a navbar deve ser fixada no topo
- `logo`: URL do logotipo
- `transparency`: Transparência inicial (com efeito de scroll)
- `items`: Itens de menu da navbar

#### Exemplo de Uso

```handlebars
{{> bootstrap/navbar/bs-navbar navbarOptions=(object theme="light" fixed=true logo="/path/to/logo.png")}}
```

### bs-footer

Rodapé personalizável com múltiplas colunas, links e informações de contato.

#### Opções Principais

- `style`: Estilo do footer ("simple", "detailed", "multi-column")
- `copyright`: Texto de copyright
- `columns`: Colunas de links e informações
- `socialLinks`: Links para redes sociais
- `showSocialLinks`: Se deve mostrar links sociais

#### Exemplo de Uso

```handlebars
{{> bootstrap/footer/bs-footer footerOptions=(object style="detailed" copyright="© 2025 Minha Empresa")}}
```

### bs-carousel

Carrossel de imagens ou conteúdo com controles e indicadores.

#### Opções Principais

- `id`: ID único do carrossel
- `indicators`: Mostrar indicadores de slides
- `controls`: Mostrar controles de navegação
- `interval`: Intervalo de transição automática (ms)
- `fade`: Usar efeito de fade nas transições
- `aspectRatio`: Proporção de aspecto do carrossel

#### Exemplo de Uso

```handlebars
{{> bootstrap/carousel/bs-carousel carouselOptions=(object id="hero-carousel" indicators=true) slides=slides}}
```

### bs-modal

Modal genérico e reutilizável para diálogos, formulários ou exibição de conteúdo.

#### Opções Principais

- `id`: ID único do modal
- `title`: Título do modal
- `size`: Tamanho do modal ("sm", "lg", "xl")
- `centered`: Centralizar verticalmente
- `fullscreen`: Mostrar em tela cheia em dispositivos móveis
- `buttons`: Botões do rodapé

#### Exemplo de Uso

```handlebars
{{> bootstrap/modal/bs-modal modalOptions=(object id="contact-modal" title="Entre em Contato" size="lg") content=formHtml}}
```

### bs-product-modal

Modal específico para exibição rápida de produtos em e-commerces.

#### Opções Principais

- `id`: ID único do modal
- `size`: Tamanho do modal
- `showGallery`: Exibir galeria de imagens adicionais
- `addToCartButton`: Configurações do botão de adicionar ao carrinho

#### Exemplo de Uso

```handlebars
{{> bootstrap/modal/bs-product-modal modalOptions=(object showGallery=true) product=productData}}
```

### bs-accordion

Componente acordeão para FAQs, categorias expansíveis ou conteúdo organizado.

#### Opções Principais

- `id`: ID único do acordeão
- `alwaysOpen`: Permitir múltiplos itens abertos
- `flush`: Estilo sem bordas e sem fundo
- `borderColor`: Cor da borda
- `activeColor`: Cor do item ativo

#### Exemplo de Uso

```handlebars
{{> bootstrap/accordion/bs-accordion accordionOptions=(object id="faq-accordion" alwaysOpen=false) items=faqItems}}
```

### bs-gallery

Galeria de imagens com suporte a lightbox e navegação.

#### Opções Principais

- `id`: ID único da galeria
- `images`: Array de URLs de imagens
- `thumbnailSize`: Tamanho das miniaturas
- `showThumbnails`: Mostrar miniaturas de navegação
- `lightbox`: Habilitar lightbox para visualização expandida

#### Exemplo de Uso

```handlebars
{{> bootstrap/gallery/bs-gallery galleryOptions=(object showThumbnails=true) images=productImages}}
```

### bs-product-card

Card para exibição de produtos em grades ou listas.

#### Opções Principais

- `showRating`: Mostrar classificação do produto
- `showDiscount`: Mostrar etiqueta de desconto
- `buttonStyle`: Estilo do botão de ação
- `hoverEffect`: Efeito ao passar o mouse sobre o card

#### Exemplo de Uso

```handlebars
{{> bootstrap/product/bs-product-card cardOptions=(object showRating=true hoverEffect="shadow") product=productData}}
```

## Uso em Templates

Para usar os componentes em seus templates, você pode incluí-los usando a sintaxe de partials do Handlebars:

```handlebars
{{> bootstrap/[tipo]/[nome-componente] [nome-options]=(object param1=valor1 param2=valor2) [dados-adicionais]}}
```

Exemplo completo em um template:

```handlebars
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{pageTitle}}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
  {{> bootstrap/navbar/bs-navbar navbarOptions=(object theme="light" fixed=true)}}
  
  <main class="container py-5">
    <h1>{{pageTitle}}</h1>
    
    {{> bootstrap/carousel/bs-carousel carouselOptions=(object indicators=true) slides=banners}}
    
    <section class="my-5">
      <h2>Produtos em Destaque</h2>
      <div class="row">
        {{#each featuredProducts}}
          <div class="col-md-4">
            {{> bootstrap/product/bs-product-card product=this}}
          </div>
        {{/each}}
      </div>
    </section>
    
    <section class="my-5">
      <h2>Perguntas Frequentes</h2>
      {{> bootstrap/accordion/bs-accordion items=faqItems}}
    </section>
  </main>
  
  {{> bootstrap/footer/bs-footer footerOptions=(object style="detailed")}}
  
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

## Personalização de Temas

Você pode personalizar o tema Bootstrap para seus componentes de duas maneiras:

1. **Globalmente**: Criando um tema personalizado usando o `BootstrapAdapter`:

```javascript
const { BootstrapAdapter } = require('php-universal-mcp-server/modules/design/services');

const customTheme = await bootstrapAdapter.generateCustomTheme({
  primary: '#ff5722',
  secondary: '#2196f3',
  bodyBg: '#f9f9f9',
  fontSize: '1rem'
});

// Obter CSS compilado
const css = customTheme.css;
```

2. **Por Componente**: Passando opções de estilo específicas para cada componente:

```handlebars
{{> bootstrap/navbar/bs-navbar navbarOptions=(object theme="light" bgColor="#f8f9fa" textColor="#333")}}
```

## Interface de Administração

O PHP Universal MCP Server inclui uma interface de administração para personalização de templates Bootstrap. Para utilizá-la:

```javascript
const { BootstrapAdminInterface } = require('php-universal-mcp-server/modules/design/services');

// Inicializar interface
const adminInterface = new BootstrapAdminInterface();
await adminInterface.initialize();

// Listar templates disponíveis
const templates = adminInterface.getAvailableTemplates();

// Gerar preview de um template
const html = await adminInterface.generateTemplatePreview('bs-ecommerce', {
  colorScheme: 'primary',
  navbarFixed: true
}, {
  products: [...],
  categories: [...]
});
```

## Exemplos

### Exemplo 1: Página de Produto

```handlebars
{{> bootstrap/navbar/bs-navbar}}

<div class="container py-5">
  <div class="row">
    <div class="col-md-6">
      {{> bootstrap/gallery/bs-gallery galleryOptions=(object showThumbnails=true) images=product.images}}
    </div>
    <div class="col-md-6">
      <h1>{{product.title}}</h1>
      <p class="lead">{{product.price}}</p>
      <p>{{product.description}}</p>
      <button class="btn btn-primary">Adicionar ao Carrinho</button>
    </div>
  </div>
  
  <div class="mt-5">
    <h2>Informações do Produto</h2>
    {{> bootstrap/accordion/bs-accordion items=productDetails}}
  </div>
</div>

{{> bootstrap/footer/bs-footer}}
```

### Exemplo 2: Página de FAQs

```handlebars
{{> bootstrap/navbar/bs-navbar}}

<div class="container py-5">
  <h1 class="mb-4">Perguntas Frequentes</h1>
  
  {{#each faqCategories}}
    <h2 class="mt-5 mb-3">{{this.title}}</h2>
    {{> bootstrap/accordion/bs-accordion accordionOptions=(object id=(concat "faq-" @index)) items=this.items}}
  {{/each}}
</div>

{{> bootstrap/footer/bs-footer}}
```

---

Para mais detalhes sobre cada componente, consulte a documentação específica na pasta `docs/components/[nome-componente].md`.