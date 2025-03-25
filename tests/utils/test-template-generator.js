/**
 * @fileoverview Utilitário para gerar templates de teste para o sistema de renderização
 * Esse componente faz parte do sistema de testes para o framework de renderização avançada,
 * permitindo criar templates com níveis variados de complexidade para avaliar o desempenho
 * dos diferentes renderizadores.
 */

const fs = require('fs');
const path = require('path');

/**
 * Classe TemplateGenerator para criação de templates de teste
 * Fornece diversos métodos para gerar templates HTML com diferentes
 * características e complexidades para testes de carga.
 */
class TemplateGenerator {
  /**
   * Constrói um novo gerador de templates
   * @param {Object} options - Opções de configuração
   * @param {string} options.outputDir - Diretório de saída para os templates
   * @param {Object} options.defaults - Valores padrão para geração
   */
  constructor(options = {}) {
    this.outputDir = options.outputDir || path.join(__dirname, '../../test-templates');
    this.defaults = {
      depth: 5,
      breadth: 10,
      textLength: 50,
      ...options.defaults
    };
    
    // Garantir que o diretório de saída existe
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Gera um template simples com estrutura básica
   * @param {string} filename - Nome do arquivo a ser gerado
   * @param {Object} options - Opções de personalização
   * @returns {string} Caminho do arquivo gerado
   */
  generateBasicTemplate(filename, options = {}) {
    const {
      title = 'Template Básico',
      sections = 3,
      paragraphsPerSection = 2
    } = options;
    
    let content = `<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
  <div class="container">
    <header class="my-4">
      <h1>${title}</h1>
    </header>
    <main>`;
    
    // Gerar seções
    for (let i = 1; i <= sections; i++) {
      content += `
      <section id="section-${i}" class="my-4">
        <h2>Seção ${i}</h2>`;
        
      // Gerar parágrafos
      for (let j = 1; j <= paragraphsPerSection; j++) {
        content += `
        <p>Este é um parágrafo de exemplo ${j} na seção ${i}. Ele contém texto para simular o conteúdo real que seria renderizado em um template.</p>`;
      }
      
      content += `
      </section>`;
    }
    
    content += `
    </main>
    <footer class="mt-4 py-3 bg-light">
      <p>Rodapé do template de teste</p>
    </footer>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
    
    const filePath = path.join(this.outputDir, filename);
    fs.writeFileSync(filePath, content);
    
    return filePath;
  }

  /**
   * Gera um template complexo com estrutura aninhada
   * @param {string} filename - Nome do arquivo a ser gerado
   * @param {Object} options - Opções de personalização
   * @returns {string} Caminho do arquivo gerado
   */
  generateComplexTemplate(filename, options = {}) {
    const {
      title = 'Template Complexo',
      depth = this.defaults.depth,
      breadth = this.defaults.breadth,
      includeImages = true,
      includeTables = true,
      includeAccordions = true
    } = options;
    
    let content = `<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
  <div class="container">
    <header class="my-4">
      <h1>${title}</h1>
      <p>Este é um template complexo gerado para testes de carga do sistema de renderização.</p>
    </header>
    <main>`;
    
    // Gerar conteúdo aninhado recursivamente
    content += this._generateNestedContent(depth, breadth, {
      includeImages,
      includeTables,
      includeAccordions
    });
    
    content += `
    </main>
    <footer class="mt-4 py-3 bg-light">
      <div class="container">
        <div class="row">
          <div class="col-md-4">
            <h5>Sobre</h5>
            <p>Template de teste para avaliação de performance.</p>
          </div>
          <div class="col-md-4">
            <h5>Links</h5>
            <ul class="list-unstyled">
              <li><a href="#">Link 1</a></li>
              <li><a href="#">Link 2</a></li>
              <li><a href="#">Link 3</a></li>
            </ul>
          </div>
          <div class="col-md-4">
            <h5>Contato</h5>
            <p>Email: teste@exemplo.com</p>
            <p>Telefone: (00) 0000-0000</p>
          </div>
        </div>
      </div>
    </footer>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
    
    const filePath = path.join(this.outputDir, filename);
    fs.writeFileSync(filePath, content);
    
    return filePath;
  }

  /**
   * Gera conteúdo aninhado recursivamente
   * @private
   * @param {number} depth - Profundidade restante
   * @param {number} breadth - Largura de elementos por nível
   * @param {Object} options - Opções adicionais
   * @returns {string} Conteúdo HTML gerado
   */
  _generateNestedContent(depth, breadth, options) {
    if (depth <= 0) return '';
    
    let content = '';
    
    // Criar elementos para este nível
    for (let i = 0; i < breadth; i++) {
      // Alternar entre diferentes tipos de elementos para criar complexidade variada
      const elementType = i % 5;
      
      switch (elementType) {
        case 0: // Seção com título e parágrafos
          content += `
      <section class="my-4">
        <h2>Seção ${depth}-${i}</h2>
        <p>${this._generateRandomText(this.defaults.textLength)}</p>`;
          
          // Adicionar conteúdo aninhado recursivamente
          if (depth > 1) {
            content += this._generateNestedContent(depth - 1, breadth / 2, options);
          }
          
          content += `
      </section>`;
          break;
          
        case 1: // Card com imagem se opção habilitada
          content += `
      <div class="card my-3">
        <div class="card-body">
          <h3 class="card-title">Card ${depth}-${i}</h3>
          <p class="card-text">${this._generateRandomText(this.defaults.textLength / 2)}</p>`;
          
          if (options.includeImages && depth > 1) {
            content += `
          <div class="text-center">
            <img src="https://via.placeholder.com/300x200.png?text=Test+Image+${depth}-${i}" class="img-fluid rounded" alt="Imagem de teste">
          </div>`;
          }
          
          // Adicionar conteúdo aninhado recursivamente
          if (depth > 1) {
            content += this._generateNestedContent(depth - 1, breadth / 3, options);
          }
          
          content += `
        </div>
      </div>`;
          break;
          
        case 2: // Tabela se opção habilitada
          if (options.includeTables) {
            content += `
      <div class="table-responsive my-4">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Coluna 1</th>
              <th>Coluna 2</th>
              <th>Coluna 3</th>
            </tr>
          </thead>
          <tbody>`;
            
            // Adicionar linhas
            const rows = 3 + (depth - 1) * 2;
            for (let r = 0; r < rows; r++) {
              content += `
            <tr>
              <td>Dado ${r}-1</td>
              <td>Dado ${r}-2</td>
              <td>Dado ${r}-3</td>
            </tr>`;
            }
            
            content += `
          </tbody>
        </table>
      </div>`;
          } else {
            content += `
      <div class="alert alert-info my-3">
        <h4>Nota Informativa ${depth}-${i}</h4>
        <p>${this._generateRandomText(this.defaults.textLength / 2)}</p>
      </div>`;
          }
          break;
          
        case 3: // Accordion se opção habilitada
          if (options.includeAccordions && depth > 1) {
            const accordionId = `accordion-${depth}-${i}`;
            content += `
      <div class="accordion my-4" id="${accordionId}">`;
            
            // Adicionar itens de accordion
            const items = 2 + (depth - 1);
            for (let a = 0; a < items; a++) {
              const itemId = `${accordionId}-item-${a}`;
              content += `
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button ${a > 0 ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#${itemId}">
              Item de Accordion ${depth}-${i}-${a}
            </button>
          </h2>
          <div id="${itemId}" class="accordion-collapse collapse ${a === 0 ? 'show' : ''}" data-bs-parent="#${accordionId}">
            <div class="accordion-body">
              <p>${this._generateRandomText(this.defaults.textLength / 2)}</p>`;
              
              // Adicionar conteúdo aninhado recursivamente com menor profundidade/largura
              if (depth > 2) {
                content += this._generateNestedContent(depth - 2, breadth / 4, options);
              }
              
              content += `
            </div>
          </div>
        </div>`;
            }
            
            content += `
      </div>`;
          } else {
            content += `
      <div class="jumbotron p-4 my-4 bg-light rounded">
        <h2>Destaque ${depth}-${i}</h2>
        <p class="lead">${this._generateRandomText(this.defaults.textLength)}</p>
        <hr class="my-4">
        <p>${this._generateRandomText(this.defaults.textLength / 2)}</p>
      </div>`;
          }
          break;
          
        case 4: // Lista com itens aninhados
          content += `
      <div class="my-4">
        <h3>Lista ${depth}-${i}</h3>
        <ul class="list-group">`;
          
          // Adicionar itens de lista
          const listItems = 3 + (depth - 1) * 2;
          for (let l = 0; l < listItems; l++) {
            content += `
          <li class="list-group-item">
            <p>Item de lista ${depth}-${i}-${l}: ${this._generateRandomText(this.defaults.textLength / 3)}</p>`;
            
            // Adicionar conteúdo aninhado recursivamente
            if (depth > 1 && l % 3 === 0) {
              content += this._generateNestedContent(depth - 1, breadth / 4, options);
            }
            
            content += `
          </li>`;
          }
          
          content += `
        </ul>
      </div>`;
          break;
      }
    }
    
    return content;
  }

  /**
   * Gera um template extremamente grande para testes de carga
   * @param {string} filename - Nome do arquivo a ser gerado
   * @param {Object} options - Opções de personalização
   * @returns {string} Caminho do arquivo gerado
   */
  generateExtremeTemplate(filename, options = {}) {
    const {
      title = 'Template Extremamente Grande',
      depth = 12,
      breadth = 20,
      repeats = 3,
      includeHeavyElements = true
    } = options;
    
    let content = `<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
  <div class="container-fluid">
    <header class="my-4 text-center">
      <h1>${title}</h1>
      <p class="lead">Este template foi gerado especificamente para testar situações extremas de renderização.</p>
    </header>
    <main class="row">
      <div class="col-12">
        <div class="alert alert-warning">
          <strong>Atenção:</strong> Este template contém elementos extremamente pesados e estruturas profundamente aninhadas para testar os limites do renderizador.
        </div>
      </div>`;
    
    // Gerar conteúdo repetidas vezes para criar um template extremamente grande
    for (let r = 0; r < repeats; r++) {
      content += `
      <div class="col-12">
        <div class="card mb-4">
          <div class="card-header bg-primary text-white">
            <h2>Bloco de Teste Extremo #${r + 1}</h2>
          </div>
          <div class="card-body">`;
      
      // Incorporar conteúdo complexo
      content += this._generateNestedContent(depth, breadth, {
        includeImages: includeHeavyElements,
        includeTables: true,
        includeAccordions: true
      });
      
      // Adicionar elementos pesados se solicitado
      if (includeHeavyElements) {
        // Tabela grande aninhada
        content += `
            <div class="table-responsive my-4">
              <table class="table table-bordered table-hover">
                <thead class="thead-dark">
                  <tr>`;
        
        // Colunas
        for (let c = 0; c < 15; c++) {
          content += `
                    <th>Coluna ${c + 1}</th>`;
        }
        
        content += `
                  </tr>
                </thead>
                <tbody>`;
        
        // Linhas e células
        for (let row = 0; row < 50; row++) {
          content += `
                  <tr>`;
          
          for (let col = 0; col < 15; col++) {
            content += `
                    <td>Dado R${r}-${row + 1}-${col + 1}</td>`;
          }
          
          content += `
                  </tr>`;
        }
        
        content += `
                </tbody>
              </table>
            </div>`;
      }
      
      content += `
          </div>
        </div>
      </div>`;
    }
    
    content += `
    </main>
    <footer class="py-4 bg-dark text-white text-center">
      <p>Template de teste extremo para avaliação de performance do renderizador.</p>
    </footer>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
    
    const filePath = path.join(this.outputDir, filename);
    fs.writeFileSync(filePath, content);
    
    return filePath;
  }

  /**
   * Gera texto aleatório para uso nos templates
   * @private
   * @param {number} length - Comprimento aproximado do texto
   * @returns {string} Texto gerado
   */
  _generateRandomText(length) {
    const words = [
      'template', 'teste', 'performance', 'renderização', 'sistema', 'complexo',
      'progressivo', 'conteúdo', 'component', 'avaliação', 'métricas', 'análise',
      'otimização', 'benchmark', 'memória', 'processamento', 'dados', 'estrutura',
      'aninhado', 'DOM', 'HTML', 'CSS', 'JavaScript', 'responsivo', 'interativo'
    ];
    
    let result = '';
    while (result.length < length) {
      const randomWord = words[Math.floor(Math.random() * words.length)];
      result += (result ? ' ' : '') + randomWord;
    }
    
    return result;
  }

  /**
   * Gera um template de grid com muitas colunas e linhas
   * @param {string} filename - Nome do arquivo a ser gerado
   * @param {Object} options - Opções de personalização
   * @returns {string} Caminho do arquivo gerado
   */
  generateGridTemplate(filename, options = {}) {
    const {
      title = 'Template de Grid Extenso',
      rows = 100,
      columns = 20
    } = options;
    
    let content = `<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    .scroll-container {
      max-height: 80vh;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <div class="container-fluid">
    <header class="my-4">
      <h1>${title}</h1>
      <p>Este template contém uma grade extensa com ${rows} linhas e ${columns} colunas para testar a performance de renderização.</p>
    </header>
    <main>
      <div class="scroll-container">
        <table class="table table-striped table-sm">
          <thead class="sticky-top bg-light">
            <tr>`;
    
    // Cabeçalhos de coluna
    for (let c = 0; c < columns; c++) {
      content += `
              <th>Coluna ${c + 1}</th>`;
    }
    
    content += `
            </tr>
          </thead>
          <tbody>`;
    
    // Linhas e células
    for (let r = 0; r < rows; r++) {
      content += `
            <tr>`;
      
      for (let c = 0; c < columns; c++) {
        content += `
              <td>Célula ${r + 1}-${c + 1}</td>`;
      }
      
      content += `
            </tr>`;
    }
    
    content += `
          </tbody>
        </table>
      </div>
    </main>
    <footer class="mt-4 py-3 bg-light text-center">
      <p>Template de grid para testes de performance.</p>
    </footer>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
    
    const filePath = path.join(this.outputDir, filename);
    fs.writeFileSync(filePath, content);
    
    return filePath;
  }
}

module.exports = TemplateGenerator;
