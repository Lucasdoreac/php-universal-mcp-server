# Plugin Template

Este é um template básico para criação de plugins para o PHP Universal MCP Server.

## Como usar

1. Copie este diretório para a pasta `plugins` do PHP Universal MCP Server
2. Renomeie o diretório para o nome do seu plugin
3. Edite o arquivo `index.js` para implementar seu plugin
4. Atualize as informações estáticas (nome, versão, descrição, autor, etc.)
5. Ative o plugin no PHP Universal MCP Server

## Estrutura do Plugin

- `index.js`: Arquivo principal do plugin
- `README.md`: Documentação do plugin

## Interface Obrigatória

Todo plugin deve implementar:

- `static get info()`: Informações estáticas do plugin
- `constructor(server, options)`: Construtor do plugin
- `async initialize()`: Método de inicialização
- `async deactivate()`: Método de desativação

## Exemplo de Uso

```javascript
// Carregando o plugin
const PluginTemplate = require('./plugin-template');

// Criando instância
const plugin = new PluginTemplate(server, { /* opções */ });

// Inicializando
await plugin.initialize();

// Usando método do plugin
const result = await server.callMethod('plugin-template.hello', { name: 'User' });
console.log(result); // { message: 'Hello from Template Plugin, User!' }

// Desativando
await plugin.deactivate();
```

## Hooks Disponíveis

O plugin pode se inscrever em diversos hooks do sistema:

- `server:started`: Acionado quando o servidor inicia
- `server:shutdown`: Acionado quando o servidor é desligado
- `plugin:loaded`: Acionado quando um plugin é carregado
- `plugin:deactivated`: Acionado quando um plugin é desativado
- `error`: Acionado quando ocorre um erro no servidor
- `product:created`: Acionado quando um produto é criado
- `product:updated`: Acionado quando um produto é atualizado
- `product:deleted`: Acionado quando um produto é removido
- `order:created`: Acionado quando um pedido é criado
- `order:updated`: Acionado quando um pedido é atualizado
- `order:deleted`: Acionado quando um pedido é removido
- `customer:created`: Acionado quando um cliente é criado
- `customer:updated`: Acionado quando um cliente é atualizado