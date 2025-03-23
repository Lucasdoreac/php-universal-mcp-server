/**
 * Módulo de Dashboard de Analytics para o E-commerce Manager Core
 * 
 * Este módulo fornece componentes de visualização para os relatórios e analytics
 * gerados pelo sistema de e-commerce.
 */

const path = require('path');
const fs = require('fs');
const { formatCurrency, formatNumber, formatPercent } = require('../utils/formatters');
const ReportService = require('../services/ReportService');

class AnalyticsDashboard {
  /**
   * Cria uma nova instância do dashboard de analytics
   * @param {Object} options Opções de configuração
   * @param {Object} options.providerManager Gerenciador de provedores
   * @param {Object} options.cache Sistema de cache (opcional)
   */
  constructor(options = {}) {
    this.options = options;
    this.reportService = new ReportService(options);
    this.templateDir = path.join(__dirname, '..', '..', '..', 'templates', 'analytics');
  }

  /**
   * Gera um dashboard completo de analytics
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {Object} params.dateRange Intervalo de datas {startDate, endDate}
   * @param {string} params.format Formato de saída ('html', 'json', 'chart')
   * @returns {Promise<Object>} Dashboard de analytics
   */
  async generateDashboard(params) {
    try {
      const { siteId, dateRange, format = 'html' } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!dateRange || !dateRange.startDate) {
        throw new Error('Intervalo de datas é obrigatório');
      }
      
      // Busca os dados de métricas do dashboard
      const dashboard = await this.reportService.getDashboardMetrics({ siteId, dateRange });
      
      // Retorna no formato apropriado
      switch (format.toLowerCase()) {
        case 'json':
          return {
            success: true,
            data: dashboard.data
          };
        
        case 'chart':
          return {
            success: true,
            data: this._generateChartData(dashboard.data)
          };
        
        case 'html':
        default:
          return {
            success: true,
            data: this._generateHtmlDashboard(dashboard.data, dateRange)
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gera dados formatados para gráficos
   * 
   * @param {Object} dashboardData Dados do dashboard
   * @returns {Object} Dados para visualização em gráficos
   * @private
   */
  _generateChartData(dashboardData) {
    const chartData = {
      revenue: {
        type: 'line',
        labels: dashboardData.revenue.series.map(item => item.period),
        datasets: [
          {
            label: 'Receita',
            data: dashboardData.revenue.series.map(item => item.value),
            color: '#4CAF50'
          }
        ]
      },
      
      productSales: {
        type: 'bar',
        labels: dashboardData.products.topSelling.map(item => item.name),
        datasets: [
          {
            label: 'Quantidade Vendida',
            data: dashboardData.products.topSelling.map(item => item.quantity),
            color: '#2196F3'
          }
        ]
      },
      
      customerSegments: {
        type: 'pie',
        labels: ['Novos', 'Recorrentes'],
        datasets: [
          {
            data: [
              dashboardData.customers.new,
              dashboardData.customers.returning
            ],
            colors: ['#FF9800', '#9C27B0']
          }
        ]
      },
      
      inventoryStatus: {
        type: 'doughnut',
        labels: ['Disponível', 'Baixo Estoque', 'Sem Estoque'],
        datasets: [
          {
            data: [
              dashboardData.products.totalCount - dashboardData.products.lowStock - dashboardData.products.outOfStock,
              dashboardData.products.lowStock,
              dashboardData.products.outOfStock
            ],
            colors: ['#4CAF50', '#FFC107', '#F44336']
          }
        ]
      }
    };
    
    return chartData;
  }

  /**
   * Gera um dashboard HTML
   * 
   * @param {Object} dashboardData Dados do dashboard
   * @param {Object} dateRange Intervalo de datas
   * @returns {string} HTML do dashboard
   * @private
   */
  _generateHtmlDashboard(dashboardData, dateRange) {
    try {
      // Carrega o template do dashboard
      const templatePath = path.join(this.templateDir, 'dashboard.html');
      let template = fs.existsSync(templatePath) 
        ? fs.readFileSync(templatePath, 'utf8')
        : this._getDefaultDashboardTemplate();
      
      // Substitui as variáveis no template
      template = template
        // Período
        .replace(/\{\{startDate\}\}/g, new Date(dateRange.startDate).toLocaleDateString())
        .replace(/\{\{endDate\}\}/g, new Date(dateRange.endDate || Date.now()).toLocaleDateString())
        
        // Métricas de receita
        .replace(/\{\{totalRevenue\}\}/g, formatCurrency(dashboardData.revenue.total))
        .replace(/\{\{orderCount\}\}/g, formatNumber(dashboardData.revenue.orders))
        .replace(/\{\{averageOrderValue\}\}/g, formatCurrency(dashboardData.revenue.averageOrderValue))
        
        // Métricas de produtos
        .replace(/\{\{topProductsList\}\}/g, this._generateTopProductsHtml(dashboardData.products.topSelling))
        .replace(/\{\{outOfStockCount\}\}/g, formatNumber(dashboardData.products.outOfStock))
        .replace(/\{\{lowStockCount\}\}/g, formatNumber(dashboardData.products.lowStock))
        
        // Métricas de clientes
        .replace(/\{\{totalCustomers\}\}/g, formatNumber(dashboardData.customers.total))
        .replace(/\{\{newCustomers\}\}/g, formatNumber(dashboardData.customers.new))
        .replace(/\{\{returningCustomers\}\}/g, formatNumber(dashboardData.customers.returning))
        .replace(/\{\{topCustomersList\}\}/g, this._generateTopCustomersHtml(dashboardData.customers.topSpenders))
        
        // Métricas de estoque
        .replace(/\{\{inventoryValue\}\}/g, formatCurrency(dashboardData.inventory.value))
        .replace(/\{\{inventoryQuantity\}\}/g, formatNumber(dashboardData.inventory.quantity))
        
        // Script de dados para gráficos
        .replace(/\{\{chartData\}\}/g, JSON.stringify(this._generateChartData(dashboardData)));
      
      return template;
    } catch (error) {
      console.error('Erro ao gerar dashboard HTML:', error);
      return `<div class="error">Erro ao gerar dashboard: ${error.message}</div>`;
    }
  }

  /**
   * Gera HTML para a lista de produtos mais vendidos
   * 
   * @param {Array} products Lista de produtos
   * @returns {string} HTML da lista
   * @private
   */
  _generateTopProductsHtml(products) {
    if (!products || !products.length) {
      return '<p>Nenhum produto vendido no período.</p>';
    }
    
    let html = '<ul class="top-products-list">';
    
    products.forEach(product => {
      html += `
        <li class="product-item">
          <div class="product-name">${product.name}</div>
          <div class="product-metrics">
            <span class="product-quantity">${formatNumber(product.quantity)} un.</span>
            <span class="product-revenue">${formatCurrency(product.revenue)}</span>
          </div>
        </li>
      `;
    });
    
    html += '</ul>';
    return html;
  }

  /**
   * Gera HTML para a lista de melhores clientes
   * 
   * @param {Array} customers Lista de clientes
   * @returns {string} HTML da lista
   * @private
   */
  _generateTopCustomersHtml(customers) {
    if (!customers || !customers.length) {
      return '<p>Nenhum cliente no período.</p>';
    }
    
    let html = '<ul class="top-customers-list">';
    
    customers.forEach(customer => {
      html += `
        <li class="customer-item">
          <div class="customer-name">${customer.name || customer.email || `Cliente #${customer.id}`}</div>
          <div class="customer-metrics">
            <span class="customer-orders">${formatNumber(customer.orderCount)} pedidos</span>
            <span class="customer-spent">${formatCurrency(customer.totalSpent)}</span>
          </div>
        </li>
      `;
    });
    
    html += '</ul>';
    return html;
  }

  /**
   * Obtém o template padrão para o dashboard
   * @returns {string} Template HTML
   * @private
   */
  _getDefaultDashboardTemplate() {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard de E-commerce</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js"></script>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; }
    .dashboard-container { padding: 20px; }
    .dashboard-header { margin-bottom: 30px; }
    .metrics-card { height: 100%; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 20px; }
    .metrics-title { font-size: 1rem; color: #666; margin-bottom: 10px; }
    .metrics-value { font-size: 1.8rem; font-weight: bold; margin-bottom: 5px; }
    .metrics-subtitle { font-size: 0.9rem; color: #999; }
    .chart-container { height: 300px; margin-bottom: 30px; }
    .top-products-list, .top-customers-list { list-style: none; padding: 0; }
    .product-item, .customer-item { padding: 10px; border-bottom: 1px solid #eee; }
    .product-name, .customer-name { font-weight: bold; }
    .product-metrics, .customer-metrics { display: flex; justify-content: space-between; }
    .date-range { color: #666; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1 class="display-5">Dashboard de Analytics</h1>
      <p class="date-range">Período: {{startDate}} a {{endDate}}</p>
    </div>
    
    <div class="row g-4 mb-4">
      <!-- Métricas de Receita -->
      <div class="col-md-4">
        <div class="metrics-card bg-light">
          <div class="metrics-title">Receita Total</div>
          <div class="metrics-value text-success">{{totalRevenue}}</div>
          <div class="metrics-subtitle">{{orderCount}} pedidos</div>
        </div>
      </div>
      
      <div class="col-md-4">
        <div class="metrics-card bg-light">
          <div class="metrics-title">Valor Médio do Pedido</div>
          <div class="metrics-value">{{averageOrderValue}}</div>
          <div class="metrics-subtitle">por pedido</div>
        </div>
      </div>
      
      <div class="col-md-4">
        <div class="metrics-card bg-light">
          <div class="metrics-title">Clientes</div>
          <div class="metrics-value">{{totalCustomers}}</div>
          <div class="metrics-subtitle">{{newCustomers}} novos, {{returningCustomers}} recorrentes</div>
        </div>
      </div>
    </div>
    
    <div class="row g-4 mb-4">
      <!-- Gráfico de Receita -->
      <div class="col-md-8">
        <div class="metrics-card">
          <div class="metrics-title">Receita no Período</div>
          <div class="chart-container">
            <canvas id="revenueChart"></canvas>
          </div>
        </div>
      </div>
      
      <!-- Gráfico de Segmentos de Clientes -->
      <div class="col-md-4">
        <div class="metrics-card">
          <div class="metrics-title">Segmentação de Clientes</div>
          <div class="chart-container">
            <canvas id="customerSegmentsChart"></canvas>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row g-4 mb-4">
      <!-- Produtos Mais Vendidos -->
      <div class="col-md-6">
        <div class="metrics-card">
          <div class="metrics-title">Produtos Mais Vendidos</div>
          {{topProductsList}}
        </div>
      </div>
      
      <!-- Melhores Clientes -->
      <div class="col-md-6">
        <div class="metrics-card">
          <div class="metrics-title">Melhores Clientes</div>
          {{topCustomersList}}
        </div>
      </div>
    </div>
    
    <div class="row g-4 mb-4">
      <!-- Gráfico de Produtos Mais Vendidos -->
      <div class="col-md-8">
        <div class="metrics-card">
          <div class="metrics-title">Desempenho dos Produtos</div>
          <div class="chart-container">
            <canvas id="productSalesChart"></canvas>
          </div>
        </div>
      </div>
      
      <!-- Status do Estoque -->
      <div class="col-md-4">
        <div class="metrics-card">
          <div class="metrics-title">Status do Estoque</div>
          <div class="chart-container">
            <canvas id="inventoryStatusChart"></canvas>
          </div>
          <div class="row mt-3">
            <div class="col-6 text-center">
              <div class="metrics-subtitle">Sem Estoque</div>
              <div class="text-danger fw-bold">{{outOfStockCount}}</div>
            </div>
            <div class="col-6 text-center">
              <div class="metrics-subtitle">Baixo Estoque</div>
              <div class="text-warning fw-bold">{{lowStockCount}}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    // Dados para os gráficos
    const chartData = {{chartData}};
    
    // Inicializa os gráficos quando o documento estiver pronto
    document.addEventListener('DOMContentLoaded', function() {
      // Gráfico de Receita
      new Chart(document.getElementById('revenueChart'), {
        type: 'line',
        data: {
          labels: chartData.revenue.labels,
          datasets: [{
            label: chartData.revenue.datasets[0].label,
            data: chartData.revenue.datasets[0].data,
            backgroundColor: chartData.revenue.datasets[0].color,
            borderColor: chartData.revenue.datasets[0].color,
            tension: 0.3,
            fill: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      
      // Gráfico de Produtos Mais Vendidos
      new Chart(document.getElementById('productSalesChart'), {
        type: 'bar',
        data: {
          labels: chartData.productSales.labels,
          datasets: [{
            label: chartData.productSales.datasets[0].label,
            data: chartData.productSales.datasets[0].data,
            backgroundColor: chartData.productSales.datasets[0].color
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      
      // Gráfico de Segmentos de Clientes
      new Chart(document.getElementById('customerSegmentsChart'), {
        type: 'pie',
        data: {
          labels: chartData.customerSegments.labels,
          datasets: [{
            data: chartData.customerSegments.datasets[0].data,
            backgroundColor: chartData.customerSegments.datasets[0].colors
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
      
      // Gráfico de Status do Estoque
      new Chart(document.getElementById('inventoryStatusChart'), {
        type: 'doughnut',
        data: {
          labels: chartData.inventoryStatus.labels,
          datasets: [{
            data: chartData.inventoryStatus.datasets[0].data,
            backgroundColor: chartData.inventoryStatus.datasets[0].colors
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%'
        }
      });
    });
  </script>
</body>
</html>`;
  }
}

module.exports = AnalyticsDashboard;