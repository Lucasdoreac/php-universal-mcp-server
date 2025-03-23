# Hostinger Provider - Documentação Detalhada

## Introdução

O Hostinger Provider é um módulo que implementa a integração com a API Hostinger para gerenciamento de hospedagem, domínios, DNS, bancos de dados e arquivos. Este módulo é parte do PHP Universal MCP Server e permite que você gerencie seus sites hospedados na Hostinger através da interface do Claude Desktop.

## Instalação

O Hostinger Provider é incluído automaticamente no PHP Universal MCP Server. Não é necessária instalação adicional.

## Configuração

Para utilizar o Hostinger Provider, você precisa configurar suas credenciais da API Hostinger. Existem duas formas de fazer isso:

### 1. Configuração via Arquivo

Crie ou edite o arquivo `config/providers/hostinger.js` com suas credenciais:

```javascript
module.exports = {
  apiKey: 'SUA_API_KEY_AQUI',
  apiEndpoint: 'https://api.hostinger.com/v1', // Opcional, esse é o padrão
  auth: {
    clientId: 'SEU_CLIENT_ID', // Se usando OAuth
    clientSecret: 'SEU_CLIENT_SECRET', // Se usando OAuth
    tokenStoragePath: './data/tokens/hostinger' // Caminho para armazenar tokens
  }
};
```

### 2. Configuração via Variáveis de Ambiente

Defina as seguintes variáveis de ambiente:

```
HOSTINGER_API_KEY=sua-api-key
HOSTINGER_API_ENDPOINT=https://api.hostinger.com/v1
HOSTINGER_CLIENT_ID=seu-client-id
HOSTINGER_CLIENT_SECRET=seu-client-secret
HOSTINGER_TOKEN_STORAGE_PATH=./data/tokens/hostinger
```

### 3. Configuração via Claude Desktop

Você também pode configurar o provedor diretamente pelo Claude Desktop usando os comandos:

```
configurações provedor hostinger apiKey=sua-api-key
```

## Uso

### Inicialização

```javascript
const HostingerProvider = require('./providers/hostinger');

const hostinger = new HostingerProvider({
  apiKey: 'sua-api-key'
});

// Inicializa o provedor
await hostinger.initialize();
```

### Gerenciamento de Sites

#### Listar Sites

```javascript
const sites = await hostinger.listSites();
console.log(sites);
```

#### Obter Detalhes de um Site

```javascript
const site = await hostinger.getSite('id-do-site');
console.log(site);
```

#### Criar um Novo Site

```javascript
const newSite = await hostinger.createSite({
  domain: 'meusite.com',
  plan: 'business',
  title: 'Meu Novo Site'
});
console.log(newSite);
```

#### Atualizar um Site

```javascript
const updatedSite = await hostinger.updateSite('id-do-site', {
  title: 'Novo Título'
});
console.log(updatedSite);
```

#### Excluir um Site

```javascript
const success = await hostinger.deleteSite('id-do-site');
console.log(success);
```

### Gerenciamento de Domínios

#### Configurar Domínio para um Site

```javascript
const result = await hostinger.configureDomain('id-do-site', {
  domain: 'meusite.com'
});
console.log(result);
```

#### Configurar SSL

```javascript
const ssl = await hostinger.setupSSL('id-do-site');
console.log(ssl);
```

### Backup e Restauração

#### Criar Backup

```javascript
const backup = await hostinger.createBackup('id-do-site');
console.log(backup);
```

#### Restaurar Backup

```javascript
const result = await hostinger.restoreBackup('id-do-site', 'id-do-backup');
console.log(result);
```

### Monitoramento

#### Obter Métricas de Desempenho

```javascript
const metrics = await hostinger.getMetrics('id-do-site', { days: 30 });
console.log(metrics);
```

## Comandos no Claude Desktop

O PHP Universal MCP Server integra o Hostinger Provider com o Claude Desktop, permitindo que você execute comandos diretamente na interface de chat.

