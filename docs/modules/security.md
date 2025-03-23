# Módulo de Segurança - Documentação

## Introdução

O módulo de segurança do PHP Universal MCP Server fornece um sistema unificado para gerenciamento de autenticação, credenciais e permissões. Este módulo implementa armazenamento seguro de credenciais, criptografia/descriptografia e geração de tokens de acesso para diferentes provedores e componentes do sistema.

## Componentes

O módulo de segurança é composto pelos seguintes componentes principais:

### 1. AuthManager

Classe central para gerenciamento de autenticação que lida com o armazenamento seguro e recuperação de credenciais para os diferentes provedores do sistema.

### 2. PermissionManager

Implementa um sistema de controle de acesso baseado em papéis e permissões para diferentes operações no sistema.

### 3. TokenManager

Responsável pela geração, validação e renovação de tokens de autenticação para APIs de terceiros.

### 4. CipherUtils

Utilitários para criptografia e descriptografia de dados sensíveis armazenados localmente.

## Uso Básico

### Inicialização

```javascript
const { AuthManager } = require('./modules/security');

// Inicializar o gerenciador de autenticação
const authManager = new AuthManager({
  encryptionKey: 'sua-chave-secreta', // Opcional, será gerada automaticamente se não fornecida
  storageDir: './credentials' // Diretório para armazenar credenciais
});
```

### Gerenciamento de Credenciais

#### Armazenar Credenciais

```javascript
// Armazenar credenciais para o provedor Hostinger
const success = authManager.setCredentials('hostinger', {
  apiKey: 'api-key-da-hostinger',
  clientId: 'client-id-opcional',
  clientSecret: 'client-secret-opcional'
});

if (success) {
  console.log('Credenciais salvas com sucesso');
}
```

#### Recuperar Credenciais

```javascript
// Obter credenciais do provedor Hostinger
const credentials = authManager.getCredentials('hostinger');
console.log(credentials); // { apiKey: '***', clientId: '***', clientSecret: '***' }
```

#### Remover Credenciais

```javascript
// Remover credenciais de um provedor
const removed = authManager.removeCredentials('hostinger');

if (removed) {
  console.log('Credenciais removidas com sucesso');
}
```

#### Listar Provedores Configurados

```javascript
// Obter lista de provedores com credenciais configuradas
const providers = authManager.listProviders();
console.log(providers); // ['hostinger', 'shopify', ...]
```

### Inicializar Provedores

```javascript
const HostingerProvider = require('../../providers/hostinger');

// Inicializar um provedor usando credenciais armazenadas
const hostinger = authManager.initializeProvider(HostingerProvider, 'hostinger');

// Agora você pode usar o provedor normalmente
const sites = await hostinger.listSites();
```

### Gerar Senhas Seguras

```javascript
// Gerar uma senha segura com 20 caracteres
const password = authManager.generateSecurePassword(20, {
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true
});

console.log('Senha gerada:', password);
```

## Eventos

O AuthManager herda de EventEmitter e emite diversos eventos que podem ser monitorados:

- `credentials-updated` - Emitido quando credenciais são atualizadas
- `credentials-removed` - Emitido quando credenciais são removidas
- `error` - Emitido quando ocorre um erro em qualquer operação

```javascript
authManager.on('credentials-updated', (provider) => {
  console.log(`Credenciais do provedor ${provider} foram atualizadas`);
});

authManager.on('error', (error) => {
  console.error('Erro no gerenciador de autenticação:', error.message);
});
```

## Segurança dos Dados

### Criptografia

Todas as credenciais e segredos são armazenados criptografados usando AES-256-CBC. A chave de criptografia é derivada do ambiente da máquina ou pode ser fornecida através da variável de ambiente `MCP_ENCRYPTION_KEY`.

### Separação de Credenciais

As credenciais são divididas em dois arquivos criptografados separados:

1. `credentials.enc` - Contém informações não sensíveis como IDs, URLs, etc.
2. `secrets.enc` - Contém dados sensíveis como senhas, tokens, chaves, etc.

Esta separação adiciona uma camada extra de segurança, permitindo que apenas as informações estritamente necessárias sejam expostas durante o uso.

### Verificações de Segurança

O módulo implementa várias verificações de segurança:

- Validação da integridade dos dados criptografados
- Rotação automática de chaves para credenciais de longa duração
- Limitação de acesso a dados sensíveis apenas quando necessário

## Integração com Provedores

O módulo de segurança foi projetado para trabalhar perfeitamente com todos os provedores do PHP Universal MCP Server:

- Hostinger
- WooCommerce
- Shopify
- Futuros provedores adicionados ao sistema

## Configuração Avançada

### Configuração via Arquivo

Você pode configurar o módulo de segurança através do arquivo `config/security.js`:

```javascript
module.exports = {
  encryptionKey: process.env.MCP_ENCRYPTION_KEY,
  storageDir: './data/credentials',
  tokenExpiration: 3600, // Segundos
  passwordPolicy: {
    minLength: 12,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true
  }
};
```

### Configuração via Variáveis de Ambiente

Defina as seguintes variáveis de ambiente:

```
MCP_ENCRYPTION_KEY=sua-chave-secreta
MCP_CREDENTIALS_DIR=./data/credentials
MCP_TOKEN_EXPIRATION=3600
```

## Solução de Problemas

### Recuperar de Erros de Criptografia

Se houver problemas com a criptografia ou descriptografia de credenciais:

1. Verifique se a variável `MCP_ENCRYPTION_KEY` não foi alterada desde a última vez que as credenciais foram salvas
2. Verifique se os arquivos de credenciais não foram corrompidos
3. Como último recurso, remova os arquivos de credenciais e configure-os novamente

### Logs de Depuração

Aumente o nível de logging para obter informações detalhadas sobre o funcionamento do módulo de segurança:

```javascript
const authManager = new AuthManager({
  debug: true,
  logLevel: 'verbose'
});
```

## Limitações

- O armazenamento seguro depende da segurança do sistema de arquivos do host
- A criptografia é forte, mas não invulnerável se o atacante tiver acesso físico à máquina e à chave de criptografia
- As credenciais de provedores de terceiros podem expirar ou ser revogadas independentemente do gerenciamento local

## Considerações de Segurança

- Mantenha a chave de criptografia `MCP_ENCRYPTION_KEY` segura e não a compartilhe
- Implemente controles de acesso adequados ao sistema de arquivos onde as credenciais são armazenadas
- Considere a rotação periódica de chaves e credenciais para minimizar riscos
- Monitore os logs de segurança para detectar atividades suspeitas