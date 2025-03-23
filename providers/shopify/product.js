/**
 * Shopify Product Management Module
 * 
 * Implementa gerenciamento de produtos na API Shopify.
 */

class ProductManager {
  /**
   * Construtor do gerenciador de produtos
   * @param {Object} api Instância da API Shopify
   */
  constructor(api) {
    this.api = api;
    this.endpoint = 'products';
    
    // Queries GraphQL
    this.productQuery = `
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          description
          descriptionHtml
          vendor
          productType
          tags
          status
          options {
            id
            name
            values
          }
          variants {
            edges {
              node {
                id
                title
                price
                compareAtPrice
                sku
                inventoryQuantity
                inventoryManagement
                inventoryPolicy
                weight
                weightUnit
                requiresShipping
                taxable
                barcode
                position
                image {
                  id
                  src
                  altText
                }
              }
            }
          }
          images {
            edges {
              node {
                id
                src
                altText
                width
                height
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
                type
              }
            }
          }
        }
      }
    `;
    
    this.productsQuery = `
      query getProducts($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              handle
              vendor
              productType
              status
              totalInventory
              createdAt
              updatedAt
              publishedAt
              tags
              priceRangeV2 {
                minVariantPrice {
                  amount
                  currencyCode
                }
                maxVariantPrice {
                  amount
                  currencyCode
                }
              }
              featuredImage {
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
   * Lista produtos
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de produtos
   */
  async list(options = {}) {
    try {
      // Se solicitado todos os produtos, usa o método getAll
      if (options.all === true) {
        delete options.all;
        const products = await this.api.getAll(`${this.endpoint}.json`, options);
        return products.products || [];
      }
      
      // Se opção GraphQL estiver habilitada, usa a API GraphQL
      if (options.useGraphQL === true) {
        delete options.useGraphQL;
        
        const limit = options.limit || 50;
        const variables = {
          first: limit,
          after: null
        };
        
        const products = await this.api.graphqlPaginate(
          this.productsQuery,
          'products',
          'node',
          variables,
          options.maxItems || 0
        );
        
        return products;
      }
      
      // Método padrão - REST API
      const response = await this.api.get(`${this.endpoint}.json`, options);
      return response.products || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém detalhes de um produto
   * @param {number|string} id ID do produto
   * @param {boolean} useGraphQL Indica se deve usar GraphQL (opcional)
   * @returns {Promise<Object>} Detalhes do produto
   */
  async get(id, useGraphQL = false) {
    try {
      if (useGraphQL) {
        // Formato GraphQL ID
        const formattedId = id.toString().includes('gid://') ? id : `gid://shopify/Product/${id}`;
        
        const result = await this.api.graphql(this.productQuery, { id: formattedId });
        return result.data.product;
      }
      
      const response = await this.api.get(`${this.endpoint}/${id}.json`);
      return response.product;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria um novo produto
   * @param {Object} productData Dados do produto
   * @returns {Promise<Object>} Produto criado
   */
  async create(productData) {
    try {
      const response = await this.api.post(`${this.endpoint}.json`, { product: productData });
      return response.product;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza um produto existente
   * @param {number} id ID do produto
   * @param {Object} productData Dados do produto
   * @returns {Promise<Object>} Produto atualizado
   */
  async update(id, productData) {
    try {
      const response = await this.api.put(`${this.endpoint}/${id}.json`, { product: productData });
      return response.product;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove um produto
   * @param {number} id ID do produto
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
   * Obtém variantes de um produto
   * @param {number} productId ID do produto
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de variantes
   */
  async getVariants(productId, options = {}) {
    try {
      const response = await this.api.get(`${this.endpoint}/${productId}/variants.json`, options);
      return response.variants || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria uma nova variante de produto
   * @param {number} productId ID do produto
   * @param {Object} variantData Dados da variante
   * @returns {Promise<Object>} Variante criada
   */
  async createVariant(productId, variantData) {
    try {
      const response = await this.api.post(`${this.endpoint}/${productId}/variants.json`, { variant: variantData });
      return response.variant;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza uma variante existente
   * @param {number} variantId ID da variante
   * @param {Object} variantData Dados da variante
   * @returns {Promise<Object>} Variante atualizada
   */
  async updateVariant(variantId, variantData) {
    try {
      const response = await this.api.put(`variants/${variantId}.json`, { variant: variantData });
      return response.variant;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove uma variante
   * @param {number} productId ID do produto
   * @param {number} variantId ID da variante
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteVariant(productId, variantId) {
    try {
      return await this.api.delete(`products/${productId}/variants/${variantId}.json`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém imagens de um produto
   * @param {number} productId ID do produto
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de imagens
   */
  async getImages(productId, options = {}) {
    try {
      const response = await this.api.get(`${this.endpoint}/${productId}/images.json`, options);
      return response.images || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Adiciona uma imagem a um produto
   * @param {number} productId ID do produto
   * @param {Object} imageData Dados da imagem
   * @returns {Promise<Object>} Imagem adicionada
   */
  async addImage(productId, imageData) {
    try {
      const response = await this.api.post(`${this.endpoint}/${productId}/images.json`, { image: imageData });
      return response.image;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza uma imagem existente
   * @param {number} productId ID do produto
   * @param {number} imageId ID da imagem
   * @param {Object} imageData Dados da imagem
   * @returns {Promise<Object>} Imagem atualizada
   */
  async updateImage(productId, imageId, imageData) {
    try {
      const response = await this.api.put(`${this.endpoint}/${productId}/images/${imageId}.json`, { image: imageData });
      return response.image;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove uma imagem
   * @param {number} productId ID do produto
   * @param {number} imageId ID da imagem
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteImage(productId, imageId) {
    try {
      return await this.api.delete(`${this.endpoint}/${productId}/images/${imageId}.json`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém metafields de um produto
   * @param {number} productId ID do produto
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de metafields
   */
  async getMetafields(productId, options = {}) {
    try {
      const response = await this.api.get(`${this.endpoint}/${productId}/metafields.json`, options);
      return response.metafields || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Adiciona um metafield a um produto
   * @param {number} productId ID do produto
   * @param {Object} metafieldData Dados do metafield
   * @returns {Promise<Object>} Metafield adicionado
   */
  async addMetafield(productId, metafieldData) {
    try {
      const response = await this.api.post(`${this.endpoint}/${productId}/metafields.json`, { metafield: metafieldData });
      return response.metafield;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Conta produtos
   * @param {Object} options Opções de filtragem
   * @returns {Promise<number>} Número de produtos
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
   * Publica um produto
   * @param {number} productId ID do produto
   * @returns {Promise<Object>} Resultado da operação
   */
  async publish(productId) {
    try {
      return await this.update(productId, { published: true });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Despublica um produto
   * @param {number} productId ID do produto
   * @returns {Promise<Object>} Resultado da operação
   */
  async unpublish(productId) {
    try {
      return await this.update(productId, { published: false });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ProductManager;