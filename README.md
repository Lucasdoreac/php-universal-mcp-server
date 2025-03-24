# PHP Universal MCP Server

[![Status do Projeto](https://img.shields.io/badge/status-em%20desenvolvimento-brightgreen)](#)
[![Versão](https://img.shields.io/badge/versão-1.9.0-blue)](#)
[![Licença](https://img.shields.io/badge/licença-MIT-green)](#)
[![Testes](https://img.shields.io/badge/testes-84%25-yellow)](#)

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
- **Sistema de Plugins**: Extensão dinâmica de funcionalidades via plugins
- **Marketing Digital**: Sistema integrado de marketing e automação

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

### Provedores

- **Hostinger**: Gerenciamento completo de hospedagem web e domínios
- **Shopify**: Gerenciamento completo de lojas Shopify
- **WooCommerce**: Gerenciamento de lojas WooCommerce (100% implementado)
- **Google**: Integração com Google Analytics 4 e Search Console
- **Email Marketing**: Integrações com Mailchimp e SendinBlue
- **Redes Sociais**: Integrações com Facebook, Instagram e Twitter

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

# Gerenciar plugins
plugins listar
plugins instalar <nome-plugin>
plugins remover <nome-plugin>

# Marketing e SEO
marketing overview site-123
marketing seo analisar site-123 /produto/456
marketing social publicar site-123 facebook,instagram "Nova promoção!"
marketing email criar-campanha site-123 "Newsletter Mensal" "Novidades de Março"
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
const { hostingManager, marketingManager } = server.modules;
const sites = await hostingManager.listSites();

// Utilizar o sistema de marketing
const marketingOverview = await marketingManager.getOverview('site-123');
const dashboard = await marketingManager.generateMarketingDashboard({
  siteId: 'site-123',
  dateRange: {
    startDate: '2025-01-01',
    endDate: '2025-03-20'
  }
});
```

## Sistema de Marketing Digital

Nossa nova funcionalidade principal na versão 1.9.0 é o sistema integrado de marketing digital, que oferece:

- **SEO Avançado**: Análise e otimização de SEO, integração com Google Search Console
- **Analytics Unificado**: Métricas completas via Google Analytics 4
- **Email Marketing**: Integração com plataformas como Mailchimp e SendinBlue
- **Redes Sociais**: Publicação e análise em Facebook, Instagram e Twitter
- **Tracking e Conversões**: Monitoramento de objetivos e funis de conversão
- **Automação**: Criação automática de conteúdo e campanhas a partir de produtos

### Comandos de Marketing no Claude Desktop

```
# Visão geral de marketing
marketing overview site-123
marketing dashboard site-123 último-mês

# SEO
marketing seo analisar site-123 /página
marketing seo keywords site-123 último-mês

# Analytics
marketing analytics relatório site-123 último-mês
marketing analytics conversões site-123 objetivo-123

# Email
marketing email criar-campanha site-123 "Nome" "Assunto" "lista-123"
marketing email enviar-teste site-123 campanha-123 email@exemplo.com

# Redes Sociais
marketing social publicar site-123 facebook,instagram "Mensagem" [mídia]
marketing social publicar-produto site-123 produto-123 facebook,instagram

# Tracking
marketing tracking gerar-código site-123 google
marketing tracking conversões site-123 por-fonte
```

### Automação via Plugins

O sistema de marketing inclui plugins para automação:

- **Content Generator**: Gera conteúdo automático para redes sociais a partir de produtos
- **SEO Optimizer**: Sugere e aplica otimizações de SEO automaticamente
- **Campaign Scheduler**: Agenda campanhas de email com base em eventos específicos
- **Social Publisher**: Publica produtos em redes sociais automaticamente

## Sistema de Plugins

O sistema de plugins permite estender o servidor com funcionalidades personalizadas:

- **Plugins Dinâmicos**: Adicione novas funcionalidades sem modificar o core
- **Plugins Gerados pelo Claude**: O Claude pode criar plugins sob demanda via prompts
- **API Completa**: Interface de programação simples para desenvolver plugins
- **Gerenciamento Seguro**: Validação e sandbox para execução segura
- **Hot Reload**: Ativação e desativação sem reiniciar o servidor

### Comandos de Plugins no Claude Desktop

```
# Listar plugins instalados
plugins listar

# Instalar um plugin
plugins instalar <nome-plugin>

# Remover um plugin
plugins remover <nome-plugin>

# Ativar um plugin
plugins ativar <nome-plugin>

# Desativar um plugin
plugins desativar <nome-plugin>

# Obter informações de um plugin
plugins info <nome-plugin>

# Criar um novo plugin (requer descrição detalhada)
criar plugin <nome-plugin> "descrição do que o plugin deve fazer"
```

### Exemplos de Plugins Disponíveis

- **SEO Analytics**: Análise de SEO para produtos e páginas
- **Social Media Integration**: Integração com redes sociais
- **Backup Manager**: Gerenciamento avançado de backups
- **Security Scanner**: Verificação de segurança para sites
- **Performance Optimizer**: Otimização de desempenho para sites
- **Marketing Content Generator**: Geração automática de conteúdo para marketing

### Desenvolvendo Plugins

Plugins seguem uma estrutura simples e consistente:

```javascript
class MeuPlugin {
  static get info() {
    return {
      name: 'meu-plugin',
      version: '1.0.0',
      description: 'Meu plugin personalizado',
      author: 'Seu Nome',
      hooks: ['server:started', 'product:created']
    };
  }

  constructor(server, options) {
    this.server = server;
    this.options = options;
  }

  async initialize() {
    // Registrar hooks e métodos
    return true;
  }

  async deactivate() {
    // Limpar recursos
    return true;
  }
}
```

## Sistema de Analytics via Claude Artifacts

O sistema de analytics fornece visualizações ricas diretamente no Claude Desktop:

- **Dashboards Interativos**: Componentes React renderizados como artifacts do Claude
- **Relatórios de Vendas**: Visualização gráfica de receitas, pedidos e tendências
- **Desempenho de Produtos**: Gráficos para análise de produtos mais vendidos
- **Comportamento de Clientes**: Visualização de segmentação e padrões de compra
- **Gestão de Estoque**: Representação visual de níveis de estoque e alertas
- **Exportação Flexível**: Exportação de relatórios em CSV, PDF e JSON

## Editor de Templates

Nosso recurso de editor de templates permite personalização diretamente no Claude:

- **Editor Visual**: Interface interativa para personalização de templates
- **Componentes Drag & Drop**: Adicione e organize elementos com facilidade
- **Visualização em Tempo Real**: Veja as mudanças instantaneamente
- **Responsividade**: Teste como o site ficará em diferentes dispositivos
- **Temas Pré-definidos**: Escolha entre diversos temas profissionais

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
- [Sistema de Plugins](./docs/plugins/README.md)
- [Marketing Digital](./docs/marketing/README.md)

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
- [ ] Suporte a mais provedores de hospedagem
- [ ] Marketplace de plugins e templates

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Suporte

Para suporte, abra uma issue no GitHub ou entre em contato pelo email suporte@php-universal-mcp.com.