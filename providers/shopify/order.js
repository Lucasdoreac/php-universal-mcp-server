/**
 * Shopify Order Management Module
 * 
 * Implementa gerenciamento de pedidos na API Shopify.
 */

class OrderManager {
  /**
   * Construtor do gerenciador de pedidos
   * @param {Object} api Instância da API Shopify
   */
  constructor(api) {
    this.api = api;
    this.endpoint = 'orders';
    
    // Queries GraphQL
    this.orderQuery = `
      query getOrder($id: ID!) {
        order(id: $id) {
          id
          name
          email
          phone
          confirmed
          cancelReason
          cancelledAt
          closed
          closedAt
          processedAt
          financialStatus
          fulfillmentStatus
          createdAt
          updatedAt
          note
          tags
          totalPrice {
            amount
            currencyCode
          }
          subtotalPrice {
            amount
            currencyCode
          }
          totalShippingPrice {
            amount
            currencyCode
          }
          totalTax {
            amount
            currencyCode
          }
          customer {
            id
            firstName
            lastName
            email
            phone
          }
          shippingAddress {
            address1
            address2
            city
            country
            province
            zip
            name
            phone
          }
          billingAddress {
            address1
            address2
            city
            country
            province
            zip
            name
            phone
          }
          lineItems(first: 50) {
            edges {
              node {
                id
                name
                quantity
                title
                variantTitle
                originalTotalPrice {
                  amount
                  currencyCode
                }
                discountedTotalPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
          fulfillments {
            id
            status
            trackingInfo {
              number
              url
              company
            }
            createdAt
          }
          transactions {
            id
            status
            kind
            gateway
            createdAt
            amountSet {
              shopMoney {
                amount
                currencyCode
              }
            }
          }
        }
      }
    `;
    
    this.ordersQuery = `
      query getOrders($first: Int!, $after: String, $query: String) {
        orders(first: $first, after: $after, query: $query) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              name
              email
              createdAt
              financialStatus
              fulfillmentStatus
              totalPrice {
                amount
                currencyCode
              }
              customer {
                id
                firstName
                lastName
                email
              }
            }
          }
        }
      }
    `;
  }

