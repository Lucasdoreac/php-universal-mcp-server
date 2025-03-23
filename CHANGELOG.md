# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/spec/v2.0.0.html).

## [1.2.0] - 2025-03-23

### Adicionado
- Implementação completa do E-commerce Manager Core
- Modelos para Produtos, Pedidos, Clientes, Categorias e Cupons
- Controladores e serviços para operações CRUD
- Sistema avançado de relatórios e analytics
- Exemplos de uso para produtos e relatórios
- Documentação detalhada do componente de e-commerce
- Sistema de cache para otimização de desempenho

## [1.1.0] - 2025-03-23

### Adicionado
- Implementação do PHP Runtime Engine
- Ambiente seguro para execução de código PHP
- Sistema de limitação de recursos (tempo, memória, execuções)
- Captura estruturada de saídas e erros
- Gerenciamento de bibliotecas para e-commerce e web

## [1.0.1] - 2025-03-23

### Corrigido
- Adicionada importação do módulo crypto no arquivo MCPServer.js que estava faltando
- Corrigido problema de retorno no método _handleStream que não incluía o objeto stream

### Adicionado
- Implementação completa do MCP Protocol Layer
- Integração com Claude Desktop via MCP
- Suporte para detecção automática de provedores de hospedagem

## [1.0.0] - 2025-03-22

### Adicionado
- Lançamento inicial do PHP Universal MCP Server
- Implementação do núcleo do servidor MCP
- Suporte para execução de código PHP via linha de comando
- Interface de linha de comando (CLI) para operações do servidor
- Documentação básica de uso e configuração
- Provedores para diferentes plataformas (AWS, Azure, GCP, cPanel, Plesk, Hostinger)
- Implementação do protocolo Model Context Protocol (MCP)
- Servidor HTTP para atender requisições MCP
