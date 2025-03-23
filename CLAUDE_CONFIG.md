# Configuração do Claude Desktop

Este documento fornece informações detalhadas sobre como configurar o Claude Desktop para utilizar o PHP Universal MCP Server versão 1.7.2 com suporte a recursos avançados.

## Arquivo de Configuração JSON

O Claude Desktop armazena suas configurações em um arquivo JSON localizado em:

- Windows: `%APPDATA%\Claude Desktop\claude-config.json`
- Mac: `~/Library/Application Support/Claude Desktop/claude-config.json`
- Linux: `~/.config/Claude Desktop/claude-config.json`

## Estrutura Completa do JSON

Abaixo está um exemplo completo da estrutura do arquivo de configuração com o PHP Universal MCP Server configurado:

```json
{
  "version": 2,
  "mcpServers": [
    {
      "name": "PHP Universal MCP Server",
      "url": "http://localhost:3100",
      "active": true,
      "id": "php-universal",
      "settings": {
        "caching": true,
        "artifactsEnabled": true,
        "templateEditor": true,
        "defaultProvider": "shopify",
        "responsive": true,
        "exportFormats": ["csv", "pdf", "json"]
      }
    }
  ],
  "pinnedConversations": [],
  "conversationStarters": {},
  "windowBounds": {
    "x": 100,
    "y": 100,
    "width": 1024,
    "height": 768
  },
  "proxyEnabled": false,
  "proxyUrl": "",
  "theme": "system",
  "fontSize": "medium",
  "artifacts": {
    "enabled": true,
    "preferSVG": true
  }
}
```

## Configuração Mínima Necessária

Se você já tem um arquivo de configuração existente, precisa apenas adicionar ou modificar a seção `mcpServers`. Aqui está o mínimo necessário:

```json
{
  "mcpServers": [
    {
      "name": "PHP Universal MCP Server",
      "url": "http://localhost:3100",
      "active": true,
      "id": "php-universal",
      "settings": {
        "caching": true,
        "artifactsEnabled": true
      }
    }
  ]
}
```

## Novas Configurações na Versão 1.7.2

A versão 1.7.2 introduz várias novas opções de configuração que podem ser definidas na seção `settings` do servidor MCP:

```json
"settings": {
  "caching": true,              // Ativa o sistema de cache para melhor desempenho
  "artifactsEnabled": true,     // Ativa o suporte para artifacts do Claude
  "templateEditor": true,       // Ativa o editor visual de templates
  "defaultProvider": "shopify", // Define o provedor padrão (shopify, hostinger, woocommerce)
  "responsive": true,           // Ativa o suporte a temas responsivos
  "exportFormats": ["csv", "pdf", "json"], // Formatos de exportação disponíveis
  "performance": {
    "compression": true,        // Ativa compressão de dados
    "lazyLoading": true,        // Ativa carregamento sob demanda
    "asyncProcessing": true     // Ativa processamento assíncrono
  }
}
```

## Como Editar o Arquivo

1. **Localizar o arquivo**:
   - Windows: Pressione `Win+R`, digite `%APPDATA%\Claude Desktop` e pressione Enter
   - Abra o arquivo `claude-config.json` em um editor de texto como o Notepad++, VS Code ou Sublime Text

2. **Fazer backup**:
   - Antes de editar, faça uma cópia do arquivo original

3. **Editar e Salvar**:
   - Adicione a configuração do servidor MCP conforme mostrado acima
   - Salve o arquivo
   - Certifique-se de que o JSON é válido (sem vírgulas extras no final dos blocos)

4. **Reinicie o Claude Desktop**

## Verificação da Porta

O PHP Universal MCP Server geralmente usa a porta 3100 por padrão. Se precisar verificar qual porta está sendo usada, execute:

```bash
php-universal-mcp-server --info
```

Se a porta for diferente de 3100, atualize o valor da `url` no arquivo de configuração para corresponder à porta correta.

## Exemplo com Múltiplos Servidores MCP

Se você já tem outros servidores MCP configurados, sua seção `mcpServers` pode ficar assim:

```json
"mcpServers": [
  {
    "name": "PHP Universal MCP Server",
    "url": "http://localhost:3100",
    "active": true,
    "id": "php-universal",
    "settings": {
      "caching": true,
      "artifactsEnabled": true,
      "templateEditor": true
    }
  },
  {
    "name": "Outro Servidor MCP",
    "url": "http://localhost:3000",
    "active": true,
    "id": "outro-servidor"
  }
]
```

## Configuração da Visualização de Artifacts

Para aproveitar ao máximo os recursos visuais do PHP Universal MCP Server, certifique-se de que as configurações de artifacts estejam habilitadas no Claude Desktop:

```json
"artifacts": {
  "enabled": true,
  "preferSVG": true
}
```

Esta configuração permite que o servidor exiba dashboards interativos, interfaces de gerenciamento e o editor visual de templates diretamente no chat do Claude.

## Configuração do Modo Responsivo

O suporte a temas responsivos permite testar como seu site ficará em diferentes dispositivos. Adicione estas configurações para ativar este recurso:

```json
"settings": {
  "responsive": true,
  "responsiveDevices": ["desktop", "tablet", "mobile"]
}
```

## Resolução de Problemas

1. **JSON Inválido**:
   - Use um validador de JSON online como [JSONLint](https://jsonlint.com/) para verificar se o formato está correto
   - Erro comum: vírgulas extras após o último elemento em um array ou objeto

2. **Claude não reconhece o servidor**:
   - Verifique se a URL está correta
   - Certifique-se de que o servidor está rodando
   - Verifique se a porta não está bloqueada por um firewall

3. **Artifacts não são exibidos corretamente**:
   - Verifique se `artifacts.enabled` está definido como `true`
   - Atualize para a versão mais recente do Claude Desktop (1.3.x ou superior)

4. **Sistema de cache não funciona**:
   - Verifique a configuração `cache` no arquivo `config.json` do servidor
   - Certifique-se de que há espaço suficiente em disco para armazenamento de cache

5. **Editor de templates não aparece**:
   - Verifique se `templateEditor` está definido como `true` nas configurações do servidor
   - Certifique-se de que as dependências necessárias foram instaladas (`npm install`)