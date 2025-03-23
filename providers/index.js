/**
 * Exporta todos os provedores disponíveis
 */

const HostingerProvider = require('./hostinger');

module.exports = {
  hostinger: HostingerProvider,
  // Adicione outros provedores aqui quando implementados
  // woocommerce: require('./woocommerce'),
  // shopify: require('./shopify')
};