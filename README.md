# PHP Universal MCP Server

Um servidor MCP universal para desenvolvimento PHP e criação de sites com suporte a qualquer provedor de hospedagem.

## Instalação

```bash
npm install -g php-universal-mcp-server
```

Para configuração detalhada com Claude Desktop, consulte o [Guia de Configuração](CONFIGURACAO.md).

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
2. Configure o Claude Desktop adicionando o servidor ao arquivo de configuração
3. Detalhes completos em [CONFIGURACAO.md](CONFIGURACAO.md)

## Licença

MIT