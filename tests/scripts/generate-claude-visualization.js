#!/usr/bin/env node

/**
 * Script para gerar visualizações dos resultados de testes do sistema 
 * de renderização para o Claude Desktop
 * 
 * Este script converte relatórios de teste JSON em componentes React
 * que podem ser visualizados diretamente no Claude Desktop como artifacts.
 * 
 * Uso:
 *   node generate-claude-visualization.js [--report caminho/para/relatorio.json]
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const formatter = require('./utils/rendering-results-formatter');

// Diretórios
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'tests', 'output');
const REPORT_DIR = path.join(OUTPUT_DIR, 'reports');
const CLAUDE_DIR = path.join(OUTPUT_DIR, 'claude-artifacts');

// Garantir que o diretório de artifacts exista
if (!fs.existsSync(CLAUDE_DIR)) {
  fs.mkdirSync(CLAUDE_DIR, { recursive: true });
}

// Processar argumentos da linha de comando
const args = process.argv.slice(2);
let reportPath = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--report' && i + 1 < args.length) {
    reportPath = args[i + 1];
    i++;
  }
}

// Se não for fornecido um caminho específico, usar o relatório mais recente
if (!reportPath) {
  console.log('Buscando relatório mais recente...');
  
  try {
    const reportFiles = fs.readdirSync(REPORT_DIR)
      .filter(file => file.endsWith('.json') && !file.includes('system-info') && !file.includes('comparison'))
      .sort((a, b) => {
        const statA = fs.statSync(path.join(REPORT_DIR, a));
        const statB = fs.statSync(path.join(REPORT_DIR, b));
        return statB.mtime.getTime() - statA.mtime.getTime(); // Mais recente primeiro
      });
    
    if (reportFiles.length === 0) {
      console.error('Nenhum relatório encontrado em:', REPORT_DIR);
      process.exit(1);
    }
    
    reportPath = path.join(REPORT_DIR, reportFiles[0]);
    console.log('Usando relatório mais recente:', reportFiles[0]);
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error.message);
    process.exit(1);
  }
}

// Verificar se o arquivo existe
if (!fs.existsSync(reportPath)) {
  console.error('Arquivo de relatório não encontrado:', reportPath);
  process.exit(1);
}

console.log('Gerando visualização para o Claude Desktop...');

try {
  // Gerar componente React para artifact do Claude
  const reactComponent = formatter.generateClaudeArtifact(reportPath);
  
  // Gerar exemplo de uso
  const usageExample = formatter.generateClaudeUsageExample(reportPath);
  
  // Salvar arquivos
  const basename = path.basename(reportPath, '.json');
  const artifactPath = path.join(CLAUDE_DIR, `${basename}-component.jsx`);
  const usagePath = path.join(CLAUDE_DIR, `${basename}-usage.md`);
  
  fs.writeFileSync(artifactPath, reactComponent);
  fs.writeFileSync(usagePath, usageExample);
  
  console.log('Visualização gerada com sucesso!');
  console.log('Componente React:', artifactPath);
  console.log('Instruções de uso:', usagePath);
  
  console.log('\nCopie o conteúdo do arquivo de componente React para criar um artifact no Claude Desktop.');
  console.log('Para instruções de uso, consulte o arquivo README ou o arquivo de uso gerado.');
  
} catch (error) {
  console.error('Erro ao gerar visualização:', error.message);
  process.exit(1);
}
