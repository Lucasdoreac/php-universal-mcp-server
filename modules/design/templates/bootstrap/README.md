# Templates Bootstrap

Esta pasta contém os templates Bootstrap prontos para uso no PHP Universal MCP Server.

## Templates Disponíveis

| ID | Nome | Descrição | Finalidade |
|----|------|-----------|------------|
| `bs-ecommerce` | E-commerce Bootstrap | Template completo para lojas online | Lojas virtuais e e-commerces |
| `bs-blog` | Blog Bootstrap | Template para blogs e publicações | Blogs, notícias e artigos |
| `bs-landing` | Landing Page Bootstrap | Template para páginas de aterrissagem | Marketing e conversão |
| `bs-portfolio` | Portfolio Bootstrap | Template para portfólios profissionais | Exibir trabalhos e projetos |

## Como Usar

Os templates podem ser utilizados através do Design Service do PHP Universal MCP Server:

```javascript
const DesignService = require('php-universal-mcp-server/modules/design/services/DesignService');

// Inicializar serviço
const designService = new DesignService({
  enableBootstrap: true
});

// Aplicar template a um site
await designService.applyTemplate('site-id', 'bs-ecommerce', {
  // Opções de customização
  colorScheme: 'primary',
  layout: 'standard',
  sections: {
    featured: true,
    categories: true,
    newsletter: true
  }
});
```

## Personalização

Todos os templates Bootstrap podem ser personalizados através de várias opções:

### Cores e Tema

Configure cores, fontes e estilos gerais:

```javascript
const options = {
  colorScheme: 'primary', // 'primary', 'dark', 'light', 'creative', etc.
  primaryColor: '#0d6efd', // Cor principal personalizada
  secondaryColor: '#6c757d', // Cor secundária personalizada
  fontFamily: 'Roboto, sans-serif', // Família de fontes
  roundedCorners: true // Cantos arredondados nos elementos
};
```

### Layout e Seções

Configure quais seções exibir e como organizá-las:

```javascript
const options = {
  layout: 'standard', // 'standard', 'fullwidth', 'centered', etc.
  sections: {
    hero: true,
    featured: true,
    categories: true,
    products: true,
    about: false,
    testimonials: true,
    newsletter: true,
    contact: true
  }
};
```

### Elementos de Navegação

Configure a navegação e rodapé:

```javascript
const options = {
  navbarStyle: 'light', // 'light', 'dark', 'transparent', 'colored'
  navbarFixed: true, // Navbar fixa ao topo
  footerStyle: 'detailed', // 'simple', 'detailed', 'multi-column'
  showSocialLinks: true // Exibir links para redes sociais
};
```

### Recursos Especiais

Adicione funcionalidades específicas para cada template:

#### E-commerce (bs-ecommerce)

```javascript
const options = {
  productDisplay: 'grid', // 'grid', 'list', 'compact'
  productsPerRow: 3, // Número de produtos por linha
  quickView: true, // Habilitar visualização rápida de produtos
  wishlist: true, // Habilitar funcionalidade de lista de desejos
  compareProducts: false // Habilitar comparação de produtos
};
```

#### Blog (bs-blog)

```javascript
const options = {
  postLayout: 'standard', // 'standard', 'grid', 'magazine'
  showFeaturedImage: true, // Exibir imagem destacada
  showAuthor: true, // Exibir informações do autor
  showDate: true, // Exibir data de publicação
  showComments: true, // Exibir seção de comentários
  sidebar: 'right' // 'left', 'right', 'none'
};
```

#### Landing Page (bs-landing)

```javascript
const options = {
  heroStyle: 'image-background', // 'image-background', 'video-background', 'gradient'
  ctaPosition: 'bottom', // 'top', 'middle', 'bottom', 'floating'
  animationsEnabled: true, // Habilitar animações no scroll
  countdownTimer: false, // Adicionar contador regressivo
  popupForm: true // Exibir formulário em popup
};
```

