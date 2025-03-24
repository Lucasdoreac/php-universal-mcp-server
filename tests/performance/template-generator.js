/**
 * Gerador de Templates Extremamente Grandes para Testes de Carga
 * 
 * Este script gera templates HTML extremamente grandes para testar
 * os limites do renderizador progressivo e otimizar para casos extremos.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');

// Configurar um sistema de logging simples
const logger = {
  info: (...args) => console.log('\x1b[36m[INFO]\x1b[0m', ...args),
  debug: (...args) => console.log('\x1b[35m[DEBUG]\x1b[0m', ...args),
  error: (...args) => console.error('\x1b[31m[ERROR]\x1b[0m', ...args),
  success: (...args) => console.log('\x1b[32m[SUCCESS]\x1b[0m', ...args),
  warn: (...args) => console.warn('\x1b[33m[WARN]\x1b[0m', ...args)
};

/**
 * Gerador de templates extremamente grandes
 */
class TemplateGenerator {
  constructor(options = {}) {
    this.options = {
      outputDir: path.join(__dirname, 'generated-templates'),
      baseTemplate: path.join(__dirname, '../../examples/templates/bootstrap-ecommerce.template.html'),
      componentMultiplier: 10, // Multiplicador para o número de componentes
      enableNestedComponents: true, // Gerar componentes altamente aninhados
      enableLargeDatasets: true, // Incluir tabelas grandes com muitos dados
      enableStressPatterns: true, // Padrões que podem ser desafiadores para o parser
      ...options
    };
  }

  /**
   * Inicializa o gerador
   */
  async initialize() {
    // Criar diretório de saída se não existir
    await fs.mkdir(this.options.outputDir, { recursive: true });
    
    // Carregar o template base
    this.baseTemplate = await fs.readFile(this.options.baseTemplate, 'utf8');
    
    logger.success('TemplateGenerator inicializado');
  }

