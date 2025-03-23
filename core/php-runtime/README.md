# PHP Runtime Engine

O PHP Runtime Engine é um componente central do PHP Universal MCP Server que fornece um ambiente seguro para execução de código PHP com limitação de recursos, captura estruturada de saídas e sistema de cache para otimização.

## Características

- **Ambiente Seguro**: Execução isolada de código PHP com configurações de segurança
- **Limites de Recursos**: Controle de tempo de execução, memória e número de execuções
- **Captura de Saídas**: Estruturação avançada de saídas e tratamento de erros
- **Suporte a Bibliotecas**: Carregamento dinâmico de bibliotecas para e-commerce e web
- **Sistema de Cache**: Cache eficiente para otimizar execuções repetidas

## Arquitetura

O PHP Runtime Engine é composto pelos seguintes módulos:

- **PHPExecutor**: Núcleo de execução de código PHP
- **ResourceLimiter**: Implementação de limites de recursos
- **OutputCapture**: Captura e processamento estruturado de saídas
- **LibraryManager**: Gerenciamento de bibliotecas PHP para desenvolvimento
- **CacheSystem**: Sistema de cache para otimização de desempenho

## Uso Básico

```javascript
const PHPRuntimeEngine = require('./core/php-runtime');

// Inicializa o engine com configurações
const runtime = new PHPRuntimeEngine({
  phpPath: '/usr/bin/php',
  timeout: 30000,
  memoryLimit: 128,
  cacheEnabled: true
});

// Executa código PHP
async function runPHP() {
  const result = await runtime.execute(`
    <?php
    echo json_encode([
      'message' => 'Hello from PHP!',
      'time' => time(),
      'memory' => memory_get_usage(true)
    ]);
  `);
  
  console.log(result);
}

runPHP();
```

## Configurações Disponíveis

| Opção | Descrição | Padrão |
|-------|-----------|--------|
| `phpPath` | Caminho para o binário PHP | Auto-detectado |
| `timeout` | Timeout em ms para execuções | 30000 |
| `memoryLimit` | Limite de memória em MB | 128 |
| `maxExecutions` | Número máximo de execuções | 1000 |
| `cacheEnabled` | Ativa/desativa o sistema de cache | true |
| `cacheLifetime` | Tempo de vida do cache em segundos | 3600 |
| `secureMode` | Ativa/desativa o modo seguro | true |
| `autoloadEnabled` | Ativa/desativa o autoload de bibliotecas | true |
| `defaultLibraries` | Lista de bibliotecas padrão | [] |

## Integração com E-commerce

O Runtime Engine suporta integração com várias plataformas de e-commerce, incluindo:

- WooCommerce
- Shopify
- Magento
- OpenCart

Para utilizar as bibliotecas de e-commerce:

```javascript
// Executa código com bibliotecas específicas
const result = await runtime.execute(phpCode, {
  libraries: ['woocommerce', 'http-client']
});
```

## Segurança

O PHP Runtime Engine implementa várias camadas de segurança:

- Limites de execução para prevenir loops infinitos
- Limites de memória para evitar uso excessivo de recursos
- Desabilitação de funções perigosas como `exec`, `system`, etc.
- Isolamento de arquivos temporários

## Cache e Otimização

O sistema de cache armazena resultados de execuções anteriores para melhorar a performance:

- Cache em memória para acesso rápido
- Cache em disco para persistência
- Gerenciamento automático de espaço e limpeza
- Chaves de cache baseadas em hashes criptográficos

## Gerenciamento de Recursos

O ResourceLimiter monitora e controla:

- Uso de CPU
- Uso de memória
- Execuções concorrentes
- Rate limiting para prevenir sobrecarga

## Tratamento de Erros

O sistema captura e estrutura diferentes tipos de erros PHP:

- Erros de sintaxe
- Erros fatais
- Avisos e notificações
- Stack traces completos

## Extensibilidade

O PHP Runtime Engine foi projetado para ser extensível:

- Adicione novas bibliotecas no diretório `libraries`
- Implemente handlers personalizados para saídas
- Customize limites de recursos por execução