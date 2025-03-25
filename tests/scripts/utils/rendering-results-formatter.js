/**
 * Módulo utilitário para formatação de resultados de testes de renderização
 * para visualização via artifacts no Claude Desktop
 * 
 * Este módulo converte os relatórios de teste do sistema avançado de renderização
 * em componentes React que podem ser visualizados diretamente no Claude.
 * 
 * @module rendering-results-formatter
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

/**
 * Formatação de duração em um formato legível
 * @param {number} ms - Duração em milissegundos
 * @returns {string} Duração formatada
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms/1000).toFixed(2)}s`;
}

/**
 * Gerar componente React para visualização de resultados no Claude
 * @param {string} reportPath - Caminho completo para o arquivo de relatório JSON
 * @returns {string} Código do componente React
 */
function generateClaudeArtifact(reportPath) {
  const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  
  if (!reportData || !reportData.tests) {
    throw new Error('Formato de relatório inválido');
  }
  
  const comparePath = reportPath.replace('.json', '-comparison.json');
  let comparisonData = null;
  
  if (fs.existsSync(comparePath)) {
    try {
      comparisonData = JSON.parse(fs.readFileSync(comparePath, 'utf8'));
    } catch (error) {
      console.warn(`Aviso: Erro ao carregar comparação: ${error.message}`);
    }
  }
  
  // Construir componente React para artifact do Claude
  const reactComponent = `
import React, { useState } from 'react';

/**
 * Componente de Visualização de Resultados de Testes do Sistema de Renderização
 */
const RenderingTestResults = () => {
  const [activeSection, setActiveSection] = useState('summary');
  
  // Dados do teste
  const testData = ${JSON.stringify(reportData, null, 2)};
  ${comparisonData ? `const comparisonData = ${JSON.stringify(comparisonData, null, 2)};` : 'const comparisonData = null;'}
  
  // Funções auxiliares
  const formatDuration = (ms) => {
    if (ms < 1000) return \`\${ms}ms\`;
    return \`\${(ms/1000).toFixed(2)}s\`;
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'passed': return 'bg-green-100 border-green-300 text-green-700';
      case 'failed': return 'bg-red-100 border-red-300 text-red-700';
      case 'skipped': return 'bg-yellow-100 border-yellow-300 text-yellow-700';
      default: return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };
  
  const getChangeBadge = (percentChange) => {
    if (!percentChange && percentChange !== 0) return null;
    
    const abs = Math.abs(percentChange);
    let badgeClass = '';
    let icon = '';
    
    if (percentChange > 0) {
      // Pior desempenho (tempo maior)
      if (percentChange > 25) {
        badgeClass = 'bg-red-100 text-red-700';
        icon = '↑';
      } else if (percentChange > 10) {
        badgeClass = 'bg-yellow-100 text-yellow-700';
        icon = '↑';
      } else {
        badgeClass = 'bg-gray-100 text-gray-700';
        icon = '↑';
      }
    } else {
      // Melhor desempenho (tempo menor)
      if (abs > 25) {
        badgeClass = 'bg-green-100 text-green-700';
        icon = '↓';
      } else if (abs > 10) {
        badgeClass = 'bg-green-100 text-green-700';
        icon = '↓';
      } else {
        badgeClass = 'bg-blue-100 text-blue-700';
        icon = '↓';
      }
    }
    
    return (
      <span className={\`px-2 py-1 rounded text-xs font-medium \${badgeClass}\`}>
        {icon} {percentChange.toFixed(2)}%
      </span>
    );
  };
  
  // Componentes de interface
  const TabButton = ({ id, label, active }) => (
    <button
      className={\`px-4 py-2 font-medium rounded-t-lg \${
        active 
          ? 'bg-white border-b-2 border-blue-500 text-blue-600' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }\`}
      onClick={() => setActiveSection(id)}
    >
      {label}
    </button>
  );
  
  // Seções do componente
  const SummarySection = () => (
    <div className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-500 text-white p-4 rounded shadow text-center">
          <h3 className="font-semibold text-lg">Total</h3>
          <p className="text-3xl font-bold">{testData.summary.total}</p>
        </div>
        <div className="bg-green-500 text-white p-4 rounded shadow text-center">
          <h3 className="font-semibold text-lg">Passou</h3>
          <p className="text-3xl font-bold">{testData.summary.passed}</p>
        </div>
        <div className="bg-red-500 text-white p-4 rounded shadow text-center">
          <h3 className="font-semibold text-lg">Falhou</h3>
          <p className="text-3xl font-bold">{testData.summary.failed}</p>
        </div>
        <div className="bg-yellow-500 text-white p-4 rounded shadow text-center">
          <h3 className="font-semibold text-lg">Pulou</h3>
          <p className="text-3xl font-bold">{testData.summary.skipped}</p>
        </div>
        <div className="bg-purple-500 text-white p-4 rounded shadow text-center">
          <h3 className="font-semibold text-lg">Tempo Total</h3>
          <p className="text-2xl font-bold">{formatDuration(testData.summary.totalTime)}</p>
        </div>
      </div>
      
      <div className="mb-6 bg-white p-4 rounded shadow">
        <h3 className="font-semibold text-lg mb-3">Métricas de Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Tempo Médio</p>
            <p className="text-xl font-semibold">{formatDuration(testData.summary.averageTime)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Mais Rápido</p>
            <p className="text-xl font-semibold">{formatDuration(testData.summary.minTime)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Mais Lento</p>
            <p className="text-xl font-semibold">{formatDuration(testData.summary.maxTime)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Taxa de Sucesso</p>
            <p className="text-xl font-semibold">
              {(testData.summary.passed / testData.summary.total * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
      
      {testData.metrics && testData.metrics.regressions && testData.metrics.regressions.length > 0 && (
        <div className="mb-6 bg-red-50 p-4 rounded shadow border border-red-200">
          <h3 className="font-semibold text-lg mb-3 text-red-700">
            ⚠️ Regressões Detectadas ({testData.metrics.regressions.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-red-100">
                <tr>
                  <th className="px-4 py-2 text-left">Teste</th>
                  <th className="px-4 py-2 text-right">Anterior</th>
                  <th className="px-4 py-2 text-right">Atual</th>
                  <th className="px-4 py-2 text-right">Mudança</th>
                  <th className="px-4 py-2 text-left">Severidade</th>
                </tr>
              </thead>
              <tbody>
                {testData.metrics.regressions.map((reg, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-red-50'}>
                    <td className="px-4 py-2">{reg.testName}</td>
                    <td className="px-4 py-2 text-right">{formatDuration(reg.previous)}</td>
                    <td className="px-4 py-2 text-right">{formatDuration(reg.current)}</td>
                    <td className="px-4 py-2 text-right">
                      {getChangeBadge(reg.percentChange)}
                    </td>
                    <td className="px-4 py-2">
                      <span className={\`px-2 py-1 rounded text-xs font-medium \${
                        reg.severity === 'critical' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }\`}>
                        {reg.severity === 'critical' ? 'Crítica' : 'Alerta'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {testData.metrics && testData.metrics.improvements && testData.metrics.improvements.length > 0 && (
        <div className="mb-6 bg-green-50 p-4 rounded shadow border border-green-200">
          <h3 className="font-semibold text-lg mb-3 text-green-700">
            ✅ Melhorias Detectadas ({testData.metrics.improvements.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-green-100">
                <tr>
                  <th className="px-4 py-2 text-left">Teste</th>
                  <th className="px-4 py-2 text-right">Anterior</th>
                  <th className="px-4 py-2 text-right">Atual</th>
                  <th className="px-4 py-2 text-right">Mudança</th>
                </tr>
              </thead>
              <tbody>
                {testData.metrics.improvements.map((imp, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-green-50'}>
                    <td className="px-4 py-2">{imp.testName}</td>
                    <td className="px-4 py-2 text-right">{formatDuration(imp.previous)}</td>
                    <td className="px-4 py-2 text-right">{formatDuration(imp.current)}</td>
                    <td className="px-4 py-2 text-right">
                      {getChangeBadge(imp.percentChange)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
  
  const TestsSection = () => (
    <div className="mt-4">
      {Object.entries(testData.tests).map(([testName, test]) => (
        <div key={testName} className="mb-4 border rounded shadow overflow-hidden">
          <div className={\`p-4 flex justify-between items-center \${getStatusColor(test.status)}\`}>
            <div>
              <span className="font-semibold">{testName}</span>
              {test.details && test.details.testCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                  {test.details.testCount} casos
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className={\`px-2 py-1 rounded text-xs font-medium \${
                test.status === 'passed' 
                  ? 'bg-green-100 text-green-700' 
                  : test.status === 'skipped'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }\`}>
                {test.status.toUpperCase()}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {formatDuration(test.duration)}
              </span>
              {comparisonData && comparisonData.comparisons && comparisonData.comparisons[testName] && (
                getChangeBadge(comparisonData.comparisons[testName].percentChange)
              )}
            </div>
          </div>
          <div className="p-4 bg-white">
            <div className="flex flex-wrap gap-2 mb-4 bg-gray-50 p-3 rounded">
              <div className="px-3 py-1 bg-gray-100 rounded text-sm">
                <strong>Arquivo:</strong> {test.file}
              </div>
              <div className="px-3 py-1 bg-gray-100 rounded text-sm">
                <strong>Duração:</strong> {formatDuration(test.duration)}
              </div>
              {test.details && test.details.passedTests !== undefined && (
                <div className="px-3 py-1 bg-green-50 text-green-700 rounded text-sm">
                  <strong>Passou:</strong> {test.details.passedTests}
                </div>
              )}
              {test.details && test.details.failedTests !== undefined && (
                <div className="px-3 py-1 bg-red-50 text-red-700 rounded text-sm">
                  <strong>Falhou:</strong> {test.details.failedTests}
                </div>
              )}
              {test.details && test.details.skippedTests !== undefined && (
                <div className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded text-sm">
                  <strong>Pulou:</strong> {test.details.skippedTests}
                </div>
              )}
            </div>
            
            {test.details && test.details.testCases && test.details.testCases.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Casos de Teste</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {test.details.testCases.map((tc, index) => (
                    <div 
                      key={index} 
                      className={\`px-3 py-2 rounded text-sm \${
                        tc.status === 'passed' 
                          ? 'bg-green-50 text-green-700' 
                          : tc.status === 'skipped'
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-red-50 text-red-700'
                      }\`}
                    >
                      <strong>{tc.suite}</strong> - {tc.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {test.errors && (
              <div className="mt-3">
                <h4 className="font-medium mb-2">Erros</h4>
                <pre className="bg-red-50 text-red-700 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                  {test.errors}
                </pre>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-bold mb-2">Relatório de Testes - Sistema Avançado de Renderização</h2>
      <div className="text-sm text-gray-600 mb-4">
        <p><strong>ID de Execução:</strong> {testData.runId}</p>
        <p><strong>Iniciado em:</strong> {new Date(testData.start).toLocaleString()}</p>
        <p><strong>Finalizado em:</strong> {new Date(testData.end).toLocaleString()}</p>
      </div>
      
      <div className="flex space-x-2 border-b mb-4">
        <TabButton id="summary" label="Resumo" active={activeSection === 'summary'} />
        <TabButton id="tests" label="Testes Detalhados" active={activeSection === 'tests'} />
      </div>
      
      {activeSection === 'summary' && <SummarySection />}
      {activeSection === 'tests' && <TestsSection />}
    </div>
  );
};

export default RenderingTestResults;
  `;
  
  return reactComponent;
}

