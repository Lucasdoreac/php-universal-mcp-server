/**
 * Comandos MCP para gerenciamento de pedidos WooCommerce
 * 
 * Este módulo implementa comandos para gerenciamento de pedidos
 * acessíveis via Claude Desktop.
 * 
 * Parte do PHP Universal MCP Server v1.9.0
 */

const OrdersManagementView = require('../artifacts/OrdersManagementView');

// Instância do renderizador de visualização
const ordersView = new OrdersManagementView();

/**
 * Comando para visualização e gerenciamento de pedidos
 * 
 * @param {Object} params - Parâmetros do comando
 * @param {Object} context - Contexto de execução do MCP
 * @returns {Promise<Object>} - Resposta para o Claude
 */
async function handleOrdersCommand(params, context) {
    try {
        const { mcp, woocommerce, site } = context;
        
        // Verifica se há site e provider configurados
        if (!site || !woocommerce) {
            return {
                type: 'error',
                content: 'Nenhum site WooCommerce configurado ou selecionado. Use "selecionar site <id>" primeiro.'
            };
        }
        
        // Parâmetros do comando
        const { action = 'listar', id, status, filtros = {}, pagina = 1 } = params;
        
        // Processa ação especificada
        switch (action.toLowerCase()) {
            case 'listar':
                return await listOrders(woocommerce, filtros, pagina);
                
            case 'visualizar':
                return await viewOrder(woocommerce, id);
                
            case 'atualizar':
                if (!id || !status) {
                    return {
                        type: 'error',
                        content: 'ID do pedido e status são obrigatórios. Exemplo: pedidos atualizar 123 concluído'
                    };
                }
                return await updateOrderStatus(woocommerce, id, status, params.nota);
                
            case 'dashboard':
                return await generateOrdersDashboard(woocommerce, filtros);
                
            case 'reembolsar':
                if (!id) {
                    return {
                        type: 'error',
                        content: 'ID do pedido é obrigatório para reembolso.'
                    };
                }
                return await processRefund(woocommerce, id, params);
                
            default:
                return {
                    type: 'error',
                    content: `Ação desconhecida: ${action}. Ações disponíveis: listar, visualizar, atualizar, dashboard, reembolsar`
                };
        }
    } catch (error) {
        console.error(`Erro ao processar comando de pedidos: ${error.message}`);
        return {
            type: 'error',
            content: `Ocorreu um erro ao processar o comando: ${error.message}`
        };
    }
}

/**
 * Lista pedidos com suporte a filtros e paginação
 * 
 * @param {Object} woocommerce - Instância do provider WooCommerce
 * @param {Object} filters - Filtros para busca
 * @param {number} page - Página atual
 * @returns {Promise<Object>} - Resposta para o Claude
 */
async function listOrders(woocommerce, filters, page) {
    // Configura parâmetros de paginação
    const pagination = {
        page: parseInt(page),
        per_page: 10
    };
    
    // Busca pedidos
    const orders = await woocommerce.orders.getOrders(filters, pagination);
    
    // Se não houver pedidos, retorna mensagem simples
    if (!orders || orders.length === 0) {
        return {
            type: 'info',
            content: 'Nenhum pedido encontrado com os filtros especificados.'
        };
    }
    
    // Busca estatísticas
    const stats = await woocommerce.orders.getOrderStats(filters);
    
    // Gera visualização em artifact
    const artifact = ordersView.render(orders, {
        stats,
        filters,
        currentPage: pagination.page
    });
    
    return {
        type: 'artifact',
        content: 'Aqui está o dashboard de gerenciamento de pedidos:',
        artifact
    };
}

/**
 * Visualiza um pedido específico
 * 
 * @param {Object} woocommerce - Instância do provider WooCommerce
 * @param {number} orderId - ID do pedido
 * @returns {Promise<Object>} - Resposta para o Claude
 */
async function viewOrder(woocommerce, orderId) {
    if (!orderId) {
        return {
            type: 'error',
            content: 'ID do pedido é obrigatório. Exemplo: pedidos visualizar 123'
        };
    }
    
    // Busca o pedido
    const order = await woocommerce.orders.getOrder(orderId);
    
    // Busca notas do pedido
    const notes = await woocommerce.orders.getOrderNotes(orderId);
    
    // Adiciona notas ao objeto do pedido para visualização
    order.notes = notes;
    
    // Gera visualização em artifact
    const artifact = ordersView.render([order], {
        stats: {
            totalRevenue: parseFloat(order.total),
            statusCounts: { [order.status]: 1 }
        },
        showNotes: true,
        showFullDetails: true
    });
    
    return {
        type: 'artifact',
        content: `Detalhes do pedido #${order.number || orderId}:`,
        artifact
    };
}

