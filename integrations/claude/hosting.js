/**
 * Integração do gerenciamento de hospedagem com Claude Desktop
 */

const { formatResponse } = require('./utils');

class HostingIntegration {
  /**
   * Construtor da classe de integração
   * @param {Object} server Servidor MCP
   * @param {Object} hostingManager Instância do HostingManager
   */
  constructor(server, hostingManager) {
    this.server = server;
    this.hostingManager = hostingManager;
  }

  /**
   * Processa comandos relacionados a hospedagem
   * @param {string} command Comando a ser processado
   * @param {Array} args Argumentos do comando
   * @returns {Promise<string>} Resposta formatada para o Claude
   */
  async processCommand(command, args) {
    try {
      switch (command) {
        case 'criar site':
          return await this.handleCreateSite(args);
        case 'listar sites':
          return await this.handleListSites(args);
        case 'atualizar site':
          return await this.handleUpdateSite(args);
        case 'excluir site':
          return await this.handleDeleteSite(args);
        case 'configurar domínio':
          return await this.handleConfigureDomain(args);
        case 'configurar ssl':
          return await this.handleSetupSSL(args);
        case 'atualizar plano':
          return await this.handleUpgradePlan(args);
        case 'fazer backup':
          return await this.handleCreateBackup(args);
        case 'restaurar backup':
          return await this.handleRestoreBackup(args);
        default:
          return formatResponse('error', `Comando de hospedagem desconhecido: ${command}`);
      }
    } catch (error) {
      return formatResponse('error', `Erro ao processar comando de hospedagem: ${error.message}`);
    }
  }

  /**
   * Trata comando para criar site
   * @param {Array} args Argumentos do comando
   * @returns {Promise<string>} Resposta formatada
   */
  async handleCreateSite(args) {
    try {
      if (args.length < 2) {
        return formatResponse('error', 'Uso: criar site <provedor> <nome> [opções]');
      }

      const provider = args[0];
      const name = args[1];
      let options = { domain: name };

      // Processa opções adicionais
      if (args.length > 2) {
        const additionalOptions = args.slice(2).join(' ');
        try {
          const parsedOptions = JSON.parse(additionalOptions);
          options = { ...options, ...parsedOptions };
        } catch (e) {
          // Se não for JSON válido, consideramos como título
          options.title = additionalOptions;
        }
      }

      const site = await this.hostingManager.createSite(options, provider);
      return formatResponse('success', `Site criado com sucesso!`, {
        id: site.id,
        domain: site.domain,
        status: site.status
      });
    } catch (error) {
      return formatResponse('error', `Erro ao criar site: ${error.message}`);
    }
  }

  /**
   * Trata comando para listar sites
   * @param {Array} args Argumentos do comando
   * @returns {Promise<string>} Resposta formatada
   */
  async handleListSites(args) {
    try {
      const provider = args.length > 0 ? args[0] : null;
      const filter = args.length > 1 ? args.slice(1).join(' ') : {};

      const sites = await this.hostingManager.listSites(provider, filter);
      if (!sites || sites.length === 0) {
        return formatResponse('info', 'Nenhum site encontrado.');
      }

      // Formata a lista de sites para exibição
      const siteList = sites.map(site => ({
        id: site.id,
        domain: site.domain,
        status: site.status
      }));

      return formatResponse('success', `${sites.length} sites encontrados:`, siteList);
    } catch (error) {
      return formatResponse('error', `Erro ao listar sites: ${error.message}`);
    }
  }

  /**
   * Trata comando para atualizar site
   * @param {Array} args Argumentos do comando
   * @returns {Promise<string>} Resposta formatada
   */
  async handleUpdateSite(args) {
    try {
      if (args.length < 2) {
        return formatResponse('error', 'Uso: atualizar site <id> <opções>');
      }

      const siteId = args[0];
      let updates = {};

      // Processa opções de atualização
      const updateOptions = args.slice(1).join(' ');
      try {
        updates = JSON.parse(updateOptions);
      } catch (e) {
        // Se não for JSON válido, tentamos analisar como pares chave-valor
        const parts = updateOptions.split(' ');
        for (let i = 0; i < parts.length; i += 2) {
          if (parts[i] && parts[i + 1]) {
            updates[parts[i]] = parts[i + 1];
          }
        }
      }

      if (Object.keys(updates).length === 0) {
        return formatResponse('error', 'Nenhuma atualização fornecida');
      }

      const result = await this.hostingManager.updateSite(siteId, updates);
      return formatResponse('success', `Site ${siteId} atualizado com sucesso!`, {
        id: result.id,
        domain: result.domain,
        status: result.status,
        updated: Object.keys(updates)
      });
    } catch (error) {
      return formatResponse('error', `Erro ao atualizar site: ${error.message}`);
    }
  }

