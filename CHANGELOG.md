# Changelog

Todas as alterações notáveis no projeto PHP Universal MCP Server serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/spec/v2.0.0.html).

## [1.10.0-dev] - Em Desenvolvimento

### Adicionado
- Implementação completa do AWS RDS Manager para gerenciamento de bancos de dados
- Templates de visualização para instâncias RDS e suas métricas
- Testes de integração para AWS RDS Manager
- Implementação do núcleo do AWS Provider
- Implementação do EC2 Manager para AWS
- Implementação do S3 Manager para AWS com gerenciamento de buckets e objetos
- Templates de visualização para buckets S3 e objetos
- Interfaces iniciais para AWS Lambda e CloudFront
- Implementação inicial do GCP Provider
- Implementação do App Engine Manager para GCP
- Implementação do Cloud Storage Manager para GCP
- Implementação do sistema de repositório para o Marketplace de Plugins
- Implementação do Installer para Marketplace de Plugins
- Estrutura base para testes de integração
- Testes de integração para AWS e GCP Providers
- Testes de integração para o Marketplace Repository e Installer

### Modificado
- Atualização da documentação para refletir novas funcionalidades
- Expansão do sistema de plugins para suportar o Marketplace
- Melhoria no sistema de logging para Cloud Providers
- Otimização do sistema de cache para recursos cloud
- Ampliação do sistema de tratamento de erros para operações assíncronas
- Melhoria na validação e segurança das operações cloud

### Correções
- Resolução de conflitos entre diferentes versões de plugins
- Correção na detecção de credenciais para provedores cloud
- Melhoria na validação de erros para operações AWS e GCP
- Correção de problemas de temporizações em operações assíncronas
- Correção de problemas de permissão em operações de armazenamento S3
- Aprimoramento na validação de métricas de desempenho RDS

## [1.9.0] - 2025-03-15

### Adicionado
- Sistema completo de Marketing Digital
- Integração com Google Analytics 4 e Search Console
- Suporte para email marketing (Mailchimp, SendinBlue)
- Integração com redes sociais (Facebook, Instagram, Twitter)
- Sistema de SEO automatizado
- Tracking de conversões e campanhas
- Visualização avançada via artifacts do Claude
- Plugins específicos para marketing digital
- Ferramentas de automação para content marketing

### Finalizado
- Implementação completa do Provider WooCommerce (100%)
- Gerenciamento completo de pedidos WooCommerce
- Gerenciamento completo de produtos e categorias WooCommerce
- Gerenciamento completo de clientes WooCommerce
- Gerenciamento completo de configurações WooCommerce
- Sistema completo de plugins de terceiros

### Modificado
- Melhoria significativa no sistema de cache
- Otimização de performance para operações frequentes
- Atualização da interface de gerenciamento de produtos
- Expansão do sistema de visualização de relatórios

### Correções
- Correção de problemas na autenticação OAuth
- Resolução de conflitos em operações concorrentes
- Melhorias na sincronização de dados entre sistemas
- Correção de problemas de memória em operações grandes

## [1.8.0] - 2025-02-25

### Adicionado
- Operações CRUD completas para produtos WooCommerce
- Gerenciamento de categorias de produtos em WooCommerce
- Dashboard interativo para analytics de produtos
- Exportação de relatórios em formatos CSV, PDF e JSON
- Sistema de filtros avançados para produtos
- Gerenciamento básico de pedidos WooCommerce
- Visualizações avançadas para métricas de vendas

### Modificado
- Melhoria no sistema de autenticação OAuth
- Otimização do carregamento de dados para produtos
- Atualização da API de Shopify para versão mais recente
- Melhoria nas visualizações de dashboards com gráficos interativos

### Correções
- Correção de problemas na sincronização de produtos com múltiplas variações
- Resolução de conflitos em APIs de terceiros
- Melhoria na gestão de erros para operações de e-commerce
- Correção de problemas de paginação em listagens grandes

## [1.7.0] - 2025-01-20

### Adicionado
- Editor visual de templates
- Sistema de temas responsivos
- Suporte completo ao Bootstrap 5
- Componentes reutilizáveis para design de sites
- Preview em tempo real de alterações de design
- Templates pré-configurados para diferentes tipos de sites
- Sistema de exportação de templates

### Modificado
- Melhoria significativa na interface de gerenciamento de sites
- Atualização do sistema de caching para melhor desempenho
- Expansão da API de hospedagem
- Otimização de queries para melhor performance

### Correções
- Correção de problemas em layouts responsivos
- Resolução de conflitos entre diferentes componentes de UI
- Melhoria na compatibilidade com diferentes navegadores
- Correção de problemas de renderização em dispositivos móveis

## [1.6.0] - 2024-12-15

### Adicionado
- Implementação completa do Provider Shopify
- Gerenciamento de produtos Shopify
- Gerenciamento de coleções Shopify
- Gerenciamento de pedidos Shopify
- Personalização de temas e apps Shopify
- Gerenciamento de clientes Shopify
- Visualizações via artifacts do Claude para Shopify

### Modificado
- Melhoria na abstração de APIs para diferentes provedores
- Otimização de performance para operações com grande volume de dados
- Expansão do sistema de logging para operações críticas
- Atualização da documentação para incluir exemplos de Shopify

### Correções
- Resolução de problemas de autenticação com Shopify API
- Correção de bugs em operações assíncronas
- Melhoria na validação de dados para diferentes provedores
- Ajustes na formatação de dados para relatórios

## [1.5.0] - 2024-11-10

### Adicionado
- Implementação completa do Provider Hostinger
- Criação e gerenciamento de sites
- Configuração de domínios e DNS
- Gerenciamento de bancos de dados MySQL
- Upload de arquivos via FTP/SFTP
- Configuração automatizada de SSL
- Monitoramento de desempenho e uso de recursos
- Sistema de backup e restauração

### Modificado
- Melhoria no sistema de autenticação
- Otimização do sistema de cache
- Melhoria na interface de comandos via chat
- Expansão dos comandos disponíveis no CLI

### Correções
- Resolução de problemas de permissões em uploads
- Correção de bugs na configuração de domínios
- Melhoria na gestão de erros para operações de hospedagem
- Ajustes na validação de configurações de DNS

## [1.0.0] - 2024-10-05

### Adicionado
- Lançamento inicial do PHP Universal MCP Server
- Implementação completa do protocolo MCP sobre JSON-RPC 2.0
- Ambiente seguro para execução de código PHP
- Estrutura modular para extensibilidade
- Sistema básico de cache
- Interface de comandos via chat
- Configuração inicial de provedores
- Sistema básico de logs e diagnóstico

[1.10.0-dev]: https://github.com/Lucasdoreac/php-universal-mcp-server/compare/v1.9.0...HEAD
[1.9.0]: https://github.com/Lucasdoreac/php-universal-mcp-server/compare/v1.8.0...v1.9.0
[1.8.0]: https://github.com/Lucasdoreac/php-universal-mcp-server/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/Lucasdoreac/php-universal-mcp-server/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/Lucasdoreac/php-universal-mcp-server/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/Lucasdoreac/php-universal-mcp-server/compare/v1.0.0...v1.5.0
[1.0.0]: https://github.com/Lucasdoreac/php-universal-mcp-server/releases/tag/v1.0.0