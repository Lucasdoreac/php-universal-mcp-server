# Sistema de Plugins

O PHP Universal MCP Server inclui um poderoso sistema de plugins que permite estender as funcionalidades do servidor sem modificar o código principal.

## Índice

- [Visão Geral](#visão-geral)
- [Usando Plugins no Claude Desktop](#usando-plugins-no-claude-desktop)
- [Plugins Gerados pelo Claude](#plugins-gerados-pelo-claude)
- [Desenvolvimento de Plugins](#desenvolvimento-de-plugins)
- [Referência de API](#referência-de-api)
- [Guia de Segurança](#guia-de-segurança)

## Visão Geral

O sistema de plugins do PHP Universal MCP Server permite:

- Adicionar novas funcionalidades sem modificar o core do sistema
- Estender os comandos disponíveis no Claude Desktop
- Integrar com serviços e APIs externos
- Personalizar o comportamento do servidor para casos de uso específicos
- Criar visualizações personalizadas via artifacts do Claude

## Usando Plugins no Claude Desktop

### Comandos Principais

```
# Listar plugins instalados
plugins listar

# Instalar um plugin
plugins instalar <nome-plugin>

# Remover um plugin
plugins remover <nome-plugin>

# Ativar um plugin
plugins ativar <nome-plugin>

# Desativar um plugin
plugins desativar <nome-plugin>

# Obter informações de um plugin
plugins info <nome-plugin>
```

### Exemplo de Uso

```
# Instalar o plugin SEO Analytics
plugins instalar seo-analytics

# Verificar informações do plugin
plugins info seo-analytics

# Usar a funcionalidade do plugin
seo analisar produto site-123 produto-456
```

## Plugins Gerados pelo Claude

Uma característica única do PHP Universal MCP Server é a capacidade de criar plugins sob demanda através do Claude.

### Como Solicitar um Plugin ao Claude

1. Descreva a funcionalidade desejada com detalhes
2. Solicite ao Claude para criar um plugin
3. O Claude desenvolverá o código do plugin
4. O plugin será instalado e ativado automaticamente

### Exemplo de Solicitação

```
Crie um plugin para integração com o Instagram que permite publicar produtos do WooCommerce diretamente no Instagram Shopping.
```

O Claude irá desenvolver o plugin, instalá-lo e fornecer instruções de uso.

## Desenvolvimento de Plugins

### Estrutura Básica

Plugins seguem uma estrutura padrão:

```
plugin-nome/
├── index.js         # Arquivo principal do plugin (obrigatório)
├── README.md        # Documentação do plugin (recomendado)
└── ... outros arquivos e pastas (opcional)
```

### Exemplo de Plugin Simples

```javascript
class MeuPlugin {
  /**
   * Informações do plugin
   */
  static get info() {
    return {
      name: 'meu-plugin',
      version: '1.0.0',
      description: 'Meu plugin personalizado',
      author: 'Seu Nome',
      requirements: {
        serverVersion: '>=1.8.0'
      },
      hooks: [
        'server:started',
        'product:created'
      ]
    };
  }

  /**
   * Construtor do plugin
   */
  constructor(server, options = {}) {
    this.server = server;
    this.options = options;
    this.methods = {};
    this.hooks = {};
  }

  /**
   * Inicialização do plugin
   */
  async initialize() {
    this.registerHooks();
    this.registerMethods();
    return true;
  }

  /**
   * Registra os hooks do plugin
   */
  registerHooks() {
    this.hooks['server:started'] = () => {
      console.log('Servidor iniciado');
    };
    
    this.hooks['product:created'] = (product) => {
      console.log(`Novo produto criado: ${product.name}`);
    };
    
    // Registra os hooks no sistema
    Object.entries(this.hooks).forEach(([event, handler]) => {
      this.server.on(event, handler);
    });
  }

  /**
   * Registra os métodos do plugin na API
   */
  registerMethods() {
    this.methods['meu-plugin.hello'] = async (params) => {
      return { message: `Olá, ${params.name || 'Mundo'}!` };
    };
    
    // Registra métodos na API
    Object.entries(this.methods).forEach(([name, handler]) => {
      this.server.registerMethod(name, handler);
    });
  }

  /**
   * Desativação do plugin
   */
  async deactivate() {
    // Remove hooks e métodos
    Object.keys(this.hooks).forEach(event => {
      this.server.removeListener(event, this.hooks[event]);
    });
    
    Object.keys(this.methods).forEach(name => {
      this.server.unregisterMethod(name);
    });
    
    return true;
  }
}

module.exports = MeuPlugin;
```

### Hooks Disponíveis

Os plugins podem se inscrever em vários eventos do sistema:

- `server:started` - Quando o servidor inicia
- `server:shutdown` - Quando o servidor está sendo desligado
- `plugin:loaded` - Quando um plugin é carregado
- `plugin:deactivated` - Quando um plugin é desativado
- `error` - Quando ocorre um erro no servidor
- `product:created` - Quando um produto é criado
- `product:updated` - Quando um produto é atualizado
- `product:deleted` - Quando um produto é removido
- `order:created` - Quando um pedido é criado
- `order:updated` - Quando um pedido é atualizado
- `order:deleted` - Quando um pedido é removido
- `customer:created` - Quando um cliente é criado
- `customer:updated` - Quando um cliente é atualizado

### API de Artifacts no Claude

Plugins podem criar visualizações via artifacts do Claude:

```javascript
// Exemplo de método que retorna um dashboard visual
async generateDashboard(siteId) {
  return {
    data: { /* dados do dashboard */ },
    visualization: {
      type: 'artifact',
      title: 'Meu Dashboard',
      content: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Dashboard</title>
          <style>/* estilos CSS */</style>
        </head>
        <body>
          <div class="dashboard">
            <!-- conteúdo do dashboard -->
          </div>
        </body>
        </html>
      `
    }
  };
}
```

## Referência de API

### Métodos do Plugin Manager

- `plugins.list()` - Lista todos os plugins instalados
- `plugins.install(source, options)` - Instala um plugin
- `plugins.create(pluginData)` - Cria um plugin a partir de código
- `plugins.remove(name)` - Remove um plugin
- `plugins.activate(name)` - Ativa um plugin
- `plugins.deactivate(name)` - Desativa um plugin
- `plugins.info(name)` - Obtém informações de um plugin

### Propriedades Estáticas do Plugin

- `name` (obrigatório) - Nome do plugin
- `version` (obrigatório) - Versão do plugin
- `description` - Descrição do plugin
- `author` - Autor do plugin
- `requirements` - Requisitos do plugin
  - `serverVersion` - Versão mínima do servidor
  - `providers` - Provedores necessários
- `hooks` - Lista de hooks que o plugin utiliza

### Métodos Obrigatórios do Plugin

- `constructor(server, options)` - Construtor do plugin
- `initialize()` - Inicialização do plugin
- `deactivate()` - Desativação do plugin

## Guia de Segurança

Ao desenvolver plugins, considere as seguintes práticas de segurança:

- Evite o uso de funções como `eval`, `Function`, `exec`
- Valide sempre as entradas do usuário
- Utilize apenas as APIs aprovadas do servidor
- Não acesse o sistema de arquivos fora dos diretórios permitidos
- Documente claramente as permissões necessárias
- Evite chamadas HTTP não seguras
- Utilize criptografia para dados sensíveis
