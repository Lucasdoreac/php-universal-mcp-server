# PHP Universal MCP Server

[![Status do Projeto](https://img.shields.io/badge/status-em%20desenvolvimento-brightgreen)](#)
[![Versão](https://img.shields.io/badge/versão-0.9.6-blue)](#)
[![Licença](https://img.shields.io/badge/licença-MIT-green)](#)

## Descrição

O PHP Universal MCP Server é uma poderosa ferramenta que permite gerenciar múltiplos sites e e-commerces através do Claude Desktop usando o Model Context Protocol (MCP). Esta solução unificada facilita o controle de hospedagem, design, produtos e administração de diversos sites sem a necessidade de conhecer os detalhes técnicos de cada plataforma.

## Recursos

- **Gerenciamento Universal**: Interface unificada para diversas plataformas (Hostinger, WooCommerce, Shopify)
- **Controle Completo**: Gerencie hospedagem, domínios, design, produtos e pedidos
- **Templates**: Sistema completo de design com suporte a Bootstrap 5
- **Analytics**: Dashboard de métricas e relatórios avançados para acompanhamento de desempenho
- **Segurança**: Autenticação robusta e armazenamento seguro de credenciais
- **Automação**: Simplifique tarefas complexas com comandos simples
- **Extensibilidade**: Arquitetura modular para fácil adição de novos provedores

## Componentes

### Core

- **MCP Protocol Layer**: Implementação completa do protocolo MCP sobre JSON-RPC 2.0
- **PHP Runtime Engine**: Ambiente seguro para execução de código PHP

### Módulos

- **E-commerce Manager**: API unificada para gerenciar produtos, pedidos e clientes
- **Analytics System**: Sistema completo de relatórios e métricas de desempenho
- **Design System**: Motor de templates com suporte ao Bootstrap 5
- **Hosting Manager**: Gerenciamento de recursos de hospedagem, domínios e SSL
- **Security Module**: Sistema de autenticação e gestão segura de credenciais

### Provedores

- **Hostinger**: Gerenciamento completo de hospedagem web e domínios
- **WooCommerce**: Gerenciamento de lojas WooCommerce (em desenvolvimento)
- **Shopify**: Gerenciamento completo de lojas Shopify

### Integrações

- **Claude Desktop**: Interface natural para comandos via chat

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
  }
});
```

## Sistema de Analytics

O sistema de analytics fornece insights completos sobre o desempenho da sua loja:

- **Dashboard Completo**: Visualização intuitiva de todas as métricas importantes
- **Relatórios de Vendas**: Análise detalhada de receitas, pedidos e margens
- **Desempenho de Produtos**: Identificação dos produtos mais vendidos e categoria
- **Comportamento de Clientes**: Segmentação de clientes e padrões de compra
- **Gestão de Estoque**: Alertas de estoque baixo e análise de valor de inventário

## Componentes Bootstrap

O sistema inclui componentes pré-configurados do Bootstrap 5:

- **bs-modal**: Modal personalizado para diferentes usos
- **bs-accordion**: Accordions expansíveis para agrupar conteúdo
- **bs-gallery**: Galeria de imagens responsiva

## Templates Bootstrap

Templates prontos para uso:

- **bs-blog**: Template completo para blogs
- **bs-landing**: Template para páginas de destino
- **bs-portfolio**: Template para portfólios profissionais
- **bs-dashboard**: Template para dashboard administrativo

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

## Roadmap

- [x] Implementação do protocolo MCP
- [x] Integração com Bootstrap 5
- [x] Implementação do provedor Hostinger
- [x] Implementação do provedor Shopify
- [x] Sistema de analytics e relatórios
- [ ] Implementação do provedor WooCommerce 
- [ ] Sistema de plugins de terceiros
- [ ] Painel de controle web

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Suporte

Para suporte, abra uma issue no GitHub ou entre em contato pelo email suporte@php-universal-mcp.com.