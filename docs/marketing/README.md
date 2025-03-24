# Módulo de Marketing Digital

O Módulo de Marketing Digital do PHP Universal MCP Server oferece um conjunto abrangente de ferramentas para gerenciar, analisar e otimizar suas estratégias de marketing digital diretamente pelo Claude Desktop.

## Índice

- [Visão Geral](#visão-geral)
- [Submódulos](#submódulos)
- [Provedores Suportados](#provedores-suportados)
- [Comandos Claude](#comandos-claude)
- [API de Referência](#api-de-referência)
- [Visualizações via Artifacts](#visualizações-via-artifacts)
- [Exemplos de Uso](#exemplos-de-uso)
- [Guia de Configuração](#guia-de-configuração)

## Visão Geral

O Módulo de Marketing Digital unifica diversas ferramentas de marketing em uma única interface gerenciada pelo Claude Desktop. Ele permite:

- Análise e otimização de SEO
- Monitoramento de métricas de analytics
- Gerenciamento de campanhas de email marketing
- Publicação e análise de redes sociais
- Tracking de conversões e funis

A arquitetura modular permite extensão fácil para novos provedores e funcionalidades através do sistema de plugins.

## Submódulos

### SEO Manager

Gerencia análise e otimização de SEO:

- Análise de páginas (título, meta descrições, headings, etc.)
- Verificação de problemas técnicos
- Monitoramento de posicionamento de palavras-chave
- Recomendações de otimização

### Analytics Manager

Integração com plataformas de analytics:

- Métricas de tráfego e comportamento
- Análise de fontes de tráfego
- Monitoramento de conversões
- Geração de relatórios personalizados

### Email Manager

Gerenciamento de email marketing:

- Criação e envio de campanhas
- Monitoramento de métricas (abertura, cliques, etc.)
- Gestão de listas de contatos
- Testes e otimização

### Social Manager

Gerenciamento de redes sociais:

- Publicação de conteúdo em múltiplas redes
- Análise de engajamento
- Monitoramento de seguidores
- Publicação automática de produtos

### Tracking Manager

Monitoramento de conversões:

- Criação de objetivos de conversão
- Construção de funis
- Análise de taxas de conversão
- Geração de códigos de tracking

## Provedores Suportados

### Google

- Google Analytics 4
- Google Search Console
- Google Tag Manager

### Email Marketing

- Mailchimp
- SendinBlue

### Redes Sociais

- Facebook
- Instagram
- Twitter

## Comandos Claude

O módulo de marketing pode ser controlado através dos seguintes comandos via Claude Desktop:

### Comandos Gerais

```
marketing overview <site-id>
marketing dashboard <site-id> [período]
```

### Comandos de SEO

```
marketing seo overview <site-id>
marketing seo analisar <site-id> <url>
marketing seo sugestões <site-id> <url>
marketing seo keywords <site-id> [período]
```

### Comandos de Analytics

```
marketing analytics overview <site-id>
marketing analytics relatório <site-id> [período] [formato]
marketing analytics fontes <site-id> [período]
marketing analytics conversões <site-id> [período] [objetivo]
```

### Comandos de Email Marketing

```
marketing email overview <site-id>
marketing email campanhas <site-id>
marketing email criar <site-id> <nome> <assunto> <lista>
marketing email enviar-teste <site-id> <campanha-id> <email>
marketing email agendar <site-id> <campanha-id> <data-hora>
marketing email stats <site-id> <campanha-id>
```

### Comandos de Redes Sociais

```
marketing social overview <site-id>
marketing social publicar <site-id> <redes> <mensagem> [mídia]
marketing social publicar-produto <site-id> <produto-id> <redes> [mensagem]
marketing social métricas <site-id> <rede> [período]
```

### Comandos de Tracking

```
marketing tracking overview <site-id>
marketing tracking criar-objetivo <site-id> <nome> <tipo> [valor]
marketing tracking criar-funil <site-id> <nome> <etapas>
marketing tracking conversões <site-id> [objetivo] [período]
marketing tracking gerar-código <site-id> [provedor]
```

## API de Referência

### Marketing Manager

- `marketing.getOverview(siteId)`: Obtém visão geral consolidada
- `marketing.generateDashboard(siteId)`: Gera dashboard de marketing

### SEO

- `marketing.seo.getOverview(siteId)`: Visão geral de SEO
- `marketing.seo.analyzePage(siteId, pageUrl)`: Análise detalhada de página
- `marketing.seo.analyzeHtml(html)`: Análise de conteúdo HTML

### Analytics

- `marketing.analytics.getOverview(siteId)`: Visão geral de analytics
- `marketing.analytics.generateReport(siteId, options)`: Gera relatório personalizado

### Email

- `marketing.email.getOverview(siteId)`: Visão geral de email marketing
- `marketing.email.createCampaign(siteId, campaignData)`: Cria nova campanha
- `marketing.email.sendTest(siteId, campaignId, emails)`: Envia teste de campanha
- `marketing.email.scheduleCampaign(siteId, campaignId, date)`: Agenda campanha
- `marketing.email.getCampaignStats(siteId, campaignId)`: Estatísticas de campanha
- `marketing.email.getLists(siteId)`: Listas de email disponíveis

### Social

- `marketing.social.getOverview(siteId)`: Visão geral de redes sociais
- `marketing.social.publishPost(siteId, postData)`: Publica nas redes sociais
- `marketing.social.publishProduct(siteId, productId, options)`: Publica produto
- `marketing.social.getNetworkMetrics(siteId, network, options)`: Métricas de rede social

### Tracking

- `marketing.tracking.getOverview(siteId)`: Visão geral de tracking
- `marketing.tracking.createGoal(siteId, goalData)`: Cria objetivo de conversão
- `marketing.tracking.createFunnel(siteId, funnelData)`: Cria funil de conversão
- `marketing.tracking.getConversionsBySource(siteId, options)`: Conversões por fonte
- `marketing.tracking.generateTrackingCode(siteId, options)`: Gera código de tracking

## Visualizações via Artifacts

O módulo de marketing utiliza a funcionalidade de artifacts do Claude para apresentar visualizações ricas:

### Dashboard de Marketing

```javascript
// Exemplo de código para gerar dashboard no Claude
const dashboard = await marketingManager.generateMarketingDashboard(siteId);
return { success: true, data: dashboard };
```

### Relatório de Analytics

```javascript
// Exemplo de código para gerar relatório no Claude
const report = await analyticsManager.generateReport(siteId, {
  format: 'artifact'
});
return { success: true, data: report };
```

### Métricas de SEO

```javascript
// Exemplo de código para visualizar métricas de SEO no Claude
const seoReport = await seoManager.analyzePage(siteId, pageUrl);
// Transformar em visualização
return { success: true, data: seoReport };
```

## Exemplos de Uso

### Exemplo 1: Análise de SEO e Recomendações

```
Claude> marketing seo analisar exemplo.com /produto/123

[O Claude exibe um artifact com análise detalhada da página, incluindo:
- Score de SEO
- Problemas encontrados (título muito curto, falta de meta descrição)
- Recomendações específicas
- Visualização da estrutura da página]
```

### Exemplo 2: Dashboard Completo de Marketing

```
Claude> marketing dashboard exemplo.com último-mês

[O Claude exibe um artifact com dashboard completo, incluindo:
- Métricas de tráfego
- Conversões
- Performance de email marketing
- Atividade em redes sociais
- Posicionamento de palavras-chave
- Tendências e comparações com período anterior]
```

### Exemplo 3: Publicar Produto em Redes Sociais

```
Claude> marketing social publicar-produto exemplo.com PROD-123 facebook,instagram "Lançamento especial! Use o cupom LAUNCH20 para 20% de desconto"

[O Claude confirma a publicação com preview do post em cada rede]
```

## Guia de Configuração

### Configuração do Google Analytics

1. Crie um projeto no Google Cloud Console
2. Ative as APIs: Google Analytics Data API e Search Console API
3. Crie uma conta de serviço e baixe o arquivo JSON
4. Adicione a conta de serviço como usuário na propriedade do GA4
5. Configure o arquivo de credenciais:

```json
{
  "provider": "google",
  "credentials": {
    "client_email": "your-service-account@project.iam.gserviceaccount.com",
    "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n",
    "project_id": "your-project-id"
  },
  "analytics": {
    "property_id": "properties/123456789"
  },
  "search_console": {
    "site_url": "https://www.example.com/"
  }
}
```

### Configuração do Email Marketing

Para Mailchimp:

```json
{
  "provider": "mailchimp",
  "api_key": "your-mailchimp-api-key",
  "server_prefix": "us1"  // depende da sua região
}
```

Para SendinBlue:

```json
{
  "provider": "sendinblue",
  "api_key": "your-sendinblue-api-key"
}
```

### Configuração de Redes Sociais

Para Facebook/Instagram (via Facebook Graph API):

```json
{
  "provider": "facebook",
  "access_token": "your-facebook-page-access-token",
  "page_id": "your-facebook-page-id",
  "instagram_account_id": "your-instagram-account-id"  // se aplicável
}
```

## Extensão via Plugins

O módulo de marketing pode ser estendido através do sistema de plugins. Exemplos:

- Plugin para integração com outras plataformas de analytics
- Plugin para geração automática de conteúdo para redes sociais
- Plugin para otimização automática de SEO
- Plugin para análise de concorrência

Para criar um plugin de marketing, use a estrutura do sistema de plugins e conecte-se ao módulo de marketing existente.
