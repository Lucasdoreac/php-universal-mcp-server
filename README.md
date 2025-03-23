# PHP Universal MCP Server

Um servidor MCP (Model Context Protocol) que permite executar código PHP diretamente a partir do Claude Desktop, projetado para gerenciar sites de e-commerce em múltiplas plataformas de hospedagem.

## 🚀 Recursos

- Execute código PHP diretamente através do Claude
- Gerencie múltiplos sites de e-commerce em diferentes plataformas
- API unificada para produtos, pedidos, clientes e relatórios
- Integração com Hostinger, WooCommerce e Shopify
- Customize temas e adicione produtos através de comandos simples
- Sistema completo de relatórios e analytics
- Interface natural para comandos via chat
- **NOVO!** Componentes Bootstrap avançados para interfaces modernas
- **NOVO!** Templates prontos para blogs e landing pages

## 📋 Pré-requisitos

- PHP 7.4 ou superior (recomendado PHP 8.2+)
- Claude Desktop (versão mais recente)
- Extensões PHP: json, mbstring, curl
- Acesso às APIs das plataformas de hospedagem desejadas
- Node.js 16.0+ para o servidor MCP

## 💾 Instalação

### Via npm (recomendado)

```bash
# Instalar globalmente
npm install -g @lucasdoreac/php-universal-mcp-server

# Configurar no Claude Desktop
php-universal-mcp configure
```

### Manual (via GitHub)

1. Clone este repositório:
```bash
git clone https://github.com/Lucasdoreac/php-universal-mcp-server.git
cd php-universal-mcp-server
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o Claude Desktop:
```bash
# Windows (PowerShell como administrador)
node scripts/configure-claude.js

# macOS/Linux
node scripts/configure-claude.js
```

## 🔧 Configuração

Edite o arquivo `config/settings.json` para adicionar suas credenciais de API:

```json
{
  "hostinger": {
    "api_key": "sua_chave_api",
    "api_secret": "seu_segredo_api"
  },
  "woocommerce": {
    "api_url": "https://sua-loja.com",
    "consumer_key": "sua_chave",
    "consumer_secret": "seu_segredo"
  },
  "shopify": {
    "shop_url": "sua-loja.myshopify.com",
    "access_token": "seu_token"
  }
}
```

## 🖥️ Uso

No Claude Desktop, você pode usar os seguintes tipos de comandos:

### 1. Executar código PHP

```
Claude, use o PHP Universal MCP para executar:
phpinfo();
```

### 2. Gerenciar sites Hostinger

```
Claude, crie um novo site WordPress na minha conta Hostinger com o nome "minha-loja-online"
```

### 3. Gerenciar produtos WooCommerce

```
Claude, adicione um novo produto ao meu site WooCommerce com o nome "Camiseta Verão", preço 29.90, com 50 unidades em estoque
```

### 4. Gerenciar pedidos

```
Claude, mostre os últimos 10 pedidos do meu site Shopify e calcule o valor médio
```

### 5. Obter relatórios e análises

```
Claude, gere um relatório de vendas dos últimos 30 dias para o meu site WooCommerce
```

### 6. Usar componentes Bootstrap

```
Claude, crie uma página de produto usando o componente bs-product-modal com o título "Smartphone XYZ" e preço R$ 1.999,00
```

### 7. Criar um blog completo

```
Claude, crie um blog com o template bs-blog para o meu site, com o título "Blog de Tecnologia"
```

## 📊 Componentes Principais

### MCP Protocol Layer
Implementação do protocolo MCP sobre JSON-RPC 2.0 para comunicação com o Claude Desktop.

### PHP Runtime Engine
Ambiente seguro para execução de código PHP com limitação de recursos e gerenciamento de bibliotecas.

### E-commerce Manager Core
API unificada para gerenciamento de produtos, pedidos, clientes, categorias, cupons e relatórios em diferentes plataformas.

### Multi-provider Integration
Adaptadores específicos para cada plataforma suportada: Hostinger, WooCommerce, Shopify.

### Site Design System
Motor de templates para sites e e-commerce com personalização de temas, componentes Bootstrap, e templates completos.

### Hosting Manager
Gerenciamento de recursos de hospedagem, incluindo domínios, DNS e SSL.

## 📚 Documentação

Para documentação detalhada de cada componente, visite os seguintes links:

- [MCP Protocol Layer](docs/protocol.md)
- [PHP Runtime Engine](docs/php-runtime.md)
- [E-commerce Manager Core](modules/ecommerce/README.md)
- [Multi-provider Integration](docs/providers.md)
- [Site Design System](docs/design.md)
- [Hosting Manager](docs/hosting.md)
- [Componentes Bootstrap](docs/bootstrap-components.md) [NOVO!]

## 🛠️ Componentes Bootstrap

O PHP Universal MCP Server agora inclui componentes Bootstrap avançados:

- **Modal**: Visualização rápida de produtos com galeria de imagens
- **Accordion**: FAQs e categorias expansíveis
- **Gallery**: Visualização de produtos com múltiplos layouts
- **Templates completos**: Blog e landing pages prontos para uso

Para mais detalhes, consulte a [documentação dos componentes Bootstrap](docs/bootstrap-components.md).

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia as [diretrizes de contribuição](CONTRIBUTING.md) antes de enviar um pull request.

## 📄 Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).