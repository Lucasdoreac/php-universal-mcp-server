/**
 * BootstrapAdapter - Serviço para adaptação de temas para Bootstrap
 * 
 * Este serviço é responsável por converter temas do Site Design System para
 * variáveis e configurações compatíveis com Bootstrap.
 */

class BootstrapAdapter {
  /**
   * Cria uma nova instância do adaptador Bootstrap
   * 
   * @param {Object} options Opções de configuração
   * @param {Object} options.cache Sistema de cache (opcional)
   */
  constructor(options = {}) {
    this.options = Object.assign({
      cache: null,
      bootstrapVersion: '5.3.0'
    }, options);
  }

  /**
   * Converte um tema do Site Design System para variáveis SASS do Bootstrap
   * 
   * @param {Object} theme Tema para converter
   * @returns {String} Variáveis SASS do Bootstrap
   */
  generateSassVariables(theme) {
    const cacheKey = `bootstrap:sass:${JSON.stringify(theme)}`;
    
    // Verificar cache
    if (this.options.cache && this.options.cache.has(cacheKey)) {
      return this.options.cache.get(cacheKey);
    }
    
    // Mapear cores do tema para variáveis do Bootstrap
    let sass = '// Bootstrap variables generated from theme\n';
    
    // Cores principais
    if (theme.colors) {
      sass += '$primary: ' + (theme.colors.primary || '#0d6efd') + ';\n';
      sass += '$secondary: ' + (theme.colors.secondary || '#6c757d') + ';\n';
      sass += '$success: ' + (theme.colors.success || theme.colors.secondary || '#198754') + ';\n';
      sass += '$info: ' + (theme.colors.info || '#0dcaf0') + ';\n';
      sass += '$warning: ' + (theme.colors.warning || '#ffc107') + ';\n';
      sass += '$danger: ' + (theme.colors.accent || theme.colors.error || '#dc3545') + ';\n';
      sass += '$light: ' + (theme.colors.light || '#f8f9fa') + ';\n';
      sass += '$dark: ' + (theme.colors.dark || '#212529') + ';\n';
      
      // Cores de background e texto
      sass += '$body-bg: ' + (theme.colors.background || '#ffffff') + ';\n';
      sass += '$body-color: ' + (theme.colors.text || '#212529') + ';\n';
    }
    
    // Tipografia
    if (theme.typography) {
      sass += '// Typography\n';
      sass += '$font-family-sans-serif: ' + (theme.typography.bodyFont || 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial') + ';\n';
      sass += '$font-family-base: ' + (theme.typography.bodyFont || '$font-family-sans-serif') + ';\n';
      sass += '$headings-font-family: ' + (theme.typography.headingFont || null) + ';\n';
      
      // Tamanhos de fonte
      if (theme.typography.baseFontSize) {
        const baseFontSize = theme.typography.baseFontSize.replace('px', '');
        sass += '$font-size-base: ' + (baseFontSize / 16) + 'rem;\n';
      }
      
      if (theme.typography.h1 && theme.typography.h1.fontSize) {
        const h1Size = theme.typography.h1.fontSize.replace('rem', '').replace('px', '');
        sass += '$h1-font-size: ' + h1Size + (h1Size.includes('.') ? 'rem' : 'px') + ';\n';
      }
      
      if (theme.typography.h2 && theme.typography.h2.fontSize) {
        const h2Size = theme.typography.h2.fontSize.replace('rem', '').replace('px', '');
        sass += '$h2-font-size: ' + h2Size + (h2Size.includes('.') ? 'rem' : 'px') + ';\n';
      }
    }
    
    // Espaçamento
    if (theme.spacing) {
      sass += '// Spacing\n';
      if (theme.spacing.base) {
        const baseSpacing = theme.spacing.base.replace('px', '');
        sass += '$spacer: ' + (baseSpacing / 16) + 'rem;\n';
      }
    }
    
    // Bordas
    if (theme.borders) {
      sass += '// Borders\n';
      if (theme.borders.radius) {
        sass += '$border-radius: ' + theme.borders.radius + ';\n';
      }
      if (theme.borders.buttonRadius) {
        sass += '$btn-border-radius: ' + theme.borders.buttonRadius + ';\n';
      }
    }
    
    // Botões e componentes
    if (theme.components) {
      sass += '// Components\n';
      if (theme.components.buttons) {
        if (theme.components.buttons.padding) {
          sass += '$btn-padding-y: ' + theme.components.buttons.padding.vertical + ';\n';
          sass += '$btn-padding-x: ' + theme.components.buttons.padding.horizontal + ';\n';
        }
      }
      
      if (theme.components.card) {
        if (theme.components.card.background) {
          sass += '$card-bg: ' + theme.components.card.background + ';\n';
        }
        if (theme.components.card.borderRadius) {
          sass += '$card-border-radius: ' + theme.components.card.borderRadius + ';\n';
        }
      }
    }
    
    // Armazenar em cache
    if (this.options.cache) {
      this.options.cache.set(cacheKey, sass, 3600);
    }
    
    return sass;
  }

  /**
   * Gera variáveis CSS Bootstrap customizadas a partir de um tema
   * 
   * @param {Object} theme Tema para converter
   * @returns {String} Variáveis CSS para customização do Bootstrap
   */
  generateCssVariables(theme) {
    const cacheKey = `bootstrap:css:${JSON.stringify(theme)}`;
    
    // Verificar cache
    if (this.options.cache && this.options.cache.has(cacheKey)) {
      return this.options.cache.get(cacheKey);
    }
    
    let css = ':root {\n';
    
    // Cores principais
    if (theme.colors) {
      css += '  --bs-primary: ' + (theme.colors.primary || '#0d6efd') + ';\n';
      css += '  --bs-secondary: ' + (theme.colors.secondary || '#6c757d') + ';\n';
      css += '  --bs-success: ' + (theme.colors.success || theme.colors.secondary || '#198754') + ';\n';
      css += '  --bs-info: ' + (theme.colors.info || '#0dcaf0') + ';\n';
      css += '  --bs-warning: ' + (theme.colors.warning || '#ffc107') + ';\n';
      css += '  --bs-danger: ' + (theme.colors.accent || theme.colors.error || '#dc3545') + ';\n';
      css += '  --bs-light: ' + (theme.colors.light || '#f8f9fa') + ';\n';
      css += '  --bs-dark: ' + (theme.colors.dark || '#212529') + ';\n';
      
      // Cores de background e texto
      css += '  --bs-body-bg: ' + (theme.colors.background || '#ffffff') + ';\n';
      css += '  --bs-body-color: ' + (theme.colors.text || '#212529') + ';\n';
    }
    
    // Tipografia
    if (theme.typography) {
      css += '  --bs-body-font-family: ' + (theme.typography.bodyFont || 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial') + ';\n';
      if (theme.typography.headingFont) {
        css += '  --bs-heading-font-family: ' + theme.typography.headingFont + ';\n';
      }
      
      if (theme.typography.baseFontSize) {
        css += '  --bs-body-font-size: ' + theme.typography.baseFontSize + ';\n';
      }
    }
    
    // Bordas
    if (theme.borders) {
      if (theme.borders.radius) {
        css += '  --bs-border-radius: ' + theme.borders.radius + ';\n';
      }
    }
    
    css += '}\n';
    
    // Aplicar estilos personalizados para componentes específicos
    
    // Headings
    if (theme.typography && theme.typography.headingFont) {
      css += 'h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6 {\n';
      css += '  font-family: var(--bs-heading-font-family) !important;\n';
      css += '}\n';
    }
    
    // Buttons
    if (theme.components && theme.components.buttons) {
      const btnProps = theme.components.buttons;
      
      if (btnProps.padding || btnProps.borderRadius) {
        css += '.btn {\n';
        if (btnProps.padding) {
          css += '  padding: ' + btnProps.padding + ' !important;\n';
        }
        if (btnProps.borderRadius) {
          css += '  border-radius: ' + btnProps.borderRadius + ' !important;\n';
        }
        css += '}\n';
      }
    }
    
    // Armazenar em cache
    if (this.options.cache) {
      this.options.cache.set(cacheKey, css, 3600);
    }
    
    return css;
  }

  /**
   * Gera um link para o CSS do Bootstrap compatível com o tema
   * 
   * @param {String} variant Variante do Bootstrap (ex: 'bootstrap', 'bootstrap-dark')
   * @returns {String} Link para o CSS do Bootstrap
   */
  getBootstrapCdnLink(variant = 'bootstrap') {
    const version = this.options.bootstrapVersion;
    
    switch (variant) {
      case 'bootstrap-dark':
        return `https://cdn.jsdelivr.net/npm/bootstrap-dark-5@${version}/dist/css/bootstrap-dark.min.css`;
      case 'bootstrap-icons':
        return `https://cdn.jsdelivr.net/npm/bootstrap-icons@${version}/font/bootstrap-icons.css`;
      default:
        return `https://cdn.jsdelivr.net/npm/bootstrap@${version}/dist/css/bootstrap.min.css`;
    }
  }

  /**
   * Gera os scripts necessários para o Bootstrap
   * 
   * @returns {Object} Objeto com os scripts do Bootstrap
   */
  getBootstrapScripts() {
    const version = this.options.bootstrapVersion;
    
    return {
      bootstrap: `https://cdn.jsdelivr.net/npm/bootstrap@${version}/dist/js/bootstrap.bundle.min.js`,
      popper: `https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js`
    };
  }

  /**
   * Converte um componente para um componente Bootstrap equivalente
   * 
   * @param {String} componentType Tipo do componente (ex: 'header', 'product-card')
   * @param {String} componentId ID do componente (ex: 'modern-header')
   * @returns {String} ID do componente Bootstrap equivalente
   */
  mapComponentToBootstrap(componentType, componentId) {
    // Mapeamento de componentes para equivalentes Bootstrap
    const componentMap = {
      header: {
        'modern-header': 'bs-navbar',
        'minimal-header': 'bs-navbar-simple',
        'ecommerce-header': 'bs-navbar-ecommerce'
      },
      footer: {
        'standard-footer': 'bs-footer',
        'ecommerce-footer': 'bs-footer-ecommerce'
      },
      product: {
        'product-card': 'bs-product-card',
        'product-grid': 'bs-product-grid'
      },
      cart: {
        'cart-dropdown': 'bs-cart-dropdown',
        'cart-summary': 'bs-cart-summary'
      }
    };
    
    return componentMap[componentType] && componentMap[componentType][componentId] ?
      componentMap[componentType][componentId] : `bs-${componentType}-default`;
  }
};

module.exports = BootstrapAdapter;