  /**
   * Trata comando para excluir site
   * @param {Array} args Argumentos do comando
   * @returns {Promise<string>} Resposta formatada
   */
  async handleDeleteSite(args) {
    try {
      if (args.length < 1) {
        return formatResponse('error', 'Uso: excluir site <id>');
      }

      const siteId = args[0];
      const provider = args.length > 1 ? args[1] : null;

      await this.hostingManager.deleteSite(siteId, provider);
      return formatResponse('success', `Site ${siteId} excluído com sucesso!`);
    } catch (error) {
      return formatResponse('error', `Erro ao excluir site: ${error.message}`);
    }
  }

  /**
   * Trata comando para configurar domínio
   * @param {Array} args Argumentos do comando
   * @returns {Promise<string>} Resposta formatada
   */
  async handleConfigureDomain(args) {
    try {
      if (args.length < 2) {
        return formatResponse('error', 'Uso: configurar domínio <site-id> <domínio>');
      }

      const siteId = args[0];
      const domain = args[1];
      const provider = args.length > 2 ? args[2] : null;

      const result = await this.hostingManager.configureDomain(siteId, { domain }, provider);
      return formatResponse('success', `Domínio ${domain} configurado com sucesso para o site ${siteId}!`, {
        domain,
        status: result.status || 'configuring'
      });
    } catch (error) {
      return formatResponse('error', `Erro ao configurar domínio: ${error.message}`);
    }
  }

  /**
   * Trata comando para configurar SSL
   * @param {Array} args Argumentos do comando
   * @returns {Promise<string>} Resposta formatada
   */
  async handleSetupSSL(args) {
    try {
      if (args.length < 1) {
        return formatResponse('error', 'Uso: configurar ssl <site-id>');
      }

      const siteId = args[0];
      const provider = args.length > 1 ? args[1] : null;

      const result = await this.hostingManager.setupSSL(siteId, provider);
      return formatResponse('success', `Certificado SSL configurado com sucesso para o site ${siteId}!`, {
        status: result.status || 'issued',
        expiry: result.expiry || 'three months from now'
      });
    } catch (error) {
      return formatResponse('error', `Erro ao configurar SSL: ${error.message}`);
    }
  }

  /**
   * Trata comando para atualizar plano
   * @param {Array} args Argumentos do comando
   * @returns {Promise<string>} Resposta formatada
   */
  async handleUpgradePlan(args) {
    try {
      if (args.length < 2) {
        return formatResponse('error', 'Uso: atualizar plano <site-id> <plano>');
      }

      const siteId = args[0];
      const plan = args[1];
      const provider = args.length > 2 ? args[2] : null;

      const result = await this.hostingManager.upgradePlan(siteId, plan, provider);
      return formatResponse('success', `Plano do site ${siteId} atualizado para ${plan} com sucesso!`, {
        plan,
        status: result.status || 'updated'
      });
    } catch (error) {
      return formatResponse('error', `Erro ao atualizar plano: ${error.message}`);
    }
  }

  /**
   * Trata comando para criar backup
   * @param {Array} args Argumentos do comando
   * @returns {Promise<string>} Resposta formatada
   */
  async handleCreateBackup(args) {
    try {
      if (args.length < 1) {
        return formatResponse('error', 'Uso: fazer backup <site-id>');
      }

      const siteId = args[0];
      const provider = args.length > 1 ? args[1] : null;

      const result = await this.hostingManager.createBackup(siteId, provider);
      return formatResponse('success', `Backup criado com sucesso para o site ${siteId}!`, {
        backupId: result.id || 'backup-' + Date.now(),
        timestamp: result.timestamp || new Date().toISOString(),
        status: result.status || 'completed'
      });
    } catch (error) {
      return formatResponse('error', `Erro ao criar backup: ${error.message}`);
    }
  }

  /**
   * Trata comando para restaurar backup
   * @param {Array} args Argumentos do comando
   * @returns {Promise<string>} Resposta formatada
   */
  async handleRestoreBackup(args) {
    try {
      if (args.length < 2) {
        return formatResponse('error', 'Uso: restaurar backup <site-id> <backup-id>');
      }

      const siteId = args[0];
      const backupId = args[1];
      const provider = args.length > 2 ? args[2] : null;

      const result = await this.hostingManager.restoreBackup(siteId, backupId, provider);
      return formatResponse('success', `Backup ${backupId} restaurado com sucesso para o site ${siteId}!`, {
        status: result.status || 'completed',
        timestamp: result.timestamp || new Date().toISOString()
      });
    } catch (error) {
      return formatResponse('error', `Erro ao restaurar backup: ${error.message}`);
    }
  }
}

module.exports = HostingIntegration;