#### Portfolio (bs-portfolio)

```javascript
const options = {
  projectLayout: 'grid', // 'grid', 'masonry', 'cards'
  projectDetailStyle: 'modal', // 'modal', 'page', 'expand'
  filterProjects: true, // Habilitar filtros por categoria
  darkMode: false, // Disponibilizar versão dark mode
  projectsPerRow: 3 // Número de projetos por linha
};
```

## Temas Predefinidos

Os templates vêm com vários temas predefinidos que podem ser aplicados:

| Tema | Descrição |
|------|-----------|
| `default` | Tema padrão em azul claro |
| `dark` | Tema escuro com contrastes fortes |
| `minimalist` | Tema minimalista com muito espaço em branco |
| `creative` | Tema colorido para designs criativos |
| `corporate` | Tema corporativo elegante e formal |
| `tech` | Tema moderno para startups de tecnologia |

Para aplicar um tema predefinido:

```javascript
await designService.applyTemplate('site-id', 'bs-ecommerce', {
  theme: 'corporate'
});
```

## Interface de Administração

Para uma experiência mais visual de personalização, utilize a interface de administração Bootstrap:

```javascript
const BootstrapAdminInterface = require('php-universal-mcp-server/modules/design/services/BootstrapAdminInterface');

// Inicializar interface
const adminInterface = new BootstrapAdminInterface();
await adminInterface.initialize();

// Gerar preview com opções personalizadas
const previewHtml = await adminInterface.generateTemplatePreview('bs-ecommerce', {
  colorScheme: 'creative',
  layout: 'fullwidth'
});
```

## Exemplos

### Loja Virtual Básica

```javascript
await designService.applyTemplate('minha-loja', 'bs-ecommerce', {
  colorScheme: 'primary',
  productDisplay: 'grid',
  productsPerRow: 3,
  sections: {
    featured: true,
    categories: true,
    newArrivals: true,
    testimonials: true,
    newsletter: true
  }
});
```

### Blog Profissional

```javascript
await designService.applyTemplate('meu-blog', 'bs-blog', {
  colorScheme: 'minimalist',
  postLayout: 'magazine',
  sidebar: 'right',
  sections: {
    featured: true,
    categories: true,
    popular: true,
    newsletter: true
  }
});
```

### Landing Page de Conversão

```javascript
await designService.applyTemplate('campanha-marketing', 'bs-landing', {
  colorScheme: 'creative',
  heroStyle: 'video-background',
  ctaPosition: 'floating',
  animationsEnabled: true,
  sections: {
    hero: true,
    features: true,
    testimonials: true,
    pricing: true,
    faq: true,
    contact: true
  }
});
```

### Portfolio Criativo

```javascript
await designService.applyTemplate('meu-portfolio', 'bs-portfolio', {
  colorScheme: 'dark',
  projectLayout: 'masonry',
  projectDetailStyle: 'modal',
  filterProjects: true,
  darkMode: true,
  sections: {
    hero: true,
    about: true,
    projects: true,
    skills: true,
    contact: true
  }
});
```

## Dependências

Todos os templates Bootstrap requerem:

- Bootstrap 5.3.0 ou superior
- Bootstrap Icons 1.10.0 ou superior

Para funcionalidades específicas, alguns templates podem requerer:

- AOS (Animate On Scroll)
- Lightbox
- Isotope (para layouts de filtro)
- Slick Carousel ou Swiper

## Documentação Completa

Para informações detalhadas sobre cada template e suas opções, consulte os arquivos README específicos:

- [E-commerce Bootstrap](./bs-ecommerce/README.md)
- [Blog Bootstrap](./bs-blog/README.md)
- [Landing Page Bootstrap](./bs-landing/README.md)
- [Portfolio Bootstrap](./bs-portfolio/README.md)

Para documentação geral sobre componentes Bootstrap, consulte [a documentação de componentes](../../docs/bootstrap-components.md).