/**
 * WooCommerce Provider
 * 
 * Implementação do provider para integração com lojas WooCommerce
 * Parte do PHP Universal MCP Server v1.8.0
 */

const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api');
const { EventEmitter } = require('events');
const ProductManager = require('./ProductManager');
const OrderManager = require('./OrderManager');
const CustomerManager = require('./CustomerManager');
const SettingsManager = require('./SettingsManager');
const NodeCache = require('node-cache');

class WooCommerceProvider extends EventEmitter {
    /**
     * Inicializa o provider WooCommerce
     * 
     * @param {Object} config - Configuração do provider
     * @param {Object} options - Opções adicionais
     */
    constructor(config, options = {}) {
        super();
        
        this.config = config;
        this.options = Object.assign({
            cacheEnabled: true,
            debugMode: false,
            version: 'v3'
        }, options);
        
        // Configuração da API
        this.api = new WooCommerceRestApi({
            url: config.url,
            consumerKey: config.consumer_key,
            consumerSecret: config.consumer_secret,
            version: this.options.version,
            queryStringAuth: true
        });
        
        // Inicializa sistema de cache
        if (this.options.cacheEnabled) {
            this.cache = new NodeCache({
                stdTTL: 300, // 5 minutos padrão
                checkperiod: 60,
                useClones: false
            });
        }
        
        // Inicializa managers
        this.products = new ProductManager(this.api, {
            cacheEnabled: this.options.cacheEnabled,
            debug: this.options.debugMode,
            cache: this.cache
        });
        
        this.orders = new OrderManager(this.api, {
            cacheEnabled: this.options.cacheEnabled,
            debug: this.options.debugMode,
            cache: this.cache
        });
        
        this.customers = new CustomerManager(this.api, {
            cacheEnabled: this.options.cacheEnabled,
            debug: this.options.debugMode,
            cache: this.cache
        });
        
        this.settings = new SettingsManager(this.api, {
            cacheEnabled: this.options.cacheEnabled,
            debug: this.options.debugMode,
            cache: this.cache
        });
        
        // Repassa eventos dos managers
        this._setupEventForwarding();
        
        this.log('WooCommerce Provider inicializado');
    }
    
    /**
     * Retorna informações da loja
     * 
     * @returns {Promise<Object>} - Informações da loja
     */
    async getStoreInfo() {
        const cacheKey = 'store:info';
        
        if (this.options.cacheEnabled && this.cache.has(cacheKey)) {
            this.log('Usando dados em cache para informações da loja');
            return this.cache.get(cacheKey);
        }
        
        try {
            this.log('Buscando informações da loja');
            
            // Busca informações básicas da loja
            const [
                siteInfo,
                settings,
                productsCount,
                ordersCount,
                customersCount
            ] = await Promise.all([
                this.api.get(''),
                this.settings.getGeneralSettings(),
                this.products.getProductCount(),
                this.orders.getOrderCount(),
                this.customers.getCustomersCount()
            ]);
            
            const storeInfo = {
                name: settings.name || siteInfo.data.store_name,
                description: settings.description,
                url: this.config.url,
                version: siteInfo.data.version || 'Desconhecida',
                currency: settings.currency,
                currencySymbol: settings.currency_symbol,
                stats: {
                    productsCount,
                    ordersCount,
                    customersCount
                },
                lastUpdated: new Date().toISOString()
            };
            
            if (this.options.cacheEnabled) {
                this.cache.set(cacheKey, storeInfo, 3600); // Cache por 1 hora
            }
            
            return storeInfo;
        } catch (error) {
            this.log(`Erro ao buscar informações da loja: ${error.message}`, 'error');
            throw new Error(`Falha ao recuperar informações da loja: ${error.message}`);
        }
    }
    
    /**
     * Verifica a conexão com a API WooCommerce
     * 
     * @returns {Promise<boolean>} - Status da conexão
     */
    async testConnection() {
        try {
            this.log('Testando conexão com WooCommerce API');
            await this.api.get('');
            this.log('Conexão bem-sucedida');
            return true;
        } catch (error) {
            this.log(`Falha na conexão: ${error.message}`, 'error');
            return false;
        }
    }
    
