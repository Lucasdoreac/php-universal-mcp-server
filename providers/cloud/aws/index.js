/**
 * Módulo de integração com Amazon Web Services (AWS)
 * @module providers/cloud/aws
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Importa subserviços
const EC2Service = require('./services/ec2');
const S3Service = require('./services/s3');
const LambdaService = require('./services/lambda');

/**
 * Classe para gerenciamento de recursos AWS
 */
class AWSProvider {
  /**
   * Cria uma instância do provedor AWS
   * @param {Object} config - Configuração do provedor AWS
   * @param {string} config.region - Região da AWS (ex: us-east-1)
   * @param {string} config.accessKeyId - ID da chave de acesso da AWS
   * @param {string} config.secretAccessKey - Chave de acesso secreta da AWS
   * @param {Object} config.services - Configurações específicas dos serviços
   */
  constructor(config = {}) {
    this.config = config;
    this.configured = false;

    // Configurar AWS SDK
    try {
      AWS.config.update({
        region: config.region || 'us-east-1',
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      });
      
      // Inicializar serviços
      this.ec2 = new EC2Service(AWS, config.services?.ec2 || {});
      this.s3 = new S3Service(AWS, config.services?.s3 || {});
      this.lambda = new LambdaService(AWS, config.services?.lambda || {});
      
      this.configured = !!(config.accessKeyId && config.secretAccessKey);
    } catch (error) {
      console.error('Erro ao inicializar provedor AWS:', error);
      this.configured = false;
    }
  }

  /**
   * Verifica se o provedor está configurado corretamente
   * @returns {Promise<boolean>} Promessa que resolve para true se o provedor estiver configurado
   */
  async isConfigured() {
    if (!this.configured) {
      return false;
    }
    
    try {
      // Tenta fazer uma operação simples na AWS para verificar a configuração
      const sts = new AWS.STS();
      await sts.getCallerIdentity().promise();
      return true;
    } catch (error) {
      console.error('Erro ao verificar configuração AWS:', error);
      return false;
    }
  }

  /**
   * Lista os serviços disponíveis no provedor AWS
   * @returns {string[]} Lista de serviços disponíveis
   */
  listServices() {
    return ['ec2', 's3', 'lambda'];
  }

  /**
   * Obtém métricas do provedor AWS
   * @returns {Promise<Object>} Métricas dos serviços AWS
   */
  async getMetrics() {
    if (!await this.isConfigured()) {
      throw new Error('Provedor AWS não está configurado corretamente');
    }

    const metrics = {};
    
    try {
      // Obter métricas de cada serviço
      metrics.ec2 = await this.ec2.getMetrics();
      metrics.s3 = await this.s3.getMetrics();
      metrics.lambda = await this.lambda.getMetrics();
      
      // Adicionar métricas gerais do provedor
      const sts = new AWS.STS();
      const identity = await sts.getCallerIdentity().promise();
      
      metrics.account = {
        accountId: identity.Account,
        userId: identity.UserId,
        arn: identity.Arn
      };
      
      return metrics;
    } catch (error) {
      console.error('Erro ao obter métricas da AWS:', error);
      throw error;
    }
  }

  /**
   * Cria uma instância de um site PHP no provedor AWS
   * @param {Object} siteConfig - Configuração do site PHP
   * @param {string} siteConfig.name - Nome do site
   * @param {string} siteConfig.domain - Domínio do site
   * @param {string} siteConfig.type - Tipo de deploy (ec2, lambda, s3)
   * @returns {Promise<Object>} Informações do site criado
   */
  async createPhpSite(siteConfig) {
    if (!await this.isConfigured()) {
      throw new Error('Provedor AWS não está configurado corretamente');
    }

    try {
      switch (siteConfig.type) {
        case 'ec2':
          return await this.ec2.createPhpSite(siteConfig);
        case 'lambda':
          return await this.lambda.createPhpSite(siteConfig);
        case 's3':
          return await this.s3.createStaticSite(siteConfig);
        default:
          throw new Error(`Tipo de deploy não suportado: ${siteConfig.type}`);
      }
    } catch (error) {
      console.error('Erro ao criar site PHP na AWS:', error);
      throw error;
    }
  }

  /**
   * Lista todos os sites PHP hospedados na AWS
   * @param {Object} filters - Filtros para a listagem
   * @returns {Promise<Array>} Lista de sites PHP
   */
  async listPhpSites(filters = {}) {
    if (!await this.isConfigured()) {
      throw new Error('Provedor AWS não está configurado corretamente');
    }

    try {
      // Combina sites de diferentes serviços
      const ec2Sites = await this.ec2.listPhpSites(filters);
      const lambdaSites = await this.lambda.listPhpSites(filters);
      const s3Sites = await this.s3.listStaticSites(filters);
      
      return [
        ...ec2Sites.map(site => ({ ...site, provider: 'aws', service: 'ec2' })),
        ...lambdaSites.map(site => ({ ...site, provider: 'aws', service: 'lambda' })),
        ...s3Sites.map(site => ({ ...site, provider: 'aws', service: 's3' }))
      ];
    } catch (error) {
      console.error('Erro ao listar sites PHP na AWS:', error);
      throw error;
    }
  }

