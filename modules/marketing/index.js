/**
 * Marketing Manager
 * 
 * Gerenciamento centralizado de funcionalidades de marketing digital
 * @version 1.0.0
 */

const path = require('path');
const fs = require('fs');
const SEOManager = require('./seo');
const AnalyticsManager = require('./analytics');
const EmailManager = require('./email');
const SocialManager = require('./social');
const TrackingManager = require('./tracking');

class MarketingManager {
  constructor(server, options = {}) {
    this.server = server;
    this.options = {
      dataDir: path.join(process.cwd(), 'data/marketing'),
      ...options
    };
    
    // Criar diretório de dados se não existir
    if (!fs.existsSync(this.options.dataDir)) {
      fs.mkdirSync(this.options.dataDir, { recursive: true });
    }
    
    // Inicializar componentes
    this.seoManager = new SEOManager(this, options.seo || {});
    this.analyticsManager = new AnalyticsManager(this, options.analytics || {});
    this.emailManager = new EmailManager(this, options.email || {});
    this.socialManager = new SocialManager(this, options.social || {});
    this.trackingManager = new TrackingManager(this, options.tracking || {});
    
    // Registro de providers
    this.providers = new Map();
  }
  
  /**
   * Inicializa o módulo de marketing
   */
  async initialize() {
    console.log('Inicializando Marketing Manager...');
    
    try {
      // Inicializar subcomponentes
      await this.seoManager.initialize();
      await this.analyticsManager.initialize();
      await this.emailManager.initialize();
      await this.socialManager.initialize();
      await this.trackingManager.initialize();
      
      return true;
    } catch (error) {
      console.error('Erro ao inicializar Marketing Manager:', error);
      return false;
    }
  }
  
  /**
   * Registra um provider de marketing
   */
  registerProvider(name, provider) {
    this.providers.set(name, provider);
    return this;
  }
  
  /**
   * Obtém um provider de marketing
   */
  getProvider(name) {
    return this.providers.get(name);
  }
  
  /**
   * Obtém uma visão geral consolidada de marketing para um site
   */
  async getOverview(siteId) {
    try {
      const [
        seoData,
        analyticsData,
        emailData,
        socialData,
        trackingData
      ] = await Promise.all([
        this.seoManager.getSEOOverview(siteId),
        this.analyticsManager.getAnalyticsOverview(siteId),
        this.emailManager.getEmailOverview(siteId),
        this.socialManager.getSocialOverview(siteId),
        this.trackingManager.getTrackingOverview(siteId)
      ]);
      
      return {
        siteId,
        timestamp: new Date().toISOString(),
        seo: seoData,
        analytics: analyticsData,
        email: emailData,
        social: socialData,
        tracking: trackingData
      };
    } catch (error) {
      console.error(`Erro ao obter visão geral de marketing para site ${siteId}:`, error);
      throw error;
    }
  }
  
