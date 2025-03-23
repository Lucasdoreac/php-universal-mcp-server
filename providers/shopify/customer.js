/**
 * Shopify Customer Management Module
 * 
 * Implementa gerenciamento de clientes na API Shopify.
 */

class CustomerManager {
  /**
   * Construtor do gerenciador de clientes
   * @param {Object} api Instância da API Shopify
   */
  constructor(api) {
    this.api = api;
    this.endpoint = 'customers';
    
    // Queries GraphQL
    this.customerQuery = `
      query getCustomer($id: ID!) {
        customer(id: $id) {
          id
          firstName
          lastName
          email
          phone
          displayName
          createdAt
          updatedAt
          defaultAddress {
            id
            address1
            address2
            city
            province
            country
            zip
            phone
          }
          addresses {
            id
            address1
            address2
            city
            province
            country
            zip
            phone
            default
          }
          orders(first: 5) {
            edges {
              node {
                id
                name
                processedAt
                financialStatus
                fulfillmentStatus
                totalPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
          metafields {
            edges {
              node {
                id
                namespace
                key
                value
              }
            }
          }
          tags
          taxExempt
          validEmailAddress
          verifiedEmail
        }
      }
    `;
    
    this.customersQuery = `
      query getCustomers($first: Int!, $after: String, $query: String) {
        customers(first: $first, after: $after, query: $query) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              firstName
              lastName
              email
              phone
              displayName
              createdAt
              updatedAt
              ordersCount
              totalSpent {
                amount
                currencyCode
              }
              defaultAddress {
                id
                address1
                city
                province
                country
              }
              tags
              verifiedEmail
            }
          }
        }
      }
    `;
  }

