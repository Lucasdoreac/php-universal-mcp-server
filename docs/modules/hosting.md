# Módulo de Hospedagem - Documentação

## Introdução

O módulo de hospedagem (Hosting Manager) do PHP Universal MCP Server fornece um sistema unificado para gerenciar hosts, sites, domínios e recursos de hospedagem através de diferentes provedores. Este módulo atua como uma camada de abstração sobre APIs específicas de provedores, oferecendo uma interface única e consistente para gerenciar recursos de hospedagem.

## Funcionalidades

### Gerenciamento de Sites

- Criação, leitura, atualização e exclusão de sites
- Gerenciamento de configurações e recursos
- Monitoramento de status e métricas

### Gerenciamento de Domínios

- Configuração de domínios para sites
- Gerenciamento de DNS e subdomínios
- Configuração de certificados SSL

### Backup e Restauração

- Criar e gerenciar backups de sites
- Restaurar sites a partir de backups
- Agendamento automático de backups

### Recursos de Hospedagem

- Monitoramento de recursos (CPU, memória, espaço em disco)
- Atualização de planos de hospedagem
- Obtenção de métricas de desempenho

## Uso Básico

### Inicialização

```javascript
const HostingManager = require('./modules/hosting');

// Inicializar o gerenciador de hospedagem
const hostingManager = new HostingManager({
  defaultProvider: 'hostinger', // Provedor padrão
  providers: {
    hostinger: { apiKey: 'sua-api-key' },
    // Outros provedores podem ser configurados aqui
  }
});

// Inicializar o gerenciador e seus provedores
await hostingManager.initialize();
```

### Gerenciamento de Sites

#### Listar Sites

```javascript
// Listar todos os sites do provedor padrão
const sites = await hostingManager.listSites();

// Ou especificar um provedor
const hostingerSites = await hostingManager.listSites('hostinger');

// Com filtro
const filteredSites = await hostingManager.listSites('hostinger', { status: 'active' });
```

#### Obter Detalhes de um Site

```javascript
const site = await hostingManager.getSite('site-id');
console.log(site);
```

#### Criar um Novo Site

```javascript
const newSite = await hostingManager.createSite({
  domain: 'example.com',
  plan: 'business',
  title: 'My Website'
});

// Ou especificar um provedor
const newSiteWithProvider = await hostingManager.createSite({
  domain: 'example.com',
  plan: 'business',
  title: 'My Website'
}, 'hostinger');
```

#### Atualizar um Site

```javascript
const updatedSite = await hostingManager.updateSite('site-id', {
  title: 'New Title',
  description: 'Updated description'
});
```

#### Excluir um Site

```javascript
const success = await hostingManager.deleteSite('site-id');
```

### Gerenciamento de Domínios

#### Configurar Domínio

```javascript
const result = await hostingManager.configureDomain('site-id', {
  domain: 'example.com'
});
```

#### Configurar SSL

```javascript
const ssl = await hostingManager.setupSSL('site-id');
```

### Backup e Restauração

#### Criar Backup

```javascript
const backup = await hostingManager.createBackup('site-id');
```

#### Restaurar Backup

```javascript
const result = await hostingManager.restoreBackup('site-id', 'backup-id');
```

### Recursos de Hospedagem

#### Obter Recursos

```javascript
const resources = await hostingManager.getResources('site-id');
console.log(resources); // { disk, bandwidth, cpu, memory }
```

#### Atualizar Plano

```javascript
const result = await hostingManager.upgradePlan('site-id', 'enterprise');
```

#### Obter Métricas

```javascript
const metrics = await hostingManager.getMetrics('site-id', { days: 30 });
```

## Eventos

O Hosting Manager herda de EventEmitter e emite diversos eventos que podem ser monitorados:

- `initialized` - Emitido quando o gerenciador é inicializado
- `provider-initialized` - Emitido quando um provedor específico é inicializado
- `site-created` - Emitido quando um site é criado
- `site-updated` - Emitido quando um site é atualizado
- `site-deleted` - Emitido quando um site é removido
- `backup-created` - Emitido quando um backup é criado
- `backup-restored` - Emitido quando um backup é restaurado
- `domain-configured` - Emitido quando um domínio é configurado
- `ssl-configured` - Emitido quando um SSL é configurado
- `error` - Emitido quando ocorre um erro em qualquer operação

```javascript
hostingManager.on('site-created', (data) => {
  console.log(`Site criado no provedor ${data.provider}: ${data.site.id}`);
});

hostingManager.on('error', (error) => {
  console.error('Erro no gerenciador de hospedagem:', error.message);
});
```

## Integração com Provedores

O Hosting Manager suporta integração com diferentes provedores de hospedagem. Atualmente, os seguintes provedores são suportados:

- **Hostinger** - Suporte completo para todas as operações
- **WooCommerce** - Em desenvolvimento
- **Shopify** - Em desenvolvimento

### Adicionar Novo Provedor

Novos provedores podem ser adicionados implementando a interface básica de provedor:

1. Criar um novo diretório em `providers/` (ex: `providers/newprovider/`)
2. Implementar a classe principal do provedor com métodos padrão (initialize, listSites, createSite, etc.)
3. Adicionar o provedor ao arquivo `providers/index.js`

## Configuração

### Configuração via Arquivo

Você pode configurar o módulo de hospedagem através do arquivo `config/hosting.js`:

```javascript
module.exports = {
  defaultProvider: 'hostinger',
  providers: {
    hostinger: require('./providers/hostinger'),
    // Outros provedores podem ser configurados aqui
  },
  cache: {
    enabled: true,
    ttl: 300 // 5 minutos
  },
  logging: {
    level: 'info',
    file: './logs/hosting.log'
  }
};
```

### Configuração via Variáveis de Ambiente

Defina as seguintes variáveis de ambiente:

```
MCP_DEFAULT_PROVIDER=hostinger
MCP_CACHE_ENABLED=true
MCP_CACHE_TTL=300
MCP_LOG_LEVEL=info
```

## Limitações

- Algumas operações podem ser específicas de determinados provedores e não estar disponíveis em todos
- O desempenho depende das APIs dos provedores e pode variar
- Operações de alto volume podem estar sujeitas a limites de taxa de requisições

## Solução de Problemas

### Diagnóstico de Erros

Quando ocorrer um erro, o Hosting Manager fornece informações detalhadas através do evento `error` e exceções lançadas. Sempre verifique:

1. Se as credenciais do provedor estão corretas
2. Se o provedor está funcionando normalmente (verifique status da API)
3. Se os parâmetros fornecidos nas chamadas são válidos

### Logs

O módulo registra logs detalhados que podem ajudar na solução de problemas. Verifique os logs em `./logs/hosting.log` ou configure um caminho personalizado em `config/hosting.js`.

## Segurança

O Hosting Manager trabalha em conjunto com o Módulo de Segurança para garantir:

- Armazenamento seguro de credenciais de provedores
- Transmissão segura de dados sensíveis
- Validação de entradas e saídas
- Controle de acesso baseado em permissões

## Considerações de Desempenho

- O módulo implementa cache para melhorar o desempenho de operações frequentes
- As operações são executadas de forma assíncrona para não bloquear o fluxo principal
- Quando possível, as operações em lote são utilizadas para reduzir o número de chamadas à API