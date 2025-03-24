/**
 * Marketplace Repository
 * 
 * Sistema de repositório central para plugins do PHP Universal MCP Server
 * @module modules/marketplace/core/repository
 * @version 1.0.0
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const NodeCache = require('node-cache');

/**
 * Classe de gerenciamento do repositório de plugins
 */
class Repository {
  /**
   * Cria uma nova instância do repositório
   * @param {Object} options - Opções de configuração
   * @param {string} options.baseUrl - URL base do repositório
   * @param {boolean} options.cacheEnabled - Habilita cache
   * @param {number} options.cacheTTL - Tempo de vida do cache em segundos
   * @param {Object} options.logger - Logger para registrar operações
   */
  constructor(options = {}) {
    this.options = {
      baseUrl: 'https://marketplace.php-universal-mcp.com/api',
      cacheEnabled: true,
      cacheTTL: 3600,
      ...options
    };
    
    this.logger = options.logger || console;
    
    // Inicializar cache se habilitado
    if (this.options.cacheEnabled) {
      this.cache = new NodeCache({ 
        stdTTL: this.options.cacheTTL,
        checkperiod: 120
      });
    }
    
    // Diretório local para plugins
    this.localPluginsPath = path.resolve(process.cwd(), 'plugins');
    if (!fs.existsSync(this.localPluginsPath)) {
      fs.mkdirSync(this.localPluginsPath, { recursive: true });
    }
    
    // Lista de categorias de plugins
    this.categories = [
      'marketing',
      'analytics',
      'seo',
      'social-media',
      'email',
      'design',
      'templates',
      'ecommerce',
      'payments',
      'shipping',
      'security',
      'performance',
      'development',
      'integration',
      'utility'
    ];
    
    this.logger.info('Repositório de marketplace inicializado');
  }
  
  /**
   * Obtém um valor do cache
   * @private
   * @param {string} key - Chave do cache
   * @returns {*} Valor do cache ou null se não existir
   */
  _getCached(key) {
    if (!this.options.cacheEnabled || !this.cache) {
      return null;
    }
    
    return this.cache.get(key);
  }
  
  /**
   * Define um valor no cache
   * @private
   * @param {string} key - Chave do cache
   * @param {*} value - Valor a ser armazenado
   * @param {number} [ttl] - Tempo de vida em segundos
   */
  _setCached(key, value, ttl) {
    if (!this.options.cacheEnabled || !this.cache) {
      return;
    }
    
    this.cache.set(key, value, ttl || this.options.cacheTTL);
  }
  
