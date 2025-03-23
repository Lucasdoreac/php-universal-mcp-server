/**
 * Gerenciador de Templates para o Site Design System
 * 
 * Responsável por gerenciar os templates disponíveis
 */

const Theme = require('../models/Theme');

class TemplateManager {
  /**
   * Cria uma instância do gerenciador de templates
   * @param {Object} options Opções de configuração
   */
  constructor(options = {}) {
    this.options = options;
    this.cache = options.cache || null;
    
    // Inicializa com templates padrão
    this._initializeDefaultTemplates();
  }

  /**
   * Inicializa templates padrão
   * @private
   */
  _initializeDefaultTemplates() {
    // Templates padrão para e-commerce
    this.templates = [
      {
        id: 'modern-shop',
        name: 'Modern Shop',
        description: 'Template moderno para lojas online com design minimalista',
        category: 'ecommerce',
        thumbnail: 'https://example.com/thumbnails/modern-shop.jpg',
        theme: new Theme({
          name: 'Modern Shop Theme',
          colors: {
            primary: '#3498db',
            secondary: '#2ecc71',
            accent: '#e74c3c',
            background: '#ffffff',
            text: '#333333'
          },
          typography: {
            fontFamily: {
              base: 'Montserrat, sans-serif',
              headings: 'Montserrat, sans-serif',
              monospace: 'Consolas, monospace'
            },
            fontSize: {
              base: '16px',
              h1: '2.5rem',
              h2: '2rem'
            }
          }
        }).toJSON(),
        layout: {
          header: 'modern-header',
          footer: 'modern-footer',
          productList: 'grid-view',
          productDetail: 'full-width',
          cart: 'side-drawer'
        },
        components: ['header-search', 'mega-menu', 'product-quickview', 'newsletter-popup']
      },
      {
        id: 'classic-store',
        name: 'Classic Store',
        description: 'Template clássico para lojas online com layout tradicional',
        category: 'ecommerce',
        thumbnail: 'https://example.com/thumbnails/classic-store.jpg',
        theme: new Theme({
          name: 'Classic Store Theme',
          colors: {
            primary: '#2c3e50',
            secondary: '#34495e',
            accent: '#f39c12',
            background: '#f5f5f5',
            text: '#333333'
          },
          typography: {
            fontFamily: {
              base: 'Open Sans, sans-serif',
              headings: 'Roboto, sans-serif',
              monospace: 'Consolas, monospace'
            },
            fontSize: {
              base: '16px',
              h1: '2.25rem',
              h2: '1.85rem'
            }
          }
        }).toJSON(),
        layout: {
          header: 'classic-header',
          footer: 'classic-footer',
          productList: 'list-view',
          productDetail: 'two-column',
          cart: 'page'
        },
        components: ['category-menu', 'featured-products', 'product-comparison', 'customer-reviews']
      },
      {
        id: 'boutique',
        name: 'Boutique',
        description: 'Template elegante para lojas de moda e boutiques',
        category: 'ecommerce',
        thumbnail: 'https://example.com/thumbnails/boutique.jpg',
        theme: new Theme({
          name: 'Boutique Theme',
          colors: {
            primary: '#9b59b6',
            secondary: '#8e44ad',
            accent: '#f1c40f',
            background: '#ffffff',
            text: '#2c3e50'
          },
          typography: {
            fontFamily: {
              base: 'Raleway, sans-serif',
              headings: 'Playfair Display, serif',
              monospace: 'Consolas, monospace'
            },
            fontSize: {
              base: '16px',
              h1: '2.75rem',
              h2: '2.25rem'
            }
          }
        }).toJSON(),
        layout: {
          header: 'minimal-header',
          footer: 'minimal-footer',
          productList: 'masonry-grid',
          productDetail: 'gallery-focus',
          cart: 'slide-in'
        },
        components: ['instagram-feed', 'lookbook', 'size-guide', 'wishlist']
      },
      {
        id: 'tech-store',
        name: 'Tech Store',
        description: 'Template moderno para lojas de eletrônicos e tecnologia',
        category: 'ecommerce',
        thumbnail: 'https://example.com/thumbnails/tech-store.jpg',
        theme: new Theme({
          name: 'Tech Store Theme',
          colors: {
            primary: '#1abc9c',
            secondary: '#16a085',
            accent: '#e74c3c',
            background: '#ecf0f1',
            text: '#2c3e50'
          },
          typography: {
            fontFamily: {
              base: 'Roboto, sans-serif',
              headings: 'Roboto Condensed, sans-serif',
              monospace: 'Consolas, monospace'
            },
            fontSize: {
              base: '16px',
              h1: '2.5rem',
              h2: '2rem'
            }
          }
        }).toJSON(),
        layout: {
          header: 'mega-header',
          footer: 'detailed-footer',
          productList: 'grid-with-filters',
          productDetail: 'tabbed-content',
          cart: 'multi-step'
        },
        components: ['product-comparison', 'tech-specs', 'stock-notification', 'bundle-offers']
      },
      {
        id: 'minimal-blog',
        name: 'Minimal Blog',
        description: 'Template minimalista para blogs e sites de conteúdo',
        category: 'blog',
        thumbnail: 'https://example.com/thumbnails/minimal-blog.jpg',
        theme: new Theme({
          name: 'Minimal Blog Theme',
          colors: {
            primary: '#333333',
            secondary: '#555555',
            accent: '#f1c40f',
            background: '#ffffff',
            text: '#333333'
          },
          typography: {
            fontFamily: {
              base: 'Merriweather, serif',
              headings: 'Montserrat, sans-serif',
              monospace: 'Consolas, monospace'
            },
            fontSize: {
              base: '18px',
              h1: '2.5rem',
              h2: '2rem'
            }
          }
        }).toJSON(),
        layout: {
          header: 'simple-header',
          footer: 'simple-footer',
          posts: 'single-column',
          post: 'reading-optimized'
        },
        components: ['author-bio', 'related-posts', 'social-sharing', 'newsletter-signup']
      }
    ];
  }

  /**
   * Lista templates disponíveis
   * 
   * @param {Object} options Opções de busca
   * @param {string} options.category Categoria de templates (opcional)
   * @returns {Promise<Array>} Lista de templates
   */
  async listTemplates(options = {}) {
    // Verifica se os templates estão em cache
    const cacheKey = `templates:${options.category || 'all'}`;
    if (this.cache) {
      const cachedTemplates = await this.cache.get(cacheKey);
      if (cachedTemplates) {
        return cachedTemplates;
      }
    }
    
    // Filtra por categoria se especificada
    let templates = [...this.templates];
    if (options.category) {
      templates = templates.filter(template => template.category === options.category);
    }
    
    // Simplifica os dados para a resposta
    const result = templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      thumbnail: template.thumbnail
    }));
    
    // Armazena em cache
    if (this.cache) {
      await this.cache.set(cacheKey, result, 3600); // Cache por 1 hora
    }
    
    return result;
  }

  /**
   * Obtém detalhes de um template específico
   * 
   * @param {string} templateId ID do template
   * @returns {Promise<Object>} Detalhes do template
   */
  async getTemplateById(templateId) {
    // Verifica se o template está em cache
    const cacheKey = `template:${templateId}`;
    if (this.cache) {
      const cachedTemplate = await this.cache.get(cacheKey);
      if (cachedTemplate) {
        return cachedTemplate;
      }
    }
    
    // Busca o template
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template não encontrado: ${templateId}`);
    }
    
    // Armazena em cache
    if (this.cache) {
      await this.cache.set(cacheKey, template, 3600); // Cache por 1 hora
    }
    
    return template;
  }
}

module.exports = TemplateManager;