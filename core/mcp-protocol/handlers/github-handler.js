/**
 * @file github-handler.js
 * @description Handler para comandos do GitHub no MCP Server
 * @module core/mcp-protocol/handlers/github-handler
 */

const GitHubManager = require('../../../modules/github');

/**
 * @class GitHubHandler
 * @description Processa comandos relacionados ao GitHub
 */
class GitHubHandler {
  /**
   * @constructor
   * @param {Object} options - Opções de configuração
   * @param {Object} options.logger - Logger para registro de eventos
   * @param {Object} options.config - Configuração do GitHub
   */
  constructor(options = {}) {
    this.logger = options.logger;
    this.github = new GitHubManager(options.config || {});
  }

  /**
   * Executa um comando do GitHub
   * @param {Object} message - Mensagem JSON-RPC
   * @param {Object} context - Contexto do cliente
   * @returns {Promise<Object>} Resultado da operação
   */
  async execute(message, context) {
    if (!message.params || !message.params.action) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32602,
          message: 'Invalid params: action is required'
        }
      };
    }

    const { action, ...params } = message.params;
    
    try {
      let result;
      
      switch (action) {
        case 'setToken':
          result = await this.handleSetToken(params);
          break;
          
        case 'getRepository':
          result = await this.handleGetRepository(params);
          break;
          
        case 'listContents':
          result = await this.handleListContents(params);
          break;
          
        case 'getFileContent':
          result = await this.handleGetFileContent(params);
          break;
          
        case 'createOrUpdateFile':
          result = await this.handleCreateOrUpdateFile(params);
          break;
          
        case 'createBranch':
          result = await this.handleCreateBranch(params);
          break;
          
        case 'createPullRequest':
          result = await this.handleCreatePullRequest(params);
          break;
          
        case 'listPullRequests':
          result = await this.handleListPullRequests(params);
          break;
          
        case 'listCommits':
          result = await this.handleListCommits(params);
          break;
          
        case 'createIssue':
          result = await this.handleCreateIssue(params);
          break;
          
        case 'listIssues':
          result = await this.handleListIssues(params);
          break;
          
        default:
          return {
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: -32601,
              message: `Unknown GitHub action: ${action}`
            }
          };
      }
      
      return {
        jsonrpc: '2.0',
        id: message.id,
        result
      };
    } catch (error) {
      this.logger.error(`Error processing GitHub action ${action}:`, error);
      
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: 0,
          message: error.message
        }
      };
    }
  }

  /**
   * Define o token de autenticação GitHub
   * @private
   * @param {Object} params - Parâmetros da requisição
   * @returns {Promise<Object>} Resultado da operação
   */
  async handleSetToken(params) {
    if (!params.token) {
      throw new Error('Token is required');
    }
    
    this.github.setAuthToken(params.token);
    
    return { success: true, message: 'Token set successfully' };
  }

  /**
   * Obtém informações de um repositório
   * @private
   * @param {Object} params - Parâmetros da requisição
   * @returns {Promise<Object>} Dados do repositório
   */
  async handleGetRepository(params) {
    if (!params.owner || !params.repo) {
      throw new Error('Owner and repo are required');
    }
    
    return await this.github.getRepository(params.owner, params.repo);
  }

  /**
   * Lista conteúdo de um diretório no repositório
   * @private
   * @param {Object} params - Parâmetros da requisição
   * @returns {Promise<Array>} Lista de arquivos e diretórios
   */
  async handleListContents(params) {
    if (!params.owner || !params.repo) {
      throw new Error('Owner and repo are required');
    }
    
    const path = params.path || '';
    const branch = params.branch || 'main';
    
    return await this.github.listContents(params.owner, params.repo, path, branch);
  }

  /**
   * Obtém conteúdo de um arquivo no repositório
   * @private
   * @param {Object} params - Parâmetros da requisição
   * @returns {Promise<Object>} Conteúdo e metadados do arquivo
   */
  async handleGetFileContent(params) {
    if (!params.owner || !params.repo || !params.path) {
      throw new Error('Owner, repo, and path are required');
    }
    
    const branch = params.branch || 'main';
    
    return await this.github.getFileContent(params.owner, params.repo, params.path, branch);
  }

  /**
   * Cria ou atualiza um arquivo no repositório
   * @private
   * @param {Object} params - Parâmetros da requisição
   * @returns {Promise<Object>} Resultado da operação
   */
  async handleCreateOrUpdateFile(params) {
    if (!params.owner || !params.repo || !params.path || !params.content || !params.message) {
      throw new Error('Owner, repo, path, content, and message are required');
    }
    
    const branch = params.branch || 'main';
    const sha = params.sha || null;
    
    return await this.github.createOrUpdateFile(
      params.owner,
      params.repo,
      params.path,
      params.content,
      params.message,
      branch,
      sha
    );
  }

  /**
   * Cria uma nova branch no repositório
   * @private
   * @param {Object} params - Parâmetros da requisição
   * @returns {Promise<Object>} Resultado da operação
   */
  async handleCreateBranch(params) {
    if (!params.owner || !params.repo || !params.branchName) {
      throw new Error('Owner, repo, and branchName are required');
    }
    
    const baseBranch = params.baseBranch || 'main';
    
    return await this.github.createBranch(params.owner, params.repo, params.branchName, baseBranch);
  }

  /**
   * Cria um pull request no repositório
   * @private
   * @param {Object} params - Parâmetros da requisição
   * @returns {Promise<Object>} Dados do PR criado
   */
  async handleCreatePullRequest(params) {
    if (!params.owner || !params.repo || !params.title || !params.head || !params.base) {
      throw new Error('Owner, repo, title, head, and base are required');
    }
    
    const body = params.body || '';
    
    return await this.github.createPullRequest(
      params.owner,
      params.repo,
      params.title,
      params.head,
      params.base,
      body
    );
  }

  /**
   * Lista pull requests do repositório
   * @private
   * @param {Object} params - Parâmetros da requisição
   * @returns {Promise<Array>} Lista de pull requests
   */
  async handleListPullRequests(params) {
    if (!params.owner || !params.repo) {
      throw new Error('Owner and repo are required');
    }
    
    const state = params.state || 'open';
    
    return await this.github.listPullRequests(params.owner, params.repo, state);
  }

  /**
   * Lista commits do repositório
   * @private
   * @param {Object} params - Parâmetros da requisição
   * @returns {Promise<Array>} Lista de commits
   */
  async handleListCommits(params) {
    if (!params.owner || !params.repo) {
      throw new Error('Owner and repo are required');
    }
    
    const branch = params.branch || 'main';
    const perPage = params.perPage || 30;
    
    return await this.github.listCommits(params.owner, params.repo, branch, perPage);
  }

  /**
   * Cria uma issue no repositório
   * @private
   * @param {Object} params - Parâmetros da requisição
   * @returns {Promise<Object>} Dados da issue criada
   */
  async handleCreateIssue(params) {
    if (!params.owner || !params.repo || !params.title) {
      throw new Error('Owner, repo, and title are required');
    }
    
    const body = params.body || '';
    const labels = params.labels || [];
    
    return await this.github.createIssue(params.owner, params.repo, params.title, body, labels);
  }

  /**
   * Lista issues do repositório
   * @private
   * @param {Object} params - Parâmetros da requisição
   * @returns {Promise<Array>} Lista de issues
   */
  async handleListIssues(params) {
    if (!params.owner || !params.repo) {
      throw new Error('Owner and repo are required');
    }
    
    const state = params.state || 'open';
    
    return await this.github.listIssues(params.owner, params.repo, state);
  }
}

module.exports = GitHubHandler;
