/**
 * Performance Monitor Dashboard para Artifacts do Claude
 * 
 * Este componente fornece uma interface visual para monitorar o desempenho
 * do renderizador progressivo, exibindo métricas e comparações em tempo real
 * através de artifacts do Claude.
 * 
 * @author PHP Universal MCP Server Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

/**
 * Classe responsável por gerar visualizações de desempenho para artifacts do Claude
 */
class PerformanceMonitorDashboard {
  /**
   * Construtor da classe
   * @param {Object} options - Opções de configuração
   */
  constructor(options = {}) {
    this.options = {
      resultsDir: path.join(__dirname, '../../../tests/performance/test-results'),
      analysisDir: path.join(__dirname, '../../../tests/performance/analysis-results'),
      ...options
    };
    
    this.resultData = null;
    this.analysisData = null;
  }

  /**
   * Inicializa o dashboard
   */
  async initialize() {
    try {
      await this._loadData();
      return true;
    } catch (error) {
      console.error(`Erro ao inicializar dashboard: ${error.message}`);
      return false;
    }
  }

  /**
   * Carrega os dados de resultados e análise
   * @private
   */
  async _loadData() {
    try {
      // Carregar resultados dos testes
      const resultPath = path.join(this.options.resultsDir, 'full-report.json');
      if (fs.existsSync(resultPath)) {
        this.resultData = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
      }
      
      // Carregar análise
      const analysisPath = path.join(this.options.analysisDir, 'analysis-full.json');
      if (fs.existsSync(analysisPath)) {
        this.analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
      }
      
      return true;
    } catch (error) {
      console.error(`Erro ao carregar dados: ${error.message}`);
      return false;
    }
  }

  /**
   * Gera HTML para artifact do Claude
   * @param {string} [templateName] - Nome do template específico (opcional)
   * @returns {string} HTML formatado para artifact
   */
  generateArtifactHTML(templateName = null) {
    // Verificar se os dados foram carregados
    if (!this.resultData) {
      return this._generateErrorHTML('Nenhum dado de teste disponível. Execute os testes primeiro.');
    }
    
    // Filtrar dados para um template específico se solicitado
    const templateData = templateName ? 
      { [templateName]: this.resultData[templateName] } : 
      this.resultData;
    
    if (templateName && !templateData[templateName]) {
      return this._generateErrorHTML(`Template "${templateName}" não encontrado nos resultados.`);
    }
    
    // Usar dados de análise se disponíveis
    const analysisAvailable = !!this.analysisData;
    
    // Gerar HTML formatado para o artifact
    return this._generateDashboardHTML(templateData, analysisAvailable);
  }

  /**
   * Gera HTML para mensagem de erro
   * @param {string} message - Mensagem de erro
   * @returns {string} HTML formatado para mensagem de erro
   * @private
   */
  _generateErrorHTML(message) {
    return `
      <div style="padding: 20px; border: 1px solid #dc3545; border-radius: 5px; background-color: #f8d7da; color: #721c24;">
        <h3>Erro ao gerar dashboard</h3>
        <p>${message}</p>
        <p>Execute os testes de carga e análise antes de visualizar o dashboard.</p>
      </div>
    `;
  }

