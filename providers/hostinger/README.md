# Hostinger Provider

Este módulo implementa a integração com a API Hostinger para gerenciamento de hospedagem, domínios, DNS, bancos de dados e arquivos.

## Funcionalidades

- Autenticação segura com a API Hostinger
- Gerenciamento completo de websites e hospedagem
- Gerenciamento de domínios e DNS
- Configuração de certificados SSL
- Gerenciamento de bancos de dados MySQL
- Upload e download de arquivos via FTP/SFTP
- Criação e restauração de backups
- Monitoramento de recursos e métricas

## Uso Básico

```javascript
const HostingerProvider = require('./providers/hostinger');
const hostinger = new HostingerProvider({
  apiKey: 'sua-api-key'
});

// Inicializa o provedor
await hostinger.initialize();

// Lista websites
const websites = await hostinger.listSites();

// Cria um novo website
const newSite = await hostinger.createSite({
  domain: 'meusite.com',
  plan: 'business',
  title: 'Meu Site'
});

// Configura domínio
await hostinger.configureDomain(newSite.id, {
  domain: 'meusite.com'
});

// Configura SSL
await hostinger.setupSSL(newSite.id);
```

## Módulos

### auth.js
Implementa autenticação segura com a API Hostinger, incluindo armazenamento criptografado de tokens e renovação automática.

### api.js
Implementa chamadas de baixo nível para a API Hostinger, com tratamento de erros e renovação de tokens.

### db.js
Gerenciamento de bancos de dados MySQL, incluindo criação, exclusão e execução de queries.

### domain.js
Gerenciamento de domínios, incluindo configuração de DNS, renovação, e redirecionamentos.

### file.js
Gerenciamento de arquivos via FTP/SFTP, com suporte a upload, download e operações em diretórios.

## Autenticação

O módulo suporta dois métodos de autenticação:

1. **API Key** - Método direto usando uma chave de API obtida no painel Hostinger
2. **OAuth** - Autenticação usando Client ID e Client Secret para aplicações de terceiros

## Armazenamento Seguro

Credenciais e tokens são armazenados com criptografia AES-256 vinculada ao ambiente, protegendo dados sensíveis.

## Tratamento de Erros

Todos os métodos incluem tratamento robusto de erros, com retries automáticos para falhas transientes e logs detalhados.

## Desenvolvimento

### Dependências

- axios: Cliente HTTP para chamadas de API
- crypto: Biblioteca para criptografia
- fs: Acesso ao sistema de arquivos
- path: Manipulação de caminhos
- events: Emissão de eventos

### Eventos

O provedor emite eventos que podem ser capturados para monitoramento:

- initialized: Quando o provedor é inicializado
- error: Quando ocorre um erro
- site-created: Quando um site é criado
- site-updated: Quando um site é atualizado
- site-deleted: Quando um site é excluído
- domain-configured: Quando um domínio é configurado
- ssl-configured: Quando um SSL é configurado
- backup-created: Quando um backup é criado
- backup-restored: Quando um backup é restaurado
- database-created: Quando um banco de dados é criado
- file-uploaded: Quando um arquivo é enviado
