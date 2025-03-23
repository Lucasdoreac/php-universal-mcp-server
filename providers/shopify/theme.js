/**
 * Shopify Theme Management Module
 * 
 * Implementa gerenciamento de temas na API Shopify.
 */

class ThemeManager {
  /**
   * Construtor do gerenciador de temas
   * @param {Object} api Instância da API Shopify
   */
  constructor(api) {
    this.api = api;
    this.endpoint = 'themes';
    
    // Queries GraphQL
    this.themesQuery = `
      query getThemes {
        themes(first: 50) {
          edges {
            node {
              id
              name
              previewable
              processing
              role
              themePath
              createdAt
              updatedAt
            }
          }
        }
      }
    `;
    
    this.themeQuery = `
      query getTheme($id: ID!) {
        theme(id: $id) {
          id
          name
          previewable
          processing
          role
          themePath
          createdAt
          updatedAt
        }
      }
    `;
    
    this.themeAssetsQuery = `
      query getThemeAssets($id: ID!, $first: Int!) {
        theme(id: $id) {
          assets(first: $first) {
            edges {
              node {
                key
                publicUrl
                contentType
                size
                createdAt
                updatedAt
              }
            }
          }
        }
      }
    `;
  }

  /**
   * Lista temas
   * @param {Object} options Opções de filtragem
   * @param {boolean} useGraphQL Indica se deve usar GraphQL
   * @returns {Promise<Array>} Lista de temas
   */
  async list(options = {}, useGraphQL = false) {
    try {
      if (useGraphQL) {
        const result = await this.api.graphql(this.themesQuery);
        return result.data.themes.edges.map(edge => edge.node);
      }
      
      const response = await this.api.get(`${this.endpoint}.json`, options);
      return response.themes || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém detalhes de um tema
   * @param {number|string} id ID do tema
   * @param {boolean} useGraphQL Indica se deve usar GraphQL
   * @returns {Promise<Object>} Detalhes do tema
   */
  async get(id, useGraphQL = false) {
    try {
      if (useGraphQL) {
        // Formato GraphQL ID
        const formattedId = id.toString().includes('gid://') ? id : `gid://shopify/Theme/${id}`;
        
        const result = await this.api.graphql(this.themeQuery, { id: formattedId });
        return result.data.theme;
      }
      
      const response = await this.api.get(`${this.endpoint}/${id}.json`);
      return response.theme;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém o tema principal da loja
   * @returns {Promise<Object>} Tema principal
   */
  async getMain() {
    try {
      const themes = await this.list();
      const mainTheme = themes.find(theme => theme.role === 'main');
      
      if (!mainTheme) {
        throw new Error('Tema principal não encontrado');
      }
      
      return mainTheme;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria um novo tema
   * @param {Object} themeData Dados do tema
   * @returns {Promise<Object>} Tema criado
   */
  async create(themeData) {
    try {
      const response = await this.api.post(`${this.endpoint}.json`, { theme: themeData });
      return response.theme;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza um tema existente
   * @param {number} id ID do tema
   * @param {Object} themeData Dados do tema
   * @returns {Promise<Object>} Tema atualizado
   */
  async update(id, themeData) {
    try {
      const response = await this.api.put(`${this.endpoint}/${id}.json`, { theme: themeData });
      return response.theme;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove um tema
   * @param {number} id ID do tema
   * @returns {Promise<Object>} Resultado da operação
   */
  async delete(id) {
    try {
      return await this.api.delete(`${this.endpoint}/${id}.json`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Define um tema como principal
   * @param {number} id ID do tema
   * @returns {Promise<Object>} Tema atualizado
   */
  async setAsMain(id) {
    try {
      return await this.update(id, { role: 'main' });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lista assets (arquivos) de um tema
   * @param {number} themeId ID do tema
   * @param {Object} options Opções de filtragem
   * @param {boolean} useGraphQL Indica se deve usar GraphQL
   * @returns {Promise<Array>} Lista de assets
   */
  async listAssets(themeId, options = {}, useGraphQL = false) {
    try {
      if (useGraphQL) {
        const formattedId = themeId.toString().includes('gid://') ? themeId : `gid://shopify/Theme/${themeId}`;
        
        const result = await this.api.graphql(this.themeAssetsQuery, {
          id: formattedId,
          first: options.limit || 100
        });
        
        return result.data.theme.assets.edges.map(edge => edge.node);
      }
      
      const response = await this.api.get(`${this.endpoint}/${themeId}/assets.json`, options);
      return response.assets || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém detalhes de um asset
   * @param {number} themeId ID do tema
   * @param {string} key Chave do asset (caminho do arquivo)
   * @returns {Promise<Object>} Detalhes do asset
   */
  async getAsset(themeId, key) {
    try {
      const response = await this.api.get(`${this.endpoint}/${themeId}/assets.json`, { asset: { key } });
      return response.asset;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria ou atualiza um asset
   * @param {number} themeId ID do tema
   * @param {Object} assetData Dados do asset
   * @returns {Promise<Object>} Asset criado/atualizado
   */
  async createOrUpdateAsset(themeId, assetData) {
    try {
      const response = await this.api.put(`${this.endpoint}/${themeId}/assets.json`, { asset: assetData });
      return response.asset;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove um asset
   * @param {number} themeId ID do tema
   * @param {string} key Chave do asset (caminho do arquivo)
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteAsset(themeId, key) {
    try {
      return await this.api.delete(`${this.endpoint}/${themeId}/assets.json`, { asset: { key } });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria uma versão de rascunho para modificações
   * @param {number} themeId ID do tema
   * @param {string} name Nome para o novo tema (opcional)
   * @returns {Promise<Object>} Tema duplicado
   */
  async createDraft(themeId, name = '') {
    try {
      // Primeiro, obtém detalhes do tema original
      const theme = await this.get(themeId);
      const draftName = name || `${theme.name} (draft)`;
      
      // Cria um novo tema
      const draft = await this.create({
        name: draftName,
        role: 'unpublished',
        src: themeId // Cria a partir do tema existente
      });
      
      return draft;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Publica um tema de desenvolvimento
   * @param {number} devThemeId ID do tema de desenvolvimento
   * @returns {Promise<Object>} Tema publicado
   */
  async publishDevTheme(devThemeId) {
    try {
      // Verifica se o tema existe
      const theme = await this.get(devThemeId);
      
      // Define como principal
      return await this.setAsMain(devThemeId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém URLs de preview de um tema
   * @param {number} themeId ID do tema
   * @returns {Promise<Object>} URLs de preview
   */
  async getPreviewUrls(themeId) {
    try {
      // Construir URLs de preview (requer o URL da loja)
      const theme = await this.get(themeId);
      const shopUrl = this.api.auth.shopUrl;
      
      // URLs básicas para previews comuns
      return {
        home: `${shopUrl}?preview_theme_id=${themeId}`,
        products: `${shopUrl}/collections/all?preview_theme_id=${themeId}`,
        product: `${shopUrl}/products?preview_theme_id=${themeId}`,
        collection: `${shopUrl}/collections?preview_theme_id=${themeId}`,
        cart: `${shopUrl}/cart?preview_theme_id=${themeId}`,
        blog: `${shopUrl}/blogs/news?preview_theme_id=${themeId}`,
        themeId: themeId,
        themeName: theme.name
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém configurações de um tema
   * @param {number} themeId ID do tema
   * @returns {Promise<Object>} Configurações do tema
   */
  async getSettings(themeId) {
    try {
      // Obter o arquivo settings_schema.json do tema
      const asset = await this.getAsset(themeId, 'config/settings_schema.json');
      
      if (!asset || !asset.value) {
        throw new Error('Configurações do tema não encontradas');
      }
      
      // As configurações vêm codificadas em base64 ou como string JSON
      let settings;
      if (asset.attachment) {
        // Decodificar base64
        const buffer = Buffer.from(asset.attachment, 'base64');
        settings = JSON.parse(buffer.toString('utf-8'));
      } else if (asset.value) {
        settings = JSON.parse(asset.value);
      }
      
      return settings;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém configurações atuais de um tema
   * @param {number} themeId ID do tema
   * @returns {Promise<Object>} Configurações atuais
   */
  async getCurrentSettings(themeId) {
    try {
      // Obter o arquivo settings_data.json do tema
      const asset = await this.getAsset(themeId, 'config/settings_data.json');
      
      if (!asset || !asset.value) {
        throw new Error('Configurações do tema não encontradas');
      }
      
      // As configurações vêm codificadas em base64 ou como string JSON
      let settings;
      if (asset.attachment) {
        // Decodificar base64
        const buffer = Buffer.from(asset.attachment, 'base64');
        settings = JSON.parse(buffer.toString('utf-8'));
      } else if (asset.value) {
        settings = JSON.parse(asset.value);
      }
      
      return settings;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza configurações de um tema
   * @param {number} themeId ID do tema
   * @param {Object} settingsData Dados de configuração
   * @returns {Promise<Object>} Resultado da operação
   */
  async updateSettings(themeId, settingsData) {
    try {
      // Primeiro, obtém as configurações atuais
      const currentSettings = await this.getCurrentSettings(themeId);
      
      // Mescla com as novas configurações
      const updatedSettings = {
        ...currentSettings,
        current: {
          ...currentSettings.current,
          ...settingsData
        }
      };
      
      // Atualiza o arquivo settings_data.json
      return await this.createOrUpdateAsset(themeId, {
        key: 'config/settings_data.json',
        value: JSON.stringify(updatedSettings)
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ThemeManager;