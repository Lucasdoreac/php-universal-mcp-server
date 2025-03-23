/**
 * Exporta todos os provedores disponíveis
 */

const HostingerProvider = require('./hostinger');
const WooCommerceProvider = require('./woocommerce');

module.exports = {
  hostinger: HostingerProvider,
  woocommerce: WooCommerceProvider,
  // Adicione outros provedores aqui quando implementados
  // shopify: require('./shopify')
};