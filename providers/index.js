/**
 * Exporta todos os provedores disponíveis
 */

const HostingerProvider = require('./hostinger');
const WooCommerceProvider = require('./woocommerce');
const ShopifyProvider = require('./shopify');

module.exports = {
  hostinger: HostingerProvider,
  woocommerce: WooCommerceProvider,
  shopify: ShopifyProvider
  // Adicione outros provedores aqui quando implementados
};