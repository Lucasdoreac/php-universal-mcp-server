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
            id
            url
            sslEnabled
          }
          plan {
            displayName
            partnerDevelopment
            shopifyPlus
          }
          billingAddress {
            address1
            address2
            city
            country
            province
            zip
            phone
          }
          currencyCode
          currencyFormats {
            moneyFormat
            moneyInEmailsFormat
            moneyWithCurrencyFormat
            moneyWithCurrencyInEmailsFormat
          }
          unitSystem
          timezone
          iana_timezone
          weight_unit
          checkoutApiSupported
          taxesIncluded
          taxShipping
          countyTaxes
          address {
            address1
            address2
            city
            country
            province
            zip
            phone
          }
          coordinates {
            latitude
            longitude
          }
          productTypes(first: 25) {
            edges {
              node
            }
          }
          productVendors(first: 25) {
            edges {
              node
            }
          }
        }
      }
    `;
    
    this.policiesQuery = `
      query getPolicies {
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
    
    this.localesQuery = `
      query getLocales {
        shopLocales {
          locale
          name
          primary
          published
        }
      }
    `;
    
    this.shippingZonesQuery = `
      query getShippingZones {
        deliveryZones(first: 100) {
          edges {
            node {
              id
              name
              countries {
                id
                name
                code
                tax
                provinces {
                  id
                  name
                  code
                  tax
                }
              }
              carrierShippingRateProviders {
                id
                carrierService {
                  id
                  name
                  active
                  callbackUrl
                  serviceDiscovery
                  format
                  carrierServiceType
                }
              }
              priceBasedShippingRates {
                id
                name
                price {
                  amount
                  currencyCode
                }
                minOrderSubtotal {
                  amount
                  currencyCode
                }
                maxOrderSubtotal {
                  amount
                  currencyCode
                }
              }
              weightBasedShippingRates {
                id
                name
                price {
                  amount
                  currencyCode
                }
                weightLow
                weightHigh
              }
            }
          }
        }
      }
    `;
    
    this.paymentsQuery = `
      query getPaymentSettings {
        shop {
          paymentSettings {
            supportedDigitalWallets
            acceptedCardBrands
            cardVaultUrl
            countryCode
            currencyCode
          }
        }
      }
    `;
  }

  /**
   * Obtém configurações gerais da loja
   * @param {boolean} useGraphQL Indica se deve usar GraphQL
   * @returns {Promise<Object>} Configurações gerais
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
   * Obtém informações sobre políticas da loja (privacidade, reembolso, etc.)
   * @param {boolean} useGraphQL Indica se deve usar GraphQL
   * @returns {Promise<Object>} Políticas da loja
   */
  async getPolicies(useGraphQL = true) {
    try {
      if (useGraphQL) {
        const result = await this.api.graphql(this.policiesQuery);
        return result.data.shop;
      }
      
      // As políticas não são facilmente acessíveis via REST API, usando GraphQL mesmo se useGraphQL=false
      const result = await this.api.graphql(this.policiesQuery);
      return result.data.shop;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém locais disponíveis na loja
   * @param {boolean} useGraphQL Indica se deve usar GraphQL
   * @returns {Promise<Array>} Locais disponíveis
   */
  async getLocales(useGraphQL = true) {
    try {
      if (useGraphQL) {
        const result = await this.api.graphql(this.localesQuery);
        return result.data.shopLocales;
      }
      
      // Os locais não são facilmente acessíveis via REST API, usando GraphQL mesmo se useGraphQL=false
      const result = await this.api.graphql(this.localesQuery);
      return result.data.shopLocales;
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
        const result = await this.api.graphql(this.shippingZonesQuery);
        return result.data.deliveryZones.edges.map(edge => edge.node);
      }
      
      // Nas versões mais recentes da API REST, as zonas de envio são acessíveis
      const response = await this.api.get('shipping_zones.json');
      return response.shipping_zones || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém configurações de pagamento
   * @param {boolean} useGraphQL Indica se deve usar GraphQL
   * @returns {Promise<Object>} Configurações de pagamento
   */
  async getPaymentSettings(useGraphQL = true) {
    try {
      if (useGraphQL) {
        const result = await this.api.graphql(this.paymentsQuery);
        return result.data.shop.paymentSettings;
      }
      
      // As configurações de pagamento não são facilmente acessíveis via REST API
      const result = await this.api.graphql(this.paymentsQuery);
      return result.data.shop.paymentSettings;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém métodos de pagamento
   * @returns {Promise<Array>} Métodos de pagamento
   */
  async getPaymentMethods() {
    try {
      const response = await this.api.get('payment_methods.json');
      return response.payment_methods || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém fornecedores de envio
   * @returns {Promise<Array>} Fornecedores de envio
   */
  async getCarrierServices() {
    try {
      const response = await this.api.get('carrier_services.json');
      return response.carrier_services || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria um fornecedor de envio
   * @param {Object} serviceData Dados do fornecedor
   * @returns {Promise<Object>} Fornecedor criado
   */
  async createCarrierService(serviceData) {
    try {
      const response = await this.api.post('carrier_services.json', { carrier_service: serviceData });
      return response.carrier_service;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza um fornecedor de envio
   * @param {number} id ID do fornecedor
   * @param {Object} serviceData Dados do fornecedor
   * @returns {Promise<Object>} Fornecedor atualizado
   */
  async updateCarrierService(id, serviceData) {
    try {
      const response = await this.api.put(`carrier_services/${id}.json`, { carrier_service: serviceData });
      return response.carrier_service;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove um fornecedor de envio
   * @param {number} id ID do fornecedor
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteCarrierService(id) {
    try {
      return await this.api.delete(`carrier_services/${id}.json`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém configurações de checkout
   * @returns {Promise<Object>} Configurações de checkout
   */
  async getCheckoutSettings() {
    try {
      // Essa informação está embutida nas configurações gerais da loja
      const shop = await this.getShopSettings();
      
      // Extrai informações relevantes de checkout
      return {
        taxesIncluded: shop.taxesIncluded,
        taxShipping: shop.taxShipping,
        countyTaxes: shop.countyTaxes,
        checkoutApiSupported: shop.checkoutApiSupported
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém países disponíveis para envio
   * @returns {Promise<Array>} Países disponíveis
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
   * Obtém configurações de notificação
   * @returns {Promise<Array>} Configurações de notificação
   */
  async getNotificationSettings() {
    try {
      const response = await this.api.get('notification_settings.json');
      return response.notification_settings || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza configurações de notificação
   * @param {Object} settingsData Dados das configurações
   * @returns {Promise<Object>} Configurações atualizadas
   */
  async updateNotificationSettings(settingsData) {
    try {
      const response = await this.api.put('notification_settings.json', { notification_settings: settingsData });
      return response.notification_settings;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém lista de scripts da loja
   * @returns {Promise<Array>} Lista de scripts
   */
  async getScriptTags() {
    try {
      const response = await this.api.get('script_tags.json');
      return response.script_tags || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria um novo script
   * @param {Object} scriptData Dados do script
   * @returns {Promise<Object>} Script criado
   */
  async createScriptTag(scriptData) {
    try {
      const response = await this.api.post('script_tags.json', { script_tag: scriptData });
      return response.script_tag;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove um script
   * @param {number} id ID do script
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteScriptTag(id) {
    try {
      return await this.api.delete(`script_tags/${id}.json`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém lista de assets da loja
   * @returns {Promise<Array>} Lista de assets
   */
  async getAssets() {
    try {
      const response = await this.api.get('assets.json');
      return response.assets || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém configurações de impostos
   * @returns {Promise<Array>} Configurações de impostos
   */
  async getTaxSettings() {
    try {
      // Informações básicas de impostos estão nas configurações da loja
      const shop = await this.getShopSettings();
      
      // Extrai informações de impostos
      const taxSettings = {
        taxesIncluded: shop.taxesIncluded,
        taxShipping: shop.taxShipping,
        countyTaxes: shop.countyTaxes
      };
      
      return taxSettings;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém políticas de conteúdo para adultos
   * @returns {Promise<Object>} Políticas de conteúdo
   */
  async getContentPolicies() {
    try {
      // Essa informação é difícil de acessar via API
      // Normalmente seria necessário verificar as configurações do tema ou da loja
      
      // Para este exemplo, retornaremos uma estrutura básica
      return {
        adultContent: false,
        ageRestriction: null
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SettingsManager;