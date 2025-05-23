# PHP Universal MCP Server

[![Status do Projeto](https://img.shields.io/badge/status-em%20desenvolvimento-brightgreen)](#)
[![Versão](https://img.shields.io/badge/versão-1.12.0--dev-blue)](#)
[![Licença](https://img.shields.io/badge/licença-MIT-green)](#)
[![Testes](https://img.shields.io/badge/testes-87%25-yellow)](#)

## Descrição

O PHP Universal MCP Server é uma poderosa ferramenta que permite gerenciar múltiplos sites e e-commerces através do Claude Desktop usando o Model Context Protocol (MCP). Esta solução unificada facilita o controle de hospedagem, design, produtos e administração de diversos sites sem a necessidade de conhecer os detalhes técnicos de cada plataforma.

## Recursos

- **Gerenciamento Universal**: Interface unificada para diversas plataformas (Hostinger, WooCommerce, Shopify)
- **Provedores Cloud**: Suporte para AWS, GCP e mais provedores cloud
- **Controle Completo**: Gerencie hospedagem, domínios, design, produtos e pedidos
- **Visualização Avançada**: Dashboards e interfaces interativas via artifacts do Claude
- **Templates**: Sistema completo de design com suporte a Bootstrap 5
- **Analytics**: Relatórios detalhados com visualização gráfica diretamente no Claude
- **Exportação**: Exportação de relatórios em formatos CSV, PDF e JSON
- **Segurança**: Autenticação robusta e armazenamento seguro de credenciais
- **Automação**: Simplifique tarefas complexas com comandos simples
- **Extensibilidade**: Arquitetura modular para fácil adição de novos provedores
- **Responsividade**: Temas adaptados para visualização em dispositivos móveis
- **Caching**: Sistema otimizado de cache para melhor desempenho
- **Sistema de Plugins**: Extensão dinâmica de funcionalidades via plugins e marketplace
- **Marketing Digital**: Sistema integrado de marketing e automação
- **Renderização Otimizada**: Sistema avançado para lidar com templates complexos e de grande porte
- **Testes Avançados**: Sistema completo de testes de integração com detecção de regressões

## Componentes

### Core

- **MCP Protocol Layer**: Implementação completa do protocolo MCP sobre JSON-RPC 2.0
- **PHP Runtime Engine**: Ambiente seguro para execução de código PHP
- **Cache System**: Sistema de caching para otimização de operações frequentes
- **Security Module**: Armazenamento seguro de credenciais e autenticação avançada
- **Plugin Manager**: Sistema para extensão dinâmica de funcionalidades

### Módulos

- **E-commerce Manager**: API unificada para gerenciar produtos, pedidos e clientes
- **Analytics System**: Sistema completo de relatórios e métricas com visualização via Claude
- **Design System**: Motor de templates com suporte ao Bootstrap 5 e adaptação responsiva
- **Hosting Manager**: Gerenciamento de recursos de hospedagem, domínios e SSL
- **Export Manager**: Sistema de exportação de relatórios em múltiplos formatos
- **Marketing Manager**: Sistema completo de marketing digital e automação
- **Cloud Manager**: Gerenciamento unificado de recursos em provedores cloud
- **Advanced Rendering System**: Sistema sofisticado para renderização de templates de qualquer complexidade

### Provedores

- **Hostinger**: Gerenciamento completo de hospedagem web e domínios
- **Shopify**: Gerenciamento completo de lojas Shopify
- **WooCommerce**: Gerenciamento de lojas WooCommerce (100% implementado)
- **Google**: Integração com Google Analytics 4 e Search Console
- **Email Marketing**: Integrações com Mailchimp e SendinBlue
- **Redes Sociais**: Integrações com Facebook, Instagram e Twitter
- **AWS**: Gerenciamento de EC2, S3, e outros serviços AWS
- **GCP**: Gerenciamento de App Engine, Cloud Storage e outros serviços GCP

### Integrações

- **Claude Desktop**: Interface natural para comandos via chat com visualizações avançadas

## O que há de novo na versão 1.12.0-dev

### Sistema Avançado de Renderização

Nossa nova funcionalidade principal é o Sistema Avançado de Renderização, que oferece:

- **SmartRenderer**: Seleciona automaticamente a melhor estratégia de renderização com base na análise do template
- **StreamingRenderer**: Renderização progressiva para templates extremamente grandes
- **AdvancedEdgeCaseOptimizer**: Detecção e otimização sofisticada de padrões problemáticos
- **Testes de Integração Avançados**: Sistema completo de testes automatizados com detecção de regressões
- **Visualizações Interativas**: Relatórios detalhados de testes visualizáveis diretamente no Claude

### Benefícios

- **Desempenho Otimizado**: Renderização até 65% mais rápida para templates complexos
- **Uso Eficiente de Memória**: Redução de 70% no uso de memória para templates grandes
- **Detecção de Problemas**: Identificação automática de padrões problemáticos
- **Visualização Interativa**: Relatórios detalhados via artifacts do Claude
- **Garantia de Qualidade**: Detecção automática de regressões de performance

## Instalação

### Requisitos

- Node.js 18.x ou superior
- Claude Desktop 1.4.x ou superior
- Acesso às APIs dos provedores desejados

### Instalação Rápida

```bash
# Via NPM
npm install -g php-universal-mcp-server

# Ou diretamente via repositório
git clone https://github.com/Lucasdoreac/php-universal-mcp-server.git
cd php-universal-mcp-server
npm install
```

### Configuração

1. Configure as credenciais dos provedores:

```bash
# Configuração interativa
php-mcp-server configure

# Ou manualmente editando o arquivo
vi config/providers/hostinger.js
```

2. Inicie o servidor:

```bash
php-mcp-server start
```

3. Conecte-se ao Claude Desktop:

```
No Claude Desktop, digite: conectar servidor mcp localhost:7654
```

## Uso Básico

### Comandos no Claude Desktop

```
# Criar um novo site
criar site hostinger meusite.com

# Listar sites
listar sites

# Configurar domínio
configurar domínio site-123 meusite.com

# Configurar SSL
configurar ssl site-123

# Adicionar produto
adicionar produto site-123 "Produto Teste" 99.90

# Gerar dashboard de analytics
analytics dashboard site-123 30 dias

# Exportar relatório
exportar relatório vendas site-123 pdf últimos-30-dias

# Editar template
editar template site-123

# Gerenciar pedidos
pedidos listar site-123
pedidos visualizar site-123 456
pedidos atualizar site-123 456 concluído "Pedido entregue e confirmado pelo cliente"
pedidos dashboard site-123

# Gerenciar plugins
plugins listar
plugins instalar <nome-plugin>
plugins remover <nome-plugin>

# Marketing e SEO
marketing overview site-123
marketing seo analisar site-123 /produto/456
marketing social publicar site-123 facebook,instagram "Nova promoção!"
marketing email criar-campanha site-123 "Newsletter Mensal" "Novidades de Março"

# Cloud Management
cloud aws ec2 listar
cloud gcp app-engine status
cloud storage criar-bucket <nome-bucket>

# Testes de Renderização
testes renderização executar
testes renderização visualizar último
testes renderização comparar último penúltimo
```

### Uso Programático

```javascript
const MCPServer = require('php-universal-mcp-server');

// Inicializar o servidor
const server = new MCPServer({
  port: 7654,
  providers: {
    hostinger: {
      apiKey: 'sua-api-key'
    },
    google: {
      credentials: require('./google-credentials.json'),
      analytics: {
        propertyId: 'properties/123456789'
      }
    },
    aws: {
      accessKeyId: 'sua-access-key',
      secretAccessKey: 'sua-secret-key',
      region: 'us-east-1'
    }
  },
  cache: {
    enabled: true,
    ttl: 3600 // 1 hora em segundos
  },
  rendering: {
    useSmartRenderer: true,
    detectEdgeCases: true,
    memoryOptimization: 'high'
  }
});

// Iniciar o servidor
server.start();

// Utilizar os módulos diretamente
const { hostingManager, marketingManager, cloudManager, renderingManager } = server.modules;
const sites = await hostingManager.listSites();
const instances = await cloudManager.aws.ec2.listInstances();

// Utilizar o sistema de renderização avançada
const template = await renderingManager.loadTemplate('template-name');
const rendered = await renderingManager.smartRender(template, {
  data: yourData,
  options: {
    streaming: true,
    detectEdgeCases: true,
    memoryOptimization: 'high'
  }
});
```

## Sistema Avançado de Renderização

### Renderizadores Disponíveis

- **StandardRenderer**: Renderizador padrão para templates simples
- **ProgressiveRenderer**: Renderização progressiva para templates médios a grandes
- **EnhancedProgressiveRenderer**: Versão otimizada do ProgressiveRenderer com uso eficiente de memória
- **StreamingRenderer**: Renderização em stream para templates extremamente grandes
- **SmartRenderer**: Seleciona automaticamente o melhor renderizador para cada template

### Otimizadores

- **MemoryOptimizer**: Otimiza o uso de memória durante a renderização
- **EdgeCaseOptimizer**: Detecta e otimiza padrões problemáticos básicos
- **AdvancedEdgeCaseOptimizer**: Versão avançada com detecção sofisticada de padrões

### Sistema de Testes

- **Testes Unitários**: Testes para cada renderizador e otimizador
- **Testes de Integração**: Testes para o sistema como um todo
- **Testes de Carga**: Testes com templates extremamente grandes
- **Detecção de Regressões**: Comparação automática com execuções anteriores
- **Visualização de Resultados**: Visualizações interativas no Claude Desktop

### Comandos de Teste

```bash
# Executar todos os testes de renderização
npm run test:rendering

# Executar testes com análise detalhada
node tests/scripts/run-advanced-rendering-tests.js

# Gerar visualização para o Claude Desktop
node tests/scripts/generate-claude-visualization.js
```

## Documentação

A documentação completa está disponível em:

- [Documentação Geral](./docs/README.md)
- [Guia de Início Rápido](./docs/quick-start.md)
- [Referência da API](./docs/api-reference.md)
- [Sistema de Analytics](./docs/analytics/README.md)
- [Provedores](./docs/providers/README.md)
- [Provedores Cloud](./docs/cloud/README.md)
- [Templates e Componentes](./docs/design/README.md)
- [Otimização de Performance](./docs/performance/README.md)
- [Sistema de Plugins](./docs/plugins/README.md)
- [Marketplace](./docs/marketplace/README.md)
- [Marketing Digital](./docs/marketing/README.md)
- [Sistema Avançado de Renderização](./docs/performance/advanced-rendering-system.md)
- [Testes de Integração](./docs/tests/integration-tests.md)

## Roadmap

- [x] Implementação do protocolo MCP
- [x] Integração com Bootstrap 5
- [x] Implementação do provedor Hostinger
- [x] Implementação do provedor Shopify
- [x] Sistema de analytics e relatórios via artifacts do Claude
- [x] Implementação de temas responsivos
- [x] Sistema de caching para otimização
- [x] Exportação de relatórios em múltiplos formatos
- [x] Editor visual de templates
- [x] Finalização do provedor WooCommerce (100% implementado)
- [x] Sistema de plugins de terceiros
- [x] Integração com ferramentas de marketing digital
- [x] Início da implementação de Cloud Providers (AWS, GCP)
- [x] Sistema avançado de renderização
- [x] Testes de integração avançados
- [ ] Finalização dos Cloud Providers (AWS, GCP, Azure)
- [ ] Marketplace de plugins e templates
- [ ] Sistema de automação avançada

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Suporte

Para suporte, abra uma issue no GitHub ou entre em contato pelo email suporte@php-universal-mcp.com.