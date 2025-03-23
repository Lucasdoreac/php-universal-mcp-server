/**
 * Shopify Settings Management Module
 * 
 * Implementa gerenciamento de configurações da loja na API Shopify.
 */

class SettingsManager {
  /**
   * Construtor do gerenciador de configurações
   * @param {Object} api Instância da API Shopify
   */
  constructor(api) {
    this.api = api;
    
    // Queries GraphQL
    this.shopSettingsQuery = `
      query getShopSettings {
        shop {
          id
          name
          email
          myshopifyDomain
          primaryDomain {
            url
            host
          }
          url
          currencyCode
          unitSystem
          ianaTimezone
          billingAddress {
            address1
            address2
            city
            country
            zip
            phone
          }
          contactEmail
          customerAccounts
          plan {
            displayName
            shopifyPlus
          }
          features {
            marketingActivityReporting
            multiLocation
            storefront
          }
          enabledPresentmentCurrencies
          merchantApps {
            edges {
              node {
                id
                name
                title
                developer
                developerName
                uninstallUrl
                created
              }
            }
          }
        }
      }
    `;
    
    this.policiesQuery = `
      query shopPolicies {
        shop {
          privacyPolicy {
            id
            title
            body
            url
          }
          refundPolicy {
            id
            title
            body
            url
          }
          termsOfService {
            id
            title
            body
            url
          }
          shippingPolicy {
            id
            title
            body
            url
          }
          subscriptionPolicy {
            id
            title
            body
            url
          }
        }
      }
    `;
    
    this.shippingSettingsQuery = `
      query shippingSettings {
        shop {
          shipsToCountries
          currencyFormats {
            moneyFormat
            moneyInEmailsFormat
          }
          weightUnit
        }
        deliveryProfiles(first: 10) {
          edges {
            node {
              id
              name
              default
              profileItems {
                edges {
                  node {
                    id
                  }
                }
              }
              profileLocations {
                edges {
                  node {
                    id
                    name
                    country
                    active
                  }
                }
              }
            }
          }
        }
      }
    `;
  }

