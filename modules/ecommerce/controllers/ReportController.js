/**
 * Controlador de Relatórios para o E-commerce Manager Core
 */

const ReportService = require('../services/ReportService');

class ReportController {
  /**
   * Cria uma instância do controlador de relatórios
   * @param {Object} options Opções de configuração
   * @param {Object} options.providerManager Gerenciador de provedores
   */
  constructor(options = {}) {
    this.reportService = new ReportService(options);
  }

  /**
   * Gera um relatório de vendas
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {Object} params.dateRange Intervalo de datas {startDate, endDate}
   * @param {Object} params.options Opções adicionais
   * @returns {Promise<Object>} Resposta com dados do relatório
   */
  async generateSalesReport(params) {
    try {
      const { siteId, dateRange, options = {} } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!dateRange || !dateRange.startDate) {
        throw new Error('Intervalo de datas é obrigatório');
      }

      const report = await this.reportService.generateSalesReport(siteId, dateRange, options);
      
      return {
        success: true,
        data: report
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gera um relatório de desempenho de produtos
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {Object} params.dateRange Intervalo de datas {startDate, endDate}
   * @param {Object} params.options Opções adicionais
   * @returns {Promise<Object>} Resposta com dados do relatório
   */
  async generateProductPerformanceReport(params) {
    try {
      const { siteId, dateRange, options = {} } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!dateRange || !dateRange.startDate) {
        throw new Error('Intervalo de datas é obrigatório');
      }

      const report = await this.reportService.generateProductPerformanceReport(siteId, dateRange, options);
      
      return {
        success: true,
        data: report
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gera um relatório de clientes
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {Object} params.dateRange Intervalo de datas {startDate, endDate}
   * @param {Object} params.options Opções adicionais
   * @returns {Promise<Object>} Resposta com dados do relatório
   */
  async generateCustomerReport(params) {
    try {
      const { siteId, dateRange, options = {} } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!dateRange || !dateRange.startDate) {
        throw new Error('Intervalo de datas é obrigatório');
      }

      const report = await this.reportService.generateCustomerReport(siteId, dateRange, options);
      
      return {
        success: true,
        data: report
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gera um relatório de estoque
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {Object} params.options Opções adicionais
   * @returns {Promise<Object>} Resposta com dados do relatório
   */
  async generateInventoryReport(params) {
    try {
      const { siteId, options = {} } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }

      const report = await this.reportService.generateInventoryReport(siteId, options);
      
      return {
        success: true,
        data: report
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtém um painel de métricas resumido
   * 
   * @param {Object} params Parâmetros da requisição
   * @param {string} params.siteId ID do site
   * @param {Object} params.dateRange Intervalo de datas {startDate, endDate}
   * @returns {Promise<Object>} Resposta com dados do painel
   */
  async getDashboardMetrics(params) {
    try {
      const { siteId, dateRange } = params;
      
      if (!siteId) {
        throw new Error('ID do site é obrigatório');
      }
      
      if (!dateRange || !dateRange.startDate) {
        throw new Error('Intervalo de datas é obrigatório');
      }

      // Obtém relatórios necessários
      const [salesReport, productReport, customerReport, inventoryReport] = await Promise.all([
        this.reportService.generateSalesReport(siteId, dateRange),
        this.reportService.generateProductPerformanceReport(siteId, dateRange),
        this.reportService.generateCustomerReport(siteId, dateRange),
        this.reportService.generateInventoryReport(siteId)
      ]);
      
      // Constrói as métricas do painel
      const dashboard = {
        revenue: {
          total: salesReport.totals.sales,
          orders: salesReport.totals.orders,
          averageOrderValue: salesReport.averages.orderValue,
          series: salesReport.series.map(item => ({
            period: item.period,
            value: item.sales
          }))
        },
        products: {
          topSelling: productReport.topProducts.slice(0, 5),
          outOfStock: inventoryReport.stockCategories.outOfStock.count,
          lowStock: inventoryReport.stockCategories.lowStock.count
        },
        customers: {
          total: customerReport.totals.customers,
          new: customerReport.segments.new.count,
          returning: customerReport.segments.returning.count,
          topSpenders: customerReport.topCustomers.slice(0, 5)
        },
        inventory: {
          value: inventoryReport.totals.stockValue,
          quantity: inventoryReport.totals.stockQuantity
        }
      };
      
      return {
        success: true,
        data: dashboard
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = ReportController;