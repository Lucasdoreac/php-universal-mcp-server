# PHP Universal MCP Server

Um servidor MCP universal para desenvolvimento PHP e criação de sites com suporte a qualquer provedor de hospedagem.

## Instalação

```bash
npm install -g php-universal-mcp-server
```

## Configuração com Claude Desktop

- [Guia de Configuração Básica](CONFIGURACAO.md) - Instalação e configuração inicial
- [Detalhes do Formato JSON](CLAUDE_CONFIG.md) - Formato detalhado do arquivo de configuração
- [Inicialização Automática](AUTOSTART_CONFIG.md) - Configuração para inicialização automática

## Recursos

- Criação de sites com diversos templates
- Execução de código PHP
- Upload de sites para servidores via FTP
- Compatibilidade com provedores de hospedagem
- Integração com Model Context Protocol

## Upload FTP

O servidor inclui suporte para upload de sites via FTP:

```javascript
// Exemplo de uso programático
const { MCPServer } = require('php-universal-mcp-server');
const server = new MCPServer();

// Upload de um site para FTP
server.execute({
  action: 'uploadToFTP',
  domain: 'meu-site.com',
  ftpHost: 'ftp.meu-provedor.com',
  ftpUser: 'usuario',
  ftpPassword: 'senha',
  ftpPath: '/public_html/'
});
```

## Uso com Claude

```
Claude, faça upload do site minha-loja.com para o servidor FTP ftp.meudominio.com usando o usuário "login" e senha "minhasenha".
```

## Configuração do Claude Desktop

Existem duas formas de configurar o Claude Desktop:

### 1. Configuração Manual (URL)

```json
{
  "mcpServers": [
    {
      "name": "PHP Universal MCP Server",
      "url": "http://localhost:3100",
      "active": true,
      "id": "php-universal"
    }
  ]
}
```

### 2. Inicialização Automática (Recomendado)

```json
{
  "mcpServers": {
    "php-universal": {
      "command": "npx",
      "args": [
        "-y",
        "php-universal-mcp-server"
      ]
    }
  }
}
```

Detalhes completos em:
- [CONFIGURACAO.md](CONFIGURACAO.md) 
- [CLAUDE_CONFIG.md](CLAUDE_CONFIG.md)
- [AUTOSTART_CONFIG.md](AUTOSTART_CONFIG.md)

## Licença

MIT