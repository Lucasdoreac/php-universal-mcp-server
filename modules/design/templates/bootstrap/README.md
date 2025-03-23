# Templates Bootstrap

Esta pasta contém templates completos baseados no framework Bootstrap 5.x para o Site Design System. Estes templates aproveitam os recursos nativos do Bootstrap para criar sites responsivos e modernos com o mínimo de CSS personalizado.

## Templates Disponíveis

- **bs-ecommerce**: Template de loja virtual completo usando Bootstrap
- **bs-blog**: Template para blogs e sites de conteúdo usando Bootstrap
- **bs-landing**: Template para landing pages com Bootstrap

## Características

- **Responsividade completa**: Funcionam perfeitamente em qualquer dispositivo
- **Componentes avançados**: Utilizam o rico ecossistema de componentes do Bootstrap
- **Personalização via variáveis**: Fácil customização através de variáveis Bootstrap
- **Acessibilidade**: Seguem as melhores práticas de acessibilidade do Bootstrap
- **Performance otimizada**: Carregamento rápido e eficiente

## Como Usar

Os templates Bootstrap podem ser utilizados como qualquer outro template do Site Design System:

```javascript
// Aplicar um template Bootstrap a um site
await designSystem.applyTemplate('site123', 'bs-ecommerce');

// Personalizar o template
await designSystem.customize('site123', {
  colors: {
    primary: '#3498db',
    secondary: '#2ecc71'
  },
  typography: {
    headingFont: 'Montserrat, sans-serif',
    bodyFont: 'Roboto, sans-serif'
  }
});
```

## Customização dos Templates

A customização dos templates Bootstrap é feita através do `BootstrapAdapter` que converte as configurações de tema do Site Design System para variáveis CSS e SASS do Bootstrap:

```javascript
const { BootstrapAdapter } = require('./modules/design/services/BootstrapAdapter');

// Criar uma instância do adaptador
const bootstrapAdapter = new BootstrapAdapter({
  cache: cacheInstance,
  bootstrapVersion: '5.3.0'
});

// Gerar CSS com variáveis personalizadas
const cssVariables = bootstrapAdapter.generateCssVariables(theme);
```

## Integração com Componentes Bootstrap

Os templates utilizam os componentes Bootstrap implementados no Site Design System, que permitem personalização avançada mantendo a coerência com o framework Bootstrap:

```html
<!-- Exemplo de inclusão de componente Bootstrap -->
{% include 'bootstrap/navbar/bs-navbar' %}

<!-- Grid de produtos usando componente Bootstrap -->
<div class="row">
  {% for product in products.featured %}
  <div class="col-md-3 mb-4">
    {% include 'bootstrap/product/bs-product-card' %}
  </div>
  {% endfor %}
</div>
```