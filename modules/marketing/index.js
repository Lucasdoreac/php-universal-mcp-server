/**
 * Marketing Module
 * 
 * Módulo para integração com ferramentas de marketing digital
 * @version 1.0.0
 */

const GoogleAnalyticsProvider = require('./providers/google-analytics');
const EmailMarketingProvider = require('./providers/email-marketing');
const SocialMediaProvider = require('./providers/social-media');

class MarketingManager {
  constructor(options = {}) {
    this.options = {
      googleAnalytics: options.googleAnalytics || {},
      emailMarketing: options.emailMarketing || {},
      socialMedia: options.socialMedia || {}
    };
    
    // Inicializa provedores de marketing
    this.googleAnalytics = new GoogleAnalyticsProvider(this.options.googleAnalytics);
    this.emailMarketing = new EmailMarketingProvider(this.options.emailMarketing);
    this.socialMedia = new SocialMediaProvider(this.options.socialMedia);
    
    // Provedores ativos
    this.providers = {
      googleAnalytics: this.googleAnalytics,
      emailMarketing: this.emailMarketing,
      socialMedia: this.socialMedia
    };
  }
  
  /**
   * Inicialização do módulo
   */
  async initialize() {
    // Inicializar cada provedor
    await this.googleAnalytics.initialize();
    await this.emailMarketing.initialize();
    await this.socialMedia.initialize();
    
    console.log('Marketing Manager initialized');
    return true;
  }
  
  /**
   * Registra métodos de API para o módulo de marketing
   */
  registerApiMethods(server) {
    // Métodos para Google Analytics
    server.registerMethod('marketing.analytics.getReports', async (params) => {
      return await this.googleAnalytics.getReports(params);
    });
    
    server.registerMethod('marketing.analytics.trackEvent', async (params) => {
      return await this.googleAnalytics.trackEvent(params);
    });
    
    server.registerMethod('marketing.analytics.getDashboard', async (params) => {
      return await this.googleAnalytics.getDashboard(params);
    });
    
    // Métodos para Email Marketing
    server.registerMethod('marketing.email.getCampaigns', async (params) => {
      return await this.emailMarketing.getCampaigns(params);
    });
    
    server.registerMethod('marketing.email.createCampaign', async (params) => {
      return await this.emailMarketing.createCampaign(params);
    });
    
    server.registerMethod('marketing.email.sendCampaign', async (params) => {
      return await this.emailMarketing.sendCampaign(params);
    });
    
    // Métodos para Social Media
    server.registerMethod('marketing.social.getPosts', async (params) => {
      return await this.socialMedia.getPosts(params);
    });
    
    server.registerMethod('marketing.social.createPost', async (params) => {
      return await this.socialMedia.createPost(params);
    });
    
    server.registerMethod('marketing.social.schedulePost', async (params) => {
      return await this.socialMedia.schedulePost(params);
    });
  }
  
  /**
   * Obtém um provedor específico
   */
  getProvider(providerName) {
    return this.providers[providerName] || null;
  }
}

module.exports = { MarketingManager };
