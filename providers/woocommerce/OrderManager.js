/**
 * WooCommerce Order Manager
 * 
 * Gerencia operações relacionadas a pedidos no WooCommerce
 * Parte do PHP Universal MCP Server v1.9.0
 */

const { EventEmitter } = require('events');

class WooCommerceOrderManager extends EventEmitter {
    /**
     * Inicializa o gerenciador de pedidos
     * 
     * @param {Object} api - Instância da API WooCommerce configurada
     * @param {Object} options - Opções de configuração
     */
    constructor(api, options = {}) {
        super();
        this.api = api;
        this.options = Object.assign({
            cacheEnabled: true,
            cacheTTL: 300, // 5 minutos
            batchSize: 20,
            debug: false,
            cache: null
        }, options);

        // Usa cache compartilhado se fornecido, senão usa o próprio
        this.cache = this.options.cache || null;

        this.log('WooCommerce Order Manager inicializado');
    }

    /**
     * Busca pedidos com suporte a filtros e paginação
     * 
     * @param {Object} filters - Filtros para busca (status, data, cliente, etc)
     * @param {Object} pagination - Opções de paginação (page, per_page)
     * @returns {Promise<Array>} - Lista de pedidos
     */
    async getOrders(filters = {}, pagination = { page: 1, per_page: 10 }) {
        const cacheKey = `orders:${JSON.stringify(filters)}:${JSON.stringify(pagination)}`;
        
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
            this.log(`Buscando pedidos com filtros: ${JSON.stringify(filters)}`);
            const response = await this.api.get('orders', params);
            const orders = response.data;
            
            // Armazena no cache
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, orders);
            }
            
            return orders;
        } catch (error) {
            this.log(`Erro ao buscar pedidos: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar pedidos: ${error.message}`);
        }
    }

    /**
     * Busca um pedido específico pelo ID
     * 
     * @param {number} orderId - ID do pedido
     * @returns {Promise<Object>} - Dados do pedido
     */
    async getOrder(orderId) {
        const cacheKey = `order:${orderId}`;
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            this.log(`Usando dados em cache para pedido: ${orderId}`);
            return this.cache.get(cacheKey);
        }

        try {
            this.log(`Buscando pedido: ${orderId}`);
            const response = await this.api.get(`orders/${orderId}`);
            const order = response.data;
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, order);
            }
            
            return order;
        } catch (error) {
            this.log(`Erro ao buscar pedido ${orderId}: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar pedido ${orderId}: ${error.message}`);
        }
    }

    /**
     * Atualiza o status de um pedido
     * 
     * @param {number} orderId - ID do pedido
     * @param {string} status - Novo status
     * @param {string} note - Nota para o cliente (opcional)
     * @returns {Promise<Object>} - Pedido atualizado
     */
    async updateOrderStatus(orderId, status, note = '') {
        try {
            this.log(`Atualizando status do pedido ${orderId} para: ${status}`);
            
            const updateData = {
                status: status
            };
            
            if (note) {
                updateData.customer_note = note;
            }
            
            const response = await this.api.put(`orders/${orderId}`, updateData);
            const updatedOrder = response.data;
            
            // Invalida cache
            if (this.options.cacheEnabled && this.cache) {
                this.cache.del(`order:${orderId}`);
                // Invalida todas as chaves de cache que começam com 'orders:'
                const keys = this.cache.keys();
                keys.forEach(key => {
                    if (key.startsWith('orders:')) {
                        this.cache.del(key);
                    }
                });
            }
            
            // Emite evento de atualização
            this.emit('orderStatusChanged', {
                id: orderId,
                newStatus: status,
                oldStatus: updatedOrder.status,
                order: updatedOrder
            });
            
            return updatedOrder;
        } catch (error) {
            this.log(`Erro ao atualizar status do pedido ${orderId}: ${error.message}`, 'error');
            throw new Error(`Falha ao atualizar status do pedido ${orderId}: ${error.message}`);
        }
    }

    /**
     * Adiciona uma nota ao pedido
     * 
     * @param {number} orderId - ID do pedido
     * @param {Object} noteData - Dados da nota
     * @returns {Promise<Object>} - Nota criada
     */
    async addOrderNote(orderId, noteData) {
        try {
            const data = {
                note: noteData.content,
                customer_note: noteData.customer_note || false,
                added_by_user: noteData.added_by_user || false
            };
            
            this.log(`Adicionando nota ao pedido ${orderId}`);
            const response = await this.api.post(`orders/${orderId}/notes`, data);
            
            // Invalida cache do pedido
            if (this.options.cacheEnabled && this.cache) {
                this.cache.del(`order:${orderId}`);
            }
            
            return response.data;
        } catch (error) {
            this.log(`Erro ao adicionar nota ao pedido ${orderId}: ${error.message}`, 'error');
            throw new Error(`Falha ao adicionar nota ao pedido ${orderId}: ${error.message}`);
        }
    }

    /**
     * Busca todas as notas de um pedido
     * 
     * @param {number} orderId - ID do pedido
     * @returns {Promise<Array>} - Lista de notas
     */
    async getOrderNotes(orderId) {
        const cacheKey = `order:${orderId}:notes`;
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            this.log(`Usando dados em cache para notas do pedido: ${orderId}`);
            return this.cache.get(cacheKey);
        }
        
        try {
            this.log(`Buscando notas do pedido: ${orderId}`);
            const response = await this.api.get(`orders/${orderId}/notes`);
            const notes = response.data;
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, notes);
            }
            
            return notes;
        } catch (error) {
            this.log(`Erro ao buscar notas do pedido ${orderId}: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar notas do pedido ${orderId}: ${error.message}`);
        }
    }

    /**
     * Obtém estatísticas de pedidos
     * 
     * @param {Object} filters - Filtros para estatísticas (período, status)
     * @returns {Promise<Object>} - Estatísticas de pedidos
     */
    async getOrderStats(filters = {}) {
        const cacheKey = `orderStats:${JSON.stringify(filters)}`;
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const { date_min, date_max, status } = filters;
            const params = {};
            
            if (date_min) params.after = date_min;
            if (date_max) params.before = date_max;
            if (status) params.status = status;
            
            // Busca pedidos
            const ordersResponse = await this.api.get('orders', {
                ...params,
                per_page: 100
            });
            
            const orders = ordersResponse.data;
            
            // Processa estatísticas
            const stats = this._calculateOrderStats(orders);
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, stats, 600); // Cache por 10 minutos
            }
            
            return stats;
        } catch (error) {
            this.log(`Erro ao buscar estatísticas de pedidos: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar estatísticas de pedidos: ${error.message}`);
        }
    }

    /**
     * Calcula estatísticas com base nos pedidos
     * 
     * @param {Array} orders - Lista de pedidos
     * @returns {Object} - Estatísticas calculadas
     * @private
     */
    _calculateOrderStats(orders) {
        let totalRevenue = 0;
        let totalTax = 0;
        let totalShipping = 0;
        let avgOrderValue = 0;
        const statusCount = {};
        const paymentMethods = {};
        
        orders.forEach(order => {
            // Soma valores
            totalRevenue += parseFloat(order.total);
            totalTax += parseFloat(order.total_tax);
            totalShipping += parseFloat(order.shipping_total);
            
            // Conta status
            statusCount[order.status] = (statusCount[order.status] || 0) + 1;
            
            // Conta métodos de pagamento
            paymentMethods[order.payment_method_title] = (paymentMethods[order.payment_method_title] || 0) + 1;
        });
        
        // Calcula média
        avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
        
        return {
            orderCount: orders.length,
            totalRevenue,
            totalTax,
            totalShipping,
            avgOrderValue,
            statusCount,
            paymentMethods
        };
    }

    /**
     * Obtém o número total de pedidos
     * 
     * @param {Object} filters - Filtros opcionais
     * @returns {Promise<number>} - Contagem de pedidos
     */
    async getOrderCount(filters = {}) {
        const cacheKey = `orderCount:${JSON.stringify(filters)}`;
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            // Usa endpoint de reports para contagem
            const response = await this.api.get('reports/orders/totals');
            const orderTotals = response.data;
            
            // Calcula contagem total e por status
            let totalCount = 0;
            const countByStatus = {};
            
            orderTotals.forEach(item => {
                countByStatus[item.slug] = item.total;
                totalCount += item.total;
            });
            
            const result = {
                total: totalCount,
                byStatus: countByStatus
            };
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, result, 3600); // Cache por 1 hora
            }
            
            return result;
        } catch (error) {
            this.log(`Erro ao obter contagem de pedidos: ${error.message}`, 'error');
            throw new Error(`Falha ao obter contagem de pedidos: ${error.message}`);
        }
    }

    /**
     * Processa reembolso para um pedido
     * 
     * @param {number} orderId - ID do pedido
     * @param {Object} refundData - Dados do reembolso
     * @returns {Promise<Object>} - Reembolso processado
     */
    async processRefund(orderId, refundData) {
        try {
            this.log(`Processando reembolso para pedido ${orderId}`);
            
            const data = {
                amount: refundData.amount,
                reason: refundData.reason || '',
                api_refund: refundData.api_refund !== false, // Default true
                line_items: refundData.line_items || []
            };
            
            const response = await this.api.post(`orders/${orderId}/refunds`, data);
            const refund = response.data;
            
            // Invalida cache
            if (this.options.cacheEnabled && this.cache) {
                this.cache.del(`order:${orderId}`);
                this.cache.del(new RegExp(`orders:.*`));
            }
            
            // Emite evento
            this.emit('orderRefunded', {
                orderId,
                refundId: refund.id,
                amount: refund.amount,
                refund
            });
            
            return refund;
        } catch (error) {
            this.log(`Erro ao processar reembolso para pedido ${orderId}: ${error.message}`, 'error');
            throw new Error(`Falha ao processar reembolso: ${error.message}`);
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
            console[level](`[WooCommerce OrderManager][${timestamp}] ${message}`);
        }
    }
}

module.exports = WooCommerceOrderManager;