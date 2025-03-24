# PHP Universal MCP Server

[![Status do Projeto](https://img.shields.io/badge/status-em%20desenvolvimento-brightgreen)](#)
[![Versão](https://img.shields.io/badge/versão-1.8.0-blue)](#)
[![Licença](https://img.shields.io/badge/licença-MIT-green)](#)
[![Testes](https://img.shields.io/badge/testes-82%25-yellow)](#)

## Descrição

O PHP Universal MCP Server é uma poderosa ferramenta que permite gerenciar múltiplos sites e e-commerces através do Claude Desktop usando o Model Context Protocol (MCP). Esta solução unificada facilita o controle de hospedagem, design, produtos e administração de diversos sites sem a necessidade de conhecer os detalhes técnicos de cada plataforma.

## Recursos

- **Gerenciamento Universal**: Interface unificada para diversas plataformas (Hostinger, WooCommerce, Shopify)
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
- **Gerenciamento de Pedidos**: Interface completa para visualização e administração de pedidos

## Componentes

### Core

- **MCP Protocol Layer**: Implementação completa do protocolo MCP sobre JSON-RPC 2.0
- **PHP Runtime Engine**: Ambiente seguro para execução de código PHP
- **Cache System**: Sistema de caching para otimização de operações frequentes
- **Security Module**: Armazenamento seguro de credenciais e autenticação avançada

### Módulos

- **E-commerce Manager**: API unificada para gerenciar produtos, pedidos e clientes
- **Analytics System**: Sistema completo de relatórios e métricas com visualização via Claude
- **Design System**: Motor de templates com suporte ao Bootstrap 5 e adaptação responsiva
- **Hosting Manager**: Gerenciamento de recursos de hospedagem, domínios e SSL
- **Export Manager**: Sistema de exportação de relatórios em múltiplos formatos
- **Order Manager**: Sistema de gerenciamento e acompanhamento de pedidos

### Provedores

- **Hostinger**: Gerenciamento completo de hospedagem web e domínios
- **Shopify**: Gerenciamento completo de lojas Shopify
- **WooCommerce**: Gerenciamento de lojas WooCommerce (100% implementado)

### Integrações

- **Claude Desktop**: Interface natural para comandos via chat com visualizações avançadas

## Instalação

### Requisitos

- Node.js 14.x ou superior
- Claude Desktop 1.3.x ou superior
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

# Gerenciar pedidos (NOVO)
pedidos listar site-123

# Visualizar pedido específico (NOVO)
pedidos visualizar site-123 456

# Atualizar status de pedido (NOVO)
pedidos atualizar site-123 456 concluído "Pedido entregue e confirmado pelo cliente"

# Dashboard de pedidos (NOVO)
pedidos dashboard site-123
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
    }
  },
  cache: {
    enabled: true,
    ttl: 3600 // 1 hora em segundos
  }
});

// Iniciar o servidor
server.start();

// Utilizar os módulos diretamente
const { hostingManager } = server.modules;
const sites = await hostingManager.listSites();

// Utilizar o sistema de analytics
const { ecommerceManager } = server.modules;
const analytics = ecommerceManager.getAnalyticsDashboard();
const dashboard = await analytics.generateDashboard({
  siteId: 'site-123',
  dateRange: {
    startDate: '2025-01-01',
    endDate: '2025-03-20'
  },
  format: 'artifact' // Ou 'json', 'csv', 'pdf'
});

// Gerenciar pedidos (NOVO)
const { woocommerceProvider } = server.providers;
const orders = await woocommerceProvider.orders.getOrders({ status: 'processing' });
```

## Sistema de Analytics via Claude Artifacts

O sistema de analytics fornece visualizações ricas diretamente no Claude Desktop:

- **Dashboards Interativos**: Componentes React renderizados como artifacts do Claude
- **Relatórios de Vendas**: Visualização gráfica de receitas, pedidos e tendências
- **Desempenho de Produtos**: Gráficos para análise de produtos mais vendidos
- **Comportamento de Clientes**: Visualização de segmentação e padrões de compra
- **Gestão de Estoque**: Representação visual de níveis de estoque e alertas
- **Exportação Flexível**: Exportação de relatórios em CSV, PDF e JSON

## Sistema de Gerenciamento de Pedidos

Nossa mais recente adição permite gerenciar pedidos diretamente no Claude Desktop:

- **Dashboard Completo**: Visualização interativa de todos os pedidos
- **Filtros Avançados**: Filtre por status, data, cliente e mais
- **Análise de Desempenho**: Gráficos de receita e distribuição de status
- **Detalhamento de Pedidos**: Acesse todas as informações de cada pedido
- **Atualização de Status**: Gerencie o ciclo de vida dos pedidos
- **Processamento de Reembolsos**: Gerencie reembolsos completos ou parciais
- **Exportação de Dados**: Exporte dados de pedidos em múltiplos formatos

## Editor de Templates

Nosso recurso de edição permite personalizar templates diretamente no Claude:

- **Editor Visual**: Interface interativa para personalização de templates
- **Componentes Drag & Drop**: Adicione e organize elementos com facilidade
- **Visualização em Tempo Real**: Veja as mudanças instantaneamente
- **Responsividade**: Teste como o site ficará em diferentes dispositivos
- **Temas Pré-definidos**: Escolha entre diversos temas profissionais

## Componentes Bootstrap via Artifacts

O sistema apresenta componentes diretamente no Claude via artifacts:

- **bs-modal**: Modal para visualização detalhada de produtos e pedidos
- **bs-accordion**: Informações expansíveis para categorias e FAQs
- **bs-gallery**: Visualização de imagens de produtos e templates
- **bs-dashboard**: Visualização completa de métricas e KPIs
- **bs-editor**: Editor visual de templates e páginas

## Templates Bootstrap

Templates visualizados diretamente no Claude via artifacts:

- **bs-blog**: Template completo para blogs
- **bs-landing**: Template para páginas de destino
- **bs-portfolio**: Template para portfólios profissionais
- **bs-dashboard**: Template para visualização de métricas
- **bs-shop**: Template responsivo para lojas online

## Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Documentação

A documentação completa está disponível em:

- [Documentação Geral](./docs/README.md)
- [Guia de Início Rápido](./docs/quick-start.md)
- [Referência da API](./docs/api-reference.md)
- [Sistema de Analytics](./docs/analytics/README.md)
- [Provedores](./docs/providers/README.md)
- [Templates e Componentes](./docs/design/README.md)
- [Otimização de Performance](./docs/performance/README.md)
- [Gerenciamento de Pedidos](./docs/orders/README.md)

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
- [x] Finalização do provedor WooCommerce (100% concluído)
- [ ] Sistema de plugins de terceiros
- [ ] Integração com ferramentas de marketing digital
- [ ] Suporte a mais provedores de hospedagem

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Suporte

Para suporte, abra uma issue no GitHub ou entre em contato pelo email suporte@php-universal-mcp.com.