  /**
   * Lista pedidos
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de pedidos
   */
  async list(options = {}) {
    try {
      // Se solicitado todos os pedidos, usa o método getAll
      if (options.all === true) {
        delete options.all;
        const orders = await this.api.getAll(`${this.endpoint}.json`, options);
        return orders.orders || [];
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
        
        const orders = await this.api.graphqlPaginate(
          this.ordersQuery,
          'orders',
          'node',
          variables,
          options.maxItems || 0
        );
        
        return orders;
      }
      
      const response = await this.api.get(`${this.endpoint}.json`, options);
      return response.orders || [];
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
    if (options.status) {
      queryParts.push(`status:${options.status}`);
    }
    
    if (options.financial_status) {
      queryParts.push(`financial_status:${options.financial_status}`);
    }
    
    if (options.fulfillment_status) {
      queryParts.push(`fulfillment_status:${options.fulfillment_status}`);
    }
    
    if (options.created_at_min) {
      queryParts.push(`created_at:>=${options.created_at_min}`);
    }
    
    if (options.created_at_max) {
      queryParts.push(`created_at:<=${options.created_at_max}`);
    }
    
    if (options.customer_id) {
      queryParts.push(`customer_id:${options.customer_id}`);
    }
    
    if (options.email) {
      queryParts.push(`email:${options.email}`);
    }
    
    if (options.tag) {
      queryParts.push(`tag:${options.tag}`);
    }
    
    return queryParts.join(' ');
  }

  /**
   * Obtém detalhes de um pedido
   * @param {number|string} id ID do pedido
   * @param {boolean} useGraphQL Indica se deve usar GraphQL
   * @returns {Promise<Object>} Detalhes do pedido
   */
  async get(id, useGraphQL = false) {
    try {
      if (useGraphQL) {
        // Formato GraphQL ID
        const formattedId = id.toString().includes('gid://') ? id : `gid://shopify/Order/${id}`;
        
        const result = await this.api.graphql(this.orderQuery, { id: formattedId });
        return result.data.order;
      }
      
      const response = await this.api.get(`${this.endpoint}/${id}.json`);
      return response.order;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Conta pedidos
   * @param {Object} options Opções de filtragem
   * @returns {Promise<number>} Número de pedidos
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
   * Cria um novo pedido
   * @param {Object} orderData Dados do pedido
   * @returns {Promise<Object>} Pedido criado
   */
  async create(orderData) {
    try {
      const response = await this.api.post(`${this.endpoint}.json`, { order: orderData });
      return response.order;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza um pedido existente
   * @param {number} id ID do pedido
   * @param {Object} orderData Dados do pedido
   * @returns {Promise<Object>} Pedido atualizado
   */
  async update(id, orderData) {
    try {
      const response = await this.api.put(`${this.endpoint}/${id}.json`, { order: orderData });
      return response.order;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove um pedido
   * @param {number} id ID do pedido
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
   * Fecha um pedido
   * @param {number} id ID do pedido
   * @returns {Promise<Object>} Pedido fechado
   */
  async close(id) {
    try {
      const response = await this.api.post(`${this.endpoint}/${id}/close.json`);
      return response.order;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reabre um pedido fechado
   * @param {number} id ID do pedido
   * @returns {Promise<Object>} Pedido reaberto
   */
  async open(id) {
    try {
      const response = await this.api.post(`${this.endpoint}/${id}/open.json`);
      return response.order;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancela um pedido
   * @param {number} id ID do pedido
   * @param {Object} options Opções de cancelamento
   * @returns {Promise<Object>} Pedido cancelado
   */
  async cancel(id, options = {}) {
    try {
      const data = { reason: options.reason };
      
      if (options.email !== undefined) {
        data.email = options.email;
      }
      
      if (options.restock !== undefined) {
        data.restock = options.restock;
      }
      
      const response = await this.api.post(`${this.endpoint}/${id}/cancel.json`, data);
      return response.order;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém metafields de um pedido
   * @param {number} orderId ID do pedido
   * @returns {Promise<Array>} Lista de metafields
   */
  async getMetafields(orderId) {
    try {
      const response = await this.api.get(`${this.endpoint}/${orderId}/metafields.json`);
      return response.metafields || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Adiciona um metafield a um pedido
   * @param {number} orderId ID do pedido
   * @param {Object} metafieldData Dados do metafield
   * @returns {Promise<Object>} Metafield adicionado
   */
  async addMetafield(orderId, metafieldData) {
    try {
      const response = await this.api.post(`${this.endpoint}/${orderId}/metafields.json`, { metafield: metafieldData });
      return response.metafield;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém transações de um pedido
   * @param {number} orderId ID do pedido
   * @returns {Promise<Array>} Lista de transações
   */
  async getTransactions(orderId) {
    try {
      const response = await this.api.get(`${this.endpoint}/${orderId}/transactions.json`);
      return response.transactions || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Adiciona uma transação a um pedido
   * @param {number} orderId ID do pedido
   * @param {Object} transactionData Dados da transação
   * @returns {Promise<Object>} Transação adicionada
   */
  async addTransaction(orderId, transactionData) {
    try {
      const response = await this.api.post(`${this.endpoint}/${orderId}/transactions.json`, { transaction: transactionData });
      return response.transaction;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém fulfillments (entregas) de um pedido
   * @param {number} orderId ID do pedido
   * @returns {Promise<Array>} Lista de fulfillments
   */
  async getFulfillments(orderId) {
    try {
      const response = await this.api.get(`${this.endpoint}/${orderId}/fulfillments.json`);
      return response.fulfillments || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria um novo fulfillment para um pedido
   * @param {number} orderId ID do pedido
   * @param {Object} fulfillmentData Dados do fulfillment
   * @returns {Promise<Object>} Fulfillment criado
   */
  async createFulfillment(orderId, fulfillmentData) {
    try {
      const response = await this.api.post(`${this.endpoint}/${orderId}/fulfillments.json`, { fulfillment: fulfillmentData });
      return response.fulfillment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém riscos de um pedido
   * @param {number} orderId ID do pedido
   * @returns {Promise<Array>} Lista de riscos
   */
  async getRisks(orderId) {
    try {
      const response = await this.api.get(`${this.endpoint}/${orderId}/risks.json`);
      return response.risks || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Marca um pedido como pago
   * @param {number} orderId ID do pedido
   * @returns {Promise<Object>} Pedido atualizado
   */
  async markAsPaid(orderId) {
    try {
      // Cria uma transação de tipo 'capture' para marcar como pago
      await this.addTransaction(orderId, {
        kind: 'capture',
        status: 'success'
      });
      
      // Atualiza o status financeiro
      return await this.update(orderId, { financial_status: 'paid' });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = OrderManager;