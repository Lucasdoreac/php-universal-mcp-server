/**
 * Integração do Renderizador Progressivo com o sistema de Artifacts do Claude MCP
 * 
 * Este módulo conecta o renderizador progressivo diretamente com o sistema de 
 * artifacts do Claude, permitindo a visualização otimizada de templates complexos
 * diretamente na interface do Claude Desktop.
 * 
 * @author PHP Universal MCP Server Team
 * @version 0.1.0
 * @license MIT
 */

const ProgressiveRenderer = require('../../modules/design/renderers/progressive-renderer');
const ArtifactVisualizer = require('./artifact-visualizer');
const logger = require('../../utils/logger');
const handlebars = require('handlebars');

class ArtifactProgressiveRenderer {
  constructor(options = {}) {
    this.options = {
      priorityLevels: 5,
      skeletonLoading: true,
      feedbackEnabled: true,
      artifactMaxSize: 500000, // Tamanho máximo para artifacts em bytes
      splitThreshold: 100, // Número de componentes a partir do qual dividir em múltiplos artifacts
      artifactTypes: {
        html: 'text/html',
        markdown: 'text/markdown',
        code: 'application/vnd.ant.code'
      },
      ...options
    };

    // Inicializar o renderizador progressivo
    this.progressiveRenderer = new ProgressiveRenderer({
      priorityLevels: this.options.priorityLevels,
      skeletonLoading: this.options.skeletonLoading,
      feedbackEnabled: this.options.feedbackEnabled
    });

    // Inicializar o visualizador de artifacts
    this.artifactVisualizer = new ArtifactVisualizer();

    // Registrar helpers Handlebars adicionais para integração
    this._registerHelpers();

    logger.info('ArtifactProgressiveRenderer: Inicializado com sucesso');
  }

  /**
   * Registra helpers Handlebars específicos para integração com artifacts
   * @private
   */
  _registerHelpers() {
    // Helper para definir limites de artifact (pontos de divisão para artifacts grandes)
    handlebars.registerHelper('artifactBoundary', function(id, options) {
      const content = options.fn(this);
      return `<div class="artifact-boundary" data-artifact-id="${id}">${content}</div>`;
    });

    // Helper para menus de navegação entre artifacts divididos
    handlebars.registerHelper('artifactNavigation', function(totalArtifacts, currentIndex) {
      let navHtml = '<div class="artifact-navigation">';
      navHtml += '<ul class="artifact-navigation-list">';
      
      for (let i = 0; i < totalArtifacts; i++) {
        const isActive = i === currentIndex ? ' active' : '';
        navHtml += `<li class="artifact-navigation-item${isActive}">`;
        navHtml += `<a href="#" data-artifact-index="${i}" class="artifact-navigation-link">Parte ${i + 1}</a>`;
        navHtml += '</li>';
      }
      
      navHtml += '</ul>';
      navHtml += '</div>';
      
      return new handlebars.SafeString(navHtml);
    });
  }

  /**
   * Renderiza um template progressivamente e gera artifacts para o Claude
   * 
   * @param {string} templateContent - Conteúdo do template a ser renderizado
   * @param {object} data - Dados para renderização do template
   * @param {object} artifactOptions - Opções específicas para artifacts
   * @returns {Promise<Array>} Array de artifacts gerados
   */
  async renderToArtifacts(templateContent, data = {}, artifactOptions = {}) {
    try {
      logger.info('ArtifactProgressiveRenderer: Iniciando renderização para artifacts');
      const startTime = Date.now();
      
      // Mesclar opções
      const options = { ...this.options, ...artifactOptions };
      
      // Analisar o template para determinar a complexidade
      const templateAnalysis = await this._analyzeTemplateComplexity(templateContent);
      logger.debug(`ArtifactProgressiveRenderer: Análise de complexidade - ${JSON.stringify(templateAnalysis)}`);
      
      // Determinar se precisamos dividir em múltiplos artifacts
      const shouldSplit = templateAnalysis.componentCount > options.splitThreshold ||
                          templateContent.length > options.artifactMaxSize * 0.8;
      
      let artifacts = [];
      
      if (shouldSplit) {
        // Dividir em múltiplos artifacts
        artifacts = await this._renderSplitArtifacts(templateContent, data, templateAnalysis, options);
        logger.info(`ArtifactProgressiveRenderer: Template dividido em ${artifacts.length} artifacts`);
      } else {
        // Renderizar como um único artifact
        const renderedHtml = await this.progressiveRenderer.render(templateContent, data, options);
        const artifact = this._createArtifact(renderedHtml, options, 0, 1);
        artifacts.push(artifact);
        logger.info('ArtifactProgressiveRenderer: Template renderizado como um único artifact');
      }
      
      const endTime = Date.now();
      logger.info(`ArtifactProgressiveRenderer: Renderização concluída em ${endTime - startTime}ms`);
      
      return artifacts;
    } catch (error) {
      logger.error(`ArtifactProgressiveRenderer: Erro ao renderizar para artifacts - ${error.message}`);
      
      // Fallback: usar o visualizador de artifacts padrão
      logger.info('ArtifactProgressiveRenderer: Usando fallback para visualizador de artifacts padrão');
      const standardArtifact = await this.artifactVisualizer.createHTMLArtifact(templateContent, data);
      return [standardArtifact];
    }
  }

