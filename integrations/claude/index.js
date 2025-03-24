/**
 * Integração Claude MCP - PHP Universal Server
 * 
 * Este módulo centraliza todas as integrações do PHP Universal MCP Server
 * com o Claude via Model Context Protocol (MCP), facilitando o acesso
 * a funcionalidades como criação de websites, gerenciamento de hospedagem
 * e criação de plugins.
 * 
 * @author Lucas Dórea
 * @version 1.0.0
 */

const { MCPResponse } = require('@modelcontextprotocol/sdk');

// Importar módulos de integração específicos
const bootstrapBuilder = require('./bootstrap-builder');
const hosting = require('./hosting');
const pluginCreator = require('./plugin-creator');

// Mapeamento de comandos para módulos de processamento
const COMMAND_HANDLERS = {
  // Comandos de criação de websites
  'criar site': bootstrapBuilder.processCommand,
  'novo site': bootstrapBuilder.processCommand,
  'adicionar componente': bootstrapBuilder.processCommand,
  'inserir': bootstrapBuilder.processCommand,
  'preview': bootstrapBuilder.processCommand,
  'prévia': bootstrapBuilder.processCommand,
  'visualizar': bootstrapBuilder.processCommand,
  'publicar': bootstrapBuilder.processCommand,
  'deploy': bootstrapBuilder.processCommand,
  
  // Comandos de hospedagem
  'criar servidor': hosting.processCommand,
  'configurar domínio': hosting.processCommand,
  'gerenciar hospedagem': hosting.processCommand,
  'configurar ssl': hosting.processCommand,
  'instalar': hosting.processCommand,
  'backup': hosting.processCommand,
  'restaurar': hosting.processCommand,
  
  // Comandos de plugins
  'criar plugin': pluginCreator.processCommand,
  'desenvolver plugin': pluginCreator.processCommand,
  'gerar plugin': pluginCreator.processCommand
};

/**
 * Handler principal para processar comandos do Claude MCP
 * 
 * Esta função atua como um router que determina qual módulo específico
 * deve processar o comando do usuário com base no texto enviado.
 * 
 * @param {Object} command - Comando recebido via MCP
 * @param {Object} session - Sessão MCP
 * @returns {MCPResponse} - Resposta para o Claude
 */
async function handleCommand(command, session) {
  try {
    const text = command.text.toLowerCase().trim();
    
    // Identificar o handler mais apropriado
    const handlerKey = Object.keys(COMMAND_HANDLERS).find(key => text.includes(key));
    
    if (handlerKey) {
      // Chamar o handler específico para o comando
      return await COMMAND_HANDLERS[handlerKey](command, session);
    } else {
      // Comando não reconhecido, responder com ajuda
      return new MCPResponse({
        message: `Não reconheci esse comando. Tente uma das seguintes opções:
        
- **Criação de websites**: "criar site blog", "novo site landing", "adicionar menu", "inserir carrossel", "visualizar site", "publicar site"
        
- **Hospedagem**: "criar servidor", "configurar domínio example.com", "instalar wordpress", "fazer backup", "restaurar backup"
        
- **Plugins**: "criar plugin", "desenvolver plugin para woocommerce", "gerar plugin de formulário"
        
Estou aqui para ajudar com qualquer uma dessas tarefas!`
      });
    }
  } catch (error) {
    console.error('Erro ao processar comando:', error);
    return new MCPResponse({
      message: `Ocorreu um erro ao processar seu comando: ${error.message}`
    });
  }
}

/**
 * Inicializa o servidor MCP para processamento de comandos
 * @param {Object} server - Instância do servidor MCP
 */
function initialize(server) {
  // Registrar o handler principal no servidor MCP
  server.handleCommand('*', handleCommand);
  
  console.log('Integração Claude MCP inicializada com sucesso');
}

// Exportar funções e módulos
module.exports = {
  initialize,
  handleCommand,
  bootstrapBuilder,
  hosting,
  pluginCreator
};