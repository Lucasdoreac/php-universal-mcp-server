/**
 * @file index.js
 * @description Módulo de integração com GitHub para o PHP Universal MCP Server
 * @module modules/github
 */

const axios = require('axios');
const { logger } = require('../../utils/logger');

/**
 * Classe para gerenciar integração com GitHub
 */
class GitHubManager {
  /**
   * @constructor
   * @param {Object} config - Configuração do módulo GitHub
   */
  constructor(config = {}) {
    this.config = config;
    this.apiBaseUrl = 'https://api.github.com';
    this.axiosInstance = axios.create({
      baseURL: this.apiBaseUrl,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'PHP-Universal-MCP-Server'
      }
    });

    if (config.token) {
      this.setAuthToken(config.token);
    }

    logger.info('GitHub Manager initialized');
  }

  /**
   * Define token de autenticação para requisições
   * @param {string} token - Token de acesso GitHub
   */
  setAuthToken(token) {
    this.axiosInstance.defaults.headers.common['Authorization'] = `token ${token}`;
    logger.info('GitHub authentication token set');
  }

  /**
   * Obtém informações do repositório
   * @param {string} owner - Proprietário do repositório
   * @param {string} repo - Nome do repositório
   * @returns {Promise<Object>} Informações do repositório
   */
  async getRepository(owner, repo) {
    try {
      const response = await this.axiosInstance.get(`/repos/${owner}/${repo}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching repository:', error.message);
      throw new Error(`Failed to fetch repository: ${error.message}`);
    }
  }

  /**
   * Lista arquivos e diretórios em um caminho do repositório
   * @param {string} owner - Proprietário do repositório
   * @param {string} repo - Nome do repositório
   * @param {string} path - Caminho dentro do repositório
   * @param {string} [branch='main'] - Branch para listar
   * @returns {Promise<Array>} Lista de arquivos e diretórios
   */
  async listContents(owner, repo, path = '', branch = 'main') {
    try {
      const response = await this.axiosInstance.get(`/repos/${owner}/${repo}/contents/${path}`, {
        params: { ref: branch }
      });
      return response.data;
    } catch (error) {
      logger.error('Error listing repository contents:', error.message);
      throw new Error(`Failed to list repository contents: ${error.message}`);
    }
  }

  /**
   * Obtém conteúdo de um arquivo específico
   * @param {string} owner - Proprietário do repositório
   * @param {string} repo - Nome do repositório
   * @param {string} path - Caminho do arquivo
   * @param {string} [branch='main'] - Branch onde o arquivo está
   * @returns {Promise<Object>} Conteúdo e metadados do arquivo
   */
  async getFileContent(owner, repo, path, branch = 'main') {
    try {
      const response = await this.axiosInstance.get(`/repos/${owner}/${repo}/contents/${path}`, {
        params: { ref: branch }
      });
      
      if (response.data.type !== 'file') {
        throw new Error('Path does not point to a file');
      }
      
      // Decodifica o conteúdo de base64
      const content = Buffer.from(response.data.content, 'base64').toString('utf8');
      
      return {
        ...response.data,
        decodedContent: content
      };
    } catch (error) {
      logger.error('Error getting file content:', error.message);
      throw new Error(`Failed to get file content: ${error.message}`);
    }
  }

  /**
   * Cria ou atualiza um arquivo no repositório
   * @param {string} owner - Proprietário do repositório
   * @param {string} repo - Nome do repositório
   * @param {string} path - Caminho do arquivo
   * @param {string} content - Conteúdo do arquivo
   * @param {string} message - Mensagem de commit
   * @param {string} [branch='main'] - Branch onde o arquivo será criado/atualizado
   * @param {string} [sha=null] - SHA do arquivo para atualização (obrigatório se o arquivo já existir)
   * @returns {Promise<Object>} Resultado da operação
   */
  async createOrUpdateFile(owner, repo, path, content, message, branch = 'main', sha = null) {
    try {
      // Verifica se o arquivo já existe para obter o SHA
      if (!sha) {
        try {
          const existingFile = await this.getFileContent(owner, repo, path, branch);
          sha = existingFile.sha;
        } catch (err) {
          // Arquivo não existe, isso é ok para criação
          logger.debug('File does not exist, will create new:', path);
        }
      }

      const payload = {
        message,
        content: Buffer.from(content).toString('base64'),
        branch
      };

      if (sha) {
        payload.sha = sha;
      }

      const response = await this.axiosInstance.put(
        `/repos/${owner}/${repo}/contents/${path}`,
        payload
      );

      logger.info(`File ${path} ${sha ? 'updated' : 'created'} successfully`);
      return response.data;
    } catch (error) {
      logger.error('Error creating/updating file:', error.message);
      throw new Error(`Failed to create/update file: ${error.message}`);
    }
  }

  /**
   * Cria uma nova branch no repositório
   * @param {string} owner - Proprietário do repositório
   * @param {string} repo - Nome do repositório
   * @param {string} branchName - Nome da nova branch
   * @param {string} baseBranch - Branch base
   * @returns {Promise<Object>} Resultado da operação
   */
  async createBranch(owner, repo, branchName, baseBranch = 'main') {
    try {
      // Obter SHA da referência base
      const baseRef = await this.axiosInstance.get(
        `/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`
      );
      const baseSha = baseRef.data.object.sha;

      // Criar nova referência
      const response = await this.axiosInstance.post(
        `/repos/${owner}/${repo}/git/refs`,
        {
          ref: `refs/heads/${branchName}`,
          sha: baseSha
        }
      );

      logger.info(`Branch ${branchName} created successfully`);
      return response.data;
    } catch (error) {
      logger.error('Error creating branch:', error.message);
      throw new Error(`Failed to create branch: ${error.message}`);
    }
  }

  /**
   * Cria um pull request no repositório
   * @param {string} owner - Proprietário do repositório
   * @param {string} repo - Nome do repositório
   * @param {string} title - Título do PR
   * @param {string} head - Branch de origem
   * @param {string} base - Branch de destino
   * @param {string} body - Descrição do PR
   * @returns {Promise<Object>} Dados do PR criado
   */
  async createPullRequest(owner, repo, title, head, base, body) {
    try {
      const response = await this.axiosInstance.post(
        `/repos/${owner}/${repo}/pulls`,
        {
          title,
          head,
          base,
          body
        }
      );

      logger.info(`Pull request created: ${response.data.html_url}`);
      return response.data;
    } catch (error) {
      logger.error('Error creating pull request:', error.message);
      throw new Error(`Failed to create pull request: ${error.message}`);
    }
  }

  /**
   * Lista pull requests do repositório
   * @param {string} owner - Proprietário do repositório
   * @param {string} repo - Nome do repositório
   * @param {string} [state='open'] - Estado dos PRs (open, closed, all)
   * @returns {Promise<Array>} Lista de pull requests
   */
  async listPullRequests(owner, repo, state = 'open') {
    try {
      const response = await this.axiosInstance.get(
        `/repos/${owner}/${repo}/pulls`,
        {
          params: { state }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error listing pull requests:', error.message);
      throw new Error(`Failed to list pull requests: ${error.message}`);
    }
  }

  /**
   * Obtém commits de um repositório
   * @param {string} owner - Proprietário do repositório
   * @param {string} repo - Nome do repositório
   * @param {string} [branch='main'] - Branch específica
   * @param {number} [perPage=30] - Número de resultados por página
   * @returns {Promise<Array>} Lista de commits
   */
  async listCommits(owner, repo, branch = 'main', perPage = 30) {
    try {
      const response = await this.axiosInstance.get(
        `/repos/${owner}/${repo}/commits`,
        {
          params: {
            sha: branch,
            per_page: perPage
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error listing commits:', error.message);
      throw new Error(`Failed to list commits: ${error.message}`);
    }
  }

  /**
   * Cria uma issue no repositório
   * @param {string} owner - Proprietário do repositório
   * @param {string} repo - Nome do repositório
   * @param {string} title - Título da issue
   * @param {string} body - Corpo/descrição da issue
   * @param {Array} [labels=[]] - Labels a serem aplicadas
   * @returns {Promise<Object>} Dados da issue criada
   */
  async createIssue(owner, repo, title, body, labels = []) {
    try {
      const response = await this.axiosInstance.post(
        `/repos/${owner}/${repo}/issues`,
        {
          title,
          body,
          labels
        }
      );

      logger.info(`Issue created: ${response.data.html_url}`);
      return response.data;
    } catch (error) {
      logger.error('Error creating issue:', error.message);
      throw new Error(`Failed to create issue: ${error.message}`);
    }
  }

  /**
   * Lista todas as issues do repositório
   * @param {string} owner - Proprietário do repositório
   * @param {string} repo - Nome do repositório
   * @param {string} [state='open'] - Estado das issues (open, closed, all)
   * @returns {Promise<Array>} Lista de issues
   */
  async listIssues(owner, repo, state = 'open') {
    try {
      const response = await this.axiosInstance.get(
        `/repos/${owner}/${repo}/issues`,
        {
          params: { state }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error listing issues:', error.message);
      throw new Error(`Failed to list issues: ${error.message}`);
    }
  }
}

module.exports = GitHubManager;
