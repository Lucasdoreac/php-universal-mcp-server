/**
 * WooCommerce Product Management Module
 * 
 * Implementa gerenciamento de produtos na API WooCommerce.
 */

class ProductManager {
  /**
   * Construtor do gerenciador de produtos
   * @param {Object} api Instância da API WooCommerce
   */
  constructor(api) {
    this.api = api;
    this.endpoint = 'products';
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
        return await this.api.getAll(this.endpoint, options);
      }
      return await this.api.get(this.endpoint, options);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém detalhes de um produto
   * @param {number} id ID do produto
   * @returns {Promise<Object>} Detalhes do produto
   */
  async get(id) {
    try {
      return await this.api.get(`${this.endpoint}/${id}`);
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
      return await this.api.post(this.endpoint, productData);
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
      return await this.api.put(`${this.endpoint}/${id}`, productData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove um produto
   * @param {number} id ID do produto
   * @param {boolean} force Forçar exclusão em vez de mover para lixeira
   * @returns {Promise<Object>} Resultado da operação
   */
  async delete(id, force = false) {
    try {
      return await this.api.delete(`${this.endpoint}/${id}`, { force });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém variações de um produto
   * @param {number} productId ID do produto
   * @param {Object} options Opções de filtragem
   * @returns {Promise<Array>} Lista de variações
   */
  async getVariations(productId, options = {}) {
    try {
      return await this.api.get(`${this.endpoint}/${productId}/variations`, options);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria uma nova variação de produto
   * @param {number} productId ID do produto
   * @param {Object} variationData Dados da variação
   * @returns {Promise<Object>} Variação criada
   */
  async createVariation(productId, variationData) {
    try {
      return await this.api.post(`${this.endpoint}/${productId}/variations`, variationData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza uma variação existente
   * @param {number} productId ID do produto
   * @param {number} variationId ID da variação
   * @param {Object} variationData Dados da variação
   * @returns {Promise<Object>} Variação atualizada
   */
  async updateVariation(productId, variationId, variationData) {
    try {
      return await this.api.put(
        `${this.endpoint}/${productId}/variations/${variationId}`,
        variationData
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove uma variação
   * @param {number} productId ID do produto
   * @param {number} variationId ID da variação
   * @param {boolean} force Forçar exclusão
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteVariation(productId, variationId, force = false) {
    try {
      return await this.api.delete(
        `${this.endpoint}/${productId}/variations/${variationId}`,
        { force }
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza estoque de um produto
   * @param {number} productId ID do produto
   * @param {number} quantity Nova quantidade em estoque
   * @returns {Promise<Object>} Produto atualizado
   */
  async updateStock(productId, quantity) {
    try {
      return await this.update(productId, {
        stock_quantity: quantity,
        stock_status: quantity > 0 ? 'instock' : 'outofstock'
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém atributos de produto
   * @returns {Promise<Array>} Lista de atributos
   */
  async getAttributes() {
    try {
      return await this.api.get('products/attributes');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém termos de um atributo
   * @param {number} attributeId ID do atributo
   * @returns {Promise<Array>} Lista de termos
   */
  async getAttributeTerms(attributeId) {
    try {
      return await this.api.get(`products/attributes/${attributeId}/terms`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém revisões de um produto
   * @param {number} productId ID do produto
   * @returns {Promise<Array>} Lista de revisões
   */
  async getReviews(productId) {
    try {
      return await this.api.get('products/reviews', {
        product: productId
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria operações em lote para produtos
   * @param {Object} operations Operações de batch (create, update, delete)
   * @returns {Promise<Object>} Resultado das operações
   */
  async batch(operations) {
    try {
      return await this.api.batch(this.endpoint, operations);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ProductManager;