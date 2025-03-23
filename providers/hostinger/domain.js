/**
 * Módulo de gerenciamento de domínios para o provedor Hostinger
 */

class HostingerDomain {
  /**
   * Construtor da classe de gerenciamento de domínios
   * @param {Object} api Instância de HostingerAPI
   */
  constructor(api) {
    this.api = api;
  }

  /**
   * Lista todos os domínios da conta
   * @returns {Promise<Array>} Lista de domínios
   */
  async listDomains() {
    return this.api.listDomains();
  }

  /**
   * Obtém detalhes de um domínio
   * @param {string} domainName Nome do domínio
   * @returns {Promise<Object>} Detalhes do domínio
   */
  async getDomainDetails(domainName) {
    return this.api.getDomain(domainName);
  }

  /**
   * Verifica disponibilidade de um domínio
   * @param {string} domainName Nome do domínio a verificar
   * @returns {Promise<Object>} Resultado da verificação
   */
  async checkDomainAvailability(domainName) {
    try {
      // Na implementação real, chamar endpoint específico da API
      const response = await this.api.get(`/domains/check?domain=${domainName}`);
      return response;
    } catch (error) {
      throw new Error(`Falha ao verificar disponibilidade do domínio: ${error.message}`);
    }
  }

  /**
   * Associa um domínio a um website
   * @param {string} websiteId ID do website
   * @param {string} domainName Nome do domínio
   * @returns {Promise<Object>} Resultado da associação
   */
  async associateDomain(websiteId, domainName) {
    try {
      const result = await this.api.post(`/websites/${websiteId}/domains`, {
        domain: domainName
      });
      return result;
    } catch (error) {
      throw new Error(`Falha ao associar domínio ao website: ${error.message}`);
    }
  }

  /**
   * Lista registros DNS de um domínio
   * @param {string} domainName Nome do domínio
   * @returns {Promise<Array>} Lista de registros DNS
   */
  async listDnsRecords(domainName) {
    return this.api.listDnsRecords(domainName);
  }

  /**
   * Cria um registro DNS
   * @param {string} domainName Nome do domínio
   * @param {Object} record Dados do registro DNS
   * @returns {Promise<Object>} Registro DNS criado
   */
  async createDnsRecord(domainName, record) {
    return this.api.createDnsRecords(domainName, [record]);
  }

  /**
   * Cria múltiplos registros DNS
   * @param {string} domainName Nome do domínio
   * @param {Array} records Lista de registros DNS
   * @returns {Promise<Object>} Resultado da operação
   */
  async createDnsRecords(domainName, records) {
    return this.api.createDnsRecords(domainName, records);
  }

  /**
   * Remove um registro DNS
   * @param {string} domainName Nome do domínio
   * @param {string} recordId ID do registro DNS
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async deleteDnsRecord(domainName, recordId) {
    await this.api.deleteDnsRecord(domainName, recordId);
    return true;
  }

  /**
   * Configura servidores de nome para um domínio
   * @param {string} domainName Nome do domínio
   * @param {Array} nameservers Lista de servidores de nome
   * @returns {Promise<Object>} Resultado da operação
   */
  async setNameservers(domainName, nameservers) {
    try {
      const result = await this.api.put(`/domains/${domainName}/nameservers`, {
        nameservers
      });
      return result;
    } catch (error) {
      throw new Error(`Falha ao configurar servidores de nome: ${error.message}`);
    }
  }

  /**
   * Renova um domínio
   * @param {string} domainName Nome do domínio
   * @param {number} years Anos de renovação
   * @returns {Promise<Object>} Resultado da renovação
   */
  async renewDomain(domainName, years = 1) {
    try {
      const result = await this.api.post(`/domains/${domainName}/renew`, {
        years
      });
      return result;
    } catch (error) {
      throw new Error(`Falha ao renovar domínio: ${error.message}`);
    }
  }

  /**
   * Configura redirecionamento de domínio
   * @param {string} domainName Nome do domínio
   * @param {string} targetUrl URL de destino
   * @param {boolean} includeSubdomains Incluir subdomínios
   * @returns {Promise<Object>} Resultado da operação
   */
  async setDomainRedirect(domainName, targetUrl, includeSubdomains = true) {
    try {
      const result = await this.api.post(`/domains/${domainName}/redirect`, {
        target_url: targetUrl,
        include_subdomains: includeSubdomains
      });
      return result;
    } catch (error) {
      throw new Error(`Falha ao configurar redirecionamento: ${error.message}`);
    }
  }

  /**
   * Configura MX records para email
   * @param {string} domainName Nome do domínio
   * @param {string} provider Provedor de email (hostinger, gmail, outlook, custom)
   * @param {Array} customRecords Registros MX personalizados (se provider for custom)
   * @returns {Promise<Object>} Resultado da operação
   */
  async setupEmailMX(domainName, provider = 'hostinger', customRecords = []) {
    try {
      let mxRecords = [];

      // Configura registros MX baseado no provedor
      if (provider === 'hostinger') {
        mxRecords = [
          { type: 'MX', name: '@', content: 'mx1.hostinger.com', priority: 10, ttl: 14400 },
          { type: 'MX', name: '@', content: 'mx2.hostinger.com', priority: 20, ttl: 14400 }
        ];
      } else if (provider === 'gmail') {
        mxRecords = [
          { type: 'MX', name: '@', content: 'aspmx.l.google.com', priority: 1, ttl: 14400 },
          { type: 'MX', name: '@', content: 'alt1.aspmx.l.google.com', priority: 5, ttl: 14400 },
          { type: 'MX', name: '@', content: 'alt2.aspmx.l.google.com', priority: 5, ttl: 14400 },
          { type: 'MX', name: '@', content: 'alt3.aspmx.l.google.com', priority: 10, ttl: 14400 },
          { type: 'MX', name: '@', content: 'alt4.aspmx.l.google.com', priority: 10, ttl: 14400 }
        ];
      } else if (provider === 'outlook') {
        mxRecords = [
          { type: 'MX', name: '@', content: 'outlook-com.olc.protection.outlook.com', priority: 10, ttl: 14400 }
        ];
      } else if (provider === 'custom') {
        mxRecords = customRecords;
      }

      // Cria os registros MX
      return await this.createDnsRecords(domainName, mxRecords);
    } catch (error) {
      throw new Error(`Falha ao configurar registros MX: ${error.message}`);
    }
  }
}

module.exports = HostingerDomain;