### Comandos Disponíveis

- `criar site <provedor> <nome> [opções]` - Cria um novo site
- `listar sites [filtro]` - Lista todos os sites
- `atualizar site <id> <opções>` - Atualiza configurações do site
- `excluir site <id>` - Remove um site
- `configurar domínio <site-id> <domínio>` - Configura domínio para um site
- `configurar ssl <site-id>` - Configura certificado SSL
- `atualizar plano <site-id> <plano>` - Atualiza plano de hospedagem
- `fazer backup <site-id>` - Cria backup de um site
- `restaurar backup <site-id> <backup-id>` - Restaura site a partir de um backup

### Exemplos

```
criar site hostinger meusite.com {"plan":"business","title":"Meu Site de Negócios"}
```

```
listar sites hostinger
```

```
configurar domínio site-123 meusite.com
```

## Arquitetura

O Hostinger Provider é composto por vários módulos:

### 1. index.js
Ponto de entrada do provedor, que implementa as operações principais de gerenciamento de sites.

### 2. auth.js
Responsável pela autenticação com a API Hostinger, armazenamento seguro de tokens e renovação automática de autenticação.

### 3. api.js
Implementa chamadas de baixo nível para a API Hostinger, com tratamento de erros e respostas.

### 4. db.js
Gerenciamento específico de bancos de dados MySQL.

### 5. domain.js
Gerenciamento de domínios e configurações de DNS.

### 6. file.js
Gerenciamento de arquivos via FTP/SFTP.

## Eventos

O Hostinger Provider herda de EventEmitter e emite diversos eventos que podem ser monitorados:

- `initialized` - Emitido quando o provedor é inicializado com sucesso
- `error` - Emitido quando ocorre um erro em qualquer operação
- `site-created` - Emitido quando um site é criado
- `site-updated` - Emitido quando um site é atualizado
- `site-deleted` - Emitido quando um site é removido
- `domain-configured` - Emitido quando um domínio é configurado
- `ssl-configured` - Emitido quando um SSL é configurado
- `backup-created` - Emitido quando um backup é criado
- `backup-restored` - Emitido quando um backup é restaurado
- `database-created` - Emitido quando um banco de dados é criado
- `file-uploaded` - Emitido quando um arquivo é enviado

## Tratamento de Erros

O Hostinger Provider trata erros de maneira consistente. Todas as operações que falham emitem um evento `error` com detalhes sobre o problema e também lançam uma exceção que pode ser capturada para tratamento apropriado.

```javascript
try {
  await hostinger.createSite(options);
} catch (error) {
  console.error('Erro ao criar site:', error.message);
}

// Ou usando eventos
hostinger.on('error', (error) => {
  console.error('Erro no provedor Hostinger:', error.message);
});
```

## Limitações

- O Hostinger Provider depende da API oficial da Hostinger, e está sujeito às suas limitações e restrições.
- Algumas operações podem requerer permissões específicas em sua conta Hostinger.
- A API da Hostinger pode ter limites de taxa de requisições que podem afetar o desempenho em cenários de uso intensivo.

## Solução de Problemas

### Erros de Autenticação

Se você encontrar erros de autenticação, verifique:

1. Se sua API Key está correta e ativa no painel da Hostinger
2. Se você tem permissões suficientes para realizar as operações desejadas
3. Se há algum problema de conectividade com a API da Hostinger

### Logs

O Hostinger Provider registra logs detalhados que podem ajudar na solução de problemas. Verifique os logs em `./logs/hostinger.log` ou configure um caminho personalizado em `config/providers/hostinger.js`.

## Suporte

Se precisar de ajuda com o Hostinger Provider, você pode:

1. Perguntar diretamente ao Claude Desktop
2. Consultar a documentação oficial da API Hostinger
3. Verificar os logs para mensagens de erro detalhadas