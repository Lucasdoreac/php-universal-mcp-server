# Configuração do PHP Universal MCP Server com Claude Desktop

Este guia explica como configurar o Claude Desktop para utilizar o PHP Universal MCP Server e acessar a funcionalidade de upload FTP.

## Pré-requisitos

- Node.js instalado
- Claude Desktop instalado
- Acesso a um servidor FTP (para upload)

## Instalação

1. **Instale o PHP Universal MCP Server globalmente**:

```bash
npm install -g php-universal-mcp-server
```

2. **Inicie o servidor MCP**:

```bash
php-universal-mcp-server
```

O servidor deve iniciar e mostrar em qual porta está rodando (geralmente 3100).

## Configuração do Claude Desktop

1. **Localize o arquivo de configuração do Claude Desktop**:
   - Windows: `%APPDATA%\Claude Desktop\claude-config.json`
   - Ou: `C:\Users\[SeuUsuário]\AppData\Roaming\Claude Desktop\claude-config.json`

2. **Edite o arquivo JSON** e adicione o servidor MCP na seção `mcpServers`:

```json
{
  "mcpServers": [
    {
      "name": "PHP Universal MCP Server",
      "url": "http://localhost:3100",
      "active": true,
      "id": "php-universal"
    },
    // Outros servidores que você já tenha
  ]
}
```

3. **Reinicie o Claude Desktop** para carregar as novas configurações.

## Verificação da Configuração

Para verificar se o Claude Desktop está corretamente conectado ao servidor MCP:

1. Abra o Claude Desktop
2. Verifique se há um indicador de conexão ativa com o servidor MCP
3. Teste com um comando simples:
   ```
   Claude, qual o status do servidor PHP Universal MCP?
   ```

## Utilizando o FTP Uploader

Uma vez configurado, você pode usar comandos naturais para fazer upload de sites:

```
Claude, faça upload do site minha-loja.com para o servidor FTP ftp.meudominio.com usando o usuário "login" e senha "minhasenha".
```

Lembre-se que:
- O site precisa existir na pasta `C:\MCP\php-universal-mcp-server\sites\minha-loja.com\`
- As credenciais FTP precisam ser válidas
- O Claude não armazena as credenciais após a execução do comando

## Resolução de Problemas

Se encontrar dificuldades, verifique:

1. **Servidor MCP não inicia**:
   - Certifique-se de que a porta não está sendo usada por outro aplicativo
   - Verifique se o Node.js está instalado corretamente

2. **Claude não se conecta ao servidor**:
   - Verifique se a URL e a porta no arquivo de configuração estão corretas
   - Confirme se o servidor MCP está em execução

3. **Erro no upload FTP**:
   - Verifique se o site existe no diretório correto
   - Confirme se as credenciais FTP estão corretas
   - Verifique se o servidor FTP está acessível da sua rede