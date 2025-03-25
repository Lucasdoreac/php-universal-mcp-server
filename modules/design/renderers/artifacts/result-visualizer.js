/**
 * Result Visualizer para integração com artifacts do Claude
 * 
 * Este módulo fornece funcionalidade para gerar visualizações interativas
 * dos resultados de testes de carga do renderizador progressivo, que podem
 * ser exibidas como artifacts no Claude.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

class ResultVisualizer {
  /**
   * Construtor
   * @param {Object} options - Opções de configuração
   */
  constructor(options = {}) {
    this.options = {
      maxDataPoints: 20, // Limitar para visualizações melhores nos artifacts
      formatOptions: {
        time: { maximumFractionDigits: 2 },
        memory: { maximumFractionDigits: 1 },
        percentage: { maximumFractionDigits: 1 }
      },
      colors: {
        progressive: {
          primary: '#3b82f6', // blue-500
          secondary: '#93c5fd', // blue-300
          background: 'rgba(59, 130, 246, 0.1)',
          border: 'rgba(59, 130, 246, 0.8)'
        },
        standard: {
          primary: '#ef4444', // red-500
          secondary: '#fca5a5', // red-300
          background: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.8)'
        },
        streaming: {
          primary: '#10b981', // emerald-500
          secondary: '#6ee7b7', // emerald-300
          background: 'rgba(16, 185, 129, 0.1)',
          border: 'rgba(16, 185, 129, 0.8)'
        },
        chunked: {
          primary: '#f59e0b', // amber-500
          secondary: '#fcd34d', // amber-300
          background: 'rgba(245, 158, 11, 0.1)',
          border: 'rgba(245, 158, 11, 0.8)'
        }
      },
      ...options
    };
  }

  /**
   * Gera um componente React para visualizar resultados de testes
   * @param {Object} results - Resultados dos testes
   * @param {string} type - Tipo de visualização (summary, comparison, templates, time, memory)
   * @returns {string} Código do componente React
   */
  generateReactComponent(results, type = 'summary') {
    // Validar resultados
    if (!results || typeof results !== 'object') {
      return this._generateErrorComponent('Resultados inválidos');
    }

    // Escolher o tipo de visualização
    switch (type.toLowerCase()) {
      case 'summary':
        return this._generateSummaryComponent(results);
      case 'comparison':
        return this._generateComparisonComponent(results);
      case 'templates':
        return this._generateTemplatesComponent(results);
      case 'time':
        return this._generateTimeComponent(results);
      case 'memory':
        return this._generateMemoryComponent(results);
      default:
        return this._generateSummaryComponent(results);
    }
  }

  /**
   * Gera um componente de erro
   * @param {string} message - Mensagem de erro
   * @returns {string} Código do componente React
   * @private
   */
  _generateErrorComponent(message) {
    return `
import React from 'react';

export default function ErrorComponent() {
  return (
    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
      <h2 className="text-lg font-semibold mb-2">Erro na Visualização</h2>
      <p>${message}</p>
    </div>
  );
}`;
  }

  /**
   * Gera um componente de resumo dos resultados
   * @param {Object} results - Resultados dos testes
   * @returns {string} Código do componente React
   * @private
   */
  _generateSummaryComponent(results) {
    // Extrair dados relevantes
    const summary = results.analysis ? results.analysis.summary : results.summary;
    const recommendations = results.analysis ? 
      results.analysis.optimizationPriorities || results.analysis.recommendations : 
      results.recommendations || [];
    
    const templates = Object.keys(results.details || results.templates || {}).length;
    
    // Obter métricas progressivas vs padrão, se disponíveis
    let comparativeData = null;
    if (summary && summary.progressive && summary.standard) {
      comparativeData = {
        time: {
          progressive: summary.progressive.avgTime,
          standard: summary.standard.avgTime,
          difference: summary.comparison.avgTimeDiff,
          percentDiff: summary.comparison.avgTimePercentDiff
        },
        memory: {
          progressive: summary.progressive.avgMemory,
          standard: summary.standard.avgMemory,
          difference: summary.comparison.avgMemoryDiff,
          percentDiff: summary.comparison.avgMemoryPercentDiff
        }
      };
    }
    
    return `
import React from 'react';

export default function PerformanceSummary() {
  // Definição do resultado dos testes
  const testData = {
    templates: ${templates},
    comparativeData: ${JSON.stringify(comparativeData)},
    recommendations: ${JSON.stringify(recommendations.slice(0, 3))}
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Resumo de Desempenho do Renderizador Progressivo
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow-md">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Visão Geral</h2>
          <p className="mb-2">
            <span className="font-medium">Templates testados:</span> {testData.templates}
          </p>
          
          {testData.comparativeData ? (
            <>
              <div className="mt-4 mb-2">
                <h3 className="font-medium text-gray-700">Comparação de Tempo</h3>
                <div className="flex items-center mt-1">
                  <div 
                    className="h-4 bg-blue-500 rounded-l" 
                    style={{ width: \`\${Math.min(100, (testData.comparativeData.time.progressive / testData.comparativeData.time.standard) * 100)}%\` }}
                  ></div>
                  <div 
                    className="h-4 bg-red-500 rounded-r" 
                    style={{ width: \`\${Math.min(100, (testData.comparativeData.time.standard / testData.comparativeData.time.progressive) * 100)}%\` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>Progressivo: {testData.comparativeData.time.progressive.toFixed(2)}ms</span>
                  <span>Padrão: {testData.comparativeData.time.standard.toFixed(2)}ms</span>
                </div>
                <p className="text-sm mt-1">
                  {testData.comparativeData.time.percentDiff > 0 ? (
                    <span className="text-red-600">
                      {Math.abs(testData.comparativeData.time.percentDiff).toFixed(1)}% mais lento
                    </span>
                  ) : (
                    <span className="text-green-600">
                      {Math.abs(testData.comparativeData.time.percentDiff).toFixed(1)}% mais rápido
                    </span>
                  )}
                </p>
              </div>
              
              <div className="mt-4">
                <h3 className="font-medium text-gray-700">Comparação de Memória</h3>
                <div className="flex items-center mt-1">
                  <div 
                    className="h-4 bg-blue-500 rounded-l" 
                    style={{ width: \`\${Math.min(100, (testData.comparativeData.memory.progressive / testData.comparativeData.memory.standard) * 100)}%\` }}
                  ></div>
                  <div 
                    className="h-4 bg-red-500 rounded-r" 
                    style={{ width: \`\${Math.min(100, (testData.comparativeData.memory.standard / testData.comparativeData.memory.progressive) * 100)}%\` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>Progressivo: {testData.comparativeData.memory.progressive.toFixed(1)}MB</span>
                  <span>Padrão: {testData.comparativeData.memory.standard.toFixed(1)}MB</span>
                </div>
                <p className="text-sm mt-1">
                  {testData.comparativeData.memory.percentDiff > 0 ? (
                    <span className="text-red-600">
                      {Math.abs(testData.comparativeData.memory.percentDiff).toFixed(1)}% mais memória
                    </span>
                  ) : (
                    <span className="text-green-600">
                      {Math.abs(testData.comparativeData.memory.percentDiff).toFixed(1)}% menos memória
                    </span>
                  )}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 mt-2">
              Dados comparativos não disponíveis
            </p>
          )}
        </div>
        
        <div className="bg-white p-4 rounded shadow-md">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Recomendações Principais</h2>
          
          {testData.recommendations && testData.recommendations.length > 0 ? (
            <ul className="space-y-3">
              {testData.recommendations.map((rec, index) => (
                <li key={index} className="border-l-4 border-blue-500 pl-3 py-1">
                  <h3 className="font-medium">{rec.title || \`Recomendação \${index + 1}\`}</h3>
                  <p className="text-sm text-gray-600">{rec.description}</p>
                  <div className="mt-1 text-xs text-gray-500 flex items-center">
                    <span className="inline-block w-16">Impacto:</span>
                    <div className="h-2 bg-gray-200 rounded-full flex-grow">
                      <div 
                        className="h-2 bg-blue-500 rounded-full" 
                        style={{ width: \`\${(rec.impact || 5) * 10}%\` }}
                      ></div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              Nenhuma recomendação disponível
            </p>
          )}
        </div>
      </div>
      
      <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm text-gray-600">
        <p>Este resumo foi gerado a partir dos testes de carga do renderizador progressivo. Para análises mais detalhadas, execute o script de análise completa.</p>
      </div>
    </div>
  );
}`;
  }

  /**
   * Gera um componente de comparação entre renderizadores
   * @param {Object} results - Resultados dos testes
   * @returns {string} Código do componente React
   * @private
   */
  _generateComparisonComponent(results) {
    // Extrair dados comparativos
    let comparisons = [];
    
    // Verificar se temos resultados de comparação entre renderizadores
    const rendererComparison = results.testResults && 
      results.testResults.find(r => r.testName === 'renderer-comparison');
    
    if (rendererComparison && rendererComparison.comparisons) {
      comparisons = rendererComparison.comparisons.map(comp => ({
        renderer: comp.renderer,
        time: comp.renderTime,
        memory: comp.memoryDelta.heapUsed / (1024 * 1024), // Converter para MB
        success: comp.successful
      }));
    } else {
      // Tentar extrair comparações de outro formato
      const variants = results.variants || (results.analysis && results.analysis.variants);
      
      if (variants) {
        Object.entries(variants).forEach(([variant, data]) => {
          comparisons.push({
            renderer: variant,
            time: data.avgTime,
            memory: data.avgMemory,
            success: true
          });
        });
      }
    }
    
    // Se ainda não temos comparações, verificar se temos pelo menos a progressiva e a padrão
    if (comparisons.length === 0 && results.analysis && results.analysis.summary) {
      const summary = results.analysis.summary;
      
      if (summary.progressive) {
        comparisons.push({
          renderer: 'Progressive',
          time: summary.progressive.avgTime,
          memory: summary.progressive.avgMemory,
          success: true
        });
      }
      
      if (summary.standard) {
        comparisons.push({
          renderer: 'Standard',
          time: summary.standard.avgTime,
          memory: summary.standard.avgMemory,
          success: true
        });
      }
    }
    
    // Ordenar por tempo
    comparisons.sort((a, b) => a.time - b.time);
    
    // Calcular métricas relativas
    if (comparisons.length > 0) {
      const bestTime = Math.min(...comparisons.filter(c => c.success).map(c => c.time));
      const bestMemory = Math.min(...comparisons.filter(c => c.success).map(c => c.memory));
      
      comparisons = comparisons.map(comp => ({
        ...comp,
        timeRatio: comp.success ? (comp.time / bestTime) : null,
        memoryRatio: comp.success ? (comp.memory / bestMemory) : null
      }));
    }
    
    return `
import React from 'react';

export default function RendererComparison() {
  // Dados de comparação entre renderizadores
  const comparisons = ${JSON.stringify(comparisons)};
  
  // Cores para diferentes renderizadores
  const colors = {
    Progressive: { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-100' },
    Standard: { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-100' },
    EnhancedProgressiveRenderer: { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-100' },
    PerformanceOptimizer: { bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-100' },
    streaming: { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-100' },
    chunked: { bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-100' },
    progressive: { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-100' },
    basic: { bg: 'bg-gray-500', text: 'text-gray-700', light: 'bg-gray-100' }
  };
  
  // Determinar o melhor renderizador
  const getRendererColor = (name) => {
    const normalizedName = name.toLowerCase();
    for (const [key, value] of Object.entries(colors)) {
      if (normalizedName.includes(key.toLowerCase())) {
        return value;
      }
    }
    return { bg: 'bg-gray-500', text: 'text-gray-700', light: 'bg-gray-100' };
  };
  
  // Formatador para números
  const formatNumber = (num, decimals = 2) => {
    return num !== null && num !== undefined 
      ? Number(num).toFixed(decimals) 
      : 'N/A';
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Comparação entre Estratégias de Renderização
      </h1>
      
      {comparisons.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full bg-white shadow rounded">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Renderizador</th>
                  <th className="px-4 py-2 text-right">Tempo (ms)</th>
                  <th className="px-4 py-2 text-right">Memória (MB)</th>
                  <th className="px-4 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((comp, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 border-t">
                      <div className="flex items-center">
                        <div className={
                          \`w-3 h-3 rounded-full mr-2 \${getRendererColor(comp.renderer).bg}\`
                        }></div>
                        <span className="font-medium">{comp.renderer}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-t text-right">
                      {comp.success ? (
                        <div className="flex items-center justify-end">
                          <span>{formatNumber(comp.time)}</span>
                          {comp.timeRatio && comp.timeRatio > 1 && (
                            <span className="text-red-500 text-xs ml-1">
                              (+{formatNumber((comp.timeRatio - 1) * 100, 1)}%)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-red-500">Falha</span>
                      )}
                    </td>
                    <td className="px-4 py-3 border-t text-right">
                      {comp.success ? (
                        <div className="flex items-center justify-end">
                          <span>{formatNumber(comp.memory, 1)}</span>
                          {comp.memoryRatio && comp.memoryRatio > 1 && (
                            <span className="text-red-500 text-xs ml-1">
                              (+{formatNumber((comp.memoryRatio - 1) * 100, 1)}%)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-red-500">Falha</span>
                      )}
                    </td>
                    <td className="px-4 py-3 border-t text-center">
                      {comp.success ? (
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Sucesso
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Falha
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-semibold mb-3">Comparação de Tempo</h2>
              <div className="space-y-3">
                {comparisons.filter(c => c.success).map((comp, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={getRendererColor(comp.renderer).text}>
                        {comp.renderer}
                      </span>
                      <span>{formatNumber(comp.time)}ms</span>
                    </div>
                    <div className="w-full h-4 bg-gray-200 rounded-full">
                      <div 
                        className={\`h-4 rounded-full \${getRendererColor(comp.renderer).bg}\`}
                        style={{ width: \`\${comp.timeRatio ? (1/comp.timeRatio) * 100 : 0}%\` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-semibold mb-3">Comparação de Memória</h2>
              <div className="space-y-3">
                {comparisons.filter(c => c.success).map((comp, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={getRendererColor(comp.renderer).text}>
                        {comp.renderer}
                      </span>
                      <span>{formatNumber(comp.memory, 1)}MB</span>
                    </div>
                    <div className="w-full h-4 bg-gray-200 rounded-full">
                      <div 
                        className={\`h-4 rounded-full \${getRendererColor(comp.renderer).bg}\`}
                        style={{ width: \`\${comp.memoryRatio ? (1/comp.memoryRatio) * 100 : 0}%\` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded">
          <p className="font-medium">Dados de comparação não disponíveis</p>
          <p className="text-sm mt-1">Execute testes com a opção --compare para gerar dados comparativos</p>
        </div>
      )}
    </div>
  );
}`;
  }

  /**
   * Gera um componente de visualização de templates
   * @param {Object} results - Resultados dos testes
   * @returns {string} Código do componente React
   * @private
   */
  _generateTemplatesComponent(results) {
    // Extrair dados dos templates
    let templates = [];
    
    // Obter dados de análise de templates
    if (results.analysis && results.analysis.details) {
      templates = Object.entries(results.analysis.details).map(([name, detail]) => ({
        name,
        components: detail.info.componentCount,
        size: detail.info.size / 1024, // KB
        time: detail.stats.progressive.avgTime,
        memory: detail.stats.progressive.peakMemory,
        performance: detail.performanceClass,
        issues: detail.issues.length
      }));
    } else if (results.details) {
      templates = Object.entries(results.details).map(([name, detail]) => ({
        name,
        components: detail.info.componentCount,
        size: detail.info.size / 1024, // KB
        time: detail.stats.progressive.avgTime,
        memory: detail.stats.progressive.peakMemory,
        performance: detail.performanceClass || 'unknown',
        issues: detail.issues ? detail.issues.length : 0
      }));
    } else if (results.templates) {
      templates = Object.entries(results.templates).map(([name, detail]) => ({
        name,
        components: detail.componentCount || 'N/A',
        size: (detail.size || 0) / 1024, // KB
        time: detail.renderTime || detail.avgTime || 0,
        memory: detail.memoryUsage || detail.peakMemory || 0,
        performance: detail.performance || 'unknown',
        issues: detail.issues || 0
      }));
    }
    
    // Limitar a quantidade de templates para visualização
    if (templates.length > this.options.maxDataPoints) {
      templates = templates.slice(0, this.options.maxDataPoints);
    }
    
    return `
import React, { useState } from 'react';

export default function TemplatesOverview() {
  // Dados dos templates testados
  const templates = ${JSON.stringify(templates)};
  
  // Estado para ordenação
  const [sortField, setSortField] = useState('time');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Função para alternar ordenação
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Ordenar templates com base no estado
  const sortedTemplates = [...templates].sort((a, b) => {
    let comparison = 0;
    
    // Para campos numéricos
    if (['components', 'size', 'time', 'memory', 'issues'].includes(sortField)) {
      // Converter para número se for string
      const aValue = typeof a[sortField] === 'string' ? parseInt(a[sortField], 10) || 0 : a[sortField];
      const bValue = typeof b[sortField] === 'string' ? parseInt(b[sortField], 10) || 0 : b[sortField];
      
      comparison = aValue - bValue;
    } 
    // Para campos de texto
    else {
      comparison = a[sortField].localeCompare(b[sortField]);
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Classes para indicar desempenho
  const performanceClasses = {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-blue-100 text-blue-800',
    fair: 'bg-yellow-100 text-yellow-800',
    poor: 'bg-red-100 text-red-800',
    unknown: 'bg-gray-100 text-gray-800'
  };
  
  // Formatador para números
  const formatNumber = (num, decimals = 2) => {
    if (num === 'N/A' || num === undefined || num === null) return 'N/A';
    return typeof num === 'number' ? num.toFixed(decimals) : num;
  };
  
  // Renderizador de seta para indicar ordenação
  const renderSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Desempenho por Template
      </h1>
      
      <div className="mb-6 bg-white shadow rounded overflow-hidden overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => toggleSort('name')}>
                Template {renderSortArrow('name')}
              </th>
              <th className="px-4 py-2 text-right cursor-pointer" onClick={() => toggleSort('components')}>
                Componentes {renderSortArrow('components')}
              </th>
              <th className="px-4 py-2 text-right cursor-pointer" onClick={() => toggleSort('size')}>
                Tamanho (KB) {renderSortArrow('size')}
              </th>
              <th className="px-4 py-2 text-right cursor-pointer" onClick={() => toggleSort('time')}>
                Tempo (ms) {renderSortArrow('time')}
              </th>
              <th className="px-4 py-2 text-right cursor-pointer" onClick={() => toggleSort('memory')}>
                Memória (MB) {renderSortArrow('memory')}
              </th>
              <th className="px-4 py-2 text-center cursor-pointer" onClick={() => toggleSort('performance')}>
                Desempenho {renderSortArrow('performance')}
              </th>
              <th className="px-4 py-2 text-center cursor-pointer" onClick={() => toggleSort('issues')}>
                Problemas {renderSortArrow('issues')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTemplates.map((template, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 border-t font-medium">{template.name}</td>
                <td className="px-4 py-3 border-t text-right">{template.components}</td>
                <td className="px-4 py-3 border-t text-right">{formatNumber(template.size, 1)}</td>
                <td className="px-4 py-3 border-t text-right">{formatNumber(template.time, 2)}</td>
                <td className="px-4 py-3 border-t text-right">{formatNumber(template.memory, 1)}</td>
                <td className="px-4 py-3 border-t text-center">
                  <span className={\`inline-block px-2 py-1 text-xs font-semibold rounded-full \${
                    performanceClasses[template.performance] || performanceClasses.unknown
                  }\`}>
                    {template.performance}
                  </span>
                </td>
                <td className="px-4 py-3 border-t text-center">
                  {template.issues > 0 ? (
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      {template.issues}
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      0
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Tempo por Componente</h2>
          <div className="h-40 relative">
            {sortedTemplates.map((template, index) => {
              // Calcular tempo por componente
              const componentsNum = parseInt(template.components, 10) || 1;
              const timePerComponent = template.time / componentsNum;
              
              // Encontrar o valor máximo para escala
              const maxTime = Math.max(...sortedTemplates.map(t => {
                const comp = parseInt(t.components, 10) || 1;
                return t.time / comp;
              }));
              
              // Calcular altura da barra (max 90%)
              const barHeight = (timePerComponent / maxTime) * 90;
              
              return (
                <div 
                  key={index}
                  className="absolute bottom-0 bg-blue-500 hover:bg-blue-600 transition-all duration-200"
                  style={{
                    height: \`\${barHeight}%\`,
                    left: \`\${(index / sortedTemplates.length) * 100}%\`,
                    width: \`\${90 / sortedTemplates.length}%\`,
                    marginLeft: \`\${5 / sortedTemplates.length}%\`
                  }}
                  title={\`\${template.name}: \${timePerComponent.toFixed(2)}ms por componente\`}
                >
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            Altura representa tempo (ms) por componente
          </div>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Distribuição de Desempenho</h2>
          
          {templates.length > 0 ? (
            <div>
              {/* Calcular contagem por categoria */}
              {(() => {
                const counts = {
                  excellent: templates.filter(t => t.performance === 'excellent').length,
                  good: templates.filter(t => t.performance === 'good').length,
                  fair: templates.filter(t => t.performance === 'fair').length,
                  poor: templates.filter(t => t.performance === 'poor').length,
                  unknown: templates.filter(t => t.performance === 'unknown').length
                };
                
                // Gerar gráfico de barras simples
                return (
                  <div className="space-y-2">
                    {Object.entries(counts).map(([category, count]) => (
                      <div key={category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={\`\${performanceClasses[category].split(' ')[1]}\`}>
                            {category}
                          </span>
                          <span>{count} ({Math.round((count / templates.length) * 100)}%)</span>
                        </div>
                        <div className="w-full h-6 bg-gray-200 rounded-full">
                          <div 
                            className={\`h-6 rounded-full \${performanceClasses[category].split(' ')[0]}\`}
                            style={{ width: \`\${(count / templates.length) * 100}%\` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6">
              Dados de desempenho não disponíveis
            </p>
          )}
        </div>
      </div>
    </div>
  );
}`;
  }

  /**
   * Gera um componente de visualização de tempos
   * @param {Object} results - Resultados dos testes
   * @returns {string} Código do componente React
   * @private
   */
  _generateTimeComponent(results) {
    // Extrair dados de tempo
    let timeData = [];
    
    // Tentar extrair de diferentes formatos
    if (results.analysis && results.analysis.details) {
      timeData = Object.entries(results.analysis.details).map(([name, detail]) => ({
        template: name,
        time: detail.stats.progressive.avgTime,
        min: detail.stats.progressive.minTime || detail.stats.progressive.avgTime * 0.9,
        max: detail.stats.progressive.maxTime || detail.stats.progressive.avgTime * 1.1,
        components: detail.info.componentCount,
        size: detail.info.size / 1024 // KB
      }));
    } else if (results.details) {
      timeData = Object.entries(results.details).map(([name, detail]) => ({
        template: name,
        time: detail.stats.progressive.avgTime,
        min: detail.stats.progressive.minTime || detail.stats.progressive.avgTime * 0.9,
        max: detail.stats.progressive.maxTime || detail.stats.progressive.avgTime * 1.1,
        components: detail.info.componentCount || detail.componentCount || 'N/A',
        size: (detail.info.size || detail.size || 0) / 1024 // KB
      }));
    } else if (results.templates) {
      timeData = Object.entries(results.templates).map(([name, detail]) => ({
        template: name,
        time: detail.renderTime || detail.avgTime || 0,
        min: detail.minTime || (detail.renderTime || detail.avgTime || 0) * 0.9,
        max: detail.maxTime || (detail.renderTime || detail.avgTime || 0) * 1.1,
        components: detail.componentCount || 'N/A',
        size: (detail.size || 0) / 1024 // KB
      }));
    }
    
    // Ordenar por tempo (decrescente)
    timeData.sort((a, b) => b.time - a.time);
    
    // Limitar a quantidade de templates para visualização
    if (timeData.length > this.options.maxDataPoints) {
      timeData = timeData.slice(0, this.options.maxDataPoints);
    }
    
    // Extrair correlações se disponíveis
    let correlations = null;
    if (results.analysis && results.analysis.summary && results.analysis.summary.correlations) {
      correlations = results.analysis.summary.correlations;
    }
    
    return `
import React from 'react';

export default function TimeAnalysis() {
  // Dados de tempo por template
  const timeData = ${JSON.stringify(timeData)};
  
  // Correlações
  const correlations = ${JSON.stringify(correlations)};
  
  // Calcular métricas gerais
  const avgTime = timeData.length > 0 
    ? timeData.reduce((sum, item) => sum + item.time, 0) / timeData.length 
    : 0;
  
  // Função para formatar número
  const formatNumber = (num, decimals = 2) => {
    if (num === 'N/A' || num === undefined || num === null) return 'N/A';
    return typeof num === 'number' ? num.toFixed(decimals) : num;
  };
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Análise de Tempo de Renderização
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded shadow p-4 text-center">
          <p className="text-sm text-gray-500 mb-1">Tempo Médio</p>
          <p className="text-3xl font-bold text-blue-600">{formatNumber(avgTime)}ms</p>
        </div>
        
        <div className="bg-white rounded shadow p-4 text-center">
          <p className="text-sm text-gray-500 mb-1">Template Mais Lento</p>
          <p className="text-3xl font-bold text-red-600">
            {timeData.length > 0 ? formatNumber(timeData[0].time) : 'N/A'}ms
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {timeData.length > 0 ? timeData[0].template : ''}
          </p>
        </div>
        
        <div className="bg-white rounded shadow p-4 text-center">
          <p className="text-sm text-gray-500 mb-1">Template Mais Rápido</p>
          <p className="text-3xl font-bold text-green-600">
            {timeData.length > 0 ? formatNumber(timeData[timeData.length - 1].time) : 'N/A'}ms
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {timeData.length > 0 ? timeData[timeData.length - 1].template : ''}
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded shadow overflow-hidden mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Tempo por Template</h2>
        </div>
        
        <div className="p-4">
          <div className="h-64 relative">
            {timeData.map((item, index) => (
              <div 
                key={index} 
                className="group absolute bottom-0 flex flex-col items-center"
                style={{
                  left: \`\${(index / timeData.length) * 100}%\`,
                  width: \`\${90 / timeData.length}%\`,
                  marginLeft: \`\${5 / timeData.length}%\`
                }}
              >
                {/* Barra principal */}
                <div 
                  className="w-full bg-blue-500 group-hover:bg-blue-600 transition-all cursor-pointer"
                  style={{
                    height: \`\${(item.time / Math.max(...timeData.map(t => t.max))) * 100}%\`,
                    minHeight: '4px'
                  }}
                  title={\`\${item.template}: \${formatNumber(item.time)}ms\`}
                >
                  {/* Tooltip */}
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                    <p className="font-bold">{item.template}</p>
                    <p>Tempo: {formatNumber(item.time)}ms</p>
                    <p>Min: {formatNumber(item.min)}ms</p>
                    <p>Max: {formatNumber(item.max)}ms</p>
                    <p>Componentes: {item.components}</p>
                    <p>Tamanho: {formatNumber(item.size, 1)}KB</p>
                  </div>
                </div>
                
                {/* Rótulo */}
                <div className="text-xs -rotate-45 origin-top-left mt-2 truncate w-20 text-gray-500">
                  {item.template.split('.')[0]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {correlations && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-lg font-semibold mb-3">Correlações</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Componentes vs. Tempo</span>
                  <span className="text-sm font-medium">{formatNumber(correlations.componentsVsTime, 3)}</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full">
                  <div 
                    className="h-3 rounded-full bg-blue-500"
                    style={{ width: \`\${Math.abs(correlations.componentsVsTime) * 100}%\` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.abs(correlations.componentsVsTime) > 0.7 ? (
                    correlations.componentsVsTime > 0 
                      ? 'Forte correlação positiva: mais componentes = mais tempo' 
                      : 'Forte correlação negativa: mais componentes = menos tempo'
                  ) : Math.abs(correlations.componentsVsTime) > 0.3 ? (
                    'Correlação moderada'
                  ) : (
                    'Correlação fraca'
                  )}
                </p>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Tamanho vs. Tempo</span>
                  <span className="text-sm font-medium">{formatNumber(correlations.sizeVsTime, 3)}</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full">
                  <div 
                    className="h-3 rounded-full bg-green-500"
                    style={{ width: \`\${Math.abs(correlations.sizeVsTime) * 100}%\` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.abs(correlations.sizeVsTime) > 0.7 ? (
                    correlations.sizeVsTime > 0 
                      ? 'Forte correlação positiva: templates maiores = mais tempo' 
                      : 'Forte correlação negativa: templates maiores = menos tempo'
                  ) : Math.abs(correlations.sizeVsTime) > 0.3 ? (
                    'Correlação moderada'
                  ) : (
                    'Correlação fraca'
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-lg font-semibold mb-3">Insights</h2>
            
            <div className="prose prose-sm">
              <ul>
                {avgTime > 1000 && (
                  <li className="text-red-600">
                    O tempo médio de renderização ({formatNumber(avgTime)}ms) é muito alto. 
                    Considere otimizações de performance.
                  </li>
                )}
                
                {avgTime > 500 && avgTime <= 1000 && (
                  <li className="text-yellow-600">
                    O tempo médio de renderização ({formatNumber(avgTime)}ms) está aceitável,
                    mas pode ser melhorado.
                  </li>
                )}
                
                {avgTime <= 500 && (
                  <li className="text-green-600">
                    O tempo médio de renderização ({formatNumber(avgTime)}ms) está bom!
                  </li>
                )}
                
                {correlations && Math.abs(correlations.componentsVsTime) > 0.7 && (
                  <li>
                    Há uma forte correlação entre quantidade de componentes e tempo de renderização.
                    {correlations.componentsVsTime > 0 
                      ? ' Foque em otimizar templates com muitos componentes.'
                      : ' Surpreendentemente, templates com mais componentes são renderizados mais rapidamente.'}
                  </li>
                )}
                
                {correlations && Math.abs(correlations.sizeVsTime) > 0.7 && (
                  <li>
                    Há uma forte correlação entre tamanho do template e tempo de renderização.
                    {correlations.sizeVsTime > 0 
                      ? ' Considere otimizações para templates grandes.'
                      : ' Surpreendentemente, templates maiores são renderizados mais rapidamente.'}
                  </li>
                )}
                
                {timeData.length > 1 && 
                  (timeData[0].time / timeData[timeData.length - 1].time) > 3 && (
                  <li className="text-yellow-600">
                    Há uma grande disparidade entre o template mais rápido e o mais lento 
                    ({(timeData[0].time / timeData[timeData.length - 1].time).toFixed(1)}x).
                    Analise o que torna o template mais lento e otimize.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;
  }

  /**
   * Gera um componente de visualização de uso de memória
   * @param {Object} results - Resultados dos testes
   * @returns {string} Código do componente React
   * @private
   */
  _generateMemoryComponent(results) {
    // Extrair dados de memória
    let memoryData = [];
    
    // Tentar extrair de diferentes formatos
    if (results.analysis && results.analysis.details) {
      memoryData = Object.entries(results.analysis.details).map(([name, detail]) => ({
        template: name,
        memory: detail.stats.progressive.peakMemory,
        components: detail.info.componentCount,
        size: detail.info.size / 1024, // KB
        time: detail.stats.progressive.avgTime
      }));
    } else if (results.details) {
      memoryData = Object.entries(results.details).map(([name, detail]) => ({
        template: name,
        memory: detail.stats.progressive.peakMemory,
        components: detail.info.componentCount || detail.componentCount || 'N/A',
        size: (detail.info.size || detail.size || 0) / 1024, // KB
        time: detail.stats.progressive.avgTime
      }));
    } else if (results.templates) {
      memoryData = Object.entries(results.templates).map(([name, detail]) => ({
        template: name,
        memory: detail.memoryUsage || detail.peakMemory || 0,
        components: detail.componentCount || 'N/A',
        size: (detail.size || 0) / 1024, // KB
        time: detail.renderTime || detail.avgTime || 0
      }));
    }
    
    // Ordenar por uso de memória (decrescente)
    memoryData.sort((a, b) => b.memory - a.memory);
    
    // Limitar a quantidade de templates para visualização
    if (memoryData.length > this.options.maxDataPoints) {
      memoryData = memoryData.slice(0, this.options.maxDataPoints);
    }
    
    // Extrair correlações se disponíveis
    let correlations = null;
    if (results.analysis && results.analysis.summary && results.analysis.summary.correlations) {
      correlations = results.analysis.summary.correlations;
    }
    
    // Extrair padrões de uso de memória, se disponíveis
    let memoryPatterns = [];
    if (results.analysis && results.analysis.patterns) {
      memoryPatterns = results.analysis.patterns.filter(p => 
        p.type === 'memory_escalation' || p.type.includes('memory')
      );
    }
    
    return `
import React from 'react';

export default function MemoryAnalysis() {
  // Dados de memória por template
  const memoryData = ${JSON.stringify(memoryData)};
  
  // Correlações
  const correlations = ${JSON.stringify(correlations)};
  
  // Padrões de uso de memória
  const memoryPatterns = ${JSON.stringify(memoryPatterns)};
  
  // Calcular métricas gerais
  const avgMemory = memoryData.length > 0 
    ? memoryData.reduce((sum, item) => sum + item.memory, 0) / memoryData.length 
    : 0;
  
  // Função para formatar número
  const formatNumber = (num, decimals = 2) => {
    if (num === 'N/A' || num === undefined || num === null) return 'N/A';
    return typeof num === 'number' ? num.toFixed(decimals) : num;
  };
  
  // Função para determinar a classe de severidade de uso de memória
  const getMemorySeverityClass = (memoryMB) => {
    if (memoryMB > 500) return 'text-red-600';
    if (memoryMB > 200) return 'text-yellow-600';
    return 'text-green-600';
  };
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Análise de Consumo de Memória
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded shadow p-4 text-center">
          <p className="text-sm text-gray-500 mb-1">Uso Médio de Memória</p>
          <p className={\`text-3xl font-bold \${getMemorySeverityClass(avgMemory)}\`}>
            {formatNumber(avgMemory, 1)}MB
          </p>
        </div>
        
        <div className="bg-white rounded shadow p-4 text-center">
          <p className="text-sm text-gray-500 mb-1">Template Mais Intensivo</p>
          <p className="text-3xl font-bold text-red-600">
            {memoryData.length > 0 ? formatNumber(memoryData[0].memory, 1) : 'N/A'}MB
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {memoryData.length > 0 ? memoryData[0].template : ''}
          </p>
        </div>
        
        <div className="bg-white rounded shadow p-4 text-center">
          <p className="text-sm text-gray-500 mb-1">Template Mais Eficiente</p>
          <p className="text-3xl font-bold text-green-600">
            {memoryData.length > 0 ? formatNumber(memoryData[memoryData.length - 1].memory, 1) : 'N/A'}MB
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {memoryData.length > 0 ? memoryData[memoryData.length - 1].template : ''}
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded shadow overflow-hidden mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Consumo de Memória por Template</h2>
        </div>
        
        <div className="p-4">
          <div className="h-64 relative">
            {memoryData.map((item, index) => (
              <div 
                key={index} 
                className="group absolute bottom-0 flex flex-col items-center"
                style={{
                  left: \`\${(index / memoryData.length) * 100}%\`,
                  width: \`\${90 / memoryData.length}%\`,
                  marginLeft: \`\${5 / memoryData.length}%\`
                }}
              >
                {/* Barra principal */}
                <div 
                  className={\`w-full \${
                    item.memory > 500 ? 'bg-red-500 group-hover:bg-red-600' :
                    item.memory > 200 ? 'bg-yellow-500 group-hover:bg-yellow-600' :
                    'bg-green-500 group-hover:bg-green-600'
                  } transition-all cursor-pointer\`}
                  style={{
                    height: \`\${(item.memory / Math.max(...memoryData.map(t => t.memory))) * 100}%\`,
                    minHeight: '4px'
                  }}
                  title={\`\${item.template}: \${formatNumber(item.memory, 1)}MB\`}
                >
                  {/* Tooltip */}
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
                    <p className="font-bold">{item.template}</p>
                    <p>Memória: {formatNumber(item.memory, 1)}MB</p>
                    <p>Componentes: {item.components}</p>
                    <p>Tamanho: {formatNumber(item.size, 1)}KB</p>
                    <p>Tempo: {formatNumber(item.time)}ms</p>
                  </div>
                </div>
                
                {/* Rótulo */}
                <div className="text-xs -rotate-45 origin-top-left mt-2 truncate w-20 text-gray-500">
                  {item.template.split('.')[0]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {correlations && (
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-lg font-semibold mb-3">Correlações de Memória</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Tamanho vs. Memória</span>
                  <span className="text-sm font-medium">
                    {correlations.sizeVsMemory ? formatNumber(correlations.sizeVsMemory, 3) : 'N/A'}
                  </span>
                </div>
                {correlations.sizeVsMemory && (
                  <>
                    <div className="w-full h-3 bg-gray-200 rounded-full">
                      <div 
                        className="h-3 rounded-full bg-green-500"
                        style={{ width: \`\${Math.abs(correlations.sizeVsMemory) * 100}%\` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.abs(correlations.sizeVsMemory) > 0.7 ? (
                        correlations.sizeVsMemory > 0 
                          ? 'Forte correlação: templates maiores consomem mais memória' 
                          : 'Correlação negativa: templates maiores consomem menos memória'
                      ) : Math.abs(correlations.sizeVsMemory) > 0.3 ? (
                        'Correlação moderada'
                      ) : (
                        'Correlação fraca'
                      )}
                    </p>
                  </>
                )}
              </div>
              
              {memoryData.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Memória por Componente</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-1 text-left">Template</th>
                        <th className="p-1 text-right">MB/Componente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memoryData.slice(0, 5).map((item, idx) => {
                        const componentsNum = parseInt(item.components, 10) || 1;
                        const memoryPerComponent = item.memory / componentsNum;
                        
                        return (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="p-1">{item.template}</td>
                            <td className={
                              \`p-1 text-right \${
                                memoryPerComponent > 1 ? 'text-red-600' : 
                                memoryPerComponent > 0.5 ? 'text-yellow-600' : 
                                'text-green-600'
                              }\`
                            }>
                              {formatNumber(memoryPerComponent, 3)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Insights de Memória</h2>
          
          <div className="prose prose-sm">
            <ul>
              {avgMemory > 500 && (
                <li className="text-red-600">
                  O uso médio de memória ({formatNumber(avgMemory, 1)}MB) é muito alto. 
                  Considere implementar estratégias de streaming ou chunking.
                </li>
              )}
              
              {avgMemory > 200 && avgMemory <= 500 && (
                <li className="text-yellow-600">
                  O uso médio de memória ({formatNumber(avgMemory, 1)}MB) está em nível moderado.
                  Monitorar para garantir que não ultrapasse limites seguros.
                </li>
              )}
              
              {avgMemory <= 200 && (
                <li className="text-green-600">
                  O uso médio de memória ({formatNumber(avgMemory, 1)}MB) está em bom nível.
                </li>
              )}
              
              {memoryPatterns.length > 0 && (
                <li className="text-yellow-600">
                  Foram identificados padrões potencialmente problemáticos no uso de memória.
                </li>
              )}
              
              {memoryData.length > 1 && 
                (memoryData[0].memory / memoryData[memoryData.length - 1].memory) > 3 && (
                <li className="text-yellow-600">
                  Há uma grande disparidade entre o template mais eficiente e o mais intensivo 
                  ({(memoryData[0].memory / memoryData[memoryData.length - 1].memory).toFixed(1)}x).
                  Analise o que causa o alto consumo no template mais intensivo.
                </li>
              )}
              
              {correlations && correlations.sizeVsMemory && correlations.sizeVsMemory > 0.9 && (
                <li>
                  Há uma correlação quase perfeita entre tamanho do template e consumo de memória,
                  indicando que o renderizador escala linearmente com o tamanho do template.
                </li>
              )}
            </ul>
          </div>
          
          {memoryPatterns.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Padrões Detectados</h3>
              
              <div className="space-y-2">
                {memoryPatterns.map((pattern, idx) => (
                  <div key={idx} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <p className="font-medium">{pattern.description}</p>
                    {pattern.recommendation && (
                      <p className="mt-1 text-gray-700">{pattern.recommendation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`;
  }
}

module.exports = ResultVisualizer;