  /**
   * Analisa a complexidade de um template
   * @private
   * @param {string} templateContent - Conteúdo do template
   * @returns {Promise<object>} Análise de complexidade
   */
  async _analyzeTemplateComplexity(templateContent) {
    // Contadores para análise de complexidade
    const componentCount = (templateContent.match(/<div/g) || []).length;
    const imageCount = (templateContent.match(/<img/g) || []).length;
    const tableCount = (templateContent.match(/<table/g) || []).length;
    const formCount = (templateContent.match(/<form/g) || []).length;
    const scriptCount = (templateContent.match(/<script/g) || []).length;
    
    // Identificar seções principais
    const hasHeader = /<header|<nav/i.test(templateContent);
    const hasFooter = /<footer/i.test(templateContent);
    const hasMainContent = /<main|<section|<article/i.test(templateContent);
    
    // Calcular pontuação de complexidade
    let complexityScore = 0;
    complexityScore += componentCount * 0.1;
    complexityScore += imageCount * 0.2;
    complexityScore += tableCount * 0.5;
    complexityScore += formCount * 0.3;
    complexityScore += scriptCount * 0.3;
    
    // Identificar pontos lógicos para divisão (seções principais)
    const divisionPoints = [];
    
    if (hasHeader) divisionPoints.push('header');
    if (hasMainContent) divisionPoints.push('main');
    if (hasFooter) divisionPoints.push('footer');
    
    return {
      componentCount,
      imageCount,
      tableCount,
      formCount,
      scriptCount,
      hasHeader,
      hasFooter,
      hasMainContent,
      complexityScore: Math.round(complexityScore),
      divisionPoints,
      size: templateContent.length
    };
  }

  /**
   * Renderiza um template dividido em múltiplos artifacts
   * @private
   * @param {string} templateContent - Conteúdo do template
   * @param {object} data - Dados para renderização
   * @param {object} analysis - Análise de complexidade
   * @param {object} options - Opções de renderização
   * @returns {Promise<Array>} Array de artifacts
   */
  async _renderSplitArtifacts(templateContent, data, analysis, options) {
    // Determinar número de artifacts necessários
    const estimatedArtifactCount = Math.ceil(analysis.size / (options.artifactMaxSize * 0.8));
    const artifactCount = Math.max(estimatedArtifactCount, 1);
    
    // Se houver pontos de divisão lógicos, usá-los
    if (analysis.divisionPoints.length > 0 && analysis.divisionPoints.length <= artifactCount) {
      return this._renderWithLogicalDivision(templateContent, data, analysis, options);
    }
    
    // Caso contrário, dividir por tamanho/complexidade
    return this._renderWithAutomaticDivision(templateContent, data, artifactCount, options);
  }

