# Configuração do PHP Universal MCP Server v1.7.2 com Claude Desktop

Este guia explica como configurar o Claude Desktop para utilizar o PHP Universal MCP Server versão 1.7.2 e acessar suas funcionalidades avançadas.

## Pré-requisitos

- Node.js 18.0.0 ou superior
- Claude Desktop 1.3.x ou superior
- Acesso às APIs dos provedores (Shopify, Hostinger, WooCommerce)

## Instalação

1. **Instale o PHP Universal MCP Server globalmente**:

```bash
npm install -g php-universal-mcp-server
```

Ou para a versão mais recente diretamente do repositório:

```bash
npm install -g Lucasdoreac/php-universal-mcp-server
```

2. **Inicie o servidor MCP**:

```bash
php-universal-mcp-server
```

O servidor iniciará e mostrará em qual porta está rodando (geralmente 3100).

## Configuração do Claude Desktop

1. **Localize o arquivo de configuração do Claude Desktop**:
   - Windows: `%APPDATA%\Claude Desktop\claude-config.json`
   - Mac: `~/Library/Application Support/Claude Desktop/claude-config.json`
   - Linux: `~/.config/Claude Desktop/claude-config.json`

2. **Edite o arquivo JSON** e adicione o servidor MCP na seção `mcpServers`:

```json
{
  "mcpServers": [
    {
      "name": "PHP Universal MCP Server",
      "url": "http://localhost:3100",
      "active": true,
      "id": "php-universal",
      "settings": {
        "caching": true,
        "artifactsEnabled": true,
        "templateEditor": true,
        "responsive": true
      }
    }
  ]
}
```

**Para informações detalhadas sobre o formato JSON e exemplos completos, consulte [CLAUDE_CONFIG.md](CLAUDE_CONFIG.md).**

3. **Reinicie o Claude Desktop** para carregar as novas configurações.

## Configuração de Provedores

A versão 1.7.2 suporta as seguintes plataformas de hospedagem e e-commerce:

1. **Hostinger** (100% implementado):
   ```bash
   php-universal-mcp-server configure --provider hostinger --apiKey SUA_API_KEY
   ```

2. **Shopify** (100% implementado):
   ```bash
   php-universal-mcp-server configure --provider shopify --shopName SUA_LOJA --apiKey SUA_API_KEY --password SUA_SENHA
   ```

3. **WooCommerce** (70% implementado):
   ```bash
   php-universal-mcp-server configure --provider woocommerce --url https://sua-loja.com --consumerKey ck_xxx --consumerSecret cs_xxx
   ```

## Novos Recursos na Versão 1.7.2

### Sistema de Cache

Configure o sistema de cache para melhorar o desempenho:

```bash
php-universal-mcp-server config set cache.enabled true
php-universal-mcp-server config set cache.ttl 3600
```

### Editor de Templates

O editor visual de templates está disponível via comandos como:

```
Claude, abrir editor de templates para o site minha-loja.com
```

### Exportação de Relatórios

Exporte relatórios em vários formatos:

```
Claude, exportar relatório de vendas do site minha-loja.com em formato PDF para os últimos 30 dias
```

### Temas Responsivos

Visualize seus sites em diferentes tamanhos de tela:

```
Claude, mostrar versão mobile do site minha-loja.com
```

## Verificação da Configuração

Para verificar se o Claude Desktop está corretamente conectado ao servidor MCP:

1. Abra o Claude Desktop
2. Verifique se há um indicador de conexão ativa com o servidor MCP
3. Teste com um comando simples:
   ```
   Claude, qual o status do servidor PHP Universal MCP?
   ```

## Comandos Básicos no Claude

Aqui estão alguns comandos que você pode usar diretamente no Claude Desktop:

```
# Criar novo site
criar site hostinger meusite.com

# Listar sites gerenciados
listar sites

# Adicionar produto (Shopify ou WooCommerce)
adicionar produto site-123 "Produto Teste" 99.90

# Gerar dashboard de analytics
mostrar analytics site-123 últimos 30 dias

# Editar template
editar template site-123

# Exportar relatório
exportar relatório vendas site-123 pdf março
```

## Utilização de Artifacts

A versão 1.7.2 aproveita os artifacts do Claude para exibir interfaces ricas como:

1. Dashboards de analytics
2. Interfaces de gerenciamento de produtos
3. Editor visual de templates
4. Visualizações responsivas de sites

Certifique-se de que os artifacts estejam habilitados no Claude Desktop para aproveitar esses recursos.

## Configuração Avançada

Para configurações avançadas, você pode editar diretamente o arquivo de configuração em:

```
~/.config/php-universal-mcp-server/config.json
```

Ou use o assistente de configuração interativo:

```bash
php-universal-mcp-server configure --interactive
```

## Resolução de Problemas

Se encontrar dificuldades, verifique:

1. **Servidor MCP não inicia**:
   - Certifique-se de que a porta não está sendo usada por outro aplicativo
   - Verifique se o Node.js está na versão 18.0.0 ou superior

2. **Claude não se conecta ao servidor**:
   - Verifique se a URL e a porta no arquivo de configuração estão corretas
   - Confirme se o servidor MCP está em execução

3. **Artifacts não são exibidos**:
   - Verifique se os artifacts estão habilitados no Claude Desktop
   - Certifique-se de que o Claude Desktop está na versão 1.3.x ou superior

4. **Sistema de cache não funciona**:
   - Verifique as permissões da pasta de cache
   - Confirme se há espaço suficiente em disco

5. **Editor de templates não abre**:
   - Certifique-se de que templateEditor está configurado como true
   - Verifique se as dependências do projeto estão instaladas