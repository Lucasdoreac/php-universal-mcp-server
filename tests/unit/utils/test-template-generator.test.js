/**
 * @fileoverview Testes para o utilitário TemplateGenerator
 * Verifica a funcionalidade do gerador de templates para testes de carga
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const rimraf = require('rimraf');
const TemplateGenerator = require('../../utils/test-template-generator');

describe('TemplateGenerator', () => {
  let testOutputDir;
  let generator;

  // Configurar um diretório temporário para os templates de teste
  beforeEach(() => {
    testOutputDir = path.join(os.tmpdir(), `template-generator-test-${Date.now()}`);
    fs.mkdirSync(testOutputDir, { recursive: true });
    
    generator = new TemplateGenerator({
      outputDir: testOutputDir,
      defaults: {
        depth: 3,
        breadth: 3,
        textLength: 20
      }
    });
  });

  // Limpar o diretório temporário após os testes
  afterEach(() => {
    rimraf.sync(testOutputDir);
  });

  test('deve criar uma instância com configurações padrão', () => {
    const defaultGenerator = new TemplateGenerator();
    
    expect(defaultGenerator).toBeDefined();
    expect(defaultGenerator.outputDir).toContain('test-templates');
    expect(defaultGenerator.defaults).toEqual({
      depth: 5,
      breadth: 10,
      textLength: 50
    });
  });

  test('deve criar uma instância com configurações personalizadas', () => {
    expect(generator).toBeDefined();
    expect(generator.outputDir).toBe(testOutputDir);
    expect(generator.defaults).toEqual({
      depth: 3,
      breadth: 3,
      textLength: 20
    });
  });

  test('deve gerar um template básico', () => {
    const filename = 'basic-template.html';
    const filePath = generator.generateBasicTemplate(filename, {
      title: 'Meu Template Básico',
      sections: 2,
      paragraphsPerSection: 3
    });
    
    // Verificar se o arquivo foi criado
    expect(fs.existsSync(filePath)).toBeTruthy();
    
    // Verificar o conteúdo do arquivo
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('<title>Meu Template Básico</title>');
    expect(content).toContain('<h1>Meu Template Básico</h1>');
    
    // Verificar se tem o número correto de seções
    expect(content.match(/<section id="section-\d+" class="my-4">/g).length).toBe(2);
    
    // Verificar se tem o número correto de parágrafos
    expect(content.match(/<p>Este é um parágrafo de exemplo/g).length).toBe(6); // 2 seções x 3 parágrafos
  });

  test('deve gerar um template complexo', () => {
    const filename = 'complex-template.html';
    const filePath = generator.generateComplexTemplate(filename, {
      title: 'Meu Template Complexo',
      depth: 2,
      breadth: 3,
      includeImages: true,
      includeTables: true,
      includeAccordions: true
    });
    
    // Verificar se o arquivo foi criado
    expect(fs.existsSync(filePath)).toBeTruthy();
    
    // Verificar o conteúdo do arquivo
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('<title>Meu Template Complexo</title>');
    expect(content).toContain('<h1>Meu Template Complexo</h1>');
    
    // Verificar elementos complexos
    expect(content).toContain('<section class="my-4">');
    
    // Com a opção includeImages, deve conter imagens
    expect(content).toContain('<img src="https://via.placeholder.com');
    
    // Com a opção includeTables, deve conter tabelas
    expect(content).toContain('<table class="table');
    
    // Com a opção includeAccordions, deve conter accordions
    expect(content).toContain('<div class="accordion');
  });

  test('deve gerar um template de grade', () => {
    const filename = 'grid-template.html';
    const filePath = generator.generateGridTemplate(filename, {
      title: 'Minha Grade',
      rows: 50,
      columns: 10
    });
    
    // Verificar se o arquivo foi criado
    expect(fs.existsSync(filePath)).toBeTruthy();
    
    // Verificar o conteúdo do arquivo
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('<title>Minha Grade</title>');
    expect(content).toContain('<h1>Minha Grade</h1>');
    
    // Verificar cabeçalhos de coluna
    const headerMatches = content.match(/<th>Coluna \d+<\/th>/g);
    expect(headerMatches).toHaveLength(10);
    
    // Verificar número de linhas (contar tags <tr> no tbody)
    const trMatches = content.match(/<tbody>(.|\n)*?<\/tbody>/)[0].match(/<tr>/g);
    expect(trMatches).toHaveLength(50);
    
    // Verificar células em uma linha
    const firstRowMatches = content.match(/<tr>(.|\n)*?<\/tr>/)[0].match(/<td>Célula \d+-\d+<\/td>/g);
    expect(firstRowMatches).toHaveLength(10);
  });

  test('deve gerar um template extremo', () => {
    const filename = 'extreme-template.html';
    const filePath = generator.generateExtremeTemplate(filename, {
      title: 'Template Extremo',
      depth: 3,
      breadth: 2,
      repeats: 2,
      includeHeavyElements: true
    });
    
    // Verificar se o arquivo foi criado
    expect(fs.existsSync(filePath)).toBeTruthy();
    
    // Verificar o conteúdo do arquivo
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('<title>Template Extremo</title>');
    expect(content).toContain('<h1>Template Extremo</h1>');
    
    // Verificar blocos de teste
    expect(content).toContain('<h2>Bloco de Teste Extremo #1</h2>');
    expect(content).toContain('<h2>Bloco de Teste Extremo #2</h2>');
    
    // Verificar elementos pesados
    expect(content).toContain('<table class="table');
    
    // Com opção includeHeavyElements, deve incluir uma tabela grande
    const tableRows = content.match(/<tr>/g).length;
    expect(tableRows).toBeGreaterThan(50); // Tabela grande tem pelo menos 50 linhas
  });

  test('deve usar o método _generateRandomText corretamente', () => {
    // Acesso ao método privado para teste
    const text = generator._generateRandomText(100);
    
    // O texto deve ter pelo menos o tamanho especificado
    expect(text.length).toBeGreaterThanOrEqual(100);
    
    // O texto deve conter palavras da lista predefinida
    expect(text).toMatch(/template|teste|performance|renderização|sistema/);
  });

  test('deve gerar templates com diferentes níveis de complexidade', () => {
    // Gerar templates com diferentes configurações
    const basicFile = generator.generateBasicTemplate('test-basic.html');
    const simpleFile = generator.generateComplexTemplate('test-simple.html', { depth: 2, breadth: 2 });
    const complexFile = generator.generateComplexTemplate('test-complex.html', { depth: 4, breadth: 3 });
    
    // Verificar se todos os arquivos foram criados
    expect(fs.existsSync(basicFile)).toBeTruthy();
    expect(fs.existsSync(simpleFile)).toBeTruthy();
    expect(fs.existsSync(complexFile)).toBeTruthy();
    
    // Comparar tamanhos para verificar níveis de complexidade
    const basicSize = fs.statSync(basicFile).size;
    const simpleSize = fs.statSync(simpleFile).size;
    const complexSize = fs.statSync(complexFile).size;
    
    // Um template mais complexo deve ser maior que um mais simples
    expect(simpleSize).toBeGreaterThan(basicSize);
    expect(complexSize).toBeGreaterThan(simpleSize);
  });
});
