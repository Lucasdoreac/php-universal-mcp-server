/**
 * WooCommerce Product Manager
 * 
 * Gerencia operações relacionadas a produtos no WooCommerce
 * Parte do PHP Universal MCP Server v1.8.0
 */

const { EventEmitter } = require('events');

class WooCommerceProductManager extends EventEmitter {
    /**
     * Inicializa o gerenciador de produtos
     * 
     * @param {Object} api - Instância da API WooCommerce configurada
     * @param {Object} options - Opções de configuração
     */
    constructor(api, options = {}) {
        super();
        this.api = api;
        this.options = Object.assign({
            cacheEnabled: true,
            cacheTTL: 600, // 10 minutos
            batchSize: 20,
            debug: false,
            cache: null
        }, options);

        // Usa cache compartilhado se fornecido
        this.cache = this.options.cache || null;

        this.log('WooCommerce Product Manager inicializado');
    }

    /**
     * Busca produtos com suporte a filtros e paginação
     * 
     * @param {Object} filters - Filtros para busca (categoria, status, etc)
     * @param {Object} pagination - Opções de paginação (page, per_page)
     * @returns {Promise<Array>} - Lista de produtos
     */
    async getProducts(filters = {}, pagination = { page: 1, per_page: 10 }) {
        const cacheKey = `products:${JSON.stringify(filters)}:${JSON.stringify(pagination)}`;
        
        // Verifica cache
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            this.log(`Usando dados em cache para: ${cacheKey}`);
            return this.cache.get(cacheKey);
        }

        const params = {
            ...filters,
            page: pagination.page,
            per_page: pagination.per_page
        };

