# Configuração do Claude Desktop

Este documento fornece informações detalhadas sobre como configurar o Claude Desktop para utilizar o PHP Universal MCP Server com a funcionalidade de upload FTP.

## Arquivo de Configuração JSON

O Claude Desktop armazena suas configurações em um arquivo JSON localizado em:

- Windows: `%APPDATA%\Claude Desktop\claude-config.json`
- Mac: `~/Library/Application Support/Claude Desktop/claude-config.json`
- Linux: `~/.config/Claude Desktop/claude-config.json`

## Estrutura Completa do JSON

Abaixo está um exemplo completo da estrutura do arquivo de configuração com o PHP Universal MCP Server configurado:

```json
{
  "version": 1,
  "mcpServers": [
    {
      "name": "PHP Universal MCP Server",
      "url": "http://localhost:3100",
      "active": true,
      "id": "php-universal"
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
  "theme": "system"
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
      "id": "php-universal"
    }
  ]
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
    "id": "php-universal"
  },
  {
    "name": "Outro Servidor MCP",
    "url": "http://localhost:3000",
    "active": true,
    "id": "outro-servidor"
  }
]
```

## Resolução de Problemas

1. **JSON Inválido**:
   - Use um validador de JSON online como [JSONLint](https://jsonlint.com/) para verificar se o formato está correto
   - Erro comum: vírgulas extras após o último elemento em um array ou objeto

2. **Claude não reconhece o servidor**:
   - Verifique se a URL está correta
   - Certifique-se de que o servidor está rodando
   - Verifique se a porta não está bloqueada por um firewall

3. **Arquivo de configuração não existe**:
   - Se você não encontrar o arquivo, inicie o Claude Desktop pelo menos uma vez para que ele seja criado
   - Se precisar criar o arquivo do zero, use o exemplo de estrutura completa acima