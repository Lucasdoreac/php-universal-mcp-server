# FTP Uploader

O PHP Universal MCP Server inclui uma funcionalidade de upload FTP que permite enviar sites gerados para servidores de hospedagem.

## Uso via MCP

```
Claude, faça upload do site minha-loja.com para o servidor FTP ftp.meudominio.com usando o usuário "login" e senha "minhasenha".
```

## Uso programático

```javascript
const { MCPServer } = require('php-universal-mcp-server');
const server = new MCPServer();

// Upload simples
const resultado = await server.execute({
  action: 'uploadToFTP',
  domain: 'meu-site.com',
  ftpHost: 'ftp.meu-provedor.com',
  ftpUser: 'usuario',
  ftpPassword: 'senha'
});

// Upload com configurações avançadas
const resultadoAvancado = await server.execute({
  action: 'uploadToFTP',
  domain: 'meu-site.com',
  ftpHost: 'ftp.meu-provedor.com',
  ftpUser: 'usuario',
  ftpPassword: 'senha',
  ftpPort: 21,
  ftpPath: '/public_html/',
  useTLS: true
});
```

## Parâmetros

| Parâmetro | Tipo | Descrição | Obrigatório |
|-----------|------|-----------|-------------|
| domain | string | Domínio do site a ser enviado | Sim |
| ftpHost | string | Endereço do servidor FTP | Sim |
| ftpUser | string | Nome de usuário FTP | Sim |
| ftpPassword | string | Senha do usuário FTP | Sim |
| ftpPort | number | Porta do servidor FTP (padrão: 21) | Não |
| ftpPath | string | Caminho no servidor onde os arquivos serão enviados (padrão: '/') | Não |
| useTLS | boolean | Usar conexão segura TLS (padrão: true) | Não |

## Resposta

```json
{
  "success": true,
  "domain": "meu-site.com",
  "ftpHost": "ftp.meu-provedor.com",
  "ftpPath": "/public_html/",
  "message": "Site 'meu-site.com' foi enviado com sucesso para ftp.meu-provedor.com/public_html/",
  "timestamp": "2025-03-22T12:34:56.789Z"
}
```

## Tratamento de Erros

Em caso de erro, a resposta será:

```json
{
  "success": false,
  "error": "Mensagem de erro detalhada",
  "timestamp": "2025-03-22T12:34:56.789Z"
}
```

## Notas de Segurança

- As credenciais FTP são usadas apenas durante a execução do comando e não são armazenadas
- Recomenda-se usar conexões FTPS (FTP sobre TLS) sempre que possível
- Considere criar usuários FTP com permissões limitadas para upload de arquivos