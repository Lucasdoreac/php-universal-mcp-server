/**
 * Registro de comandos MCP para Claude Desktop
 * 
 * Este módulo exporta todos os comandos disponíveis para interação
 * via Claude Desktop.
 * 
 * Parte do PHP Universal MCP Server v1.8.0
 */

const { handleSitesCommand } = require('./sites');
const { handleProductsCommand } = require('./products');
const { handleTemplatesCommand } = require('./templates');
const { handleAnalyticsCommand } = require('./analytics');
const { handleExportCommand } = require('./export');
const { handleOrdersCommand } = require('./orders');

// Mapeamento de comandos
const commands = {
    'sites': handleSitesCommand,
    'site': handleSitesCommand,
    'produtos': handleProductsCommand,
    'produto': handleProductsCommand,
    'templates': handleTemplatesCommand,
    'template': handleTemplatesCommand,
    'analytics': handleAnalyticsCommand,
    'relatorios': handleAnalyticsCommand,
    'relatório': handleAnalyticsCommand,
    'exportar': handleExportCommand,
    'pedidos': handleOrdersCommand, // Novo comando de pedidos
    'pedido': handleOrdersCommand,  // Alias para o comando de pedidos
    'orders': handleOrdersCommand   // Versão em inglês
};

/**
 * Processa comando MCP recebido do Claude Desktop
 * 
 * @param {string} commandName - Nome do comando
 * @param {Object} params - Parâmetros do comando
 * @param {Object} context - Contexto de execução
 * @returns {Promise<Object>} - Resposta para o Claude
 */
async function processCommand(commandName, params, context) {
    // Verifica se o comando existe
    if (!commandName || !commands[commandName.toLowerCase()]) {
        return {
            type: 'error',
            content: `Comando desconhecido: ${commandName}. Use um dos comandos disponíveis: ${Object.keys(commands).join(', ')}`
        };
    }
    
    try {
        // Executa o handler do comando
        const handler = commands[commandName.toLowerCase()];
        return await handler(params, context);
    } catch (error) {
        console.error(`Erro ao processar comando ${commandName}: ${error.message}`);
        return {
            type: 'error',
            content: `Ocorreu um erro ao processar o comando: ${error.message}`
        };
    }
}

module.exports = {
    processCommand,
    commands
};