  /**
   * Gera uma chave de cache baseada nos parâmetros
   * @private
   * @param {string} prefix - Prefixo da chave
   * @param {Object} params - Parâmetros para a chave
   * @returns {string} Chave de cache
   */
  _cacheKey(prefix, params = {}) {
    const paramString = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${value}`)
      .sort()
      .join('&');
      
    return `${prefix}:${crypto.createHash('md5').update(paramString).digest('hex')}`;
  }
  
  /**
   * Busca plugins do repositório
   * @param {Object} options - Opções de busca
   * @param {string} [options.query] - Termo de busca
   * @param {string} [options.category] - Categoria do plugin
   * @param {string} [options.tags] - Tags para filtrar
   * @param {string} [options.author] - Autor do plugin
   * @param {boolean} [options.paid] - Filtrar por plugins pagos/gratuitos
   * @param {string} [options.sort] - Campo para ordenação
   * @param {number} [options.limit=20] - Limite de resultados
   * @param {number} [options.page=1] - Página de resultados
   * @returns {Promise<Object>} Resultados da busca
   */
  async getPlugins(options = {}) {
    try {
      const cacheKey = this._cacheKey('plugins', options);
      const cached = this._getCached(cacheKey);
      
      if (cached) {
        this.logger.debug('Retornando plugins do cache');
        return cached;
      }
      
      this.logger.info('Buscando plugins do repositório');
      
      // Em uma implementação real, faríamos uma requisição HTTP para o repositório
      // Aqui simulamos dados de exemplo
      
      const plugins = this._generateExamplePlugins();
      
      // Aplicar filtros de acordo com as opções
      let filtered = [...plugins];
      
      if (options.query) {
        const query = options.query.toLowerCase();
        filtered = filtered.filter(plugin => 
          plugin.name.toLowerCase().includes(query) || 
          plugin.description.toLowerCase().includes(query)
        );
      }
      
      if (options.category) {
        filtered = filtered.filter(plugin => 
          plugin.category === options.category
        );
      }
      
      if (options.tags) {
        const tags = options.tags.split(',').map(tag => tag.trim().toLowerCase());
        filtered = filtered.filter(plugin => 
          plugin.tags.some(tag => tags.includes(tag.toLowerCase()))
        );
      }
      
      if (options.author) {
        filtered = filtered.filter(plugin => 
          plugin.author.toLowerCase().includes(options.author.toLowerCase())
        );
      }
      
      if (options.paid !== undefined) {
        filtered = filtered.filter(plugin => 
          plugin.isPaid === options.paid
        );
      }
      
      // Ordenar resultados
      if (options.sort) {
        const [field, order] = options.sort.split(':');
        const multiplier = order === 'desc' ? -1 : 1;
        
        filtered.sort((a, b) => {
          if (field === 'rating') {
            return (a.rating - b.rating) * multiplier;
          } else if (field === 'downloads') {
            return (a.downloads - b.downloads) * multiplier;
          } else if (field === 'created') {
            return (new Date(a.createdAt) - new Date(b.createdAt)) * multiplier;
          } else if (field === 'updated') {
            return (new Date(a.updatedAt) - new Date(b.updatedAt)) * multiplier;
          }
          return 0;
        });
      }
      
      // Paginar resultados
      const page = options.page || 1;
      const limit = options.limit || 20;
      const offset = (page - 1) * limit;
      const paged = filtered.slice(offset, offset + limit);
      
      const result = {
        plugins: paged,
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit)
      };
      
      // Armazenar no cache
      this._setCached(cacheKey, result);
      
      return result;
    } catch (error) {
      this.logger.error('Erro ao buscar plugins:', error);
      throw error;
    }
  }
  
  /**
   * Obtém detalhes de um plugin específico
   * @param {string} pluginId - ID do plugin
   * @returns {Promise<Object>} Detalhes do plugin
   */
  async getPluginInfo(pluginId) {
    try {
      const cacheKey = `plugin:${pluginId}`;
      const cached = this._getCached(cacheKey);
      
      if (cached) {
        this.logger.debug(`Retornando plugin ${pluginId} do cache`);
        return cached;
      }
      
      this.logger.info(`Obtendo informações do plugin ${pluginId}`);
      
      // Em uma implementação real, faríamos uma requisição HTTP para o repositório
      // Aqui simulamos dados de exemplo
      
      const plugins = this._generateExamplePlugins();
      const plugin = plugins.find(p => p.id === pluginId);
      
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} não encontrado`);
      }
      
      // Adicionar detalhes extras para a visualização individual
      const detailedPlugin = {
        ...plugin,
        longDescription: `${plugin.description}\n\nEste plugin oferece funcionalidades avançadas para ${plugin.category}. Desenvolvido por ${plugin.author}, é compatível com todas as versões recentes do PHP Universal MCP Server.`,
        requirements: {
          minVersion: '1.8.0',
          phpVersion: '>=7.4',
          dependencies: []
        },
        images: [
          `${this.options.baseUrl}/plugins/${pluginId}/screenshot-1.png`,
          `${this.options.baseUrl}/plugins/${pluginId}/screenshot-2.png`
        ],
        documentation: `${this.options.baseUrl}/plugins/${pluginId}/docs`,
        support: {
          email: `support@${plugin.author.toLowerCase().replace(/\s+/g, '-')}.com`,
          website: `https://${plugin.author.toLowerCase().replace(/\s+/g, '-')}.com/support`,
          issues: `https://github.com/${plugin.author.toLowerCase().replace(/\s+/g, '-')}/${pluginId}/issues`
        },
        versions: [
          {
            version: plugin.version,
            releaseDate: plugin.updatedAt,
            compatibility: '1.8.0 - 1.9.0',
            changelog: 'Melhorias de desempenho e correções de bugs'
          },
          {
            version: '1.0.0',
            releaseDate: plugin.createdAt,
            compatibility: '1.8.0',
            changelog: 'Versão inicial'
          }
        ],
        reviews: Array.from({ length: 5 }, (_, i) => ({
          id: `review-${i + 1}`,
          user: `user${i + 1}`,
          rating: Math.min(5, Math.max(1, Math.floor((plugin.rating + (Math.random() * 2 - 1))))),
          comment: `Este plugin é ${Math.random() > 0.2 ? 'muito bom' : 'razoável'} e atende bem às necessidades.`,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }))
      };
      
      // Armazenar no cache
      this._setCached(cacheKey, detailedPlugin);
      
      return detailedPlugin;
    } catch (error) {
      this.logger.error(`Erro ao obter informações do plugin ${pluginId}:`, error);
      throw error;
    }
  }
  
  /**
   * Baixa um plugin do repositório
   * @param {string} pluginId - ID do plugin
   * @param {string} [version] - Versão específica (opcional)
   * @returns {Promise<Object>} Informações do download
   */
  async downloadPlugin(pluginId, version) {
    try {
      this.logger.info(`Baixando plugin ${pluginId}${version ? ` versão ${version}` : ''}`);
      
      // Verificar se o plugin existe
      const plugin = await this.getPluginInfo(pluginId);
      
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} não encontrado`);
      }
      
      // Verificar versão
      if (version) {
        const versionExists = plugin.versions.some(v => v.version === version);
        if (!versionExists) {
          throw new Error(`Versão ${version} não encontrada para o plugin ${pluginId}`);
        }
      }
      
      // Em uma implementação real, baixaríamos o plugin do repositório
      // Aqui simulamos um download bem-sucedido
      
      // Simular tempo de download
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const targetVersion = version || plugin.version;
      const targetPath = path.join(this.localPluginsPath, `${pluginId}-${targetVersion}`);
      
      // Simular criação do diretório e arquivos do plugin
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      
      // Simular escrita do arquivo de metadados
      fs.writeFileSync(
        path.join(targetPath, 'plugin.json'),
        JSON.stringify(plugin, null, 2)
      );
      
      return {
        pluginId,
        version: targetVersion,
        path: targetPath,
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Erro ao baixar plugin ${pluginId}:`, error);
      throw error;
    }
  }
  
  /**
   * Publica um plugin no repositório
   * @param {Object} plugin - Dados do plugin
   * @param {string} sourcePath - Caminho do código-fonte do plugin
   * @returns {Promise<Object>} Resultado da publicação
   */
  async publishPlugin(plugin, sourcePath) {
    try {
      this.logger.info(`Publicando plugin: ${plugin.name}`);
      
      // Validar dados do plugin
      if (!plugin.name) {
        throw new Error('Nome do plugin é obrigatório');
      }
      
      if (!plugin.version) {
        throw new Error('Versão do plugin é obrigatória');
      }
      
      if (!plugin.description) {
        throw new Error('Descrição do plugin é obrigatória');
      }
      
      if (!plugin.author) {
        throw new Error('Autor do plugin é obrigatório');
      }
      
      if (!plugin.category || !this.categories.includes(plugin.category)) {
        throw new Error(`Categoria inválida. Categorias válidas: ${this.categories.join(', ')}`);
      }
      
      // Verificar existência do código-fonte
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Caminho do código-fonte não encontrado: ${sourcePath}`);
      }
      
      // Em uma implementação real, empacotar e enviar o plugin para o repositório
      // Aqui simulamos uma publicação bem-sucedida
      
      // Gerar ID único para o plugin se não existir
      if (!plugin.id) {
        plugin.id = `${plugin.name.toLowerCase().replace(/\s+/g, '-')}-${crypto.randomBytes(4).toString('hex')}`;
      }
      
      // Adicionar timestamps
      plugin.createdAt = new Date().toISOString();
      plugin.updatedAt = plugin.createdAt;
      
      // Adicionar metadados padrão
      if (!plugin.tags || plugin.tags.length === 0) {
        plugin.tags = [plugin.category];
      }
      
      if (plugin.isPaid === undefined) {
        plugin.isPaid = false;
      }
      
      if (!plugin.rating) {
        plugin.rating = 5; // Classificação inicial
      }
      
      if (!plugin.downloads) {
        plugin.downloads = 0;
      }
      
      // Simular tempo de upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        pluginId: plugin.id,
        name: plugin.name,
        version: plugin.version,
        publishedAt: plugin.createdAt,
        status: 'published',
        url: `${this.options.baseUrl}/plugins/${plugin.id}`
      };
    } catch (error) {
      this.logger.error('Erro ao publicar plugin:', error);
      throw error;
    }
  }
  
  /**
   * Gera uma lista de plugins de exemplo para demonstração
   * @private
   * @returns {Array<Object>} Lista de plugins
   */
  _generateExamplePlugins() {
    // Gerar 20 plugins de exemplo
    return Array.from({ length: 20 }, (_, index) => {
      const id = index + 1;
      const categoryIndex = index % this.categories.length;
      const category = this.categories[categoryIndex];
      
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - (30 + Math.floor(Math.random() * 100)));
      
      const updatedDate = new Date();
      updatedDate.setDate(updatedDate.getDate() - Math.floor(Math.random() * 30));
      
      const isPaid = index % 5 === 0; // 20% dos plugins são pagos
      const authors = [
        'PHP Experts',
        'WebDev Studio',
        'Commerce Solutions',
        'Marketing Tools',
        'Cloud Integrators'
      ];
      
      return {
        id: `plugin-${category}-${id}`,
        name: `${category.charAt(0).toUpperCase() + category.slice(1)} Toolkit ${id}`,
        version: `1.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
        description: `Um plugin avançado para ${category} com várias funcionalidades úteis.`,
        author: authors[Math.floor(Math.random() * authors.length)],
        category,
        tags: [category, 'php', 'mcp-server'],
        isPaid,
        price: isPaid ? 9.99 + (Math.floor(Math.random() * 10) * 5) : 0,
        rating: 3 + Math.random() * 2, // 3-5 estrelas
        downloads: Math.floor(Math.random() * 1000),
        createdAt: createdDate.toISOString(),
        updatedAt: updatedDate.toISOString()
      };
    });
  }
  
  /**
   * Obtém estatísticas do marketplace
   * @returns {Promise<Object>} Estatísticas do marketplace
   */
  async getMarketplaceStats() {
    try {
      const cacheKey = 'marketplace:stats';
      const cached = this._getCached(cacheKey);
      
      if (cached) {
        this.logger.debug('Retornando estatísticas do cache');
        return cached;
      }
      
      this.logger.info('Obtendo estatísticas do marketplace');
      
      // Em uma implementação real, faríamos uma requisição HTTP para o repositório
      // Aqui simulamos dados de exemplo
      
      const plugins = this._generateExamplePlugins();
      
      // Calcular estatísticas
      const totalPlugins = plugins.length;
      const freePlugins = plugins.filter(p => !p.isPaid).length;
      const paidPlugins = totalPlugins - freePlugins;
      
      const categoryCounts = {};
      this.categories.forEach(category => {
        categoryCounts[category] = plugins.filter(p => p.category === category).length;
      });
      
      const stats = {
        totalPlugins,
        freePlugins,
        paidPlugins,
        categoryCounts,
        topDownloaded: [...plugins].sort((a, b) => b.downloads - a.downloads).slice(0, 5),
        topRated: [...plugins].sort((a, b) => b.rating - a.rating).slice(0, 5),
        newest: [...plugins].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
        updated: [...plugins].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5)
      };
      
      // Armazenar no cache
      this._setCached(cacheKey, stats);
      
      return stats;
    } catch (error) {
      this.logger.error('Erro ao obter estatísticas do marketplace:', error);
      throw error;
    }
  }
}

module.exports = Repository;