  /**
   * Renderiza com divisão lógica (por seções do site)
   * @private
   * @param {string} templateContent - Conteúdo do template
   * @param {object} data - Dados para renderização
   * @param {object} analysis - Análise de complexidade
   * @param {object} options - Opções de renderização
   * @returns {Promise<Array>} Array de artifacts
   */
  async _renderWithLogicalDivision(templateContent, data, analysis, options) {
    const artifacts = [];
    const divisionPoints = analysis.divisionPoints;
    const totalParts = divisionPoints.length;
    
    // Extrair seções com base nos pontos de divisão
    const sections = {};
    
    // Header (se presente)
    if (divisionPoints.includes('header')) {
      const headerMatch = templateContent.match(/<header[^>]*>[\s\S]*?<\/header>/i) || 
                          templateContent.match(/<nav[^>]*>[\s\S]*?<\/nav>/i);
      if (headerMatch) {
        sections.header = headerMatch[0];
      }
    }
    
    // Main content (se presente)
    if (divisionPoints.includes('main')) {
      const mainMatch = templateContent.match(/<main[^>]*>[\s\S]*?<\/main>/i) || 
                        templateContent.match(/<section[^>]*>[\s\S]*?<\/section>/i) ||
                        templateContent.match(/<article[^>]*>[\s\S]*?<\/article>/i);
      if (mainMatch) {
        sections.main = mainMatch[0];
      }
    }
    
    // Footer (se presente)
    if (divisionPoints.includes('footer')) {
      const footerMatch = templateContent.match(/<footer[^>]*>[\s\S]*?<\/footer>/i);
      if (footerMatch) {
        sections.footer = footerMatch[0];
      }
    }
    
    // Criar artifacts para cada seção
    let partIndex = 0;
    
    for (const [key, content] of Object.entries(sections)) {
      // Envolver em uma estrutura HTML básica
      const partHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Parte ${partIndex + 1} - ${key.charAt(0).toUpperCase() + key.slice(1)}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    ${this._extractStyles(templateContent)}
  </style>
</head>
<body>
  ${this._generateNavigationHtml(partIndex, totalParts)}
  <div class="container mt-4 mb-4">
    <div class="alert alert-info">
      Visualizando parte ${partIndex + 1} de ${totalParts}: <strong>${key.charAt(0).toUpperCase() + key.slice(1)}</strong>
    </div>
  </div>
  ${content}
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;

      // Renderizar progressivamente
      const renderedHtml = await this.progressiveRenderer.render(partHtml, data, options);
      
      // Criar artifact
      const artifact = this._createArtifact(renderedHtml, options, partIndex, totalParts);
      artifacts.push(artifact);
      
      partIndex++;
    }
    
    return artifacts;
  }

  /**
   * Renderiza com divisão automática (por tamanho/complexidade)
   * @private
   * @param {string} templateContent - Conteúdo do template
   * @param {object} data - Dados para renderização
   * @param {number} artifactCount - Número de artifacts a criar
   * @param {object} options - Opções de renderização
   * @returns {Promise<Array>} Array de artifacts
   */
  async _renderWithAutomaticDivision(templateContent, data, artifactCount, options) {
    const artifacts = [];
    
    // Extrair estrutura básica HTML (head, scripts, etc.)
    const headMatch = templateContent.match(/<head[^>]*>[\s\S]*?<\/head>/i);
    const headContent = headMatch ? headMatch[0] : '<head><meta charset="UTF-8"></head>';
    
    const stylesContent = this._extractStyles(templateContent);
    
    // Identificar componentes principais para divisão
    const componentsRegex = /<div[^>]*class="[^"]*(?:container|section|row|col|card|component)[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
    const components = [];
    let match;
    
    while ((match = componentsRegex.exec(templateContent)) !== null) {
      components.push(match[0]);
    }
    
    // Se não encontrarmos componentes suficientes, dividir o template em pedaços
    if (components.length < artifactCount) {
      // Divisão simples por tamanho
      const chunkSize = Math.ceil(templateContent.length / artifactCount);
      const bodyContent = templateContent.replace(/<head[^>]*>[\s\S]*?<\/head>/i, '');
      
      for (let i = 0; i < artifactCount; i++) {
        const startPos = i * chunkSize;
        const endPos = Math.min(startPos + chunkSize, bodyContent.length);
        const chunk = bodyContent.substring(startPos, endPos);
        
        // Envolver em uma estrutura HTML básica
        const partHtml = `
<!DOCTYPE html>
<html lang="en">
${headContent}
<style>
  ${stylesContent}
</style>
<body>
  ${this._generateNavigationHtml(i, artifactCount)}
  <div class="container mt-4 mb-4">
    <div class="alert alert-info">
      Visualizando parte ${i + 1} de ${artifactCount} (divisão automática por tamanho)
    </div>
  </div>
  ${chunk}
</body>
</html>`;

        // Renderizar progressivamente
        const renderedHtml = await this.progressiveRenderer.render(partHtml, data, options);
        
        // Criar artifact
        const artifact = this._createArtifact(renderedHtml, options, i, artifactCount);
        artifacts.push(artifact);
      }
    } else {
      // Divisão por componentes
      const componentsPerArtifact = Math.ceil(components.length / artifactCount);
      
      for (let i = 0; i < artifactCount; i++) {
        const startIdx = i * componentsPerArtifact;
        const endIdx = Math.min(startIdx + componentsPerArtifact, components.length);
        const artifactComponents = components.slice(startIdx, endIdx);
        
        // Envolver em uma estrutura HTML básica
        const partHtml = `
<!DOCTYPE html>
<html lang="en">
${headContent}
<style>
  ${stylesContent}
</style>
<body>
  ${this._generateNavigationHtml(i, artifactCount)}
  <div class="container mt-4 mb-4">
    <div class="alert alert-info">
      Visualizando parte ${i + 1} de ${artifactCount}: Componentes ${startIdx + 1}-${endIdx}
    </div>
  </div>
  ${artifactComponents.join('\n')}
</body>
</html>`;

        // Renderizar progressivamente
        const renderedHtml = await this.progressiveRenderer.render(partHtml, data, options);
        
        // Criar artifact
        const artifact = this._createArtifact(renderedHtml, options, i, artifactCount);
        artifacts.push(artifact);
      }
    }
    
    return artifacts;
  }