        try {
            this.log(`Buscando produtos com filtros: ${JSON.stringify(filters)}`);
            const response = await this.api.get('products', params);
            const products = response.data;
            
            // Armazena no cache
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, products, this.options.cacheTTL);
            }
            
            return products;
        } catch (error) {
            this.log(`Erro ao buscar produtos: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar produtos: ${error.message}`);
        }
    }

    /**
     * Busca um produto específico pelo ID
     * 
     * @param {number} productId - ID do produto
     * @returns {Promise<Object>} - Dados do produto
     */
    async getProduct(productId) {
        const cacheKey = `product:${productId}`;
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            this.log(`Usando dados em cache para produto: ${productId}`);
            return this.cache.get(cacheKey);
        }

        try {
            this.log(`Buscando produto: ${productId}`);
            const response = await this.api.get(`products/${productId}`);
            const product = response.data;
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, product, this.options.cacheTTL);
            }
            
            return product;
        } catch (error) {
            this.log(`Erro ao buscar produto ${productId}: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar produto ${productId}: ${error.message}`);
        }
    }

    /**
     * Cria um novo produto
     * 
     * @param {Object} productData - Dados do produto
     * @returns {Promise<Object>} - Produto criado
     */
    async createProduct(productData) {
        try {
            this.log(`Criando novo produto: ${productData.name}`);
            
            const response = await this.api.post('products', productData);
            const product = response.data;
            
            // Invalida cache de listas de produtos
            if (this.options.cacheEnabled && this.cache) {
                const keys = this.cache.keys();
                keys.forEach(key => {
                    if (key.startsWith('products:')) {
                        this.cache.del(key);
                    }
                });
            }
            
            // Emite evento de criação
            this.emit('productCreated', product);
            
            return product;
        } catch (error) {
            this.log(`Erro ao criar produto: ${error.message}`, 'error');
            throw new Error(`Falha ao criar produto: ${error.message}`);
        }
    }

    /**
     * Atualiza um produto existente
     * 
     * @param {number} productId - ID do produto
     * @param {Object} updates - Dados para atualização
     * @returns {Promise<Object>} - Produto atualizado
     */
    async updateProduct(productId, updates) {
        try {
            this.log(`Atualizando produto ${productId}`);
            
            const response = await this.api.put(`products/${productId}`, updates);
            const product = response.data;
            
            // Invalida cache
            if (this.options.cacheEnabled && this.cache) {
                this.cache.del(`product:${productId}`);
                
                // Invalida listas de produtos
                const keys = this.cache.keys();
                keys.forEach(key => {
                    if (key.startsWith('products:')) {
                        this.cache.del(key);
                    }
                });
            }
            
            // Emite evento de atualização
            this.emit('productUpdated', product);
            
            return product;
        } catch (error) {
            this.log(`Erro ao atualizar produto ${productId}: ${error.message}`, 'error');
            throw new Error(`Falha ao atualizar produto ${productId}: ${error.message}`);
        }
    }

    /**
     * Remove um produto
     * 
     * @param {number} productId - ID do produto
     * @param {boolean} force - Se verdadeiro, força a exclusão permanente
     * @returns {Promise<Object>} - Resultado da operação
     */
    async deleteProduct(productId, force = false) {
        try {
            this.log(`Removendo produto ${productId}${force ? ' (forçado)' : ''}`);
            
            const response = await this.api.delete(`products/${productId}`, {
                force
            });
            
            // Invalida cache
            if (this.options.cacheEnabled && this.cache) {
                this.cache.del(`product:${productId}`);
                
                // Invalida listas de produtos
                const keys = this.cache.keys();
                keys.forEach(key => {
                    if (key.startsWith('products:')) {
                        this.cache.del(key);
                    }
                });
            }
            
            // Emite evento de exclusão
            this.emit('productDeleted', {
                id: productId,
                success: true
            });
            
            return response.data;
        } catch (error) {
            this.log(`Erro ao remover produto ${productId}: ${error.message}`, 'error');
            throw new Error(`Falha ao remover produto ${productId}: ${error.message}`);
        }
    }

    /**
     * Busca categorias de produtos
     * 
     * @param {Object} filters - Filtros para busca
     * @returns {Promise<Array>} - Lista de categorias
     */
    async getCategories(filters = {}) {
        const cacheKey = `product-categories:${JSON.stringify(filters)}`;
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await this.api.get('products/categories', filters);
            const categories = response.data;
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, categories, 1800); // Cache por 30 minutos
            }
            
            return categories;
        } catch (error) {
            this.log(`Erro ao buscar categorias: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar categorias: ${error.message}`);
        }
    }

    /**
     * Cria uma nova categoria de produtos
     * 
     * @param {Object} categoryData - Dados da categoria
     * @returns {Promise<Object>} - Categoria criada
     */
    async createCategory(categoryData) {
        try {
            const response = await this.api.post('products/categories', categoryData);
            
            // Invalida cache de categorias
            if (this.options.cacheEnabled && this.cache) {
                const keys = this.cache.keys();
                keys.forEach(key => {
                    if (key.startsWith('product-categories:')) {
                        this.cache.del(key);
                    }
                });
            }
            
            return response.data;
        } catch (error) {
            this.log(`Erro ao criar categoria: ${error.message}`, 'error');
            throw new Error(`Falha ao criar categoria: ${error.message}`);
        }
    }

    /**
     * Busca atributos de produtos
     * 
     * @returns {Promise<Array>} - Lista de atributos
     */
    async getAttributes() {
        const cacheKey = 'product-attributes';
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await this.api.get('products/attributes');
            const attributes = response.data;
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, attributes, 3600); // Cache por 1 hora
            }
            
            return attributes;
        } catch (error) {
            this.log(`Erro ao buscar atributos: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar atributos: ${error.message}`);
        }
    }

    /**
     * Busca termos de um atributo
     * 
     * @param {number} attributeId - ID do atributo
     * @returns {Promise<Array>} - Lista de termos
     */
    async getAttributeTerms(attributeId) {
        const cacheKey = `attribute-terms:${attributeId}`;
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await this.api.get(`products/attributes/${attributeId}/terms`);
            const terms = response.data;
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, terms, 3600); // Cache por 1 hora
            }
            
            return terms;
        } catch (error) {
            this.log(`Erro ao buscar termos do atributo ${attributeId}: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar termos do atributo: ${error.message}`);
        }
    }

    /**
     * Atualiza estoque de um produto
     * 
     * @param {number} productId - ID do produto
     * @param {number} quantity - Nova quantidade
     * @param {string} stockStatus - Status do estoque ('instock', 'outofstock', 'onbackorder')
     * @returns {Promise<Object>} - Produto atualizado
     */
    async updateStock(productId, quantity, stockStatus = null) {
        try {
            this.log(`Atualizando estoque do produto ${productId} para ${quantity}`);
            
            const updateData = {
                stock_quantity: quantity
            };
            
            if (stockStatus) {
                updateData.stock_status = stockStatus;
            } else {
                // Define automaticamente com base na quantidade
                updateData.stock_status = quantity > 0 ? 'instock' : 'outofstock';
            }
            
            return await this.updateProduct(productId, updateData);
        } catch (error) {
            this.log(`Erro ao atualizar estoque do produto ${productId}: ${error.message}`, 'error');
            throw new Error(`Falha ao atualizar estoque: ${error.message}`);
        }
    }

    /**
     * Atualiza preço de um produto
     * 
     * @param {number} productId - ID do produto
     * @param {number} regularPrice - Preço regular
     * @param {number} salePrice - Preço promocional (opcional)
     * @returns {Promise<Object>} - Produto atualizado
     */
    async updatePrices(productId, regularPrice, salePrice = null) {
        try {
            this.log(`Atualizando preços do produto ${productId}`);
            
            const updateData = {
                regular_price: regularPrice.toString()
            };
            
            if (salePrice !== null) {
                updateData.sale_price = salePrice.toString();
            }
            
            return await this.updateProduct(productId, updateData);
        } catch (error) {
            this.log(`Erro ao atualizar preços do produto ${productId}: ${error.message}`, 'error');
            throw new Error(`Falha ao atualizar preços: ${error.message}`);
        }
    }

    /**
     * Busca variações de um produto variável
     * 
     * @param {number} productId - ID do produto
     * @returns {Promise<Array>} - Lista de variações
     */
    async getVariations(productId) {
        const cacheKey = `product-variations:${productId}`;
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await this.api.get(`products/${productId}/variations`);
            const variations = response.data;
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, variations, this.options.cacheTTL);
            }
            
            return variations;
        } catch (error) {
            this.log(`Erro ao buscar variações do produto ${productId}: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar variações: ${error.message}`);
        }
    }

    /**
     * Atualiza uma variação de produto
     * 
     * @param {number} productId - ID do produto pai
     * @param {number} variationId - ID da variação
     * @param {Object} data - Dados para atualização
     * @returns {Promise<Object>} - Variação atualizada
     */
    async updateVariation(productId, variationId, data) {
        try {
            this.log(`Atualizando variação ${variationId} do produto ${productId}`);
            
            const response = await this.api.put(`products/${productId}/variations/${variationId}`, data);
            
            // Invalida cache
            if (this.options.cacheEnabled && this.cache) {
                this.cache.del(`product-variations:${productId}`);
                this.cache.del(`product:${productId}`);
            }
            
            return response.data;
        } catch (error) {
            this.log(`Erro ao atualizar variação ${variationId}: ${error.message}`, 'error');
            throw new Error(`Falha ao atualizar variação: ${error.message}`);
        }
    }

    /**
     * Busca revisões de um produto
     * 
     * @param {number} productId - ID do produto
     * @returns {Promise<Array>} - Lista de revisões
     */
    async getReviews(productId) {
        const cacheKey = `product-reviews:${productId}`;
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await this.api.get('products/reviews', {
                product: productId
            });
            
            const reviews = response.data;
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, reviews, 1800); // Cache por 30 minutos
            }
            
            return reviews;
        } catch (error) {
            this.log(`Erro ao buscar revisões do produto ${productId}: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar revisões: ${error.message}`);
        }
    }

    /**
     * Obtém o número total de produtos
     * 
     * @param {Object} filters - Filtros opcionais
     * @returns {Promise<number>} - Contagem de produtos
     */
    async getProductCount(filters = {}) {
        const cacheKey = `productCount:${JSON.stringify(filters)}`;
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            // Busca com parâmetros de contagem
            const countParams = {
                ...filters,
                per_page: 1, // Minimiza dados transferidos
                page: 1
            };
            
            const response = await this.api.get('products', countParams);
            
            // Extrai contagem total do cabeçalho
            const totalProducts = parseInt(response.headers['x-wp-total'], 10);
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, totalProducts, 3600); // Cache por 1 hora
            }
            
            return totalProducts;
        } catch (error) {
            this.log(`Erro ao obter contagem de produtos: ${error.message}`, 'error');
            throw new Error(`Falha ao obter contagem de produtos: ${error.message}`);
        }
    }

    /**
     * Importa produtos em lote
     * 
     * @param {Array} products - Lista de produtos para importar
     * @returns {Promise<Object>} - Resultado da importação
     */
    async batchImport(products) {
        try {
            this.log(`Importando ${products.length} produtos em lote`);
            
            const batchSize = this.options.batchSize;
            const results = {
                created: [],
                updated: [],
                failed: []
            };
            
            // Processa em lotes para evitar limites de API
            for (let i = 0; i < products.length; i += batchSize) {
                const batch = products.slice(i, i + batchSize);
                
                const batchData = {
                    create: batch.filter(p => !p.id),
                    update: batch.filter(p => p.id)
                };
                
                // Só envia se houver produtos para criar/atualizar
                if (batchData.create.length > 0 || batchData.update.length > 0) {
                    const response = await this.api.post('products/batch', batchData);
                    
                    // Processa resultados
                    if (response.data.create) {
                        results.created = [...results.created, ...response.data.create];
                    }
                    
                    if (response.data.update) {
                        results.updated = [...results.updated, ...response.data.update];
                    }
                }
                
                // Se não for o último lote, aguarda um pouco para evitar throttling
                if (i + batchSize < products.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            // Invalida cache de produtos
            if (this.options.cacheEnabled && this.cache) {
                const keys = this.cache.keys();
                keys.forEach(key => {
                    if (key.startsWith('products:') || key === 'productCount') {
                        this.cache.del(key);
                    }
                });
            }
            
            this.log(`Importação concluída: ${results.created.length} criados, ${results.updated.length} atualizados`);
            
            return results;
        } catch (error) {
            this.log(`Erro na importação em lote: ${error.message}`, 'error');
            throw new Error(`Falha na importação em lote: ${error.message}`);
        }
    }

    /**
     * Busca produtos mais vendidos
     * 
     * @param {Object} options - Opções para a busca
     * @returns {Promise<Array>} - Lista de produtos mais vendidos
     */
    async getTopSellingProducts(options = {}) {
        const { period = '30days', limit = 10 } = options;
        const cacheKey = `topProducts:${period}:${limit}`;
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            // Calcula datas com base no período
            const endDate = new Date();
            const startDate = new Date();
            
            if (period === '7days') {
                startDate.setDate(endDate.getDate() - 7);
            } else if (period === '30days') {
                startDate.setDate(endDate.getDate() - 30);
            } else if (period === '90days') {
                startDate.setDate(endDate.getDate() - 90);
            } else if (period === '1year') {
                startDate.setFullYear(endDate.getFullYear() - 1);
            }
            
            // Formata datas para a API
            const after = startDate.toISOString();
            const before = endDate.toISOString();
            
            // Busca relatório de vendas por produto
            const response = await this.api.get('reports/top_sellers', {
                period,
                date_min: after,
                date_max: before,
                limit
            });
            
            // Processa relatório
            const topSellers = response.data;
            
            // Se houver produtos, busca detalhes completos
            const productsDetails = [];
            
            if (topSellers && topSellers.length > 0) {
                // Busca detalhes de cada produto
                for (const seller of topSellers) {
                    try {
                        const product = await this.getProduct(seller.product_id);
                        productsDetails.push({
                            ...product,
                            total_sales: seller.quantity
                        });
                    } catch (e) {
                        // Se falhar ao buscar detalhes, apenas registra e continua
                        this.log(`Não foi possível buscar detalhes do produto ${seller.product_id}: ${e.message}`, 'warn');
                    }
                }
            }
            
            // Armazena em cache
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, productsDetails, 3600); // Cache por 1 hora
            }
            
            return productsDetails;
        } catch (error) {
            this.log(`Erro ao buscar produtos mais vendidos: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar produtos mais vendidos: ${error.message}`);
        }
    }

    /**
     * Utilitário para logging
     * 
     * @param {string} message - Mensagem para log
     * @param {string} level - Nível do log (info, error, warn)
     * @private
     */
    log(message, level = 'info') {
        if (this.options.debug) {
            const timestamp = new Date().toISOString();
            console[level](`[WooCommerce ProductManager][${timestamp}] ${message}`);
        }
    }
}

module.exports = WooCommerceProductManager;
