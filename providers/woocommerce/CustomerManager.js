/**
 * WooCommerce Customer Manager
 * 
 * Gerencia operações relacionadas a clientes no WooCommerce
 * Parte do PHP Universal MCP Server v1.9.0
 */

const { EventEmitter } = require('events');

class WooCommerceCustomerManager extends EventEmitter {
    /**
     * Inicializa o gerenciador de clientes
     * 
     * @param {Object} api - Instância da API WooCommerce configurada
     * @param {Object} options - Opções de configuração
     */
    constructor(api, options = {}) {
        super();
        this.api = api;
        this.options = Object.assign({
            cacheEnabled: true,
            cacheTTL: 900, // 15 minutos
            batchSize: 20,
            debug: false,
            cache: null
        }, options);

        // Usa cache compartilhado se fornecido
        this.cache = this.options.cache || null;

        this.log('WooCommerce Customer Manager inicializado');
    }

    /**
     * Busca clientes com suporte a filtros e paginação
     * 
     * @param {Object} filters - Filtros para busca (email, nome, etc)
     * @param {Object} pagination - Opções de paginação (page, per_page)
     * @returns {Promise<Array>} - Lista de clientes
     */
    async getCustomers(filters = {}, pagination = { page: 1, per_page: 10 }) {
        const cacheKey = `customers:${JSON.stringify(filters)}:${JSON.stringify(pagination)}`;
        
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
            this.log(`Buscando clientes com filtros: ${JSON.stringify(filters)}`);
            const response = await this.api.get('customers', params);
            const customers = response.data;
            
            // Armazena no cache
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, customers, this.options.cacheTTL);
            }
            
            return customers;
        } catch (error) {
            this.log(`Erro ao buscar clientes: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar clientes: ${error.message}`);
        }
    }

    /**
     * Busca um cliente específico pelo ID
     * 
     * @param {number} customerId - ID do cliente
     * @returns {Promise<Object>} - Dados do cliente
     */
    async getCustomer(customerId) {
        const cacheKey = `customer:${customerId}`;
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            this.log(`Usando dados em cache para cliente: ${customerId}`);
            return this.cache.get(cacheKey);
        }

        try {
            this.log(`Buscando cliente: ${customerId}`);
            const response = await this.api.get(`customers/${customerId}`);
            const customer = response.data;
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, customer, this.options.cacheTTL);
            }
            
            return customer;
        } catch (error) {
            this.log(`Erro ao buscar cliente ${customerId}: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar cliente ${customerId}: ${error.message}`);
        }
    }

    /**
     * Cria um novo cliente
     * 
     * @param {Object} customerData - Dados do cliente
     * @returns {Promise<Object>} - Cliente criado
     */
    async createCustomer(customerData) {
        try {
            this.log(`Criando novo cliente: ${customerData.email || 'Sem email'}`);
            
            const response = await this.api.post('customers', customerData);
            const customer = response.data;
            
            // Invalida cache de listas de clientes
            if (this.options.cacheEnabled && this.cache) {
                const keys = this.cache.keys();
                keys.forEach(key => {
                    if (key.startsWith('customers:')) {
                        this.cache.del(key);
                    }
                });
            }
            
            // Emite evento de criação
            this.emit('customerCreated', customer);
            
            return customer;
        } catch (error) {
            this.log(`Erro ao criar cliente: ${error.message}`, 'error');
            throw new Error(`Falha ao criar cliente: ${error.message}`);
        }
    }

    /**
     * Atualiza um cliente existente
     * 
     * @param {number} customerId - ID do cliente
     * @param {Object} updates - Dados para atualização
     * @returns {Promise<Object>} - Cliente atualizado
     */
    async updateCustomer(customerId, updates) {
        try {
            this.log(`Atualizando cliente ${customerId}`);
            
            const response = await this.api.put(`customers/${customerId}`, updates);
            const customer = response.data;
            
            // Invalida cache
            if (this.options.cacheEnabled && this.cache) {
                this.cache.del(`customer:${customerId}`);
                
                // Invalida listas de clientes
                const keys = this.cache.keys();
                keys.forEach(key => {
                    if (key.startsWith('customers:')) {
                        this.cache.del(key);
                    }
                });
            }
            
            // Emite evento de atualização
            this.emit('customerUpdated', customer);
            
            return customer;
        } catch (error) {
            this.log(`Erro ao atualizar cliente ${customerId}: ${error.message}`, 'error');
            throw new Error(`Falha ao atualizar cliente ${customerId}: ${error.message}`);
        }
    }

    /**
     * Remove um cliente
     * 
     * @param {number} customerId - ID do cliente
     * @param {boolean} force - Se verdadeiro, força a exclusão permanente
     * @returns {Promise<Object>} - Resultado da operação
     */
    async deleteCustomer(customerId, force = false) {
        try {
            this.log(`Removendo cliente ${customerId}${force ? ' (forçado)' : ''}`);
            
            const response = await this.api.delete(`customers/${customerId}`, {
                force
            });
            
            // Invalida cache
            if (this.options.cacheEnabled && this.cache) {
                this.cache.del(`customer:${customerId}`);
                
                // Invalida listas de clientes
                const keys = this.cache.keys();
                keys.forEach(key => {
                    if (key.startsWith('customers:')) {
                        this.cache.del(key);
                    }
                });
            }
            
            // Emite evento de exclusão
            this.emit('customerDeleted', {
                id: customerId,
                success: true
            });
            
            return response.data;
        } catch (error) {
            this.log(`Erro ao remover cliente ${customerId}: ${error.message}`, 'error');
            throw new Error(`Falha ao remover cliente ${customerId}: ${error.message}`);
        }
    }

    /**
     * Busca downloads disponíveis para um cliente
     * 
     * @param {number} customerId - ID do cliente
     * @returns {Promise<Array>} - Lista de downloads
     */
    async getCustomerDownloads(customerId) {
        const cacheKey = `customer-downloads:${customerId}`;
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await this.api.get(`customers/${customerId}/downloads`);
            const downloads = response.data;
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, downloads, this.options.cacheTTL);
            }
            
            return downloads;
        } catch (error) {
            this.log(`Erro ao buscar downloads do cliente ${customerId}: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar downloads do cliente: ${error.message}`);
        }
    }

    /**
     * Busca pedidos de um cliente específico
     * 
     * @param {number} customerId - ID do cliente
     * @param {Object} filters - Filtros adicionais
     * @returns {Promise<Array>} - Lista de pedidos do cliente
     */
    async getCustomerOrders(customerId, filters = {}) {
        const cacheKey = `customer-orders:${customerId}:${JSON.stringify(filters)}`;
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            // Combina o ID do cliente com outros filtros
            const params = {
                customer: customerId,
                ...filters
            };
            
            const response = await this.api.get('orders', params);
            const orders = response.data;
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, orders, this.options.cacheTTL);
            }
            
            return orders;
        } catch (error) {
            this.log(`Erro ao buscar pedidos do cliente ${customerId}: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar pedidos do cliente: ${error.message}`);
        }
    }

    /**
     * Busca total de gastos e estatísticas de um cliente
     * 
     * @param {number} customerId - ID do cliente
     * @returns {Promise<Object>} - Estatísticas do cliente
     */
    async getCustomerStats(customerId) {
        const cacheKey = `customer-stats:${customerId}`;
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            // Busca pedidos do cliente (apenas concluídos)
            const orders = await this.getCustomerOrders(customerId, {
                status: 'completed',
                per_page: 100 // Obtém mais pedidos para estatísticas mais precisas
            });
            
            // Calcula estatísticas
            const stats = {
                totalSpent: 0,
                orderCount: orders.length,
                averageOrderValue: 0,
                firstOrderDate: null,
                lastOrderDate: null,
                daysSinceLastOrder: null,
                purchaseFrequency: null // Em dias
            };
            
            if (orders.length > 0) {
                // Calcula total gasto
                stats.totalSpent = orders.reduce((total, order) => {
                    return total + parseFloat(order.total);
                }, 0);
                
                // Calcula média por pedido
                stats.averageOrderValue = stats.totalSpent / orders.length;
                
                // Ordena pedidos por data
                const sortedOrders = [...orders].sort((a, b) => {
                    return new Date(a.date_created) - new Date(b.date_created);
                });
                
                // Obtém datas do primeiro e último pedido
                stats.firstOrderDate = sortedOrders[0].date_created;
                stats.lastOrderDate = sortedOrders[sortedOrders.length - 1].date_created;
                
                // Calcula dias desde o último pedido
                const lastOrderDate = new Date(stats.lastOrderDate);
                const today = new Date();
                const timeDiff = today - lastOrderDate;
                stats.daysSinceLastOrder = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                
                // Calcula frequência de compra (se houver mais de um pedido)
                if (orders.length > 1) {
                    const firstOrderDate = new Date(stats.firstOrderDate);
                    const totalDays = Math.floor((lastOrderDate - firstOrderDate) / (1000 * 60 * 60 * 24));
                    stats.purchaseFrequency = totalDays / (orders.length - 1);
                }
            }
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, stats, 7200); // Cache por 2 horas
            }
            
            return stats;
        } catch (error) {
            this.log(`Erro ao buscar estatísticas do cliente ${customerId}: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar estatísticas do cliente: ${error.message}`);
        }
    }

    /**
     * Gera estatísticas agregadas para todos os clientes
     * 
     * @param {Object} options - Opções para as estatísticas
     * @returns {Promise<Object>} - Estatísticas de clientes
     */
    async getAggregateCustomerStats(options = {}) {
        const { period = '30days' } = options;
        const cacheKey = `customer-stats:${period}`;
        
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
            
            // Busca pedidos do período
            const orders = await this.api.get('orders', {
                after,
                before,
                per_page: 100
            });
            
            // Extrai dados de clientes dos pedidos
            const customerMap = new Map();
            const customerOrders = new Map();
            
            orders.data.forEach(order => {
                const customerId = order.customer_id;
                if (customerId === 0) return; // Pula pedidos de convidados
                
                // Registra cliente
                if (!customerMap.has(customerId)) {
                    customerMap.set(customerId, {
                        id: customerId,
                        name: order.billing ? 
                            `${order.billing.first_name || ''} ${order.billing.last_name || ''}`.trim() : 
                            `Cliente #${customerId}`,
                        email: order.billing ? order.billing.email : null,
                        totalSpent: 0,
                        orderCount: 0
                    });
                }
                
                // Adiciona pedido à lista do cliente
                if (!customerOrders.has(customerId)) {
                    customerOrders.set(customerId, []);
                }
                customerOrders.get(customerId).push(order);
                
                // Atualiza estatísticas
                const customer = customerMap.get(customerId);
                customer.totalSpent += parseFloat(order.total);
                customer.orderCount += 1;
            });
            
            // Calcula estatísticas agregadas
            const customerStats = {
                totalCustomers: customerMap.size,
                newCustomers: 0,
                returningCustomers: 0,
                averageOrderValue: 0,
                totalSpent: 0,
                topCustomers: []
            };
            
            // Processa estatísticas por cliente
            for (const [customerId, orders] of customerOrders.entries()) {
                const customer = customerMap.get(customerId);
                
                // Adiciona ao total gasto
                customerStats.totalSpent += customer.totalSpent;
                
                // Verifica se é novo cliente
                const firstOrderDate = new Date(orders[0].date_created);
                if (firstOrderDate >= startDate) {
                    customerStats.newCustomers += 1;
                } else {
                    customerStats.returningCustomers += 1;
                }
            }
            
            // Calcula média por pedido
            const totalOrders = orders.data.length;
            if (totalOrders > 0) {
                customerStats.averageOrderValue = customerStats.totalSpent / totalOrders;
            }
            
            // Identifica top clientes
            customerStats.topCustomers = Array.from(customerMap.values())
                .sort((a, b) => b.totalSpent - a.totalSpent)
                .slice(0, 10);
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, customerStats, 7200); // Cache por 2 horas
            }
            
            return customerStats;
        } catch (error) {
            this.log(`Erro ao gerar estatísticas de clientes: ${error.message}`, 'error');
            throw new Error(`Falha ao gerar estatísticas de clientes: ${error.message}`);
        }
    }

    /**
     * Obtém o número total de clientes
     * 
     * @param {Object} filters - Filtros opcionais
     * @returns {Promise<number>} - Contagem de clientes
     */
    async getCustomersCount(filters = {}) {
        const cacheKey = `customersCount:${JSON.stringify(filters)}`;
        
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
            
            const response = await this.api.get('customers', countParams);
            
            // Extrai contagem total do cabeçalho
            const totalCustomers = parseInt(response.headers['x-wp-total'], 10);
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, totalCustomers, 3600); // Cache por 1 hora
            }
            
            return totalCustomers;
        } catch (error) {
            this.log(`Erro ao obter contagem de clientes: ${error.message}`, 'error');
            throw new Error(`Falha ao obter contagem de clientes: ${error.message}`);
        }
    }

    /**
     * Busca cliente por email
     * 
     * @param {string} email - Email do cliente
     * @returns {Promise<Object|null>} - Cliente ou null se não encontrado
     */
    async findCustomerByEmail(email) {
        try {
            this.log(`Buscando cliente por email: ${email}`);
            
            const response = await this.api.get('customers', {
                email,
                per_page: 1
            });
            
            if (response.data && response.data.length > 0) {
                return response.data[0];
            }
            
            return null;
        } catch (error) {
            this.log(`Erro ao buscar cliente por email ${email}: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar cliente por email: ${error.message}`);
        }
    }

    /**
     * Busca ou cria um cliente por email
     * 
     * @param {string} email - Email do cliente
     * @param {Object} customerData - Dados adicionais do cliente
     * @returns {Promise<Object>} - Cliente encontrado ou criado
     */
    async findOrCreateCustomer(email, customerData = {}) {
        try {
            // Busca cliente existente
            const existingCustomer = await this.findCustomerByEmail(email);
            
            if (existingCustomer) {
                this.log(`Cliente encontrado para email: ${email}`);
                return existingCustomer;
            }
            
            // Cria novo cliente
            this.log(`Criando novo cliente para email: ${email}`);
            return await this.createCustomer({
                email,
                ...customerData
            });
        } catch (error) {
            this.log(`Erro ao buscar/criar cliente por email ${email}: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar/criar cliente por email: ${error.message}`);
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
            console[level](`[WooCommerce CustomerManager][${timestamp}] ${message}`);
        }
    }
}

module.exports = WooCommerceCustomerManager;