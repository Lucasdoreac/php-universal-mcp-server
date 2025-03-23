/**
 * PHP Universal MCP Server - Extensões e Inicialização
 * 
 * Este arquivo estende o servidor MCP base com funcionalidades específicas e inicia o servidor
 * Versão 1.7.2
 */

const { MCPServer } = require('./server-part1');
const fs = require('fs');
const path = require('path');

// Carregar adaptadores de provedores
const HostingerProvider = require('./providers/hostinger');
const ShopifyProvider = require('./providers/shopify');
const WooCommerceProvider = require('./providers/woocommerce');

// Criar servidor
const server = new MCPServer();
const DEFAULT_PORT = process.env.MCP_PORT || 7654;

// Inicializar provedores
const hostingerProvider = new HostingerProvider(server.config.hosting?.providers?.hostinger || {});
const shopifyProvider = new ShopifyProvider(server.config.ecommerce?.providers?.shopify || {});
const woocommerceProvider = new WooCommerceProvider(server.config.ecommerce?.providers?.woocommerce || {});

// Registrar métodos de API dos provedores
hostingerProvider.registerApiMethods(server);
shopifyProvider.registerApiMethods(server);
woocommerceProvider.registerApiMethods(server);

// Registrar métodos de API para gerenciamento de sites
server.registerMethod('sites.create', async (params) => {
  const { provider, options } = params;
  
  switch (provider) {
    case 'hostinger':
      return await hostingerProvider.createSite(options);
    case 'shopify':
      return await shopifyProvider.createStore(options);
    case 'woocommerce':
      return await woocommerceProvider.createStore(options);
    default:
      throw new Error(`Provider '${provider}' not supported`);
  }
});

server.registerMethod('sites.list', async (params) => {
  const { provider } = params || {};
  
  if (provider) {
    switch (provider) {
      case 'hostinger':
        return await hostingerProvider.listSites(params);
      case 'shopify':
        return await shopifyProvider.listStores(params);
      case 'woocommerce':
        return await woocommerceProvider.listStores(params);
      default:
        throw new Error(`Provider '${provider}' not supported`);
    }
  }
  
  // Se nenhum provedor for especificado, combinar resultados de todos
  const results = await Promise.all([
    hostingerProvider.listSites().catch(e => ({ sites: [] })),
    shopifyProvider.listStores().catch(e => ({ stores: [] })),
    woocommerceProvider.listStores().catch(e => ({ stores: [] }))
  ]);
  
  return {
    success: true,
    data: {
      sites: [
        ...(results[0].data?.sites || []).map(site => ({ ...site, provider: 'hostinger' })),
        ...(results[1].data?.stores || []).map(store => ({ ...store, provider: 'shopify' })),
        ...(results[2].data?.stores || []).map(store => ({ ...store, provider: 'woocommerce' }))
      ]
    }
  };
});

// Adicionar suporte para comandos naturais
server.registerMethod('nlp.process', async (params) => {
  const { text } = params;
  
  // Comandos para criar site
  if (/^criar\s+site\s+(\w+)\s+(.+)$/i.test(text)) {
    const [_, provider, siteName] = text.match(/^criar\s+site\s+(\w+)\s+(.+)$/i);
    return await server.methods['sites.create']({ provider, options: { name: siteName } });
  }
  
  // Comandos para listar sites
  if (/^listar\s+sites/i.test(text)) {
    const provider = text.match(/^listar\s+sites\s+(\w+)/i)?.[1];
    return await server.methods['sites.list']({ provider });
  }
  
  // Comandos para editar templates
  if (/^editar\s+template\s+(.+)$/i.test(text)) {
    const [_, siteId] = text.match(/^editar\s+template\s+(.+)$/i);
    return await server.methods['design.editor.open']({ siteId });
  }
  
  // Comandos para exportar relatórios
  if (/^exportar\s+relatório\s+(\w+)\s+(.+)\s+(\w+)\s+(.+)$/i.test(text)) {
    const [_, reportType, siteId, format, period] = text.match(/^exportar\s+relatório\s+(\w+)\s+(.+)\s+(\w+)\s+(.+)$/i);
    return await server.methods['export.report']({ 
      siteId, 
      reportType, 
      format, 
      period 
    });
  }
  
  // Se nenhum comando for reconhecido
  return {
    success: false,
    error: "Comando não reconhecido. Tente 'criar site', 'listar sites', 'editar template' ou 'exportar relatório'."
  };
});

// Iniciar o servidor
server.startServer(DEFAULT_PORT);

// Tratamento de sinais
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.stop();
  process.exit(0);
});

module.exports = server;