  /**
   * Lista clientes
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de clientes
   */
  async list(options = {}) {
    try {
      // Se solicitado todos os clientes, usa o método getAll
      if (options.all === true) {
        delete options.all;
        const customers = await this.api.getAll(`${this.endpoint}.json`, options);
        return customers.customers || [];
      }
      
      // Se opção GraphQL estiver habilitada, usa a API GraphQL
      if (options.useGraphQL === true) {
        delete options.useGraphQL;
        
        const limit = options.limit || 50;
        const queryString = this.buildGraphQLQueryString(options);
        
        const variables = {
          first: limit,
          after: null,
          query: queryString
        };
        
        const customers = await this.api.graphqlPaginate(
          this.customersQuery,
          'customers',
          'node',
          variables,
          options.maxItems || 0
        );
        
        return customers;
      }
      
      const response = await this.api.get(`${this.endpoint}.json`, options);
      return response.customers || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Constrói string de consulta para GraphQL
   * @param {Object} options Opções de filtragem
   * @returns {string} String de consulta
   * @private
   */
  buildGraphQLQueryString(options) {
    const queryParts = [];
    
    // Adiciona filtros específicos
    if (options.email) {
      queryParts.push(`email:${options.email}`);
    }
    
    if (options.first_name) {
      queryParts.push(`first_name:${options.first_name}`);
    }
    
    if (options.last_name) {
      queryParts.push(`last_name:${options.last_name}`);
    }
    
    if (options.created_at_min) {
      queryParts.push(`created_at:>=${options.created_at_min}`);
    }
    
    if (options.created_at_max) {
      queryParts.push(`created_at:<=${options.created_at_max}`);
    }
    
    if (options.tag) {
      queryParts.push(`tag:${options.tag}`);
    }
    
    if (options.phone) {
      queryParts.push(`phone:${options.phone}`);
    }
    
    return queryParts.join(' ');
  }

  /**
   * Obtém detalhes de um cliente
   * @param {number|string} id ID do cliente
   * @param {boolean} useGraphQL Indica se deve usar GraphQL
   * @returns {Promise<Object>} Detalhes do cliente
   */
  async get(id, useGraphQL = false) {
    try {
      if (useGraphQL) {
        // Formato GraphQL ID
        const formattedId = id.toString().includes('gid://') ? id : `gid://shopify/Customer/${id}`;
        
        const result = await this.api.graphql(this.customerQuery, { id: formattedId });
        return result.data.customer;
      }
      
      const response = await this.api.get(`${this.endpoint}/${id}.json`);
      return response.customer;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca clientes por email
   * @param {string} email Email do cliente
   * @returns {Promise<Array>} Clientes encontrados
   */
  async search(email) {
    try {
      // Busca por email usando a API REST
      const response = await this.api.get(`${this.endpoint}/search.json`, { query: email });
      return response.customers || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Conta clientes
   * @param {Object} options Opções de filtragem
   * @returns {Promise<number>} Número de clientes
   */
  async count(options = {}) {
    try {
      const response = await this.api.get(`${this.endpoint}/count.json`, options);
      return response.count || 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria um novo cliente
   * @param {Object} customerData Dados do cliente
   * @returns {Promise<Object>} Cliente criado
   */
  async create(customerData) {
    try {
      const response = await this.api.post(`${this.endpoint}.json`, { customer: customerData });
      return response.customer;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza um cliente existente
   * @param {number} id ID do cliente
   * @param {Object} customerData Dados do cliente
   * @returns {Promise<Object>} Cliente atualizado
   */
  async update(id, customerData) {
    try {
      const response = await this.api.put(`${this.endpoint}/${id}.json`, { customer: customerData });
      return response.customer;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove um cliente
   * @param {number} id ID do cliente
   * @returns {Promise<Object>} Resultado da operação
   */
  async delete(id) {
    try {
      return await this.api.delete(`${this.endpoint}/${id}.json`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém pedidos de um cliente
   * @param {number} customerId ID do cliente
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de pedidos
   */
  async getOrders(customerId, options = {}) {
    try {
      // Usa a API de pedidos para filtrar por cliente
      const params = {
        ...options,
        customer_id: customerId
      };
      
      const response = await this.api.get('orders.json', params);
      return response.orders || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém endereços de um cliente
   * @param {number} customerId ID do cliente
   * @returns {Promise<Array>} Lista de endereços
   */
  async getAddresses(customerId) {
    try {
      const response = await this.api.get(`${this.endpoint}/${customerId}/addresses.json`);
      return response.addresses || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Adiciona um endereço a um cliente
   * @param {number} customerId ID do cliente
   * @param {Object} addressData Dados do endereço
   * @returns {Promise<Object>} Endereço adicionado
   */
  async addAddress(customerId, addressData) {
    try {
      const response = await this.api.post(`${this.endpoint}/${customerId}/addresses.json`, { address: addressData });
      return response.address;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza um endereço existente
   * @param {number} customerId ID do cliente
   * @param {number} addressId ID do endereço
   * @param {Object} addressData Dados do endereço
   * @returns {Promise<Object>} Endereço atualizado
   */
  async updateAddress(customerId, addressId, addressData) {
    try {
      const response = await this.api.put(`${this.endpoint}/${customerId}/addresses/${addressId}.json`, { address: addressData });
      return response.address;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove um endereço
   * @param {number} customerId ID do cliente
   * @param {number} addressId ID do endereço
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteAddress(customerId, addressId) {
    try {
      return await this.api.delete(`${this.endpoint}/${customerId}/addresses/${addressId}.json`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Define um endereço como padrão
   * @param {number} customerId ID do cliente
   * @param {number} addressId ID do endereço
   * @returns {Promise<Object>} Resultado da operação
   */
  async setDefaultAddress(customerId, addressId) {
    try {
      const response = await this.api.put(`${this.endpoint}/${customerId}/addresses/${addressId}/default.json`);
      return response.address;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém metafields de um cliente
   * @param {number} customerId ID do cliente
   * @returns {Promise<Array>} Lista de metafields
   */
  async getMetafields(customerId) {
    try {
      const response = await this.api.get(`${this.endpoint}/${customerId}/metafields.json`);
      return response.metafields || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Adiciona um metafield a um cliente
   * @param {number} customerId ID do cliente
   * @param {Object} metafieldData Dados do metafield
   * @returns {Promise<Object>} Metafield adicionado
   */
  async addMetafield(customerId, metafieldData) {
    try {
      const response = await this.api.post(`${this.endpoint}/${customerId}/metafields.json`, { metafield: metafieldData });
      return response.metafield;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Envia convite para um cliente
   * @param {number} customerId ID do cliente
   * @param {Object} options Opções do convite
   * @returns {Promise<Object>} Resultado do envio
   */
  async sendInvite(customerId, options = {}) {
    try {
      const data = { customer_invite: {} };
      
      if (options.customMessage) {
        data.customer_invite.custom_message = options.customMessage;
      }
      
      if (options.subject) {
        data.customer_invite.subject = options.subject;
      }
      
      const response = await this.api.post(`${this.endpoint}/${customerId}/send_invite.json`, data);
      return response.customer_invite;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gera um token de redefinição de senha
   * @param {number} customerId ID do cliente
   * @returns {Promise<Object>} Resultado da operação
   */
  async generateAccountActivationUrl(customerId) {
    try {
      const response = await this.api.post(`${this.endpoint}/${customerId}/account_activation_url.json`);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CustomerManager;