    /**
     * Configura o repasse de eventos dos managers
     * 
     * @private
     */
    _setupEventForwarding() {
        // Propaga eventos do ProductManager
        this.products.on('productCreated', (data) => {
            this.emit('productCreated', data);
        });
        
        this.products.on('productUpdated', (data) => {
            this.emit('productUpdated', data);
        });
        
        this.products.on('productDeleted', (data) => {
            this.emit('productDeleted', data);
        });
        
        // Propaga eventos do OrderManager
        this.orders.on('orderCreated', (data) => {
            this.emit('orderCreated', data);
        });
        
        this.orders.on('orderUpdated', (data) => {
            this.emit('orderUpdated', data);
        });
        
        this.orders.on('orderStatusChanged', (data) => {
            this.emit('orderStatusChanged', data);
        });
        
        // Propaga eventos do CustomerManager
        this.customers.on('customerCreated', (data) => {
            this.emit('customerCreated', data);
        });
        
        this.customers.on('customerUpdated', (data) => {
            this.emit('customerUpdated', data);
        });
    }
    
    /**
     * Utilitário para logging
     * 
     * @param {string} message - Mensagem para log
     * @param {string} level - Nível do log (info, error, warn)
     * @private
     */
    log(message, level = 'info') {
        if (this.options.debugMode) {
            const timestamp = new Date().toISOString();
            console[level](`[WooCommerce][${timestamp}] ${message}`);
        }
    }
    
    /**
     * Gera um relatório de desempenho da loja
     * 
     * @param {Object} options - Opções do relatório
     * @returns {Promise<Object>} - Dados do relatório
     */
    async generatePerformanceReport(options = {}) {
        try {
            const { period = '30days', includeOrders = true, includeProducts = true, includeCustomers = true } = options;
            
            this.log(`Gerando relatório de desempenho para período: ${period}`);
            
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
            
            const dateRange = {
                after: startDate.toISOString(),
                before: endDate.toISOString()
            };
            
            // Dados a coletar
            const reportData = {
                period,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                summary: {},
                details: {}
            };
            
            // Coleta dados de pedidos se solicitado
            if (includeOrders) {
                const orders = await this.orders.getOrders({
                    after: dateRange.after,
                    before: dateRange.before,
                    per_page: 100
                });
                
                const orderAnalytics = this._analyzeOrders(orders);
                reportData.summary.orders = orderAnalytics.summary;
                reportData.details.orders = orderAnalytics.details;
            }
            
            // Coleta dados de produtos se solicitado
            if (includeProducts) {
                const topProducts = await this.products.getTopSellingProducts({
                    period,
                    limit: 10
                });
                
                reportData.summary.products = {
                    topSelling: topProducts
                };
            }
            
            // Coleta dados de clientes se solicitado
            if (includeCustomers) {
                const customerStats = await this.customers.getCustomerStats({
                    period
                });
                
                reportData.summary.customers = customerStats;
            }
            
            return reportData;
        } catch (error) {
            this.log(`Erro ao gerar relatório de desempenho: ${error.message}`, 'error');
            throw new Error(`Falha ao gerar relatório de desempenho: ${error.message}`);
        }
    }
    
    /**
     * Analisa dados de pedidos para relatório
     * 
     * @param {Array} orders - Lista de pedidos
     * @returns {Object} - Análise dos pedidos
     * @private
     */
    _analyzeOrders(orders) {
        // Inicializa contadores
        const statuses = {};
        let totalRevenue = 0;
        let orderCount = orders.length;
        let avgOrderValue = 0;
        
        // Processa cada pedido
        orders.forEach(order => {
            // Conta por status
            if (!statuses[order.status]) {
                statuses[order.status] = 0;
            }
            statuses[order.status]++;
            
            // Soma receita
            const total = parseFloat(order.total);
            totalRevenue += total;
        });
        
        // Calcula média
        avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
        
        return {
            summary: {
                orderCount,
                totalRevenue,
                avgOrderValue,
                statusCounts: statuses
            },
            details: {
                // Pode incluir dados mais detalhados aqui
                // como vendas por dia, etc.
            }
        };
    }
}

module.exports = WooCommerceProvider;