  /**
   * Gera um template extremamente grande
   * @param {string} name - Nome do template
   * @param {number} componentCount - Número aproximado de componentes
   * @returns {Promise<string>} Caminho para o template gerado
   */
  async generateLargeTemplate(name, componentCount = 500) {
    logger.info(`Gerando template extremamente grande: ${name} (${componentCount} componentes)`);
    
    // Extrair partes do template base
    const headMatch = this.baseTemplate.match(/<head[^>]*>[\s\S]*?<\/head>/i);
    const headContent = headMatch ? headMatch[0] : '<head><meta charset="UTF-8"></head>';
    
    const bodyStartMatch = this.baseTemplate.match(/<body[^>]*>/i);
    const bodyStart = bodyStartMatch ? bodyStartMatch[0] : '<body>';
    
    const headerMatch = this.baseTemplate.match(/<header[^>]*>[\s\S]*?<\/header>/i);
    const headerContent = headerMatch ? headerMatch[0] : '';
    
    const footerMatch = this.baseTemplate.match(/<footer[^>]*>[\s\S]*?<\/footer>/i);
    const footerContent = footerMatch ? footerMatch[0] : '';
    
    // Construir o template
    let template = '<!DOCTYPE html>\n<html lang="en">\n';
    template += headContent + '\n';
    template += '<style>\n';
    template += this._extractStyles(this.baseTemplate);
    
    // Adicionar estilos para componentes adicionais
    template += `
      .stress-component {
        margin: 10px 0;
        padding: 15px;
        border: 1px solid #ddd;
        border-radius: 5px;
      }
      
      .massive-table-container {
        max-height: 400px;
        overflow-y: auto;
        margin: 20px 0;
      }
      
      .deeply-nested {
        padding-left: 20px;
        border-left: 1px solid #eee;
      }
      
      .grid-layout {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 20px;
        margin: 20px 0;
      }
      
      .very-complex-component {
        position: relative;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        border-radius: 8px;
        box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        overflow: hidden;
        transition: all 0.3s ease;
      }
      
      .very-complex-component:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 30px rgba(0,0,0,0.2);
      }
    `;
    template += '</style>\n';
    
    template += bodyStart + '\n';
    template += headerContent + '\n';
    
    // Adicionar conteúdo principal massivo
    template += '<main class="container py-5">\n';
    
    // Adicionar título
    template += `
      <div class="row">
        <div class="col-12 text-center mb-5">
          <h1 class="display-4">Template Extremamente Grande para Testes de Carga</h1>
          <p class="lead">Este template contém aproximadamente ${componentCount} componentes para testar o renderizador progressivo.</p>
        </div>
      </div>
    `;
    
    // Adicionar seções com componentes
    const sectionsCount = Math.ceil(componentCount / 50); // Aproximadamente 50 componentes por seção
    for (let i = 0; i < sectionsCount; i++) {
      template += this._generateMassiveSection(i, componentCount, sectionsCount);
    }
    
    // Adicionar seções com padrões de estresse, se habilitado
    if (this.options.enableStressPatterns) {
      template += this._generateStressPatterns();
    }
    
    template += '</main>\n';
    template += footerContent + '\n';
    
    // Adicionar script para melhorar performance de scrolling em browsers
    template += `
      <script>
        // Script para lazy loading de imagens e vídeos
        document.addEventListener('DOMContentLoaded', function() {
          const lazyImages = [].slice.call(document.querySelectorAll('img.lazy'));
          const lazyVideos = [].slice.call(document.querySelectorAll('video.lazy'));
          
          if ('IntersectionObserver' in window) {
            let lazyObserver = new IntersectionObserver(function(entries, observer) {
              entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                  let lazyElement = entry.target;
                  if (lazyElement.tagName === 'IMG') {
                    lazyElement.src = lazyElement.dataset.src;
                    lazyElement.classList.remove('lazy');
                  } else if (lazyElement.tagName === 'VIDEO') {
                    Array.from(lazyElement.children).forEach(source => {
                      source.src = source.dataset.src;
                    });
                    lazyElement.load();
                    lazyElement.classList.remove('lazy');
                  }
                  lazyObserver.unobserve(lazyElement);
                }
              });
            });
            
            lazyImages.forEach(function(lazyImage) {
              lazyObserver.observe(lazyImage);
            });
            
            lazyVideos.forEach(function(lazyVideo) {
              lazyObserver.observe(lazyVideo);
            });
          }
        });
      </script>
    `;
    
    template += '</body>\n</html>';
    
    // Salvar o template
    const outputPath = path.join(this.options.outputDir, `${name}.html`);
    await fs.writeFile(outputPath, template);
    
    // Relatório estatístico
    const stats = {
      fileSizeBytes: template.length,
      fileSizeKb: (template.length / 1024).toFixed(2),
      approximateComponentCount: template.match(/<div/g).length,
      headerSize: headerContent.length,
      footerSize: footerContent.length,
      mainContentSize: template.length - headerContent.length - footerContent.length - headContent.length - 100,
      nestedComponentsDepth: this.options.enableNestedComponents ? 10 : 1,
      hasLargeDatasets: this.options.enableLargeDatasets,
      hasStressPatterns: this.options.enableStressPatterns
    };
    
    logger.success(`Template extremamente grande gerado: ${outputPath}`);
    logger.info(`Estatísticas do template:`, stats);
    
    // Salvar estatísticas
    const statsPath = path.join(this.options.outputDir, `${name}-stats.json`);
    await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));
    
    return outputPath;
  }

  /**
   * Gera uma seção massiva com muitos componentes
   * @private
   * @param {number} sectionIndex - Índice da seção
   * @param {number} totalComponentCount - Número total de componentes desejado
   * @param {number} totalSections - Número total de seções
   * @returns {string} HTML da seção
   */
  _generateMassiveSection(sectionIndex, totalComponentCount, totalSections) {
    const componentsPerSection = Math.ceil(totalComponentCount / totalSections);
    
    let sectionHtml = `
      <section class="my-5" id="section-${sectionIndex + 1}">
        <div class="row">
          <div class="col-12">
            <h2 class="mb-4">Seção ${sectionIndex + 1} - Componentes em Massa</h2>
          </div>
        </div>
    `;
    
    if (sectionIndex % 3 === 0) {
      // A cada 3 seções, adicionar uma lista de cards
      sectionHtml += '<div class="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">';
      
      for (let i = 0; i < componentsPerSection / 2; i++) {
        sectionHtml += this._generateCardComponent(i, sectionIndex);
      }
      
      sectionHtml += '</div>';
    } else if (sectionIndex % 3 === 1) {
      // Seções do tipo 1 terão uma grade de componentes
      sectionHtml += '<div class="grid-layout">';
      
      for (let i = 0; i < componentsPerSection / 2; i++) {
        sectionHtml += this._generateGridItemComponent(i, sectionIndex);
      }
      
      sectionHtml += '</div>';
    } else {
      // Seções do tipo 2 terão componentes aninhados
      if (this.options.enableNestedComponents) {
        sectionHtml += this._generateNestedComponents(10, Math.floor(componentsPerSection / 10));
      } else {
        // Alternativa para componentes não aninhados
        sectionHtml += '<div class="row">';
        for (let i = 0; i < componentsPerSection; i++) {
          sectionHtml += `
            <div class="col-md-4 mb-4">
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">Componente ${sectionIndex * componentsPerSection + i}</h5>
                  <p class="card-text">Este é um componente simples para teste de carga.</p>
                </div>
              </div>
            </div>
          `;
        }
        sectionHtml += '</div>';
      }
    }
    
    // Adicionar tabela grande com muitos dados
    if (this.options.enableLargeDatasets && sectionIndex % 2 === 0) {
      sectionHtml += this._generateLargeTable(100); // 100 linhas
    }
    
    sectionHtml += '</section>';
    
    return sectionHtml;
  }

  /**
   * Gera um componente de card
   * @private
   * @param {number} index - Índice do componente
   * @param {number} sectionIndex - Índice da seção
   * @returns {string} HTML do componente
   */
  _generateCardComponent(index, sectionIndex) {
    const componentId = sectionIndex * 1000 + index;
    
    return `
      <div class="col">
        <div class="card h-100" id="card-${componentId}">
          <img src="https://via.placeholder.com/300x200?text=Card+${componentId}" class="card-img-top" alt="Card image">
          <div class="card-body">
            <h5 class="card-title">Card ${componentId}</h5>
            <p class="card-text">Este é um componente de card para teste de carga do renderizador progressivo.</p>
            <div class="d-flex justify-content-between align-items-center">
              <div class="btn-group">
                <button type="button" class="btn btn-sm btn-outline-primary">Ver</button>
                <button type="button" class="btn btn-sm btn-outline-secondary">Editar</button>
              </div>
              <small class="text-muted">9 mins</small>
            </div>
          </div>
          <div class="card-footer">
            <small class="text-muted">Última atualização 3 mins atrás</small>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Gera um componente de item de grade
   * @private
   * @param {number} index - Índice do componente
   * @param {number} sectionIndex - Índice da seção
   * @returns {string} HTML do componente
   */
  _generateGridItemComponent(index, sectionIndex) {
    const componentId = sectionIndex * 1000 + index;
    
    return `
      <div class="very-complex-component" id="grid-item-${componentId}">
        <div class="p-4">
          <h5>Item ${componentId}</h5>
          <p>Este é um item de grade para teste de carga do renderizador progressivo.</p>
          <div class="progress mb-3">
            <div class="progress-bar" role="progressbar" style="width: ${(index % 10) * 10}%" aria-valuenow="${(index % 10) * 10}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
          <div class="d-flex justify-content-between">
            <span class="badge bg-primary">${index % 5 === 0 ? 'Novo' : 'Normal'}</span>
            <button class="btn btn-sm btn-light">Detalhes</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Gera componentes profundamente aninhados
   * @private
   * @param {number} depth - Profundidade de aninhamento
   * @param {number} breadth - Número de componentes em cada nível
   * @returns {string} HTML dos componentes aninhados
   */
  _generateNestedComponents(depth, breadth) {
    if (depth <= 0) return '';
    
    let html = '<div class="deeply-nested">';
    
    for (let i = 0; i < breadth; i++) {
      html += `
        <div class="stress-component">
          <h5>Componente Aninhado (Nível ${11 - depth}, Item ${i + 1})</h5>
          <p>Este é um componente aninhado para teste de carga do renderizador progressivo.</p>
      `;
      
      // Adicionar conteúdo recursivamente
      if (depth > 1) {
        html += this._generateNestedComponents(depth - 1, Math.max(1, Math.floor(breadth / 2)));
      }
      
      html += '</div>';
    }
    
    html += '</div>';
    
    return html;
  }

  /**
   * Gera uma tabela grande com muitos dados
   * @private
   * @param {number} rowCount - Número de linhas na tabela
   * @returns {string} HTML da tabela
   */
  _generateLargeTable(rowCount) {
    let html = `
      <div class="row mt-5">
        <div class="col-12">
          <h3>Conjunto de Dados Grande</h3>
          <p>Esta tabela contém ${rowCount} linhas para testar o renderizador com conjuntos de dados grandes.</p>
          <div class="massive-table-container">
            <table class="table table-striped table-hover">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Departamento</th>
                  <th>Cargo</th>
                  <th>Status</th>
                  <th>Data de Contratação</th>
                  <th>Salário</th>
                  <th>Avaliação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
    `;
    
    const departments = ['Engenharia', 'Marketing', 'Vendas', 'Suporte', 'RH', 'Financeiro', 'TI', 'Legal'];
    const positions = ['Analista Jr', 'Analista Sr', 'Especialista', 'Coordenador', 'Gerente', 'Diretor', 'Estagiário'];
    const statuses = ['Ativo', 'Férias', 'Licença', 'Remoto', 'Treinamento'];
    
    for (let i = 0; i < rowCount; i++) {
      const department = departments[i % departments.length];
      const position = positions[i % positions.length];
      const status = statuses[i % statuses.length];
      const rating = (Math.random() * 5).toFixed(1);
      const salary = (3000 + Math.random() * 15000).toFixed(2);
      
      const hireDate = new Date(2018, i % 12, (i % 28) + 1);
      const hireDateStr = hireDate.toLocaleDateString('pt-BR');
      
      html += `
        <tr>
          <td>${i + 1}</td>
          <td>Funcionário ${i + 1}</td>
          <td>funcionario${i + 1}@empresa.com</td>
          <td>${department}</td>
          <td>${position}</td>
          <td><span class="badge ${status === 'Ativo' ? 'bg-success' : 'bg-secondary'}">${status}</span></td>
          <td>${hireDateStr}</td>
          <td>R$ ${salary}</td>
          <td>
            <div class="progress" style="height: 15px;">
              <div class="progress-bar" role="progressbar" style="width: ${rating * 20}%" aria-valuenow="${rating}" aria-valuemin="0" aria-valuemax="5">${rating}</div>
            </div>
          </td>
          <td>
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-outline-primary">Editar</button>
              <button type="button" class="btn btn-outline-danger">Excluir</button>
            </div>
          </td>
        </tr>
      `;
    }
    
    html += `
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    return html;
  }

  /**
   * Gera padrões de estresse para testar o renderizador
   * @private
   * @returns {string} HTML com padrões de estresse
   */
  _generateStressPatterns() {
    let html = `
      <section class="my-5">
        <div class="row">
          <div class="col-12">
            <h2 class="mb-4">Padrões de Estresse para Testes</h2>
            <p>Esta seção contém padrões que podem ser desafiadores para o renderizador progressivo.</p>
          </div>
        </div>
    `;
    
    // 1. Elementos com muitos atributos
    html += `
      <div class="row mb-5">
        <div class="col-12">
          <h3>Elementos com Muitos Atributos</h3>
          <div
            class="stress-component"
            id="many-attributes"
            data-test="true"
            data-value="123"
            data-type="stress-test"
            data-category="extreme"
            data-size="large"
            data-color="blue"
            data-width="100%"
            data-height="auto"
            data-animation="true"
            data-speed="fast"
            data-autoplay="true"
            data-loop="false"
            data-direction="forward"
            data-intensity="high"
            data-opacity="1"
            data-visibility="visible"
            data-position="relative"
            data-overflow="hidden"
            data-index="0"
            data-context="test"
            data-section="stress"
            data-group="attributes"
            data-custom1="value1"
            data-custom2="value2"
            data-custom3="value3"
            data-custom4="value4"
            data-custom5="value5"
            data-custom6="value6"
            data-custom7="value7"
            data-custom8="value8"
            data-custom9="value9"
            data-custom10="value10"
            style="padding: 20px; border: 1px solid #ddd; border-radius: 5px;"
          >
            <p>Este elemento tem 35 atributos para testar o parser.</p>
          </div>
        </div>
      </div>
    `;
    
    // 2. Comentários grandes e nested comments
    html += `
      <div class="row mb-5">
        <div class="col-12">
          <h3>Comentários Grandes e Aninhados</h3>
          <div class="stress-component">
            <!-- 
              Este é um comentário muito grande que contém muitos caracteres e pode potencialmente
              causar problemas para parsers HTML. O comentário contém vários parágrafos de texto
              para simular documentação ou código comentado em um template real.
              
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              
              <!-- Este é um comentário aninhado, que não é tecnicamente válido em HTML, mas
                   pode aparecer em templates reais e causar confusão em parsers -->
              
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui 
              officia deserunt mollit anim id est laborum.
            -->
            <p>Este componente contém um comentário muito grande e aninhado para testar o parser.</p>
          </div>
        </div>
      </div>
    `;
    
    // 3. Elementos com muito texto
    const loremIpsum = this._generateLoremIpsum(5000); // ~5000 caracteres
    html += `
      <div class="row mb-5">
        <div class="col-12">
          <h3>Elemento com Muito Texto</h3>
          <div class="stress-component">
            <p>${loremIpsum}</p>
          </div>
        </div>
      </div>
    `;
    
    // 4. Elementos com HTML mal formado (mas válido no browser)
    html += `
      <div class="row mb-5">
        <div class="col-12">
          <h3>HTML Potencialmente Problemático</h3>
          <div class="stress-component">
            <p>Elemento com tags não fechadas ou mal formadas (mas que funcionam em browsers).</p>
            <p>Parágrafo com <strong>negrito não fechado.
            <p>Parágrafo sem fechamento.
            <div>Div com <p>parágrafo aninhado</div> incorretamente.
          </div>
        </div>
      </div>
    `;
    
    // 5. Elementos com CSS complexo inline
    html += `
      <div class="row mb-5">
        <div class="col-12">
          <h3>CSS Inline Complexo</h3>
          <div class="stress-component" style="position: relative; display: flex; flex-direction: column; justify-content: space-between; align-items: center; padding: 20px; margin: 15px; border: 1px solid rgba(0,0,0,0.125); border-radius: 0.25rem; box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15); background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); color: #333; font-size: 1rem; line-height: 1.5; text-align: center; transition: all 0.3s ease-in-out; cursor: pointer; user-select: none; z-index: 1; overflow: hidden; transform: translateZ(0); backface-visibility: hidden; perspective: 1000px; transform-style: preserve-3d;">
            <p>Este elemento tem um atributo style muito grande e complexo.</p>
          </div>
        </div>
      </div>
    `;
    
    // 6. Muitos elementos pequenos
    html += `
      <div class="row mb-5">
        <div class="col-12">
          <h3>Muitos Elementos Pequenos</h3>
          <div class="stress-component" style="display: flex; flex-wrap: wrap; gap: 5px;">
    `;
    
    for (let i = 0; i < 200; i++) {
      html += `<span class="badge bg-${['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'][i % 8]}">Tag ${i}</span>`;
    }
    
    html += `
          </div>
        </div>
      </div>
    `;
    
    html += '</section>';
    
    return html;
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
    
    return styles;
  }

  /**
   * Gera um texto Lorem Ipsum de tamanho aproximado
   * @private
   * @param {number} size - Tamanho aproximado em caracteres
   * @returns {string} Texto Lorem Ipsum
   */
  _generateLoremIpsum(size) {
    const loremIpsumBase = `
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      
      Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
      
      Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?
    `.trim().replace(/\s+/g, ' ');
    
    let result = '';
    while (result.length < size) {
      result += loremIpsumBase + ' ';
    }
    
    return result.substring(0, size);
  }
}

/**
 * Função principal para gerar templates de teste
 */
async function generateTestTemplates() {
  try {
    logger.info('Iniciando geração de templates para testes de carga...');
    
    const generator = new TemplateGenerator();
    await generator.initialize();
    
    // Gerar templates de diferentes tamanhos
    await generator.generateLargeTemplate('extreme-large', 500); // ~500 componentes
    await generator.generateLargeTemplate('ultra-large', 1000); // ~1000 componentes
    await generator.generateLargeTemplate('monster-large', 2000); // ~2000 componentes
    
    // Versão específica para edge cases
    await generator.generateLargeTemplate('edge-cases', 500);
    
    logger.success('Geração de templates concluída com sucesso!');
  } catch (error) {
    logger.error('Erro ao gerar templates:', error);
  }
}

// Executar geração de templates
if (require.main === module) {
  generateTestTemplates();
}

module.exports = TemplateGenerator;