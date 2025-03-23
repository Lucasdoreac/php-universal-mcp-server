# Componentes do Site Design System

Componentes reutilizáveis para construir interfaces de sites e e-commerce. Estes componentes são utilizados pelos templates e podem ser personalizados de acordo com o tema.

## Categorias de Componentes

- **header**: Componentes de cabeçalho e navegação
- **footer**: Componentes de rodapé
- **product**: Componentes relacionados a produtos
- **cart**: Componentes de carrinho e checkout
- **form**: Componentes de formulários
- **ui**: Componentes de interface geral

## Estrutura

Cada componente segue uma estrutura padronizada:

```
component-name/
├── index.html       # Markup HTML do componente
├── style.css       # Estilos específicos do componente
├── script.js       # JavaScript opcional do componente
└── config.json      # Configurações e personalizações do componente
```

## Como Usar

Componentes podem ser incorporados em templates usando a tag de includeMC:

```html
{% include 'components/header/modern-header' %}
```

Também podem ser utilizados programaticamente:

```javascript
const headerComponent = designSystem.getComponent('header/modern-header');
const renderedHeader = await headerComponent.render(siteData, themeSettings);
```