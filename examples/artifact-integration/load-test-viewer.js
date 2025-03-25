/**
 * Exemplo de integração dos resultados de testes de carga com artifacts do Claude
 * 
 * Este exemplo demonstra como exibir os resultados dos testes de carga
 * em um artifact do Claude, permitindo análise visual dos resultados.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const ResultVisualizer = require('../../modules/design/renderers/artifacts/result-visualizer');

/**
 * Exemplo de uso do ResultVisualizer para gerar artifacts do Claude
 * @param {Object} options - Opções de configuração
 */
async function generateArtifactExample(options = {}) {
  const opts = {
    resultPath: path.join(__dirname, '../../tests/performance/test-results/analysis/analysis-full.json'),
    outputDir: path.join(__dirname, 'output'),
    visualizationType: 'summary', // Pode ser 'summary', 'comparison', 'templates', 'time', 'memory'
    ...options
  };

  try {
    // Criar diretório de saída se não existir
    await fs.mkdir(opts.outputDir, { recursive: true });

    console.log(`Lendo dados de análise de: ${opts.resultPath}`);
    const resultData = JSON.parse(await fs.readFile(opts.resultPath, 'utf8'));

    // Criar visualizador
    const visualizer = new ResultVisualizer();

    // Gerar componente React
    const reactComponent = visualizer.generateReactComponent(
      resultData, 
      opts.visualizationType
    );

    // Salvar o código do componente
    const outputPath = path.join(
      opts.outputDir, 
      `load-test-${opts.visualizationType}-artifact.jsx`
    );
    
    await fs.writeFile(outputPath, reactComponent);
    console.log(`Componente React gerado em: ${outputPath}`);

    // Gerar comentário para o prompt do Claude
    const claudePrompt = `
Para visualizar os resultados dos testes de carga, você pode usar o seguinte código React em um artifact:

\`\`\`jsx
${reactComponent}
\`\`\`

Para exibir este conteúdo, basta copiar o código acima e colá-lo em um artifact do Claude com tipo "application/vnd.ant.react".
`.trim();

    const promptPath = path.join(
      opts.outputDir, 
      `load-test-${opts.visualizationType}-prompt.txt`
    );
    
    await fs.writeFile(promptPath, claudePrompt);
    console.log(`Prompt para Claude gerado em: ${promptPath}`);

    return {
      success: true,
      reactComponent,
      outputPath,
      promptPath
    };
  } catch (error) {
    console.error('Erro ao gerar artifact de exemplo:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Função principal
 */
async function main() {
  // Verificar se foi fornecido um argumento para o tipo de visualização
  const visualizationType = process.argv[2] || 'summary';
  const validTypes = ['summary', 'comparison', 'templates', 'time', 'memory'];

  if (!validTypes.includes(visualizationType)) {
    console.error(`Tipo de visualização inválido: ${visualizationType}`);
    console.log(`Tipos válidos: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  // Caminho para o arquivo de resultados
  let resultPath = process.argv[3];
  if (!resultPath) {
    // Tentar encontrar o arquivo de resultados mais recente
    const testResultsDir = path.join(__dirname, '../../tests/performance/test-results');
    
    try {
      const dirs = await fs.readdir(testResultsDir);
      const analysisDirs = dirs
        .filter(dir => dir.includes('analysis') || dir.includes('run-'))
        .map(dir => path.join(testResultsDir, dir));
      
      if (analysisDirs.length > 0) {
        // Ordenar por data de modificação (mais recente primeiro)
        const sortedDirs = await Promise.all(
          analysisDirs.map(async dir => {
            const stats = await fs.stat(dir);
            return { dir, mtime: stats.mtime };
          })
        );
        
        sortedDirs.sort((a, b) => b.mtime - a.mtime);
        
        // Verificar se existe um arquivo analysis-full.json
        for (const { dir } of sortedDirs) {
          const analysisPath = path.join(dir, 'analysis-full.json');
          try {
            await fs.access(analysisPath);
            resultPath = analysisPath;
            break;
          } catch (e) {
            // Continuar procurando
          }
        }
      }
    } catch (error) {
      console.warn('Não foi possível encontrar automaticamente o arquivo de resultados.');
    }
    
    // Se ainda não encontrou, usar um caminho padrão
    if (!resultPath) {
      resultPath = path.join(__dirname, '../../tests/performance/test-results/analysis/analysis-full.json');
    }
  }

  // Gerar o exemplo
  const result = await generateArtifactExample({
    resultPath,
    visualizationType
  });

  if (result.success) {
    console.log('\nArtifact gerado com sucesso!');
    console.log('\nPara usar este artifact no Claude:');
    console.log('1. Abra uma conversa com o Claude');
    console.log('2. Solicite uma visualização dos resultados dos testes de carga');
    console.log(`3. O Claude poderá gerar o artifact "${visualizationType}" usando o código gerado`);
    console.log('\nExemplo de prompt:');
    console.log(`"Pode visualizar os resultados dos testes de carga do renderizador progressivo no modo ${visualizationType}?"`);
  } else {
    console.error('Falha ao gerar artifact.');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = generateArtifactExample;