  /**
   * Gera HTML para o dashboard completo
   * @param {Object} data - Dados dos testes
   * @param {boolean} analysisAvailable - Indica se a análise está disponível
   * @returns {string} HTML formatado para o dashboard
   * @private
   */
  _generateDashboardHTML(data, analysisAvailable) {
    // Preparar dados para os gráficos
    const templates = Object.keys(data);
    const progressiveTimes = templates.map(t => data[t].progressiveRenderer.averageTime);
    const standardTimes = templates.map(t => 
      data[t].standardRenderer ? data[t].standardRenderer.averageTime : null
    );
    const memoryUsage = templates.map(t => data[t].progressiveRenderer.peakMemoryUsage);
    const componentCounts = templates.map(t => {
      const count = data[t].templateInfo.componentCount;
      return typeof count === 'string' && count === 'N/A' ? 0 : Number(count);
    });
    
    // Formatar dados para JavaScript
    const jsData = {
      templates,
      progressive: progressiveTimes,
      standard: standardTimes,
      memory: memoryUsage,
      components: componentCounts,
      sizes: templates.map(t => Number(data[t].templateInfo.sizeKb))
    };
    
    // Calcular métricas gerais
    const avgProgressive = progressiveTimes.reduce((a, b) => a + b, 0) / progressiveTimes.length;
    const avgMemory = memoryUsage.reduce((a, b) => a + b, 0) / memoryUsage.length;
    
    // Calcular comparação geral se houver dados do renderizador padrão
    let comparison = null;
    if (standardTimes.some(t => t !== null)) {
      const validStandard = standardTimes.filter(t => t !== null);
      const avgStandard = validStandard.reduce((a, b) => a + b, 0) / validStandard.length;
      const diff = avgProgressive - avgStandard;
      const percentDiff = (diff / avgStandard) * 100;
      
      comparison = {
        avgStandard,
        diff,
        percentDiff
      };
    }
    
    // Gerar HTML
    return `
      <style>
        .performance-dashboard {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #212529;
        }
        .dashboard-title {
          color: #007bff;
          margin-bottom: 20px;
        }
        .metrics-card {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric {
          display: inline-block;
          padding: 10px;
          margin: 5px;
          background-color: white;
          border-radius: 4px;
          min-width: 150px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          margin: 5px 0;
        }
        .metric-label {
          font-size: 14px;
          color: #6c757d;
        }
        .charts-container {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 20px;
        }
        .chart-box {
          background-color: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          flex: 1;
          min-width: 400px;
        }
        .chart-title {
          margin-top: 0;
          margin-bottom: 15px;
          color: #495057;
          font-size: 18px;
        }
        .positive { color: #28a745; }
        .negative { color: #dc3545; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #dee2e6;
        }
        th {
          background-color: #f8f9fa;
          font-weight: 600;
        }
        tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        .chart-wrapper {
          height: 300px;
          position: relative;
        }
        .analysis-summary {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        .recommendations {
          background-color: #d1ecf1;
          border-left: 4px solid #17a2b8;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 4px;
        }
      </style>
      
      <div class="performance-dashboard">
        <h1 class="dashboard-title">Dashboard de Desempenho - Renderizador Progressivo</h1>
        
        <div class="metrics-card">
          <h3>Métricas Gerais</h3>
          <div class="metric">
            <div class="metric-label">Templates Testados</div>
            <div class="metric-value">${templates.length}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Tempo Médio</div>
            <div class="metric-value">${avgProgressive.toFixed(2)}ms</div>
          </div>
          <div class="metric">
            <div class="metric-label">Memória Média</div>
            <div class="metric-value">${avgMemory.toFixed(2)}MB</div>
          </div>
          ${comparison ? `
          <div class="metric">
            <div class="metric-label">Comparação com Padrão</div>
            <div class="metric-value ${comparison.percentDiff <= 0 ? 'positive' : 'negative'}">
              ${comparison.percentDiff.toFixed(2)}%
            </div>
          </div>` : ''}
        </div>
        
        <div class="charts-container">
          <div class="chart-box">
            <h3 class="chart-title">Tempo de Renderização por Template</h3>
            <div class="chart-wrapper">
              <canvas id="timeChart"></canvas>
            </div>
          </div>
          <div class="chart-box">
            <h3 class="chart-title">Uso de Memória por Template</h3>
            <div class="chart-wrapper">
              <canvas id="memoryChart"></canvas>
            </div>
          </div>
        </div>
        
        <div class="charts-container">
          <div class="chart-box">
            <h3 class="chart-title">Relação Componentes vs. Tempo</h3>
            <div class="chart-wrapper">
              <canvas id="scatterChart"></canvas>
            </div>
          </div>
          <div class="chart-box">
            <h3 class="chart-title">Comparação de Desempenho</h3>
            <div class="chart-wrapper">
              <canvas id="comparisonChart"></canvas>
            </div>
          </div>
        </div>
        
        ${analysisAvailable ? this._generateAnalysisSummaryHTML() : ''}
        
        <h3>Detalhes por Template</h3>
        <table>
          <thead>
            <tr>
              <th>Template</th>
              <th>Componentes</th>
              <th>Tamanho</th>
              <th>Tempo (ms)</th>
              <th>Padrão (ms)</th>
              <th>Diferença</th>
              <th>Memória (MB)</th>
            </tr>
          </thead>
          <tbody>
            ${templates.map(t => {
              const template = data[t];
              const progressiveTime = template.progressiveRenderer.averageTime;
              const standardTime = template.standardRenderer ? template.standardRenderer.averageTime : null;
              const diff = standardTime ? ((progressiveTime - standardTime) / standardTime) * 100 : null;
              
              return `
                <tr>
                  <td>${t}</td>
                  <td>${template.templateInfo.componentCount}</td>
                  <td>${template.templateInfo.sizeKb} KB</td>
                  <td>${progressiveTime.toFixed(2)}</td>
                  <td>${standardTime ? standardTime.toFixed(2) : 'N/A'}</td>
                  <td class="${diff !== null ? (diff <= 0 ? 'positive' : 'negative') : ''}">
                    ${diff !== null ? diff.toFixed(2) + '%' : 'N/A'}
                  </td>
                  <td>${template.progressiveRenderer.peakMemoryUsage.toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script>
          // Dados para os gráficos
          const chartData = ${JSON.stringify(jsData)};
          
          // Cores para os gráficos
          const colors = {
            progressive: 'rgba(54, 162, 235, 0.7)',
            standard: 'rgba(255, 99, 132, 0.7)',
            memory: 'rgba(75, 192, 192, 0.7)',
            border: {
              progressive: 'rgba(54, 162, 235, 1)',
              standard: 'rgba(255, 99, 132, 1)',
              memory: 'rgba(75, 192, 192, 1)'
            }
          };
          
          // Renderizar gráficos
          document.addEventListener('DOMContentLoaded', function() {
            // Gráfico de tempo de renderização
            const timeCtx = document.getElementById('timeChart').getContext('2d');
            new Chart(timeCtx, {
              type: 'bar',
              data: {
                labels: chartData.templates,
                datasets: [
                  {
                    label: 'Tempo Progressivo (ms)',
                    data: chartData.progressive,
                    backgroundColor: colors.progressive,
                    borderColor: colors.border.progressive,
                    borderWidth: 1
                  },
                  {
                    label: 'Tempo Padrão (ms)',
                    data: chartData.standard,
                    backgroundColor: colors.standard,
                    borderColor: colors.border.standard,
                    borderWidth: 1
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  }
                },
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
                labels: chartData.templates,
                datasets: [
                  {
                    label: 'Uso de Memória (MB)',
                    data: chartData.memory,
                    backgroundColor: colors.memory,
                    borderColor: colors.border.memory,
                    borderWidth: 1
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  }
                },
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
            
            // Gráfico de dispersão (componentes vs. tempo)
            const scatterCtx = document.getElementById('scatterChart').getContext('2d');
            new Chart(scatterCtx, {
              type: 'scatter',
              data: {
                datasets: [
                  {
                    label: 'Componentes vs. Tempo',
                    data: chartData.components.map((comp, i) => ({
                      x: comp,
                      y: chartData.progressive[i]
                    })),
                    backgroundColor: colors.progressive
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const index = context.dataIndex;
                        return \`\${chartData.templates[index]}: \${chartData.components[index]} componentes, \${chartData.progressive[index].toFixed(2)}ms\`;
                      }
                    }
                  }
                },
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
                }
              }
            });
            
            // Gráfico de comparação (progressivo vs. padrão)
            const comparisonCtx = document.getElementById('comparisonChart').getContext('2d');
            
            // Filtrar apenas templates com dados do renderizador padrão
            const validIndices = chartData.standard.map((val, idx) => val !== null ? idx : -1).filter(idx => idx !== -1);
            const comparisonData = {
              templates: validIndices.map(idx => chartData.templates[idx]),
              progressive: validIndices.map(idx => chartData.progressive[idx]),
              standard: validIndices.map(idx => chartData.standard[idx]),
              diff: validIndices.map(idx => {
                const prog = chartData.progressive[idx];
                const std = chartData.standard[idx];
                return ((prog - std) / std) * 100;
              })
            };
            
            if (comparisonData.templates.length > 0) {
              new Chart(comparisonCtx, {
                type: 'bar',
                data: {
                  labels: comparisonData.templates,
                  datasets: [
                    {
                      label: 'Diferença (%)',
                      data: comparisonData.diff,
                      backgroundColor: comparisonData.diff.map(val => 
                        val <= 0 ? 'rgba(40, 167, 69, 0.7)' : 'rgba(220, 53, 69, 0.7)'
                      ),
                      borderColor: comparisonData.diff.map(val => 
                        val <= 0 ? 'rgba(40, 167, 69, 1)' : 'rgba(220, 53, 69, 1)'
                      ),
                      borderWidth: 1
                    }
                  ]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const index = context.dataIndex;
                          const diff = comparisonData.diff[index];
                          return \`\${diff.toFixed(2)}% \${diff <= 0 ? 'mais rápido' : 'mais lento'} que o padrão\`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      title: {
                        display: true,
                        text: 'Diferença (%)'
                      }
                    }
                  }
                }
              });
            } else {
              document.getElementById('comparisonChart').parentNode.innerHTML = 
                '<div style="height: 100%; display: flex; align-items: center; justify-content: center; color: #6c757d; text-align: center;">' +
                  '<p>Dados insuficientes para comparação.<br>Execute testes com o renderizador padrão.</p>' +
                '</div>';
            }
          });
        </script>
      </div>
    `;
  }

  /**
   * Gera HTML para o resumo da análise
   * @returns {string} HTML formatado para o resumo da análise
   * @private
   */
  _generateAnalysisSummaryHTML() {
    if (!this.analysisData || !this.analysisData.recommendations) {
      return '';
    }
    
    const recommendations = this.analysisData.recommendations;
    
    // Gerar HTML para o resumo
    return `
      <div class="analysis-summary">
        <h3>Resumo da Análise</h3>
        <p>Análise completa disponível em: <code>tests/performance/analysis-results/</code></p>
        ${this.analysisData.patterns && this.analysisData.patterns.length > 0 ? `
          <h4>Padrões Identificados</h4>
          <ul>
            ${this.analysisData.patterns.map(pattern => `
              <li><strong>${pattern.type}:</strong> ${pattern.description}</li>
            `).join('')}
          </ul>
        ` : ''}
      </div>
      
      <div class="recommendations">
        <h3>Recomendações Prioritárias</h3>
        <ol>
          ${recommendations.slice(0, 3).map(rec => `
            <li>
              <strong>${rec.title}</strong> (Prioridade: ${rec.priority})
              <p>${rec.description}</p>
              <ul>
                ${rec.actions.map(action => `<li>${action}</li>`).join('')}
              </ul>
            </li>
          `).join('')}
        </ol>
      </div>
    `;
  }
}

module.exports = PerformanceMonitorDashboard;
