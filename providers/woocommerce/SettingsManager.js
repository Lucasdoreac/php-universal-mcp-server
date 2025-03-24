/**
 * WooCommerce Settings Manager
 * 
 * Gerencia configurações da loja WooCommerce
 * Parte do PHP Universal MCP Server v1.8.0
 */

const { EventEmitter } = require('events');

class WooCommerceSettingsManager extends EventEmitter {
    /**
     * Inicializa o gerenciador de configurações
     * 
     * @param {Object} api - Instância da API WooCommerce configurada
     * @param {Object} options - Opções de configuração
     */
    constructor(api, options = {}) {
        super();
        this.api = api;
        this.options = Object.assign({
            cacheEnabled: true,
            cacheTTL: 3600, // 1 hora
            debug: false,
            cache: null
        }, options);

        // Usa cache compartilhado se fornecido
        this.cache = this.options.cache || null;

        this.log('WooCommerce Settings Manager inicializado');
    }

    /**
     * Busca todas as configurações da loja
     * 
     * @returns {Promise<Object>} - Configurações agrupadas
     */
    async getAllSettings() {
        const cacheKey = 'settings:all';
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            this.log('Usando dados em cache para todas as configurações');
            return this.cache.get(cacheKey);
        }

        try {
            this.log('Buscando todas as configurações da loja');
            
            // Busca os grupos de configurações
            const groups = await this.getSettingsGroups();
            
            // Busca configurações de cada grupo
            const settings = {};
            for (const group of groups) {
                settings[group.id] = await this.getSettings(group.id);
            }
            
            // Armazena no cache
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, settings, this.options.cacheTTL);
            }
            
            return settings;
        } catch (error) {
            this.log(`Erro ao buscar todas as configurações: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar configurações: ${error.message}`);
        }
    }

    /**
     * Busca grupos de configurações disponíveis
     * 
     * @returns {Promise<Array>} - Grupos de configurações
     */
    async getSettingsGroups() {
        const cacheKey = 'settings:groups';
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await this.api.get('settings');
            const groups = response.data;
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, groups, this.options.cacheTTL);
            }
            
            return groups;
        } catch (error) {
            this.log(`Erro ao buscar grupos de configurações: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar grupos de configurações: ${error.message}`);
        }
    }

    /**
     * Busca configurações de um grupo específico
     * 
     * @param {string} group - ID do grupo de configurações
     * @returns {Promise<Array>} - Configurações do grupo
     */
    async getSettings(group) {
        const cacheKey = `settings:${group}`;
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await this.api.get(`settings/${group}`);
            const settings = response.data;
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, settings, this.options.cacheTTL);
            }
            
            return settings;
        } catch (error) {
            this.log(`Erro ao buscar configurações do grupo ${group}: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar configurações do grupo: ${error.message}`);
        }
    }

    /**
     * Busca uma configuração específica
     * 
     * @param {string} group - ID do grupo de configurações
     * @param {string} id - ID da configuração
     * @returns {Promise<Object>} - Configuração
     */
    async getSetting(group, id) {
        try {
            const response = await this.api.get(`settings/${group}/${id}`);
            return response.data;
        } catch (error) {
            this.log(`Erro ao buscar configuração ${id} do grupo ${group}: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar configuração: ${error.message}`);
        }
    }

    /**
     * Atualiza uma configuração específica
     * 
     * @param {string} group - ID do grupo de configurações
     * @param {string} id - ID da configuração
     * @param {Object} data - Dados para atualização
     * @returns {Promise<Object>} - Configuração atualizada
     */
    async updateSetting(group, id, data) {
        try {
            this.log(`Atualizando configuração ${id} do grupo ${group}`);
            
            const response = await this.api.put(`settings/${group}/${id}`, data);
            
            // Invalida cache
            if (this.options.cacheEnabled && this.cache) {
                this.cache.del(`settings:${group}`);
                this.cache.del('settings:all');
            }
            
            // Emite evento de atualização
            this.emit('settingUpdated', {
                group,
                id,
                value: data.value,
                setting: response.data
            });
            
            return response.data;
        } catch (error) {
            this.log(`Erro ao atualizar configuração ${id}: ${error.message}`, 'error');
            throw new Error(`Falha ao atualizar configuração: ${error.message}`);
        }
    }

    /**
     * Atualiza múltiplas configurações de uma vez
     * 
     * @param {string} group - ID do grupo de configurações
     * @param {Array} settings - Configurações para atualizar
     * @returns {Promise<Array>} - Configurações atualizadas
     */
    async batchUpdateSettings(group, settings) {
        try {
            this.log(`Atualizando ${settings.length} configurações do grupo ${group} em lote`);
            
            // Prepara atualizações no formato esperado pela API
            const updates = settings.map(setting => {
                return {
                    id: setting.id,
                    value: setting.value
                };
            });
            
            // Realiza a atualização em lote
            const response = await this.api.post(`settings/${group}/batch`, {
                update: updates
            });
            
            // Invalida cache
            if (this.options.cacheEnabled && this.cache) {
                this.cache.del(`settings:${group}`);
                this.cache.del('settings:all');
            }
            
            // Emite evento para cada configuração atualizada
            if (response.data && response.data.update) {
                response.data.update.forEach(setting => {
                    this.emit('settingUpdated', {
                        group,
                        id: setting.id,
                        value: setting.value,
                        setting
                    });
                });
            }
            
            return response.data;
        } catch (error) {
            this.log(`Erro ao atualizar configurações em lote: ${error.message}`, 'error');
            throw new Error(`Falha ao atualizar configurações em lote: ${error.message}`);
        }
    }

    /**
     * Busca configurações gerais da loja
     * 
     * @returns {Promise<Object>} - Configurações gerais formatadas
     */
    async getGeneralSettings() {
        try {
            const [general, products, tax] = await Promise.all([
                this.getSettings('general'),
                this.getSettings('products'),
                this.getSettings('tax')
            ]);
            
            // Converte array de configurações para objeto
            const formatSettings = (settingsArray) => {
                const formatted = {};
                settingsArray.forEach(setting => {
                    formatted[setting.id] = setting.value;
                });
                return formatted;
            };
            
            // Formata configurações
            const generalSettings = formatSettings(general);
            const productSettings = formatSettings(products);
            const taxSettings = formatSettings(tax);
            
            // Combina configurações relevantes
            return {
                // Informações da loja
                name: generalSettings.woocommerce_store_name,
                description: generalSettings.woocommerce_store_description,
                address: generalSettings.woocommerce_store_address,
                city: generalSettings.woocommerce_store_city,
                postalCode: generalSettings.woocommerce_store_postcode,
                country: generalSettings.woocommerce_default_country,
                
                // Configurações de moeda
                currency: generalSettings.woocommerce_currency,
                currencyPosition: generalSettings.woocommerce_currency_pos,
                thousandSeparator: generalSettings.woocommerce_price_thousand_sep,
                decimalSeparator: generalSettings.woocommerce_price_decimal_sep,
                priceDecimals: parseInt(generalSettings.woocommerce_price_num_decimals, 10),
                
                // Configurações de produtos
                weightUnit: productSettings.woocommerce_weight_unit,
                dimensionUnit: productSettings.woocommerce_dimension_unit,
                enableReviews: productSettings.woocommerce_enable_reviews === 'yes',
                enableRatings: productSettings.woocommerce_enable_review_rating === 'yes',
                
                // Configurações de impostos
                taxesEnabled: taxSettings.woocommerce_calc_taxes === 'yes',
                taxDisplayShop: taxSettings.woocommerce_tax_display_shop,
                taxDisplayCart: taxSettings.woocommerce_tax_display_cart,
                
                // Outras configurações
                calcTaxes: generalSettings.woocommerce_calc_taxes === 'yes',
                enableCoupons: generalSettings.woocommerce_enable_coupons === 'yes'
            };
        } catch (error) {
            this.log(`Erro ao buscar configurações gerais: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar configurações gerais: ${error.message}`);
        }
    }

    /**
     * Busca configurações de envio
     * 
     * @returns {Promise<Object>} - Configurações de envio
     */
    async getShippingSettings() {
        try {
            // Busca configurações de envio
            const shipping = await this.getSettings('shipping');
            
            // Converte para objeto
            const shippingSettings = {};
            shipping.forEach(setting => {
                shippingSettings[setting.id] = setting.value;
            });
            
            // Busca zonas de envio
            const zones = await this.getShippingZones();
            
            return {
                settings: shippingSettings,
                zones,
                enableShippingCalc: shippingSettings.woocommerce_enable_shipping_calc === 'yes',
                shippingDestination: shippingSettings.woocommerce_ship_to_destination,
                shippingDebugMode: shippingSettings.woocommerce_shipping_debug_mode === 'yes'
            };
        } catch (error) {
            this.log(`Erro ao buscar configurações de envio: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar configurações de envio: ${error.message}`);
        }
    }

    /**
     * Busca zonas de envio
     * 
     * @returns {Promise<Array>} - Zonas de envio
     */
    async getShippingZones() {
        const cacheKey = 'shipping:zones';
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await this.api.get('shipping/zones');
            const zones = response.data;
            
            // Para cada zona, busca métodos de envio
            for (let i = 0; i < zones.length; i++) {
                zones[i].methods = await this.getShippingZoneMethods(zones[i].id);
                zones[i].locations = await this.getShippingZoneLocations(zones[i].id);
            }
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, zones, this.options.cacheTTL);
            }
            
            return zones;
        } catch (error) {
            this.log(`Erro ao buscar zonas de envio: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar zonas de envio: ${error.message}`);
        }
    }

    /**
     * Busca métodos de envio de uma zona
     * 
     * @param {number} zoneId - ID da zona de envio
     * @returns {Promise<Array>} - Métodos de envio da zona
     */
    async getShippingZoneMethods(zoneId) {
        try {
            const response = await this.api.get(`shipping/zones/${zoneId}/methods`);
            return response.data;
        } catch (error) {
            this.log(`Erro ao buscar métodos de envio da zona ${zoneId}: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar métodos de envio da zona: ${error.message}`);
        }
    }

    /**
     * Busca localizações de uma zona de envio
     * 
     * @param {number} zoneId - ID da zona de envio
     * @returns {Promise<Array>} - Localizações da zona
     */
    async getShippingZoneLocations(zoneId) {
        try {
            const response = await this.api.get(`shipping/zones/${zoneId}/locations`);
            return response.data;
        } catch (error) {
            this.log(`Erro ao buscar localizações da zona ${zoneId}: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar localizações da zona: ${error.message}`);
        }
    }

    /**
     * Busca configurações de pagamento
     * 
     * @returns {Promise<Object>} - Configurações de pagamento
     */
    async getPaymentSettings() {
        try {
            // Busca configurações de checkout e pagamentos
            const checkout = await this.getSettings('checkout');
            
            // Converte para objeto
            const checkoutSettings = {};
            checkout.forEach(setting => {
                checkoutSettings[setting.id] = setting.value;
            });
            
            // Busca gateways de pagamento
            const gateways = await this.getPaymentGateways();
            
            return {
                settings: checkoutSettings,
                gateways,
                enableGuestCheckout: checkoutSettings.woocommerce_enable_guest_checkout === 'yes',
                enableCoupons: checkoutSettings.woocommerce_enable_coupons === 'yes',
                checkoutEndpoint: checkoutSettings.woocommerce_checkout_endpoint
            };
        } catch (error) {
            this.log(`Erro ao buscar configurações de pagamento: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar configurações de pagamento: ${error.message}`);
        }
    }

    /**
     * Busca gateways de pagamento
     * 
     * @returns {Promise<Array>} - Gateways de pagamento
     */
    async getPaymentGateways() {
        const cacheKey = 'payment:gateways';
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await this.api.get('payment_gateways');
            const gateways = response.data;
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, gateways, this.options.cacheTTL);
            }
            
            return gateways;
        } catch (error) {
            this.log(`Erro ao buscar gateways de pagamento: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar gateways de pagamento: ${error.message}`);
        }
    }

    /**
     * Atualiza um gateway de pagamento
     * 
     * @param {string} id - ID do gateway
     * @param {Object} data - Dados para atualização
     * @returns {Promise<Object>} - Gateway atualizado
     */
    async updatePaymentGateway(id, data) {
        try {
            this.log(`Atualizando gateway de pagamento ${id}`);
            
            const response = await this.api.put(`payment_gateways/${id}`, data);
            
            // Invalida cache
            if (this.options.cacheEnabled && this.cache) {
                this.cache.del('payment:gateways');
            }
            
            return response.data;
        } catch (error) {
            this.log(`Erro ao atualizar gateway de pagamento ${id}: ${error.message}`, 'error');
            throw new Error(`Falha ao atualizar gateway de pagamento: ${error.message}`);
        }
    }

    /**
     * Busca configurações de emails
     * 
     * @returns {Promise<Array>} - Configurações de emails
     */
    async getEmailSettings() {
        const cacheKey = 'settings:email';
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await this.api.get('settings/email');
            const emails = response.data;
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, emails, this.options.cacheTTL);
            }
            
            return emails;
        } catch (error) {
            this.log(`Erro ao buscar configurações de email: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar configurações de email: ${error.message}`);
        }
    }

    /**
     * Busca webhooks configurados
     * 
     * @returns {Promise<Array>} - Webhooks
     */
    async getWebhooks() {
        const cacheKey = 'webhooks';
        
        if (this.options.cacheEnabled && this.cache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await this.api.get('webhooks');
            const webhooks = response.data;
            
            if (this.options.cacheEnabled && this.cache) {
                this.cache.set(cacheKey, webhooks, this.options.cacheTTL);
            }
            
            return webhooks;
        } catch (error) {
            this.log(`Erro ao buscar webhooks: ${error.message}`, 'error');
            throw new Error(`Falha ao buscar webhooks: ${error.message}`);
        }
    }

    /**
     * Cria um novo webhook
     * 
     * @param {Object} webhookData - Dados do webhook
     * @returns {Promise<Object>} - Webhook criado
     */
    async createWebhook(webhookData) {
        try {
            this.log(`Criando webhook para ${webhookData.topic} em ${webhookData.delivery_url}`);
            
            const response = await this.api.post('webhooks', webhookData);
            
            // Invalida cache
            if (this.options.cacheEnabled && this.cache) {
                this.cache.del('webhooks');
            }
            
            return response.data;
        } catch (error) {
            this.log(`Erro ao criar webhook: ${error.message}`, 'error');
            throw new Error(`Falha ao criar webhook: ${error.message}`);
        }
    }

    /**
     * Remove um webhook
     * 
     * @param {number} webhookId - ID do webhook
     * @param {boolean} force - Se verdadeiro, força a exclusão permanente
     * @returns {Promise<Object>} - Resultado da operação
     */
    async deleteWebhook(webhookId, force = false) {
        try {
            this.log(`Removendo webhook ${webhookId}`);
            
            const response = await this.api.delete(`webhooks/${webhookId}`, {
                force
            });
            
            // Invalida cache
            if (this.options.cacheEnabled && this.cache) {
                this.cache.del('webhooks');
            }
            
            return response.data;
        } catch (error) {
            this.log(`Erro ao remover webhook ${webhookId}: ${error.message}`, 'error');
            throw new Error(`Falha ao remover webhook: ${error.message}`);
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
            console[level](`[WooCommerce SettingsManager][${timestamp}] ${message}`);
        }
    }
}

module.exports = WooCommerceSettingsManager;
