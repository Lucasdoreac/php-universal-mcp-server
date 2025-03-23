# Configuração de Inicialização Automática para Claude Desktop

O PHP Universal MCP Server suporta inicialização automática pelo Claude Desktop, permitindo que o servidor seja iniciado automaticamente quando necessário, sem precisar executá-lo manualmente.

## Formato de Configuração Alternativo

Este formato utiliza o sistema de inicialização automática do Claude Desktop:

```json
{
  "mcpServers": {
    "php-universal": {
      "command": "npx",
      "args": [
        "-y",
        "php-universal-mcp-server"
      ]
    }
  }
}
```

## Configuração com Acesso FTP e Opções Avançadas

Para incluir opções avançadas:

```json
{
  "mcpServers": {
    "php-universal": {
      "command": "npx",
      "args": [
        "-y",
        "php-universal-mcp-server",
        "--enableFtp",
        "--sitesDir=/MCP/sites"
      ]
    }
  }
}
```

## Combinando com Outros Servidores MCP

Você pode combinar o PHP Universal MCP Server com outros servidores MCP:

```json
{
  "mcpServers": {
    "mcp-agent": {
      "command": "npx",
      "args": [
        "mcp-agent",
        "--upgrade"
      ]
    },
    "memory": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/MCP"
      ]
    },
    "php-universal": {
      "command": "npx",
      "args": [
        "-y",
        "php-universal-mcp-server"
      ]
    }
  }
}
```

## Opções Disponíveis

O PHP Universal MCP Server aceita os seguintes argumentos:

- `--port=XXXX`: Define a porta de escuta (padrão: 3100)
- `--enableFtp`: Ativa explicitamente o suporte a FTP
- `--sitesDir=/caminho/para/sites`: Define o diretório onde os sites estão armazenados
- `--logLevel=info|debug|error`: Define o nível de logs
- `--autoStart`: Configura o servidor para inicialização automática
- `--noColor`: Desativa cores no terminal

## Vantagens da Inicialização Automática

- O servidor é iniciado apenas quando necessário
- Não é preciso manter o servidor rodando manualmente
- O Claude Desktop gerencia o ciclo de vida do servidor
- Atualizações automáticas por usar `npx`