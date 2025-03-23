# PHP Universal MCP Server

Um servidor MCP (Model Context Protocol) universal para desenvolvimento PHP em qualquer provedor de hospedagem ou nuvem.

## Descrição

O PHP Universal MCP Server é uma ferramenta avançada que permite gerenciar múltiplos sites e e-commerces através do Claude Desktop usando o Model Context Protocol (MCP). Ele oferece uma interface unificada para interagir com diferentes plataformas como Hostinger, WooCommerce, Shopify, entre outras.

## Componentes Principais

1. **MCP Protocol Layer** - Implementação do protocolo MCP sobre JSON-RPC 2.0
2. **PHP Runtime Engine** - Ambiente seguro para execução de código PHP
3. **E-commerce Manager** - API unificada para gerenciar produtos, pedidos e clientes
4. **Multi-provider Integration** - Adaptadores para diferentes plataformas
5. **Site Design System** - Motor de templates para sites e e-commerce
6. **Hosting Manager** - Gerenciamento de recursos de hospedagem
7. **Claude Desktop Integration** - Interface natural para comandos via chat

## Instalação

```bash
# Clonar o repositório
git clone https://github.com/Lucasdoreac/php-universal-mcp-server.git
cd php-universal-mcp-server

# Instalar dependências
npm install

# Iniciar o servidor
npm start
```

## Configuração

Crie um arquivo `config.json` na raiz do projeto com suas configurações:

```json
{
  "server": {
    "tcpPort": 7654,
    "httpPort": 8080
  },
  "bootstrap": {
    "enabled": true,
    "version": "5.3.0"
  },
  "providers": {
    "hostinger": {
      "apiKey": "sua-api-key",
      "apiUrl": "https://api.hostinger.com/v1"
    },
    "woocommerce": {
      "url": "https://sua-loja.com",
      "consumerKey": "ck_xxx",
      "consumerSecret": "cs_xxx"
    }
  }
}
```

## Uso

### Através do Claude Desktop

1. Inicie o servidor MCP
2. No Claude Desktop, conecte-se ao MCP Server
3. Use comandos como:
   - `criar site hostinger meu-site`
   - `listar produtos loja1`
   - `adicionar produto loja1 "Nome do produto" 99.90`

### Através da API

```javascript
const client = require('./client');

// Listar todos os sites
client.call('sites.list')
  .then(response => console.log(response))
  .catch(error => console.error(error));

// Adicionar produto
client.call('products.create', {
  siteId: 'loja1',
  productData: {
    name: 'Produto de Teste',
    price: 99.90,
    description: 'Descrição do produto'
  }
})
  .then(response => console.log(response))
  .catch(error => console.error(error));
```

## Recursos de Design System

O sistema inclui um Design System completo com suporte a Bootstrap 5, permitindo criar e personalizar facilmente sites e lojas com os seguintes recursos:

### Componentes Bootstrap

- `bs-navbar`: Barra de navegação responsiva
- `bs-footer`: Rodapé customizável
- `bs-carousel`: Carousel de imagens
- `bs-modal`: Janelas modais
- `bs-accordion`: Componente acordeão
- `bs-gallery`: Galeria de imagens
- `bs-product-card`: Cartão de produto

### Templates Bootstrap

- `bs-ecommerce`: Template para lojas online
- `bs-blog`: Template para blogs
- `bs-landing`: Template para landing pages
- `bs-portfolio`: Template para portfólios

### Exemplo de Uso de Componentes

```javascript
const { DesignSystem, ComponentManager } = require('./modules/design/index');

// Inicializar o Design System com suporte a Bootstrap
const designSystem = new DesignSystem({
  enableBootstrap: true
});

// Renderizar um navbar Bootstrap
const componentManager = new ComponentManager();
const html = await componentManager.renderComponent('bootstrap/navbar/bs-navbar', {
  options: {
    theme: 'light',
    fixed: true,
    logo: '/assets/logo.png'
  }
});
```

### Exemplo de Uso de Templates

```javascript
const { DesignSystem } = require('./modules/design/index');

// Inicializar o Design System
const designSystem = new DesignSystem({
  enableBootstrap: true
});

// Criar um renderizador de templates
const templateRenderer = designSystem.createBootstrapRenderer();

// Renderizar um template de e-commerce
const html = await templateRenderer.render('bs-ecommerce', {
  colorScheme: 'primary',
  layout: 'standard'
}, {
  siteInfo: { title: 'Minha Loja' },
  products: [...],
  categories: [...]
});
```

## Contribuição

Contribuições são bem-vindas! Por favor, leia o [guia de contribuição](CONTRIBUTING.md) para mais detalhes.

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).