  /**
   * Extrai estilos CSS de um template HTML
   * @private
   * @param {string} templateContent - Conteúdo do template HTML
   * @returns {string} Estilos CSS
   */
  _extractStyles(templateContent) {
    const styleMatches = templateContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    let styles = '';
    
    if (styleMatches) {
      styleMatches.forEach(styleTag => {
        const styleContent = styleTag.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        if (styleContent && styleContent[1]) {
          styles += styleContent[1] + '\n';
        }
      });
    }
    
    // Adicionar estilos para navegação entre artifacts
    styles += `
      .artifact-navigation {
        background: #f8f9fa;
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 20px;
      }
      .artifact-navigation-list {
        display: flex;
        list-style: none;
        padding: 0;
        margin: 0;
        flex-wrap: wrap;
      }
      .artifact-navigation-item {
        margin-right: 10px;
      }
      .artifact-navigation-item.active a {
        font-weight: bold;
        color: #0d6efd;
      }
    `;
    
    return styles;
  }

  /**
   * Gera HTML para navegação entre artifacts
   * @private
   * @param {number} currentIndex - Índice do artifact atual
   * @param {number} totalArtifacts - Número total de artifacts
   * @returns {string} HTML da navegação
   */
  _generateNavigationHtml(currentIndex, totalArtifacts) {
    if (totalArtifacts <= 1) return '';
    
    let html = '<div class="artifact-navigation container mt-3">';
    html += '<div class="row align-items-center">';
    html += '<div class="col-auto"><strong>Navegação:</strong></div>';
    html += '<div class="col">';
    html += '<nav aria-label="Navegação entre partes do template">';
    html += '<ul class="pagination mb-0">';
    
    for (let i = 0; i < totalArtifacts; i++) {
      const isActive = i === currentIndex ? ' active' : '';
      html += `<li class="page-item${isActive}">`;
      html += `<a class="page-link" href="#">Parte ${i + 1}</a>`;
      html += '</li>';
    }
    
    html += '</ul>';
    html += '</nav>';
    html += '</div></div></div>';
    
    return html;
  }

  /**
   * Cria um artifact a partir do HTML renderizado
   * @private
   * @param {string} renderedHtml - HTML renderizado
   * @param {object} options - Opções do artifact
   * @param {number} partIndex - Índice da parte (para artifacts divididos)
   * @param {number} totalParts - Total de partes
   * @returns {object} Objeto do artifact
   */
  _createArtifact(renderedHtml, options, partIndex, totalParts) {
    const title = totalParts > 1 
      ? `Visualização Progressiva (Parte ${partIndex + 1} de ${totalParts})`
      : 'Visualização Progressiva';
    
    return {
      type: options.artifactTypes.html,
      title: title,
      content: renderedHtml
    };
  }
}

module.exports = ArtifactProgressiveRenderer;