  /**
   * Obtém informações básicas da loja
   * @param {boolean} useGraphQL Indica se deve usar GraphQL
   * @returns {Promise<Object>} Informações da loja
   */
  async getShopSettings(useGraphQL = true) {
    try {
      if (useGraphQL) {
        const result = await this.api.graphql(this.shopSettingsQuery);
        return result.data.shop;
      }
      
      const response = await this.api.get('shop.json');
      return response.shop;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém políticas da loja (privacidade, reembolso, etc.)
   * @param {boolean} useGraphQL Indica se deve usar GraphQL
   * @returns {Promise<Object>} Políticas da loja
   */
  async getPolicies(useGraphQL = true) {
    try {
      if (useGraphQL) {
        const result = await this.api.graphql(this.policiesQuery);
        return result.data.shop;
      }
      
      // Versão REST (precisa de múltiplas chamadas)
      const policies = {};
      
      // Política de privacidade
      try {
        const privacy = await this.api.get('policies/privacy_policy.json');
        policies.privacyPolicy = privacy.policy;
      } catch (e) {
        policies.privacyPolicy = null;
      }
      
      // Política de reembolso
      try {
        const refund = await this.api.get('policies/refund_policy.json');
        policies.refundPolicy = refund.policy;
      } catch (e) {
        policies.refundPolicy = null;
      }
      
      // Termos de serviço
      try {
        const terms = await this.api.get('policies/terms_of_service.json');
        policies.termsOfService = terms.policy;
      } catch (e) {
        policies.termsOfService = null;
      }
      
      // Política de envio
      try {
        const shipping = await this.api.get('policies/shipping_policy.json');
        policies.shippingPolicy = shipping.policy;
      } catch (e) {
        policies.shippingPolicy = null;
      }
      
      return policies;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém configurações de envio
   * @param {boolean} useGraphQL Indica se deve usar GraphQL
   * @returns {Promise<Object>} Configurações de envio
   */
  async getShippingSettings(useGraphQL = true) {
    try {
      if (useGraphQL) {
        const result = await this.api.graphql(this.shippingSettingsQuery);
        return {
          shop: result.data.shop,
          deliveryProfiles: result.data.deliveryProfiles.edges.map(edge => edge.node)
        };
      }
      
      // Versão REST (obtém apenas informações básicas)
      const shop = await this.getShopSettings(false);
      
      return {
        shop: {
          shipsToCountries: [], // Não disponível diretamente via REST
          weightUnit: shop.weight_unit,
          currencyFormats: {
            moneyFormat: shop.money_format,
            moneyInEmailsFormat: shop.money_with_currency_format
          }
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém configurações de pagamento
   * @returns {Promise<Object>} Configurações de pagamento
   */
  async getPaymentSettings() {
    try {
      // Infelizmente, a API REST não expõe diretamente os gateways de pagamento
      // Precisamos extrair do HTML da página de configurações ou usar a API GraphQL
      // Aqui retornaremos apenas informações básicas disponíveis
      const shop = await this.getShopSettings();
      
      return {
        currencyCode: shop.currencyCode || shop.currency,
        enabled_presentment_currencies: shop.enabledPresentmentCurrencies || [],
        money_format: shop.money_format,
        money_with_currency_format: shop.money_with_currency_format
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém metafields da loja
   * @returns {Promise<Array>} Lista de metafields
   */
  async getMetafields() {
    try {
      const response = await this.api.get('metafields.json');
      return response.metafields || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Adiciona um metafield à loja
   * @param {Object} metafieldData Dados do metafield
   * @returns {Promise<Object>} Metafield adicionado
   */
  async addMetafield(metafieldData) {
    try {
      const response = await this.api.post('metafields.json', { metafield: metafieldData });
      return response.metafield;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza um metafield da loja
   * @param {number} metafieldId ID do metafield
   * @param {Object} metafieldData Dados do metafield
   * @returns {Promise<Object>} Metafield atualizado
   */
  async updateMetafield(metafieldId, metafieldData) {
    try {
      const response = await this.api.put(`metafields/${metafieldId}.json`, { metafield: metafieldData });
      return response.metafield;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove um metafield da loja
   * @param {number} metafieldId ID do metafield
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteMetafield(metafieldId) {
    try {
      return await this.api.delete(`metafields/${metafieldId}.json`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém webhooks configurados
   * @returns {Promise<Array>} Lista de webhooks
   */
  async getWebhooks() {
    try {
      const response = await this.api.get('webhooks.json');
      return response.webhooks || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria um novo webhook
   * @param {Object} webhookData Dados do webhook
   * @returns {Promise<Object>} Webhook criado
   */
  async createWebhook(webhookData) {
    try {
      const response = await this.api.post('webhooks.json', { webhook: webhookData });
      return response.webhook;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza um webhook existente
   * @param {number} webhookId ID do webhook
   * @param {Object} webhookData Dados do webhook
   * @returns {Promise<Object>} Webhook atualizado
   */
  async updateWebhook(webhookId, webhookData) {
    try {
      const response = await this.api.put(`webhooks/${webhookId}.json`, { webhook: webhookData });
      return response.webhook;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove um webhook
   * @param {number} webhookId ID do webhook
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteWebhook(webhookId) {
    try {
      return await this.api.delete(`webhooks/${webhookId}.json`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém informações sobre limites de consumo da API
   * @returns {Promise<Object>} Informações sobre limites
   */
  async getApiLimits() {
    try {
      // Não há um endpoint dedicado, mas podemos extrair informações dos cabeçalhos
      // Fazemos uma requisição simples e observamos os headers de limite
      const client = await this.api.getClient();
      const response = await client.get('shop.json', { params: { fields: 'id' } });
      
      // Extrair informações de limite dos cabeçalhos
      const headers = response.headers;
      
      return {
        callsMade: parseInt(headers['x-shopify-shop-api-call-limit']?.split('/')[0], 10) || 0,
        callsLimit: parseInt(headers['x-shopify-shop-api-call-limit']?.split('/')[1], 10) || 40,
        callsRemaining: parseInt(headers['x-shopify-shop-api-call-limit']?.split('/')[1], 10) - 
                       (parseInt(headers['x-shopify-shop-api-call-limit']?.split('/')[0], 10) || 0),
        retryAfter: headers['retry-after'] ? parseInt(headers['retry-after'], 10) : null,
        graphqlCost: {
          actualCost: parseFloat(headers['x-shopify-graphql-cost-actual-cost'] || '0'),
          throttleStatus: headers['x-shopify-graphql-cost-throttle-status'] || 'OK'
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém todos os países disponíveis
   * @returns {Promise<Array>} Lista de países
   */
  async getCountries() {
    try {
      const response = await this.api.get('countries.json');
      return response.countries || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém as províncias/estados de um país
   * @param {number} countryId ID do país
   * @returns {Promise<Array>} Lista de províncias/estados
   */
  async getProvinces(countryId) {
    try {
      const response = await this.api.get(`countries/${countryId}/provinces.json`);
      return response.provinces || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém configurações de gateway de pagamento (limitado)
   * @returns {Promise<Object>} Configurações de gateway de pagamento
   */
  async getPaymentGateways() {
    try {
      // Este endpoint tem restrições e pode não estar disponível
      // dependendo das permissões da API
      try {
        const response = await this.api.get('payment_gateways.json');
        return response.payment_gateways || [];
      } catch (e) {
        // Caso o endpoint não esteja disponível, retornar informações limitadas
        return {
          limited_access: true,
          message: 'Acesso limitado às informações de gateway de pagamento. É necessário permissões adicionais.'
        };
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém informações sobre moedas suportadas
   * @returns {Promise<Object>} Informações sobre moedas
   */
  async getCurrencySettings() {
    try {
      const shop = await this.getShopSettings();
      
      return {
        primary_currency: shop.currencyCode || shop.currency,
        enabled_presentment_currencies: shop.enabledPresentmentCurrencies || [],
        money_format: shop.money_format,
        money_with_currency_format: shop.money_with_currency_format,
        money_in_emails_format: shop.money_in_emails_format,
        money_with_currency_in_emails_format: shop.money_with_currency_in_emails_format
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SettingsManager;