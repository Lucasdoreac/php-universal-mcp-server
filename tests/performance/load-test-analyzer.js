/**
 * Load Test Analyzer para Renderizador Progressivo
 * 
 * Este módulo analisa os resultados dos testes de carga para identificar
 * gargalos de desempenho, padrões de uso de memória e oportunidades de
 * otimização no renderizador progressivo.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const mathjs = require('mathjs');

// Configurações padrão
const DEFAULT_CONFIG = {
  inputDir: path.join(__dirname, 'test-results'),
  outputDir: path.join(__dirname, 'analysis-results'),
  thresholds: {
    timeDiff: 20, // Diferença de tempo considerada significativa (%)
    memoryUsage: 200, // Uso de memória considerado alto (MB)
    outlierThreshold: 2.5 // Desvios padrão para considerar um outlier
  }
};

/**
 * Analisador de testes de carga para renderizador progressivo
 */
class LoadTestAnalyzer {
  /**
   * Construtor do analisador
   * @param {Object} options - Opções de configuração
   */
  constructor(options = {}) {
    this.config = { ...DEFAULT_CONFIG, ...options };
    this.results = {};
    this.analysis = {
      summary: {},
      details: {},
      recommendations: [],
      optimizationPriorities: [],
      patterns: []
    };

    // Configurar sistema de logging
    this.logger = {
      info: (...args) => console.log('\x1b[36m[INFO]\x1b[0m', ...args),
      debug: (...args) => console.log('\x1b[35m[DEBUG]\x1b[0m', ...args),
      error: (...args) => console.error('\x1b[31m[ERROR]\x1b[0m', ...args),
      success: (...args) => console.log('\x1b[32m[SUCCESS]\x1b[0m', ...args),
      warn: (...args) => console.warn('\x1b[33m[WARN]\x1b[0m', ...args),
      table: (data) => console.table(data)
    };
  }

  /**
   * Inicializa o analisador
   */
  async initialize() {
    try {
      // Criar diretório de saída se não existir
      await fs.mkdir(this.config.outputDir, { recursive: true });
      this.logger.success('LoadTestAnalyzer inicializado');
    } catch (error) {
      this.logger.error(`Erro ao inicializar analisador: ${error.message}`);
      throw error;
    }
  }

