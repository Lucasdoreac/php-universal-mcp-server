# PHP Universal MCP Server

Um servidor MCP (Model Context Protocol) que permite executar código PHP diretamente a partir do Claude Desktop, projetado para gerenciar sites de e-commerce em múltiplas plataformas de hospedagem.

## 🚀 Recursos

- Execute código PHP diretamente através do Claude
- Gerencie múltiplos sites de e-commerce em diferentes plataformas
- Integração com Hostinger, WooCommerce e Shopify
- Customize temas e adicione produtos através de comandos simples
- Obtenha informações sobre o ambiente PHP
- Automatize tarefas de gerenciamento web

## 📋 Pré-requisitos

- PHP 7.4 ou superior (recomendado PHP 8.2+)
- Claude Desktop (versão mais recente)
- Extensões PHP: json, mbstring, curl
- Acesso às APIs das plataformas de hospedagem desejadas

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

2. Configure o Claude Desktop:
```bash
# Windows (PowerShell como administrador)
php install.php

# macOS/Linux
php install.php
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

### 4. Personalizar temas

```
Claude, atualize a cor principal do meu tema Shopify para #3498db
```

### 5. Gerenciar múltiplos sites simultaneamente

```
Claude, mostre o status de todos os meus sites de e-commerce
```

## 📚 Documentação

Para documentação detalhada, visite [a página de documentação](docs/USAGE.md).

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia as [diretrizes de contribuição](CONTRIBUTING.md) antes de enviar um pull request.

## 📄 Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).