  /**
   * Obtém detalhes de um site PHP específico
   * @param {string} siteId - ID do site
   * @param {string} service - Serviço onde o site está hospedado (ec2, lambda, s3)
   * @returns {Promise<Object>} Detalhes do site
   */
  async getPhpSite(siteId, service) {
    if (!await this.isConfigured()) {
      throw new Error('Provedor AWS não está configurado corretamente');
    }

    try {
      switch (service) {
        case 'ec2':
          return await this.ec2.getPhpSite(siteId);
        case 'lambda':
          return await this.lambda.getPhpSite(siteId);
        case 's3':
          return await this.s3.getStaticSite(siteId);
        default:
          throw new Error(`Serviço não suportado: ${service}`);
      }
    } catch (error) {
      console.error(`Erro ao obter site PHP ${siteId} na AWS:`, error);
      throw error;
    }
  }

  /**
   * Atualiza um site PHP existente
   * @param {string} siteId - ID do site
   * @param {string} service - Serviço onde o site está hospedado (ec2, lambda, s3)
   * @param {Object} updates - Atualizações a serem aplicadas
   * @returns {Promise<Object>} Detalhes do site atualizado
   */
  async updatePhpSite(siteId, service, updates) {
    if (!await this.isConfigured()) {
      throw new Error('Provedor AWS não está configurado corretamente');
    }

    try {
      switch (service) {
        case 'ec2':
          return await this.ec2.updatePhpSite(siteId, updates);
        case 'lambda':
          return await this.lambda.updatePhpSite(siteId, updates);
        case 's3':
          return await this.s3.updateStaticSite(siteId, updates);
        default:
          throw new Error(`Serviço não suportado: ${service}`);
      }
    } catch (error) {
      console.error(`Erro ao atualizar site PHP ${siteId} na AWS:`, error);
      throw error;
    }
  }

  /**
   * Exclui um site PHP
   * @param {string} siteId - ID do site
   * @param {string} service - Serviço onde o site está hospedado (ec2, lambda, s3)
   * @returns {Promise<boolean>} True se o site foi excluído com sucesso
   */
  async deletePhpSite(siteId, service) {
    if (!await this.isConfigured()) {
      throw new Error('Provedor AWS não está configurado corretamente');
    }

    try {
      switch (service) {
        case 'ec2':
          return await this.ec2.deletePhpSite(siteId);
        case 'lambda':
          return await this.lambda.deletePhpSite(siteId);
        case 's3':
          return await this.s3.deleteStaticSite(siteId);
        default:
          throw new Error(`Serviço não suportado: ${service}`);
      }
    } catch (error) {
      console.error(`Erro ao excluir site PHP ${siteId} na AWS:`, error);
      throw error;
    }
  }

  /**
   * Cria um backup de um site PHP
   * @param {string} siteId - ID do site
   * @param {string} service - Serviço onde o site está hospedado (ec2, lambda, s3)
   * @returns {Promise<Object>} Informações do backup criado
   */
  async backupPhpSite(siteId, service) {
    if (!await this.isConfigured()) {
      throw new Error('Provedor AWS não está configurado corretamente');
    }

    try {
      switch (service) {
        case 'ec2':
          return await this.ec2.backupPhpSite(siteId);
        case 'lambda':
          return await this.lambda.backupPhpSite(siteId);
        case 's3':
          return await this.s3.backupStaticSite(siteId);
        default:
          throw new Error(`Serviço não suportado: ${service}`);
      }
    } catch (error) {
      console.error(`Erro ao criar backup do site PHP ${siteId} na AWS:`, error);
      throw error;
    }
  }

  /**
   * Restaura um site PHP a partir de um backup
   * @param {string} siteId - ID do site
   * @param {string} service - Serviço onde o site está hospedado (ec2, lambda, s3)
   * @param {string} backupId - ID do backup
   * @returns {Promise<Object>} Informações do site restaurado
   */
  async restorePhpSite(siteId, service, backupId) {
    if (!await this.isConfigured()) {
      throw new Error('Provedor AWS não está configurado corretamente');
    }

    try {
      switch (service) {
        case 'ec2':
          return await this.ec2.restorePhpSite(siteId, backupId);
        case 'lambda':
          return await this.lambda.restorePhpSite(siteId, backupId);
        case 's3':
          return await this.s3.restoreStaticSite(siteId, backupId);
        default:
          throw new Error(`Serviço não suportado: ${service}`);
      }
    } catch (error) {
      console.error(`Erro ao restaurar site PHP ${siteId} na AWS:`, error);
      throw error;
    }
  }
}

module.exports = AWSProvider;