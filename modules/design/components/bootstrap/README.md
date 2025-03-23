# Componentes Bootstrap

Esta pasta contém componentes reutilizáveis baseados no framework Bootstrap para o Site Design System. Estes componentes são otimizados para funcionar com o Bootstrap 5.x e aproveitam seus recursos nativos para criação de interfaces responsivas e modernas.

## Categorias de Componentes

- **navbar**: Barras de navegação e headers com Bootstrap
- **footer**: Rodapés com grid e estilos Bootstrap
- **product**: Cartões e grids de produtos usando componentes Bootstrap
- **card**: Diferentes estilos de cards Bootstrap
- **form**: Formulários e controles de entrada Bootstrap

## Como Usar

Para utilizar estes componentes, é necessário incluir o Bootstrap em seu template:

```html
<!-- CSS do Bootstrap -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

<!-- JavaScript do Bootstrap (opcional) -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
```

Nosso `BootstrapAdapter` facilita a inclusão automática do Bootstrap e sua personalização segundo o tema do site:

```javascript
const { DesignSystem } = require('./modules/design');
const { BootstrapAdapter } = require('./modules/design/services/BootstrapAdapter');

// Inicializar o Bootstrap Adapter
const bootstrapAdapter = new BootstrapAdapter({
  cache: cacheInstance,
  bootstrapVersion: '5.3.0'
});

// Incluir na inicialização do Design System
const designSystem = new DesignSystem({
  providerManager,
  cache: cacheInstance,
  bootstrapAdapter
});
```

## Vantagens da Integração com Bootstrap

- **Framework maduro e testado**: Bootstrap é amplamente utilizado e testado em diferentes navegadores e dispositivos
- **Comunidade ativa**: Grande quantidade de recursos, extensões e documentação disponível
- **Responsividade nativa**: Sistema de grid flexível que se adapta a qualquer tamanho de tela
- **Componentes ricos**: Acesso a componentes avançados como carousels, offcanvas, toasts, etc.
- **Personalização via variáveis**: Fácil customização através de variáveis CSS e SASS

## Estrutura dos Componentes

Cada componente Bootstrap segue a mesma estrutura dos componentes padrão do Site Design System:

```
component-name/
├── index.html       # Markup HTML do componente usando classes Bootstrap
├── style.css       # Estilos adicionais ou sobrescritas (mínimo possível)
├── script.js       # JavaScript para funcionalidades específicas
└── config.json      # Configurações e opções de personalização
```

## Boas Práticas

1. **Use classes Bootstrap nativas** sempre que possível
2. **Minimize CSS personalizado** para manter a consistência com Bootstrap
3. **Aproveite componentes** do Bootstrap como accordions, cards, navs, etc.
4. **Utilize sistema de grid** do Bootstrap para layouts responsivos
5. **Siga padrões de acessibilidade** conforme documentado pelo Bootstrap