/**
 * Modelo de Tema para o Site Design System
 * 
 * Representa um tema visual que pode ser aplicado a um site
 */
class Theme {
  /**
   * Cria uma instância de tema
   * 
   * @param {Object} data Dados do tema
   * @param {string} data.id Identificador único do tema
   * @param {string} data.name Nome do tema
   * @param {string} data.description Descrição do tema
   * @param {Object} data.colors Cores do tema
   * @param {Object} data.typography Configurações tipográficas
   * @param {Object} data.spacing Configurações de espaçamento
   * @param {Object} data.components Sobreposições de componentes
   * @param {string} data.parentTheme Tema pai (para herança)
   * @param {Object} data.metadata Metadados adicionais
   */
  constructor(data = {}) {
    this.id = data.id || this._generateId();
    this.name = data.name || '';
    this.description = data.description || '';
    this.colors = data.colors || this._getDefaultColors();
    this.typography = data.typography || this._getDefaultTypography();
    this.spacing = data.spacing || this._getDefaultSpacing();
    this.components = data.components || {};
    this.parentTheme = data.parentTheme || null;
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Gera um ID único para o tema
   * @private
   * @returns {string} ID único
   */
  _generateId() {
    return 'theme_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Retorna cores padrão para o tema
   * @private
   * @returns {Object} Cores padrão
   */
  _getDefaultColors() {
    return {
      primary: '#3498db',
      secondary: '#2ecc71',
      accent: '#e74c3c',
      background: '#ffffff',
      text: '#333333',
      border: '#dddddd',
      success: '#2ecc71',
      warning: '#f39c12',
      error: '#e74c3c',
      info: '#3498db'
    };
  }

  /**
   * Retorna configurações tipográficas padrão
   * @private
   * @returns {Object} Configurações tipográficas
   */
  _getDefaultTypography() {
    return {
      fontFamily: {
        base: 'Roboto, "Helvetica Neue", Arial, sans-serif',
        headings: 'Roboto, "Helvetica Neue", Arial, sans-serif',
        monospace: '"Roboto Mono", Consolas, monospace'
      },
      fontSize: {
        base: '16px',
        h1: '2.5rem',
        h2: '2rem',
        h3: '1.75rem',
        h4: '1.5rem',
        h5: '1.25rem',
        h6: '1rem',
        small: '0.875rem'
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        bold: 700
      },
      lineHeight: {
        tight: 1.2,
        base: 1.5,
        loose: 1.8
      }
    };
  }

  /**
   * Retorna configurações de espaçamento padrão
   * @private
   * @returns {Object} Configurações de espaçamento
   */
  _getDefaultSpacing() {
    return {
      base: '1rem',
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      xxl: '3rem'
    };
  }

  /**
   * Mescla o tema com um tema pai
   * @param {Theme} parentTheme Tema pai
   * @returns {Theme} Tema mesclado
   */
  mergeWithParent(parentTheme) {
    if (!parentTheme) return this;
    
    const merged = new Theme({
      ...this,
      colors: { ...parentTheme.colors, ...this.colors },
      typography: {
        fontFamily: { ...parentTheme.typography.fontFamily, ...this.typography.fontFamily },
        fontSize: { ...parentTheme.typography.fontSize, ...this.typography.fontSize },
        fontWeight: { ...parentTheme.typography.fontWeight, ...this.typography.fontWeight },
        lineHeight: { ...parentTheme.typography.lineHeight, ...this.typography.lineHeight }
      },
      spacing: { ...parentTheme.spacing, ...this.spacing },
      components: { ...parentTheme.components, ...this.components }
    });
    
    // Mantém os metadados originais
    merged.id = this.id;
    merged.name = this.name;
    merged.description = this.description;
    merged.parentTheme = this.parentTheme;
    merged.metadata = this.metadata;
    merged.createdAt = this.createdAt;
    merged.updatedAt = new Date().toISOString();
    
    return merged;
  }

  /**
   * Aplica personalizações ao tema
   * @param {Object} customizations Personalizações a serem aplicadas
   * @returns {Theme} Tema personalizado
   */
  customize(customizations) {
    const customized = new Theme({
      ...this,
      colors: customizations.colors ? { ...this.colors, ...customizations.colors } : this.colors,
      typography: customizations.typography ? {
        fontFamily: customizations.typography.fontFamily ? 
          { ...this.typography.fontFamily, ...customizations.typography.fontFamily } : 
          this.typography.fontFamily,
        fontSize: customizations.typography.fontSize ? 
          { ...this.typography.fontSize, ...customizations.typography.fontSize } : 
          this.typography.fontSize,
        fontWeight: customizations.typography.fontWeight ? 
          { ...this.typography.fontWeight, ...customizations.typography.fontWeight } : 
          this.typography.fontWeight,
        lineHeight: customizations.typography.lineHeight ? 
          { ...this.typography.lineHeight, ...customizations.typography.lineHeight } : 
          this.typography.lineHeight
      } : this.typography,
      spacing: customizations.spacing ? { ...this.spacing, ...customizations.spacing } : this.spacing,
      components: customizations.components ? { ...this.components, ...customizations.components } : this.components
    });
    
    // Mantém os metadados originais
    customized.id = this.id;
    customized.name = this.name;
    customized.description = this.description;
    customized.parentTheme = this.parentTheme;
    customized.metadata = this.metadata;
    customized.createdAt = this.createdAt;
    customized.updatedAt = new Date().toISOString();
    
    return customized;
  }

  /**
   * Exporta o tema como CSS variáveis
   * @returns {string} Variáveis CSS
   */
  toCSSVariables() {
    let css = ':root {\n';
    
    // Adiciona cores
    Object.entries(this.colors).forEach(([key, value]) => {
      css += `  --color-${key}: ${value};\n`;
    });
    
    // Adiciona tipografia
    Object.entries(this.typography.fontFamily).forEach(([key, value]) => {
      css += `  --font-family-${key}: ${value};\n`;
    });
    
    Object.entries(this.typography.fontSize).forEach(([key, value]) => {
      css += `  --font-size-${key}: ${value};\n`;
    });
    
    Object.entries(this.typography.fontWeight).forEach(([key, value]) => {
      css += `  --font-weight-${key}: ${value};\n`;
    });
    
    Object.entries(this.typography.lineHeight).forEach(([key, value]) => {
      css += `  --line-height-${key}: ${value};\n`;
    });
    
    // Adiciona espaçamento
    Object.entries(this.spacing).forEach(([key, value]) => {
      css += `  --spacing-${key}: ${value};\n`;
    });
    
    css += '}\n';
    return css;
  }

  /**
   * Converte o tema para um objeto simples
   * @returns {Object} Representação do tema como objeto simples
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      colors: this.colors,
      typography: this.typography,
      spacing: this.spacing,
      components: this.components,
      parentTheme: this.parentTheme,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Theme;