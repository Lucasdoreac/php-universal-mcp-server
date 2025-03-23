# PHP Universal MCP Server

Um servidor MCP universal para desenvolvimento PHP e criação de sites com suporte a qualquer provedor de hospedagem.

## Instalação

```bash
npm install -g php-universal-mcp-server
```

## Configuração com Claude Desktop

- [Guia de Configuração Básica](CONFIGURACAO.md) - Instalação e configuração inicial
- [Detalhes do Formato JSON](CLAUDE_CONFIG.md) - Formato detalhado do arquivo de configuração

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

Para usar este servidor com Claude Desktop:

1. Instale o pacote globalmente: `npm install -g php-universal-mcp-server`
2. Configure o Claude Desktop adicionando o servidor ao arquivo `claude-config.json`:

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

3. Inicie o servidor: `php-universal-mcp-server`
4. Reinicie o Claude Desktop

Configuração completa em [CONFIGURACAO.md](CONFIGURACAO.md) e [CLAUDE_CONFIG.md](CLAUDE_CONFIG.md).

## Licença

MIT