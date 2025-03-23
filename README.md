# PHP Universal MCP Server

Um servidor MCP (Model Context Protocol) universal para desenvolvimento PHP, compatível com diversos provedores de hospedagem e nuvem, funcional sem chave de API.

## Características

- **Universal**: Funciona com qualquer provedor de hospedagem ou plataforma de nuvem
- **Offline-first**: Completamente funcional sem necessidade de chaves de API
- **Multi-provider**: Suporte integrado para cPanel, Plesk, AWS, Azure, GCP e mais
- **Detecção automática**: Identifica automaticamente o ambiente de hospedagem
- **Compatibilidade MCP**: Conformidade total com o protocolo Model Context Protocol
- **Modo Fallback**: Continua operacional mesmo quando APIs externas falham

## Instalação

### Método 1: Usando NPM

```bash
npm install php-universal-mcp-server
```

### Método 2: Usando o MCP Installer (Recomendado para Claude Desktop)

Se você usa Claude Desktop com o [mcp-installer](https://github.com/anaisbetts/mcp-installer), pode instalar facilmente este servidor com o seguinte comando:

```
Hey Claude, install the MCP server named php-universal-mcp-server
```

Para configurar o servidor com parâmetros específicos:

```
Hey Claude, install the MCP server named php-universal-mcp-server. Use --mode offline --provider azure as arguments
```

Para usar com uma chave de API:

```
Hey Claude, install the MCP server named php-universal-mcp-server. Set the environment variable API_KEY to 'sua-chave-api-aqui'
```

### Configuração no claude_desktop_config.json

Você também pode configurar manualmente no `claude_desktop_config.json`:

```json
"mcpServers": {
  "php-universal-mcp": {
    "command": "npx",
    "args": [
      "php-universal-mcp-server",
      "--mode", "auto"
    ],
    "env": {
      "API_KEY": "sua-chave-api-aqui"
    }
  }
}
```

## Uso Básico

```javascript
const { createServer } = require('php-universal-mcp-server');

// Criar o servidor MCP
const server = createServer({
  mode: 'auto', // 'online', 'offline', 'auto'
  apiKey: '', // Vazio força modo offline/mock
  fallbackEnabled: true,
  providerType: 'auto' // 'cpanel', 'plesk', 'aws', 'azure', 'gcp', 'mock', 'auto'
});

// Iniciar o servidor
server.start();

// Executar um comando
const result = server.processCommand({
  type: 'execute',
  payload: {
    action: 'createSite',
    domain: 'example.com',
    template: 'ecommerce'
  }
});

console.log(result);
```

## Licença

MIT