/**
 * Atualiza o status de um pedido
 * 
 * @param {Object} woocommerce - Instância do provider WooCommerce
 * @param {number} orderId - ID do pedido
 * @param {string} status - Novo status
 * @param {string} note - Nota opcional
 * @returns {Promise<Object>} - Resposta para o Claude
 */
async function updateOrderStatus(woocommerce, orderId, status, note) {
    // Mapeia status amigáveis para valores do WooCommerce
    const statusMap = {
        'pendente': 'pending',
        'processando': 'processing',
        'em-espera': 'on-hold',
        'espera': 'on-hold',
        'concluído': 'completed',
        'concluido': 'completed',
        'cancelado': 'cancelled',
        'reembolsado': 'refunded',
        'falhou': 'failed'
    };
    
    // Converte status se necessário
    const normalizedStatus = statusMap[status.toLowerCase()] || status.toLowerCase();
    
    // Atualiza o status
    const updatedOrder = await woocommerce.orders.updateOrderStatus(orderId, normalizedStatus, note);
    
    return {
        type: 'success',
        content: `Status do pedido #${updatedOrder.number || orderId} atualizado para "${normalizedStatus}" com sucesso.`,
        data: {
            order: updatedOrder
        }
    };
}

/**
 * Gera dashboard de pedidos
 * 
 * @param {Object} woocommerce - Instância do provider WooCommerce
 * @param {Object} filters - Filtros para o dashboard
 * @returns {Promise<Object>} - Resposta para o Claude
 */
async function generateOrdersDashboard(woocommerce, filters) {
    // Define filtros padrão se não especificados
    const defaultFilters = {
        per_page: 100 // Busca mais pedidos para análise
    };
    
    // Busca pedidos para o dashboard
    const orders = await woocommerce.orders.getOrders({
        ...defaultFilters,
        ...filters
    });
    
    // Busca estatísticas
    const stats = await woocommerce.orders.getOrderStats(filters);
    
    // Busca contagem total de pedidos
    const counts = await woocommerce.orders.getOrderCount();
    
    // Configura metadata para a visualização
    const metadata = {
        stats,
        totalCount: counts.total,
        statusCounts: counts.byStatus,
        dateRange: {
            start: filters.date_min || 'todos',
            end: filters.date_max || 'todos'
        },
        filters
    };
    
    // Gera visualização em artifact
    const artifact = ordersView.render(orders, metadata);
    
    return {
        type: 'artifact',
        content: 'Aqui está o dashboard de análise de pedidos:',
        artifact
    };
}

/**
 * Processa reembolso de pedido
 * 
 * @param {Object} woocommerce - Instância do provider WooCommerce
 * @param {number} orderId - ID do pedido
 * @param {Object} params - Parâmetros do reembolso
 * @returns {Promise<Object>} - Resposta para o Claude
 */
async function processRefund(woocommerce, orderId, params) {
    const { valor, motivo, items } = params;
    
    // Verifica valor do reembolso
    if (!valor && !items) {
        return {
            type: 'error',
            content: 'É necessário especificar o valor do reembolso ou os itens a serem reembolsados.'
        };
    }
    
    // Prepara dados do reembolso
    const refundData = {
        amount: parseFloat(valor) || 0,
        reason: motivo || 'Reembolso solicitado via PHP Universal MCP Server',
        api_refund: true
    };
    
    // Processa itens se especificados
    if (items && Array.isArray(items)) {
        refundData.line_items = items.map(item => ({
            line_item_id: item.id,
            quantity: item.quantidade || 1,
            refund_total: item.valor || true
        }));
    }
    
    // Processa reembolso
    const refund = await woocommerce.orders.processRefund(orderId, refundData);
    
    return {
        type: 'success',
        content: `Reembolso de ${refundData.amount} processado com sucesso para o pedido #${orderId}.`,
        data: {
            refund
        }
    };
}

module.exports = {
    handleOrdersCommand
};