# PHP Universal MCP Server

Um servidor MCP (Model Context Protocol) universal para desenvolvimento PHP, compatível com diversos provedores de hospedagem e nuvem, funcional sem chave de API.

![Versão](https://img.shields.io/badge/versão-1.0.1-blue.svg)
![Licença](https://img.shields.io/badge/licença-MIT-green.svg)

## Características

- **Universal**: Funciona com qualquer provedor de hospedagem ou plataforma de nuvem
- **Offline-first**: Completamente funcional sem necessidade de chaves de API
- **Multi-provider**: Suporte integrado para cPanel, Plesk, AWS, Azure, GCP e mais
- **Detecção automática**: Identifica automaticamente o ambiente de hospedagem
- **Compatibilidade MCP**: Conformidade total com o protocolo Model Context Protocol
- **Modo Fallback**: Continua operacional mesmo quando APIs externas falham
- **Execução PHP**: Permite executar código PHP diretamente através do Model Context Protocol

## Novidades da Versão 1.0.1

- Corrigido problema de importação do módulo crypto
- Melhorada a integração com Claude Desktop
- Adicionado suporte para detecção automática de provedores
- [Visualize o changelog completo](./CHANGELOG.md)

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
const { createServer, startServer } = require('php-universal-mcp-server');

// Método 1: Criar e iniciar o servidor MCP interno
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

// Método 2: Iniciar o servidor HTTP para o protocolo MCP 
// (compatível com Claude Desktop e outros clientes MCP)
startServer({
  port: 7432,
  host: '127.0.0.1',
  mcpConfig: {
    mode: 'auto',
    providerType: 'auto'
  }
});
```

## Linha de Comando

```bash
# Iniciar o servidor no modo padrão
npx php-universal-mcp-server

# Iniciar em modo offline
npx php-universal-mcp-server --mode offline

# Usar um provedor específico
npx php-universal-mcp-server --provider azure

# Usar um arquivo de configuração
npx php-universal-mcp-server --config ./config.json

# Definir a porta HTTP para o servidor MCP
npx php-universal-mcp-server --port 8080

# Ver todas as opções disponíveis
npx php-universal-mcp-server --help
```

## Funções PHP Disponíveis

O servidor MCP permite executar código PHP diretamente através do protocolo MCP. As seguintes funções estão disponíveis:

* **executeCode**: Executa código PHP arbitrário e retorna os resultados
* **executeFile**: Executa um arquivo PHP específico
* **checkSyntax**: Verifica a sintaxe do código PHP sem executá-lo
* **getInfo**: Obtém informações sobre a instalação PHP disponível

Exemplo de uso através do MCP:

```javascript
// Através do servidor interno
const result = server.processCommand({
  type: 'execute',
  payload: {
    action: 'executeCode',
    code: '<?php echo "Hello from PHP!"; ?>'
  }
});

// Via HTTP com curl
curl -X POST http://localhost:7432/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "type": "execute",
    "payload": {
      "action": "executeCode",
      "code": "<?php echo \"Hello from PHP!\"; ?>"
    }
  }'
```

## Configuração

O servidor MCP aceita as seguintes opções de configuração:

| Opção | Descrição | Valor padrão |
|-------|-----------|--------------|
| `mode` | Modo de operação do servidor | `'auto'` |
| `apiKey` | Chave de API do provedor | `''` (vazio) |
| `fallbackEnabled` | Habilita fallback para mock quando APIs falham | `true` |
| `simulateResponses` | Habilita respostas simuladas no modo offline | `true` |
| `providerType` | Tipo de provedor de hospedagem | `'auto'` |
| `mockDataDir` | Diretório para dados simulados | `'./mock-data'` |
| `php.phpBinary` | Caminho para o binário PHP | Auto-detectado |
| `php.tempDir` | Diretório para arquivos temporários PHP | `os.tmpdir()` |
| `php.timeout` | Timeout para execução PHP (ms) | `30000` |

## Integração com Claude Desktop

Este servidor é totalmente compatível com o Claude Desktop usando o Model Context Protocol (MCP). Quando configurado no Claude Desktop, você pode executar código PHP diretamente através do Claude.

Exemplo de uso no Claude Desktop:

```
Quero executar este código PHP:

function fibonacci($n) {
    if ($n <= 1) return $n;
    return fibonacci($n-1) + fibonacci($n-2);
}

echo "Fibonacci de 10: " . fibonacci(10);
```

O Claude Desktop enviará o código para o servidor MCP que executará o código PHP e retornará os resultados.

## Modos de Operação

- **auto**: Detecta o melhor modo com base no ambiente e disponibilidade de API
- **online**: Força o uso de APIs reais, falha se não disponíveis
- **offline**: Força modo offline usando respostas simuladas

## Providers Suportados

- **PHP**: Execução direta de código PHP e scripts
- **cPanel**: Suporte para servidores que utilizam cPanel
- **Plesk**: Suporte para servidores que utilizam Plesk
- **AWS**: Integração com serviços AWS para hospedagem
- **Azure**: Integração com serviços Microsoft Azure
- **GCP**: Integração com Google Cloud Platform
- **Mock**: Provider simulado para desenvolvimento offline

## Comandos MCP

O servidor implementa os seguintes comandos do protocolo MCP:

- **status**: Retorna o status atual do servidor
- **execute**: Executa uma operação síncrona
- **stream**: Inicia uma operação assíncrona com eventos
- **cancel**: Cancela uma operação em andamento
- **terminate**: Finaliza o servidor

## Exemplo de Streams

```javascript
const { createServer } = require('php-universal-mcp-server');
const server = createServer();

server.start();

// Processa um comando de stream
const streamResult = server.processCommand({
  type: 'stream',
  payload: {
    action: 'executeCode',
    code: `
      <?php
      for ($i = 0; $i < 5; $i++) {
        echo "Processando etapa $i...\n";
        sleep(1);
      }
      echo "Concluído!";
    `
  }
});

// Obtém o stream
const stream = streamResult.stream;

// Eventos do stream
stream.emitter.on('start', (data) => {
  console.log('Stream iniciado:', data);
});

stream.emitter.on('data', (data) => {
  console.log('Progresso:', data.progress + '%');
  console.log('Saída:', data.result.output);
});

stream.emitter.on('end', (data) => {
  console.log('Stream finalizado:', data);
});

// Cancelar o stream (opcional)
setTimeout(() => {
  server.processCommand({
    type: 'cancel',
    payload: {
      sessionId: streamResult.sessionId
    }
  });
}, 2000);
```

## Extendendo o Servidor

Você pode estender o servidor com comandos personalizados:

```javascript
const { createServer } = require('php-universal-mcp-server');
const server = createServer();

// Registra um handler personalizado
server.registerHandler('customCommand', (command) => {
  // Implementação personalizada
  return {
    status: 'success',
    message: 'Custom command executed',
    result: { /* dados personalizados */ }
  };
});

// Usar o comando personalizado
const result = server.processCommand({
  type: 'customCommand',
  payload: { /* ... */ }
});
```

## Criando um Novo Provider

Você pode criar providers personalizados extendendo a classe BaseProvider:

```javascript
const { providers } = require('php-universal-mcp-server');
const { BaseProvider } = providers;

class MyCustomProvider extends BaseProvider {
  constructor(config) {
    super(config);
  }
  
  getName() {
    return 'my-custom-provider';
  }
  
  // Implementar os métodos restantes...
}

// Usar o provider personalizado
const server = createServer({
  providerType: 'custom'
});

// Registrar o provider personalizado
server._initProvider = function() {
  return new MyCustomProvider(this.config);
};
```

## Licença

MIT