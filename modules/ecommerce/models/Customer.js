/**
 * Modelo de Cliente para o E-commerce Manager Core
 * 
 * Representa um cliente no sistema unificado de e-commerce
 */
class Customer {
  /**
   * Cria uma nova instância de cliente
   * 
   * @param {Object} data Dados do cliente
   * @param {string} data.id Identificador único do cliente
   * @param {string} data.email Email do cliente
   * @param {string} data.firstName Nome do cliente
   * @param {string} data.lastName Sobrenome do cliente
   * @param {string} data.phone Telefone do cliente
   * @param {Object[]} data.addresses Endereços do cliente
   * @param {Object} data.defaultBillingAddress Endereço de cobrança padrão
   * @param {Object} data.defaultShippingAddress Endereço de entrega padrão
   * @param {string} data.notes Notas sobre o cliente
   * @param {Object} data.metadata Metadados adicionais específicos da plataforma
   */
  constructor(data = {}) {
    this.id = data.id || this._generateId();
    this.email = data.email || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.phone = data.phone || '';
    this.addresses = data.addresses || [];
    this.defaultBillingAddress = data.defaultBillingAddress || null;
    this.defaultShippingAddress = data.defaultShippingAddress || null;
    this.notes = data.notes || '';
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Gera um ID único para o cliente
   * @private
   * @returns {string} ID único
   */
  _generateId() {
    return 'cust_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Obtém o nome completo do cliente
   * @returns {string} Nome completo
   */
  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Adiciona um endereço ao cliente
   * @param {Object} address Endereço a ser adicionado
   * @param {Object} options Opções adicionais
   * @param {boolean} options.makeDefaultBilling Define como endereço de cobrança padrão
   * @param {boolean} options.makeDefaultShipping Define como endereço de entrega padrão
   * @returns {string} ID do endereço adicionado
   */
  addAddress(address, options = {}) {
    const addressId = `addr_${this.addresses.length + 1}`;
    const newAddress = {
      id: addressId,
      firstName: address.firstName || this.firstName,
      lastName: address.lastName || this.lastName,
      company: address.company || '',
      address1: address.address1 || '',
      address2: address.address2 || '',
      city: address.city || '',
      state: address.state || '',
      postcode: address.postcode || '',
      country: address.country || '',
      phone: address.phone || this.phone,
      isDefaultBilling: Boolean(options.makeDefaultBilling),
      isDefaultShipping: Boolean(options.makeDefaultShipping)
    };

    this.addresses.push(newAddress);

    // Atualiza os endereços padrão se necessário
    if (options.makeDefaultBilling) {
      this.defaultBillingAddress = newAddress;
      // Atualiza outros endereços
      this.addresses.forEach(addr => {
        if (addr.id !== addressId) addr.isDefaultBilling = false;
      });
    }

    if (options.makeDefaultShipping) {
      this.defaultShippingAddress = newAddress;
      // Atualiza outros endereços
      this.addresses.forEach(addr => {
        if (addr.id !== addressId) addr.isDefaultShipping = false;
      });
    }

    this.updatedAt = new Date().toISOString();
    return addressId;
  }

  /**
   * Atualiza um endereço existente
   * @param {string} addressId ID do endereço
   * @param {Object} updateData Dados de atualização
   * @param {Object} options Opções adicionais
   * @returns {boolean} Se a atualização foi bem sucedida
   */
  updateAddress(addressId, updateData, options = {}) {
    const addressIndex = this.addresses.findIndex(addr => addr.id === addressId);
    if (addressIndex === -1) return false;

    // Atualiza o endereço com os novos dados
    this.addresses[addressIndex] = {
      ...this.addresses[addressIndex],
      ...updateData
    };

    // Atualiza os endereços padrão se necessário
    if (options.makeDefaultBilling) {
      this.defaultBillingAddress = this.addresses[addressIndex];
      this.addresses[addressIndex].isDefaultBilling = true;
      // Atualiza outros endereços
      this.addresses.forEach((addr, idx) => {
        if (idx !== addressIndex) addr.isDefaultBilling = false;
      });
    }

    if (options.makeDefaultShipping) {
      this.defaultShippingAddress = this.addresses[addressIndex];
      this.addresses[addressIndex].isDefaultShipping = true;
      // Atualiza outros endereços
      this.addresses.forEach((addr, idx) => {
        if (idx !== addressIndex) addr.isDefaultShipping = false;
      });
    }

    this.updatedAt = new Date().toISOString();
    return true;
  }

  /**
   * Remove um endereço
   * @param {string} addressId ID do endereço
   * @returns {boolean} Se a remoção foi bem sucedida
   */
  removeAddress(addressId) {
    const initialLength = this.addresses.length;
    const addressToRemove = this.addresses.find(addr => addr.id === addressId);
    
    if (!addressToRemove) return false;
    
    // Remove o endereço
    this.addresses = this.addresses.filter(addr => addr.id !== addressId);
    
    // Atualiza os endereços padrão se necessário
    if (addressToRemove.isDefaultBilling) {
      this.defaultBillingAddress = this.addresses.length > 0 ? this.addresses[0] : null;
      if (this.addresses.length > 0) {
        this.addresses[0].isDefaultBilling = true;
      }
    }
    
    if (addressToRemove.isDefaultShipping) {
      this.defaultShippingAddress = this.addresses.length > 0 ? this.addresses[0] : null;
      if (this.addresses.length > 0) {
        this.addresses[0].isDefaultShipping = true;
      }
    }
    
    this.updatedAt = new Date().toISOString();
    return this.addresses.length !== initialLength;
  }

  /**
   * Valida os dados do cliente
   * @returns {Object} Resultado da validação {isValid: boolean, errors: string[]}
   */
  validate() {
    const errors = [];

    if (!this.email || this.email.trim() === '') {
      errors.push('O e-mail do cliente é obrigatório');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.push('O e-mail do cliente é inválido');
    }

    if (!this.firstName || this.firstName.trim() === '') {
      errors.push('O nome do cliente é obrigatório');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Converte o cliente para um formato adequado para uma plataforma específica
   * @param {string} platform Nome da plataforma (woocommerce, shopify, etc)
   * @returns {Object} Dados formatados para a plataforma
   */
  toPlatformFormat(platform) {
    // Implementação base que pode ser estendida por adaptadores específicos
    return {
      ...this,
      platform
    };
  }

  /**
   * Converte o cliente para um objeto simples
   * @returns {Object} Representação do cliente como objeto simples
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      phone: this.phone,
      addresses: this.addresses,
      defaultBillingAddress: this.defaultBillingAddress,
      defaultShippingAddress: this.defaultShippingAddress,
      notes: this.notes,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Cria uma instância de cliente a partir de um objeto específico de plataforma
   * @param {Object} platformData Dados da plataforma
   * @param {string} platform Nome da plataforma
   * @returns {Customer} Nova instância de cliente
   */
  static fromPlatformFormat(platformData, platform) {
    // Implementação base que pode ser estendida por adaptadores específicos
    return new Customer({
      ...platformData,
      metadata: { platform, originalData: platformData }
    });
  }
}

module.exports = Customer;