  /**
   * Carrega os resultados dos testes de carga
   * @param {string} [reportPath] - Caminho opcional para o relatório específico
   */
  async loadResults(reportPath = null) {
    try {
      const filePath = reportPath || path.join(this.config.inputDir, 'full-report.json');
      this.logger.info(`Carregando resultados de: ${filePath}`);
      
      const data = await fs.readFile(filePath, 'utf8');
      this.results = JSON.parse(data);
      
      this.logger.success(`Resultados carregados: ${Object.keys(this.results).length} templates`);
      return this.results;
    } catch (error) {
      this.logger.error(`Erro ao carregar resultados: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analisa todos os resultados de testes
   */
  async analyzeResults() {
    try {
      if (Object.keys(this.results).length === 0) {
        throw new Error('Nenhum resultado carregado para análise');
      }

      this.logger.info('Iniciando análise detalhada dos resultados...');
      
      // Análise geral
      this._analyzeOverallPerformance();
      
      // Análise por template
      this._analyzeTemplateDetails();
      
      // Identificar padrões
      this._identifyPatterns();
      
      // Gerar recomendações
      this._generateRecommendations();
      
      // Priorizar otimizações
      this._prioritizeOptimizations();
      
      // Salvar resultados da análise
      await this._saveAnalysisResults();
      
      this.logger.success('Análise concluída com sucesso!');
      return this.analysis;
    } catch (error) {
      this.logger.error(`Erro ao analisar resultados: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analisa o desempenho geral do renderizador progressivo
   * @private
   */
  _analyzeOverallPerformance() {
    const templates = Object.keys(this.results);
    
    // Calcular métricas gerais
    const progressiveTimes = templates.map(t => this.results[t].progressiveRenderer.averageTime);
    const standardTimes = templates
      .filter(t => this.results[t].standardRenderer)
      .map(t => this.results[t].standardRenderer.averageTime);
    
    const progressiveMemory = templates.map(t => this.results[t].progressiveRenderer.peakMemoryUsage);
    const standardMemory = templates
      .filter(t => this.results[t].standardRenderer)
      .map(t => this.results[t].standardRenderer.peakMemoryUsage);
    
    // Estatísticas para tempo de renderização
    this.analysis.summary.progressive = {
      avgTime: mathjs.mean(progressiveTimes),
      medianTime: mathjs.median(progressiveTimes),
      stdDevTime: mathjs.std(progressiveTimes),
      minTime: mathjs.min(progressiveTimes),
      maxTime: mathjs.max(progressiveTimes),
      avgMemory: mathjs.mean(progressiveMemory),
      medianMemory: mathjs.median(progressiveMemory),
      minMemory: mathjs.min(progressiveMemory),
      maxMemory: mathjs.max(progressiveMemory)
    };
    
    if (standardTimes.length > 0) {
      this.analysis.summary.standard = {
        avgTime: mathjs.mean(standardTimes),
        medianTime: mathjs.median(standardTimes),
        stdDevTime: mathjs.std(standardTimes),
        minTime: mathjs.min(standardTimes),
        maxTime: mathjs.max(standardTimes),
        avgMemory: mathjs.mean(standardMemory),
        medianMemory: mathjs.median(standardMemory),
        minMemory: mathjs.min(standardMemory),
        maxMemory: mathjs.max(standardMemory)
      };
      
      // Comparação
      this.analysis.summary.comparison = {
        avgTimeDiff: this.analysis.summary.progressive.avgTime - this.analysis.summary.standard.avgTime,
        avgTimePercentDiff: ((this.analysis.summary.progressive.avgTime / this.analysis.summary.standard.avgTime) - 1) * 100,
        avgMemoryDiff: this.analysis.summary.progressive.avgMemory - this.analysis.summary.standard.avgMemory,
        avgMemoryPercentDiff: ((this.analysis.summary.progressive.avgMemory / this.analysis.summary.standard.avgMemory) - 1) * 100
      };
    }
    
    // Correlação entre tamanho do template e tempo
    const sizes = templates.map(t => this.results[t].templateInfo.size);
    const componentCounts = templates.map(t => {
      const count = this.results[t].templateInfo.componentCount;
      return typeof count === 'string' && count === 'N/A' ? null : Number(count);
    }).filter(count => count !== null);
    
    if (componentCounts.length > 1) {
      // Correlação entre número de componentes e tempo
      this.analysis.summary.correlations = {
        componentsVsTime: mathjs.correlation(
          componentCounts,
          templates
            .filter(t => {
              const count = this.results[t].templateInfo.componentCount;
              return typeof count !== 'string' || count !== 'N/A';
            })
            .map(t => this.results[t].progressiveRenderer.averageTime)
        ),
        sizeVsTime: mathjs.correlation(sizes, progressiveTimes),
        sizeVsMemory: mathjs.correlation(sizes, progressiveMemory)
      };
    }
    
    this.logger.info('Análise geral de desempenho concluída');
  }

  /**
   * Analisa detalhes de cada template
   * @private
   */
  _analyzeTemplateDetails() {
    const templates = Object.keys(this.results);
    
    for (const template of templates) {
      const result = this.results[template];
      
      // Análise básica
      const detail = {
        name: template,
        info: result.templateInfo,
        stats: {
          progressive: {
            avgTime: result.progressiveRenderer.averageTime,
            times: result.progressiveRenderer.times,
            peakMemory: result.progressiveRenderer.peakMemoryUsage
          },
          outliers: this._detectOutliers(result.progressiveRenderer.times),
          timeVariability: mathjs.std(result.progressiveRenderer.times) / mathjs.mean(result.progressiveRenderer.times) * 100
        }
      };
      
      // Adicionar estatísticas do renderizador padrão se disponíveis
      if (result.standardRenderer) {
        detail.stats.standard = {
          avgTime: result.standardRenderer.averageTime,
          times: result.standardRenderer.times,
          peakMemory: result.standardRenderer.peakMemoryUsage
        };
        
        detail.stats.comparison = {
          timeDiff: result.comparison.timeDifference,
          percentDiff: result.comparison.percentageDifference,
          memoryDiff: result.comparison.memoryDifference
        };
      }
      
      // Classificar o desempenho
      detail.performanceClass = this._classifyPerformance(detail);
      
      // Problemas específicos
      detail.issues = this._identifyIssues(detail);
      
      this.analysis.details[template] = detail;
    }
    
    this.logger.info('Análise detalhada por template concluída');
  }

  /**
   * Detecta outliers nos tempos de execução
   * @param {Array<number>} times - Lista de tempos de execução
   * @returns {Array<number>} - Índices dos outliers
   * @private
   */
  _detectOutliers(times) {
    if (times.length < 3) return [];
    
    const mean = mathjs.mean(times);
    const std = mathjs.std(times);
    const threshold = this.config.thresholds.outlierThreshold;
    
    return times
      .map((time, index) => ({ time, index }))
      .filter(item => Math.abs(item.time - mean) > threshold * std)
      .map(item => item.index);
  }

  /**
   * Classifica o desempenho com base nos resultados
   * @param {Object} detail - Detalhes do template
   * @returns {string} - Classificação de desempenho
   * @private
   */
  _classifyPerformance(detail) {
    // Implementar lógica de classificação
    const stats = detail.stats;
    
    if (stats.standard) {
      if (stats.comparison.percentDiff < -10) {
        return 'excellent'; // Muito melhor que o padrão
      } else if (stats.comparison.percentDiff < 5) {
        return 'good'; // Melhor ou similar ao padrão
      } else if (stats.comparison.percentDiff < 20) {
        return 'fair'; // Um pouco pior que o padrão
      } else {
        return 'poor'; // Muito pior que o padrão
      }
    } else {
      // Classificação absoluta caso não haja comparação
      const componentCount = Number(detail.info.componentCount);
      if (isNaN(componentCount)) return 'unknown';
      
      // Valores de referência para tempos esperados
      const expectedTime = componentCount * 0.1; // 0.1ms por componente é uma estimativa
      
      if (stats.progressive.avgTime < expectedTime * 0.7) {
        return 'excellent';
      } else if (stats.progressive.avgTime < expectedTime * 1.2) {
        return 'good';
      } else if (stats.progressive.avgTime < expectedTime * 2) {
        return 'fair';
      } else {
        return 'poor';
      }
    }
  }

  /**
   * Identifica problemas específicos no template
   * @param {Object} detail - Detalhes do template
   * @returns {Array<Object>} - Lista de problemas identificados
   * @private
   */
  _identifyIssues(detail) {
    const issues = [];
    const stats = detail.stats;
    
    // Alta variabilidade nos tempos
    if (stats.timeVariability > 25) {
      issues.push({
        type: 'high_variability',
        severity: 'medium',
        description: `Alta variabilidade nos tempos de execução (${stats.timeVariability.toFixed(2)}%)`,
        recommendation: 'Investigar condições de corrida ou comportamento inconsistente no renderizador'
      });
    }
    
    // Outliers significativos
    if (stats.outliers.length > 0) {
      issues.push({
        type: 'outliers',
        severity: 'low',
        description: `${stats.outliers.length} outliers detectados nos tempos de execução`,
        recommendation: 'Verificar se há fatores externos afetando algumas execuções'
      });
    }
    
    // Uso excessivo de memória
    if (stats.progressive.peakMemory > this.config.thresholds.memoryUsage) {
      issues.push({
        type: 'high_memory_usage',
        severity: 'high',
        description: `Uso excessivo de memória: ${stats.progressive.peakMemory.toFixed(2)}MB`,
        recommendation: 'Implementar processamento em chunks ou otimizar o uso de memória'
      });
    }
    
    // Comparação com renderizador padrão (se disponível)
    if (stats.standard && stats.comparison.percentDiff > this.config.thresholds.timeDiff) {
      issues.push({
        type: 'slower_than_standard',
        severity: 'high',
        description: `${stats.comparison.percentDiff.toFixed(2)}% mais lento que o renderizador padrão`,
        recommendation: 'Otimizar algoritmo de priorização e renderização progressiva'
      });
    }
    
    return issues;
  }

  /**
   * Identifica padrões nos resultados dos testes
   * @private
   */
  _identifyPatterns() {
    const templates = Object.keys(this.analysis.details);
    
    // Padrão 1: Correlação tamanho vs desempenho
    const sizeVsPerformance = templates.map(t => ({
      name: t,
      size: this.analysis.details[t].info.size,
      time: this.analysis.details[t].stats.progressive.avgTime
    }));
    
    // Ordernar por tamanho
    sizeVsPerformance.sort((a, b) => a.size - b.size);
    
    // Verificar se o tempo cresce mais rápido que o tamanho
    const smallTemplates = sizeVsPerformance.slice(0, Math.ceil(sizeVsPerformance.length / 3));
    const largeTemplates = sizeVsPerformance.slice(-Math.ceil(sizeVsPerformance.length / 3));
    
    if (smallTemplates.length > 0 && largeTemplates.length > 0) {
      const smallAvgSize = mathjs.mean(smallTemplates.map(t => t.size));
      const smallAvgTime = mathjs.mean(smallTemplates.map(t => t.time));
      const largeAvgSize = mathjs.mean(largeTemplates.map(t => t.size));
      const largeAvgTime = mathjs.mean(largeTemplates.map(t => t.time));
      
      const sizeRatio = largeAvgSize / smallAvgSize;
      const timeRatio = largeAvgTime / smallAvgTime;
      
      if (timeRatio > sizeRatio * 1.5) {
        this.analysis.patterns.push({
          type: 'non_linear_scaling',
          description: 'O tempo de renderização cresce mais rápido que o tamanho do template',
          ratio: timeRatio / sizeRatio,
          recommendation: 'Investigar algoritmo para complexidade não linear (O(n²) ou pior)'
        });
      }
    }
    
    // Padrão 2: Categorizar templates por desempenho
    const performanceCategories = {
      excellent: [],
      good: [],
      fair: [],
      poor: [],
      unknown: []
    };
    
    templates.forEach(t => {
      const category = this.analysis.details[t].performanceClass;
      if (performanceCategories[category]) {
        performanceCategories[category].push(t);
      }
    });
    
    // Adicionar informações de categorias
    this.analysis.patterns.push({
      type: 'performance_distribution',
      description: 'Distribuição de desempenho entre templates',
      categories: Object.keys(performanceCategories).map(cat => ({
        category: cat,
        count: performanceCategories[cat].length,
        percentage: (performanceCategories[cat].length / templates.length) * 100
      }))
    });
    
    // Padrão 3: Problemas de memória relacionados ao tamanho
    const memoryEscalationPattern = this._analyzeMemoryEscalation();
    if (memoryEscalationPattern) {
      this.analysis.patterns.push(memoryEscalationPattern);
    }
    
    this.logger.info(`${this.analysis.patterns.length} padrões identificados nos resultados`);
  }

  /**
   * Analisa o padrão de escalação de memória
   * @returns {Object|null} Padrão de escalação de memória
   * @private
   */
  _analyzeMemoryEscalation() {
    const templates = Object.keys(this.analysis.details);
    const sizeVsMemory = templates.map(t => ({
      name: t,
      size: this.analysis.details[t].info.size,
      memory: this.analysis.details[t].stats.progressive.peakMemory
    }));
    
    // Ordenar por tamanho
    sizeVsMemory.sort((a, b) => a.size - b.size);
    
    if (sizeVsMemory.length < 3) return null;
    
    // Calcular razão entre tamanho e uso de memória
    const memoryRatios = sizeVsMemory.map(t => ({
      name: t.name,
      ratio: t.memory / (t.size / 1024) // MB por KB
    }));
    
    const avgRatio = mathjs.mean(memoryRatios.map(r => r.ratio));
    const stdRatio = mathjs.std(memoryRatios.map(r => r.ratio));
    
    // Verificar se há outliers significativos
    const outliers = memoryRatios.filter(r => 
      Math.abs(r.ratio - avgRatio) > stdRatio * 2
    );
    
    if (outliers.length > 0) {
      return {
        type: 'memory_escalation',
        description: 'Alguns templates apresentam uso anormal de memória proporcional ao tamanho',
        averageRatio: avgRatio,
        outliers: outliers.map(o => ({
          name: o.name,
          ratio: o.ratio,
          deviation: (o.ratio - avgRatio) / stdRatio
        })),
        recommendation: 'Investigar vazamentos de memória ou alocação ineficiente em templates específicos'
      };
    }
    
    return null;
  }

  /**
   * Gera recomendações com base na análise
   * @private
   */
  _generateRecommendations() {
    // Recomendação 1: Algoritmo de renderização
    if (this.analysis.summary.standard && 
        this.analysis.summary.comparison.avgTimePercentDiff > 10) {
      this.analysis.recommendations.push({
        category: 'performance',
        priority: 'high',
        title: 'Otimização do Algoritmo de Renderização Progressiva',
        description: `O renderizador progressivo é ${this.analysis.summary.comparison.avgTimePercentDiff.toFixed(2)}% mais lento que o padrão`,
        actions: [
          'Revisar algoritmo de priorização de componentes',
          'Reduzir operações síncronas durante a renderização',
          'Implementar cache para sub-templates frequentemente usados',
          'Otimizar a identificação de componentes críticos para o usuário'
        ]
      });
    }
    
    // Recomendação 2: Uso de memória
    const avgMemory = this.analysis.summary.progressive.avgMemory;
    if (avgMemory > this.config.thresholds.memoryUsage) {
      this.analysis.recommendations.push({
        category: 'memory',
        priority: 'high',
        title: 'Otimização do Uso de Memória',
        description: `Uso médio de memória alto (${avgMemory.toFixed(2)}MB)`,
        actions: [
          'Implementar processamento em streaming para templates grandes',
          'Liberar referências a DOM temporário após processamento',
          'Dividir templates grandes em chunks para processamento',
          'Implementar lazy loading para seções não visíveis imediatamente'
        ]
      });
    }
    
    // Recomendação 3: Complexidade não linear
    const nonLinearPattern = this.analysis.patterns.find(p => p.type === 'non_linear_scaling');
    if (nonLinearPattern) {
      this.analysis.recommendations.push({
        category: 'algorithm',
        priority: 'high',
        title: 'Otimização para Escalabilidade Linear',
        description: `O tempo de renderização escala não-linearmente (${nonLinearPattern.ratio.toFixed(2)}x)`,
        actions: [
          'Revisar loops aninhados no código de renderização',
          'Utilizar estruturas de dados otimizadas para operações frequentes',
          'Implementar memoização para resultados intermediários',
          'Verificar se há operações O(n²) que podem ser otimizadas para O(n)'
        ]
      });
    }
    
    // Recomendação 4: Consistência
    const highVariabilityTemplates = Object.values(this.analysis.details)
      .filter(d => d.stats.timeVariability > 25);
    
    if (highVariabilityTemplates.length > 0) {
      this.analysis.recommendations.push({
        category: 'consistency',
        priority: 'medium',
        title: 'Melhorar Consistência de Renderização',
        description: `${highVariabilityTemplates.length} templates apresentam alta variabilidade nos tempos`,
        actions: [
          'Investigar condições de corrida ou comportamento não-determinístico',
          'Implementar estratégias de throttling consistentes',
          'Verificar se há componentes com comportamento imprevisível',
          'Estabilizar o gerenciamento de recursos durante a renderização'
        ]
      });
    }
    
    // Recomendação 5: Edge cases
    const poorPerformingTemplates = Object.values(this.analysis.details)
      .filter(d => d.performanceClass === 'poor');
    
    if (poorPerformingTemplates.length > 0) {
      this.analysis.recommendations.push({
        category: 'edge_cases',
        priority: 'medium',
        title: 'Otimização para Casos Extremos',
        description: `${poorPerformingTemplates.length} templates apresentam desempenho ruim`,
        templates: poorPerformingTemplates.map(t => t.name),
        actions: [
          'Criar casos de teste especializados para os templates problemáticos',
          'Analisar estruturas específicas que causam degradação de desempenho',
          'Implementar otimizações específicas para padrões problemáticos',
          'Considerar estratégias alternativas para templates extremos'
        ]
      });
    }
    
    this.logger.info(`${this.analysis.recommendations.length} recomendações geradas`);
  }

  /**
   * Prioriza otimizações com base na análise
   * @private
   */
  _prioritizeOptimizations() {
    // Converter recomendações em otimizações priorizadas
    this.analysis.optimizationPriorities = this.analysis.recommendations
      .map(rec => ({
        title: rec.title,
        priority: rec.priority,
        description: rec.description,
        actions: rec.actions,
        impact: this._estimateImpact(rec)
      }))
      .sort((a, b) => {
        // Ordenar por impacto e depois por prioridade
        if (a.impact !== b.impact) {
          return b.impact - a.impact;
        }
        
        const priorityMap = { high: 3, medium: 2, low: 1 };
        return priorityMap[b.priority] - priorityMap[a.priority];
      });
    
    this.logger.info('Otimizações priorizadas com base no impacto estimado');
  }

  /**
   * Estima o impacto de uma recomendação
   * @param {Object} recommendation - Recomendação a ser avaliada
   * @returns {number} - Pontuação de impacto (0-10)
   * @private
   */
  _estimateImpact(recommendation) {
    // Pontuação base por prioridade
    const priorityScore = { high: 8, medium: 5, low: 3 }[recommendation.priority] || 5;
    
    // Ajustar com base na categoria
    let categoryAdjustment = 0;
    switch (recommendation.category) {
      case 'performance':
        // Ajustar com base na diferença percentual
        if (recommendation.description.includes('%')) {
          const percentMatch = recommendation.description.match(/([0-9.]+)%/);
          if (percentMatch) {
            const percent = parseFloat(percentMatch[1]);
            categoryAdjustment = Math.min(percent / 10, 2); // Máximo de +2 pontos
          }
        }
        break;
      case 'memory':
        // Priorizar memória se estiver muito alta
        if (this.analysis.summary.progressive.avgMemory > 300) {
          categoryAdjustment = 2;
        } else if (this.analysis.summary.progressive.avgMemory > 200) {
          categoryAdjustment = 1;
        }
        break;
      case 'algorithm':
        // Alta prioridade para problemas de algoritmo
        categoryAdjustment = 1.5;
        break;
    }
    
    // Calcular pontuação final, limitada a 10
    return Math.min(priorityScore + categoryAdjustment, 10);
  }

  /**
   * Salva os resultados da análise
   * @private
   */
  async _saveAnalysisResults() {
    try {
      // Salvar JSON com a análise completa
      await fs.writeFile(
        path.join(this.config.outputDir, 'analysis-full.json'),
        JSON.stringify(this.analysis, null, 2)
      );
      
      // Salvar relatório resumido em formato Markdown
      await fs.writeFile(
        path.join(this.config.outputDir, 'analysis-summary.md'),
        this._generateMarkdownReport()
      );
      
      // Gerar visualização HTML
      await fs.writeFile(
        path.join(this.config.outputDir, 'analysis-dashboard.html'),
        this._generateHTMLDashboard()
      );
      
      this.logger.success('Resultados da análise salvos com sucesso');
    } catch (error) {
      this.logger.error(`Erro ao salvar resultados: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gera um relatório em formato Markdown
   * @returns {string} - Conteúdo do relatório Markdown
   * @private
   */
  _generateMarkdownReport() {
    const summary = this.analysis.summary;
    const now = new Date().toLocaleString();
    
    let markdown = `# Análise de Desempenho do Renderizador Progressivo\n\n`;
    markdown += `Gerado em: ${now}\n\n`;
    
    // Resumo geral
    markdown += `## Resumo Geral\n\n`;
    markdown += `| Métrica | Renderizador Progressivo | Renderizador Padrão | Diferença |\n`;
    markdown += `|---------|--------------------------|---------------------|----------|\n`;
    
    if (summary.standard) {
      markdown += `| Tempo Médio | ${summary.progressive.avgTime.toFixed(2)}ms | ${summary.standard.avgTime.toFixed(2)}ms | ${summary.comparison.avgTimeDiff.toFixed(2)}ms (${summary.comparison.avgTimePercentDiff.toFixed(2)}%) |\n`;
      markdown += `| Uso de Memória | ${summary.progressive.avgMemory.toFixed(2)}MB | ${summary.standard.avgMemory.toFixed(2)}MB | ${summary.comparison.avgMemoryDiff.toFixed(2)}MB (${summary.comparison.avgMemoryPercentDiff.toFixed(2)}%) |\n`;
    } else {
      markdown += `| Tempo Médio | ${summary.progressive.avgTime.toFixed(2)}ms | N/A | N/A |\n`;
      markdown += `| Uso de Memória | ${summary.progressive.avgMemory.toFixed(2)}MB | N/A | N/A |\n`;
    }
    
    // Correlações
    if (summary.correlations) {
      markdown += `\n### Correlações\n\n`;
      markdown += `- Componentes vs. Tempo: ${summary.correlations.componentsVsTime.toFixed(3)}\n`;
      markdown += `- Tamanho vs. Tempo: ${summary.correlations.sizeVsTime.toFixed(3)}\n`;
      markdown += `- Tamanho vs. Memória: ${summary.correlations.sizeVsMemory.toFixed(3)}\n`;
    }
    
    // Recomendações prioritárias
    markdown += `\n## Recomendações Prioritárias\n\n`;
    
    this.analysis.optimizationPriorities.forEach((opt, index) => {
      markdown += `### ${index + 1}. ${opt.title} (Impacto: ${opt.impact.toFixed(1)}/10)\n\n`;
      markdown += `${opt.description}\n\n`;
      markdown += `**Ações recomendadas:**\n\n`;
      
      opt.actions.forEach(action => {
        markdown += `- ${action}\n`;
      });
      
      markdown += `\n`;
    });
    
    // Padrões identificados
    markdown += `\n## Padrões Identificados\n\n`;
    
    this.analysis.patterns.forEach((pattern, index) => {
      markdown += `### ${index + 1}. ${pattern.type}\n\n`;
      markdown += `${pattern.description}\n\n`;
      
      if (pattern.type === 'performance_distribution') {
        markdown += `| Categoria | Quantidade | Porcentagem |\n`;
        markdown += `|-----------|------------|-------------|\n`;
        
        pattern.categories.forEach(cat => {
          markdown += `| ${cat.category} | ${cat.count} | ${cat.percentage.toFixed(1)}% |\n`;
        });
      }
      
      markdown += `\n`;
    });
    
    // Detalhes por template
    markdown += `\n## Detalhes por Template\n\n`;
    markdown += `| Template | Componentes | Tamanho (KB) | Tempo (ms) | Memória (MB) | Classe | Problemas |\n`;
    markdown += `|----------|-------------|--------------|------------|--------------|--------|----------|\n`;
    
    Object.values(this.analysis.details).forEach(detail => {
      markdown += `| ${detail.name} | ${detail.info.componentCount} | ${(detail.info.size / 1024).toFixed(2)} | ${detail.stats.progressive.avgTime.toFixed(2)} | ${detail.stats.progressive.peakMemory.toFixed(2)} | ${detail.performanceClass} | ${detail.issues.length} |\n`;
    });
    
    return markdown;
  }

  /**
   * Gera um dashboard HTML para visualização dos resultados
   * @returns {string} - Conteúdo HTML do dashboard
   * @private
   */
  _generateHTMLDashboard() {
    const now = new Date().toLocaleString();
    
    // Converter análise para formato adequado para gráficos
    const templateData = Object.values(this.analysis.details).map(detail => ({
      name: detail.name,
      size: detail.info.size,
      sizeKb: (detail.info.size / 1024).toFixed(2),
      components: isNaN(Number(detail.info.componentCount)) ? 0 : Number(detail.info.componentCount),
      progressiveTime: detail.stats.progressive.avgTime,
      standardTime: detail.stats.standard ? detail.stats.standard.avgTime : null,
      memoryUsage: detail.stats.progressive.peakMemory,
      performanceClass: detail.performanceClass,
      issues: detail.issues.length
    }));
    
    // Dados para gráficos gerais
    const chartData = `const templateData = ${JSON.stringify(templateData)};`;
    
    // Dados para recomendações
    const recommendationsData = `const recommendations = ${JSON.stringify(this.analysis.optimizationPriorities)};`;
    
    // Dados para padrões
    const patternsData = `const patterns = ${JSON.stringify(this.analysis.patterns)};`;
    
    // Estrutura HTML
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Análise de Desempenho - Renderizador Progressivo</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        .card { margin-bottom: 20px; }
        .performance-excellent { background-color: #d4edda; }
        .performance-good { background-color: #d1ecf1; }
        .performance-fair { background-color: #fff3cd; }
        .performance-poor { background-color: #f8d7da; }
      </style>
    </head>
    <body>
      <div class="container py-4">
        <h1 class="mb-4">Dashboard de Análise - Renderizador Progressivo</h1>
        <p class="text-muted">Gerado em: ${now}</p>
        
        <div class="row">
          <div class="col-md-6">
            <div class="card">
              <div class="card-header bg-primary text-white">
                <h5 class="m-0">Tempo de Renderização por Template</h5>
              </div>
              <div class="card-body">
                <canvas id="timeChart"></canvas>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card">
              <div class="card-header bg-primary text-white">
                <h5 class="m-0">Uso de Memória por Template</h5>
              </div>
              <div class="card-body">
                <canvas id="memoryChart"></canvas>
              </div>
            </div>
          </div>
        </div>
        
        <div class="row">
          <div class="col-md-6">
            <div class="card">
              <div class="card-header bg-primary text-white">
                <h5 class="m-0">Correlação: Componentes vs. Tempo</h5>
              </div>
              <div class="card-body">
                <canvas id="correlationChart"></canvas>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card">
              <div class="card-header bg-primary text-white">
                <h5 class="m-0">Distribuição de Desempenho</h5>
              </div>
              <div class="card-body">
                <canvas id="performanceChart"></canvas>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header bg-warning text-dark">
            <h5 class="m-0">Recomendações Prioritárias</h5>
          </div>
          <div class="card-body">
            <div id="recommendationsContainer">
              <!-- Será preenchido via JavaScript -->
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header bg-info text-dark">
            <h5 class="m-0">Detalhes por Template</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Template</th>
                    <th>Componentes</th>
                    <th>Tamanho (KB)</th>
                    <th>Tempo (ms)</th>
                    <th>Memória (MB)</th>
                    <th>Desempenho</th>
                    <th>Problemas</th>
                  </tr>
                </thead>
                <tbody id="templateTableBody">
                  <!-- Será preenchido via JavaScript -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <script>
        // Dados para os gráficos
        ${chartData}
        ${recommendationsData}
        ${patternsData}
        
        // Renderizar gráficos e tabelas quando o DOM estiver pronto
        document.addEventListener('DOMContentLoaded', function() {
          // Gráfico de tempo de renderização
          const timeCtx = document.getElementById('timeChart').getContext('2d');
          new Chart(timeCtx, {
            type: 'bar',
            data: {
              labels: templateData.map(t => t.name),
              datasets: [
                {
                  label: 'Tempo Progressivo (ms)',
                  data: templateData.map(t => t.progressiveTime),
                  backgroundColor: 'rgba(54, 162, 235, 0.7)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 1
                },
                {
                  label: 'Tempo Padrão (ms)',
                  data: templateData.map(t => t.standardTime),
                  backgroundColor: 'rgba(255, 99, 132, 0.7)',
                  borderColor: 'rgba(255, 99, 132, 1)',
                  borderWidth: 1
                }
              ]
            },
            options: {
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Tempo (ms)'
                  }
                }
              }
            }
          });
          
          // Gráfico de uso de memória
          const memoryCtx = document.getElementById('memoryChart').getContext('2d');
          new Chart(memoryCtx, {
            type: 'bar',
            data: {
              labels: templateData.map(t => t.name),
              datasets: [
                {
                  label: 'Uso de Memória (MB)',
                  data: templateData.map(t => t.memoryUsage),
                  backgroundColor: 'rgba(75, 192, 192, 0.7)',
                  borderColor: 'rgba(75, 192, 192, 1)',
                  borderWidth: 1
                }
              ]
            },
            options: {
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Memória (MB)'
                  }
                }
              }
            }
          });
          
          // Gráfico de correlação
          const correlationCtx = document.getElementById('correlationChart').getContext('2d');
          new Chart(correlationCtx, {
            type: 'scatter',
            data: {
              datasets: [
                {
                  label: 'Componentes vs. Tempo',
                  data: templateData.map(t => ({ 
                    x: t.components, 
                    y: t.progressiveTime,
                    r: Math.sqrt(t.memoryUsage) * 2
                  })),
                  backgroundColor: 'rgba(54, 162, 235, 0.7)'
                }
              ]
            },
            options: {
              responsive: true,
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Número de Componentes'
                  }
                },
                y: {
                  title: {
                    display: true,
                    text: 'Tempo (ms)'
                  }
                }
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const point = context.raw;
                      return \`\${templateData[context.dataIndex].name}: \${point.x} componentes, \${point.y.toFixed(2)}ms\`;
                    }
                  }
                }
              }
            }
          });
          
          // Gráfico de distribuição de desempenho
          const performanceCtx = document.getElementById('performanceChart').getContext('2d');
          
          // Contar templates por categoria de desempenho
          const performanceDistribution = {
            excellent: templateData.filter(t => t.performanceClass === 'excellent').length,
            good: templateData.filter(t => t.performanceClass === 'good').length,
            fair: templateData.filter(t => t.performanceClass === 'fair').length,
            poor: templateData.filter(t => t.performanceClass === 'poor').length,
            unknown: templateData.filter(t => t.performanceClass === 'unknown').length
          };
          
          new Chart(performanceCtx, {
            type: 'pie',
            data: {
              labels: Object.keys(performanceDistribution),
              datasets: [
                {
                  data: Object.values(performanceDistribution),
                  backgroundColor: [
                    'rgba(40, 167, 69, 0.7)',  // excellent - green
                    'rgba(23, 162, 184, 0.7)', // good - blue
                    'rgba(255, 193, 7, 0.7)',  // fair - yellow
                    'rgba(220, 53, 69, 0.7)',  // poor - red
                    'rgba(108, 117, 125, 0.7)' // unknown - gray
                  ],
                  borderColor: [
                    'rgba(40, 167, 69, 1)',
                    'rgba(23, 162, 184, 1)',
                    'rgba(255, 193, 7, 1)',
                    'rgba(220, 53, 69, 1)',
                    'rgba(108, 117, 125, 1)'
                  ],
                  borderWidth: 1
                }
              ]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom'
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const label = context.label || '';
                      const value = context.raw;
                      const percentage = Math.round((value / templateData.length) * 100);
                      return \`\${label}: \${value} (\${percentage}%)\`;
                    }
                  }
                }
              }
            }
          });
          
          // Preencher tabela de templates
          const templateTableBody = document.getElementById('templateTableBody');
          templateData.forEach(template => {
            const row = document.createElement('tr');
            row.classList.add(\`performance-\${template.performanceClass}\`);
            
            row.innerHTML = \`
              <td>\${template.name}</td>
              <td>\${template.components}</td>
              <td>\${template.sizeKb}</td>
              <td>\${template.progressiveTime.toFixed(2)}</td>
              <td>\${template.memoryUsage.toFixed(2)}</td>
              <td>\${template.performanceClass}</td>
              <td>\${template.issues}</td>
            \`;
            
            templateTableBody.appendChild(row);
          });
          
          // Preencher recomendações
          const recommendationsContainer = document.getElementById('recommendationsContainer');
          recommendations.forEach((rec, index) => {
            const card = document.createElement('div');
            card.className = 'card mb-3';
            
            // Determinar cor com base no impacto
            let headerClass = 'bg-info';
            if (rec.impact >= 8) {
              headerClass = 'bg-danger text-white';
            } else if (rec.impact >= 6) {
              headerClass = 'bg-warning';
            }
            
            card.innerHTML = \`
              <div class="card-header \${headerClass}">
                <h5 class="m-0">\${index + 1}. \${rec.title} (Impacto: \${rec.impact.toFixed(1)}/10)</h5>
              </div>
              <div class="card-body">
                <p>\${rec.description}</p>
                <h6>Ações recomendadas:</h6>
                <ul>
                  \${rec.actions.map(action => \`<li>\${action}</li>\`).join('')}
                </ul>
              </div>
            \`;
            
            recommendationsContainer.appendChild(card);
          });
        });
      </script>
    </body>
    </html>
    `;
  }

  /**
   * Executa todo o processo de análise
   * @param {string} [reportPath] - Caminho opcional para o relatório específico
   */
  async analyze(reportPath = null) {
    try {
      await this.initialize();
      await this.loadResults(reportPath);
      await this.analyzeResults();
      return this.analysis;
    } catch (error) {
      this.logger.error(`Erro durante o processo de análise: ${error.message}`);
      throw error;
    }
  }
}

// Exportar a classe
module.exports = LoadTestAnalyzer;

// Executar análise se chamado diretamente
if (require.main === module) {
  const analyzer = new LoadTestAnalyzer();
  analyzer.analyze()
    .then(() => {
      console.log('Análise completa');
    })
    .catch(error => {
      console.error('Erro:', error);
    });
}