/**
 * Gerar código para usar artifact do Claude para visualizar resultados
 * @param {string} reportPath - Caminho completo para o arquivo de relatório JSON
 * @returns {string} Código para uso no Claude
 */
function generateClaudeUsageExample(reportPath) {
  const reportFilename = path.basename(reportPath);
  const baseName = reportFilename.replace('.json', '');
  
  const usage = `
Para visualizar os resultados dos testes de integração do sistema avançado de renderização, você pode usar o seguinte artifact:

\`\`\`javascript
// Componente React para visualização dos resultados de teste
import React from 'react';
import RenderingTestResults from './rendering-test-results';

const VisualizarResultados = () => {
  return <RenderingTestResults />;
};

export default VisualizarResultados;
\`\`\`

Este componente mostra um resumo interativo dos resultados do teste "${baseName}", incluindo:
- Estatísticas gerais (testes passados, falhos, pulados)
- Métricas de performance e duração
- Comparações com execuções anteriores
- Detalhes de cada teste e caso de teste
- Regressões e melhorias de performance detectadas

Os dados são carregados automaticamente pelo componente, sem necessidade de importação adicional.
  `;
  
  return usage;
}

module.exports = {
  formatDuration,
  generateClaudeArtifact,
  generateClaudeUsageExample
};
