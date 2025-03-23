/**
 * Shopify Collection Management Module
 * 
 * Implementa gerenciamento de coleções na API Shopify.
 */

class CollectionManager {
  /**
   * Construtor do gerenciador de coleções
   * @param {Object} api Instância da API Shopify
   */
  constructor(api) {
    this.api = api;
    this.customEndpoint = 'custom_collections';
    this.smartEndpoint = 'smart_collections';
    
    // Queries GraphQL
    this.collectionQuery = `
      query getCollection($id: ID!) {
        collection(id: $id) {
          id
          title
          handle
          description
          descriptionHtml
          updatedAt
          image {
            id
            src
            altText
            width
            height
          }
          productsCount
          ruleSet {
            rules {
              column
              relation
              condition
            }
          }
          products(first: 10) {
            edges {
              node {
                id
                title
                handle
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
        }
      }
    `;
    
    this.collectionsQuery = `
      query getCollections($first: Int!, $after: String) {
        collections(first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              handle
              descriptionHtml
              updatedAt
              productsCount
              image {
                id
                src
                altText
              }
            }
          }
        }
      }
    `;
  }

  /**
   * Lista coleções personalizadas
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de coleções
   */
  async listCustom(options = {}) {
    try {
      // Se solicitado todas as coleções, usa o método getAll
      if (options.all === true) {
        delete options.all;
        const collections = await this.api.getAll(`${this.customEndpoint}.json`, options);
        return collections.custom_collections || [];
      }
      
      const response = await this.api.get(`${this.customEndpoint}.json`, options);
      return response.custom_collections || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lista coleções inteligentes
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de coleções
   */
  async listSmart(options = {}) {
    try {
      // Se solicitado todas as coleções, usa o método getAll
      if (options.all === true) {
        delete options.all;
        const collections = await this.api.getAll(`${this.smartEndpoint}.json`, options);
        return collections.smart_collections || [];
      }
      
      const response = await this.api.get(`${this.smartEndpoint}.json`, options);
      return response.smart_collections || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lista todas as coleções (personalizadas e inteligentes)
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de coleções
   */
  async listAll(options = {}) {
    try {
      // Se opção GraphQL estiver habilitada, usa a API GraphQL
      if (options.useGraphQL === true) {
        delete options.useGraphQL;
        
        const limit = options.limit || 50;
        const variables = {
          first: limit,
          after: null
        };
        
        const collections = await this.api.graphqlPaginate(
          this.collectionsQuery,
          'collections',
          'node',
          variables,
          options.maxItems || 0
        );
        
        return collections;
      }
      
      // Método REST API padrão
      const [customCollections, smartCollections] = await Promise.all([
        this.listCustom(options),
        this.listSmart(options)
      ]);
      
      // Combina e adiciona marcador para identificar o tipo
      const combined = [
        ...customCollections.map(c => ({ ...c, collection_type: 'custom' })),
        ...smartCollections.map(c => ({ ...c, collection_type: 'smart' }))
      ];
      
      // Ordena por título ou data de criação se especificado
      if (options.sort_by === 'title') {
        combined.sort((a, b) => a.title.localeCompare(b.title));
      } else if (options.sort_by === 'created_at') {
        combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
      
      return combined;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém detalhes de uma coleção
   * @param {number|string} id ID da coleção
   * @param {boolean} isCustom Indica se é uma coleção personalizada
   * @param {boolean} useGraphQL Indica se deve usar GraphQL (opcional)
   * @returns {Promise<Object>} Detalhes da coleção
   */
  async get(id, isCustom = true, useGraphQL = false) {
    try {
      if (useGraphQL) {
        // Formato GraphQL ID
        const formattedId = id.toString().includes('gid://') ? id : `gid://shopify/Collection/${id}`;
        
        const result = await this.api.graphql(this.collectionQuery, { id: formattedId });
        return result.data.collection;
      }
      
      const endpoint = isCustom ? this.customEndpoint : this.smartEndpoint;
      const response = await this.api.get(`${endpoint}/${id}.json`);
      
      // Resposta diferente dependendo do tipo
      return isCustom ? response.custom_collection : response.smart_collection;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria uma nova coleção personalizada
   * @param {Object} collectionData Dados da coleção
   * @returns {Promise<Object>} Coleção criada
   */
  async createCustom(collectionData) {
    try {
      const response = await this.api.post(`${this.customEndpoint}.json`, { custom_collection: collectionData });
      return response.custom_collection;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria uma nova coleção inteligente
   * @param {Object} collectionData Dados da coleção
   * @returns {Promise<Object>} Coleção criada
   */
  async createSmart(collectionData) {
    try {
      const response = await this.api.post(`${this.smartEndpoint}.json`, { smart_collection: collectionData });
      return response.smart_collection;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza uma coleção existente
   * @param {number} id ID da coleção
   * @param {Object} collectionData Dados da coleção
   * @param {boolean} isCustom Indica se é uma coleção personalizada
   * @returns {Promise<Object>} Coleção atualizada
   */
  async update(id, collectionData, isCustom = true) {
    try {
      const endpoint = isCustom ? this.customEndpoint : this.smartEndpoint;
      const dataKey = isCustom ? 'custom_collection' : 'smart_collection';
      
      const response = await this.api.put(`${endpoint}/${id}.json`, { [dataKey]: collectionData });
      return response[dataKey];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove uma coleção
   * @param {number} id ID da coleção
   * @param {boolean} isCustom Indica se é uma coleção personalizada
   * @returns {Promise<Object>} Resultado da operação
   */
  async delete(id, isCustom = true) {
    try {
      const endpoint = isCustom ? this.customEndpoint : this.smartEndpoint;
      return await this.api.delete(`${endpoint}/${id}.json`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém produtos em uma coleção
   * @param {number} collectionId ID da coleção
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de produtos
   */
  async getProducts(collectionId, options = {}) {
    try {
      const response = await this.api.get(`collections/${collectionId}/products.json`, options);
      return response.products || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Adiciona um produto a uma coleção personalizada
   * @param {number} collectionId ID da coleção
   * @param {number} productId ID do produto
   * @returns {Promise<Object>} Resultado da operação
   */
  async addProduct(collectionId, productId) {
    try {
      // Para coleções personalizadas, é preciso adicionar o "collect"
      const response = await this.api.post('collects.json', {
        collect: {
          collection_id: collectionId,
          product_id: productId
        }
      });
      
      return response.collect;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove um produto de uma coleção personalizada
   * @param {number} collectionId ID da coleção
   * @param {number} productId ID do produto
   * @returns {Promise<Object>} Resultado da operação
   */
  async removeProduct(collectionId, productId) {
    try {
      // Primeiro, precisamos encontrar o ID do collect
      const collects = await this.api.get('collects.json', {
        collection_id: collectionId,
        product_id: productId
      });
      
      if (!collects.collects || collects.collects.length === 0) {
        throw new Error('Produto não encontrado na coleção');
      }
      
      const collectId = collects.collects[0].id;
      return await this.api.delete(`collects/${collectId}.json`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém metafields de uma coleção
   * @param {number} collectionId ID da coleção
   * @returns {Promise<Array>} Lista de metafields
   */
  async getMetafields(collectionId) {
    try {
      const response = await this.api.get(`collections/${collectionId}/metafields.json`);
      return response.metafields || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Adiciona um metafield a uma coleção
   * @param {number} collectionId ID da coleção
   * @param {Object} metafieldData Dados do metafield
   * @returns {Promise<Object>} Metafield adicionado
   */
  async addMetafield(collectionId, metafieldData) {
    try {
      const response = await this.api.post(`collections/${collectionId}/metafields.json`, { metafield: metafieldData });
      return response.metafield;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Conta coleções
   * @param {boolean} isCustom Indica se deve contar coleções personalizadas
   * @returns {Promise<number>} Número de coleções
   */
  async count(isCustom = true) {
    try {
      const endpoint = isCustom ? this.customEndpoint : this.smartEndpoint;
      const response = await this.api.get(`${endpoint}/count.json`);
      return response.count || 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Publica uma coleção
   * @param {number} collectionId ID da coleção
   * @param {boolean} isCustom Indica se é uma coleção personalizada
   * @returns {Promise<Object>} Coleção atualizada
   */
  async publish(collectionId, isCustom = true) {
    try {
      return await this.update(collectionId, { published: true }, isCustom);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Despublica uma coleção
   * @param {number} collectionId ID da coleção
   * @param {boolean} isCustom Indica se é uma coleção personalizada
   * @returns {Promise<Object>} Coleção atualizada
   */
  async unpublish(collectionId, isCustom = true) {
    try {
      return await this.update(collectionId, { published: false }, isCustom);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CollectionManager;