  /**
   * Gera um dashboard de marketing para o Claude
   */
  async generateMarketingDashboard(siteId) {
    try {
      const overviewData = await this.getOverview(siteId);
      
      // Este é um exemplo simplificado de artifact para o Claude
      return {
        data: overviewData,
        visualization: {
          type: 'artifact',
          title: 'Marketing Dashboard',
          content: `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Marketing Dashboard - Site ${siteId}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .dashboard { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
              .card { background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 16px; }
              .card h2 { margin-top: 0; color: #333; font-size: 18px; }
              .metrics { display: flex; flex-wrap: wrap; gap: 10px; }
              .metric { background: #f5f5f5; border-radius: 4px; padding: 10px; flex: 1; min-width: 120px; }
              .metric-title { font-size: 12px; color: #666; margin-bottom: 5px; }
              .metric-value { font-size: 24px; font-weight: bold; color: #0066cc; }
              .metric-change { font-size: 12px; }
              .positive { color: green; }
              .negative { color: red; }
            </style>
          </head>
          <body>
            <h1>Marketing Dashboard - Site ${siteId}</h1>
            <div class="dashboard">
              <!-- SEO Card -->
              <div class="card">
                <h2>SEO Overview</h2>
                <div class="metrics">
                  <div class="metric">
                    <div class="metric-title">Overall Score</div>
                    <div class="metric-value">${overviewData.seo?.overallScore || 'N/A'}</div>
                  </div>
                  <div class="metric">
                    <div class="metric-title">Indexed Pages</div>
                    <div class="metric-value">${overviewData.seo?.indexedPages || 'N/A'}</div>
                  </div>
                  <div class="metric">
                    <div class="metric-title">Keywords Ranking</div>
                    <div class="metric-value">${overviewData.seo?.keywordsRanking || 'N/A'}</div>
                  </div>
                </div>
              </div>
              
              <!-- Analytics Card -->
              <div class="card">
                <h2>Analytics Overview</h2>
                <div class="metrics">
                  <div class="metric">
                    <div class="metric-title">Visitors (30d)</div>
                    <div class="metric-value">${overviewData.analytics?.visitors || 'N/A'}</div>
                  </div>
                  <div class="metric">
                    <div class="metric-title">Bounce Rate</div>
                    <div class="metric-value">${overviewData.analytics?.bounceRate || 'N/A'}</div>
                  </div>
                  <div class="metric">
                    <div class="metric-title">Avg. Session</div>
                    <div class="metric-value">${overviewData.analytics?.avgSessionDuration || 'N/A'}</div>
                  </div>
                </div>
              </div>
              
              <!-- Email Card -->
              <div class="card">
                <h2>Email Marketing</h2>
                <div class="metrics">
                  <div class="metric">
                    <div class="metric-title">Subscribers</div>
                    <div class="metric-value">${overviewData.email?.subscribers || 'N/A'}</div>
                  </div>
                  <div class="metric">
                    <div class="metric-title">Open Rate</div>
                    <div class="metric-value">${overviewData.email?.openRate || 'N/A'}</div>
                  </div>
                  <div class="metric">
                    <div class="metric-title">Click Rate</div>
                    <div class="metric-value">${overviewData.email?.clickRate || 'N/A'}</div>
                  </div>
                </div>
              </div>
              
              <!-- Social Media Card -->
              <div class="card">
                <h2>Social Media</h2>
                <div class="metrics">
                  <div class="metric">
                    <div class="metric-title">Followers</div>
                    <div class="metric-value">${overviewData.social?.followers || 'N/A'}</div>
                  </div>
                  <div class="metric">
                    <div class="metric-title">Engagement</div>
                    <div class="metric-value">${overviewData.social?.engagement || 'N/A'}</div>
                  </div>
                  <div class="metric">
                    <div class="metric-title">Clicks</div>
                    <div class="metric-value">${overviewData.social?.clicks || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
          </body>
          </html>
          `
        }
      };
    } catch (error) {
      console.error(`Erro ao gerar dashboard de marketing para site ${siteId}:`, error);
      throw error;
    }
  }
  
  /**
   * Registro de métodos da API
   */
  registerApiMethods() {
    // Método para obter visão geral de marketing
    this.server.registerMethod('marketing.getOverview', async (params) => {
      try {
        const { siteId } = params;
        const data = await this.getOverview(siteId);
        return { success: true, data };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    // Método para gerar dashboard de marketing
    this.server.registerMethod('marketing.generateDashboard', async (params) => {
      try {
        const { siteId } = params;
        const dashboard = await this.generateMarketingDashboard(siteId);
        return { success: true, data: dashboard };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    // Delegação para subcomponentes
    this.seoManager.registerApiMethods();
    this.analyticsManager.registerApiMethods();
    this.emailManager.registerApiMethods();
    this.socialManager.registerApiMethods();
    this.trackingManager.registerApiMethods();
  }
}

module.exports = MarketingManager;