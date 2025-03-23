/**
 * Modelo de Pedido para o E-commerce Manager Core
 * 
 * Representa um pedido no sistema unificado de e-commerce
 */
class Order {
  /**
   * Cria uma nova instância de pedido
   * 
   * @param {Object} data Dados do pedido
   * @param {string} data.id Identificador único do pedido
   * @param {string} data.number Número do pedido para exibição
   * @param {Object} data.customer Informações do cliente
   * @param {Object} data.billing Endereço de cobrança
   * @param {Object} data.shipping Endereço de entrega
   * @param {Object[]} data.items Itens do pedido
   * @param {number} data.itemsTotal Total dos itens (subtotal)
   * @param {number} data.discountTotal Total de descontos
   * @param {number} data.shippingTotal Total de frete
   * @param {number} data.taxTotal Total de impostos
   * @param {number} data.total Total geral do pedido
   * @param {string} data.currency Moeda utilizada
   * @param {string} data.status Status atual do pedido
   * @param {string} data.paymentMethod Método de pagamento
   * @param {string} data.paymentStatus Status do pagamento
   * @param {string} data.shippingMethod Método de envio
   * @param {Object[]} data.notes Notas e comentários do pedido
   * @param {Object[]} data.coupons Cupons aplicados
   * @param {Object} data.metadata Metadados adicionais específicos da plataforma
   */
  constructor(data = {}) {
    this.id = data.id || this._generateId();
    this.number = data.number || this._generateOrderNumber();
    this.customer = data.customer || {};
    this.billing = data.billing || {};
    this.shipping = data.shipping || {};
    this.items = data.items || [];
    this.itemsTotal = data.itemsTotal || 0;
    this.discountTotal = data.discountTotal || 0;
    this.shippingTotal = data.shippingTotal || 0;
    this.taxTotal = data.taxTotal || 0;
    this.total = data.total || 0;
    this.currency = data.currency || 'BRL';
    this.status = data.status || 'pending';
    this.paymentMethod = data.paymentMethod || '';
    this.paymentStatus = data.paymentStatus || 'pending';
    this.shippingMethod = data.shippingMethod || '';
    this.notes = data.notes || [];
    this.coupons = data.coupons || [];
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Gera um ID único para o pedido
   * @private
   * @returns {string} ID único
   */
  _generateId() {
    return 'ord_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Gera um número de pedido para exibição
   * @private
   * @returns {string} Número de pedido
   */
  _generateOrderNumber() {
    const timestamp = new Date().getTime();
    return `ORD-${timestamp}`;
  }

  /**
   * Calcula ou recalcula os totais do pedido
   */
  calculateTotals() {
    // Calcula subtotal dos itens
    this.itemsTotal = this.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    // Total geral (subtotal - descontos + frete + impostos)
    this.total = this.itemsTotal - this.discountTotal + this.shippingTotal + this.taxTotal;

    // Atualiza a data de modificação
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Adiciona um item ao pedido
   * @param {Object} item Item a ser adicionado
   */
  addItem(item) {
    // Verifica se o item já existe no pedido
    const existingItem = this.items.find(i => i.productId === item.productId && 
      JSON.stringify(i.variation || {}) === JSON.stringify(item.variation || {}));

    if (existingItem) {
      // Atualiza a quantidade do item existente
      existingItem.quantity += item.quantity || 1;
    } else {
      // Adiciona o novo item
      this.items.push({
        id: `item_${this.items.length + 1}`,
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        variation: item.variation || null,
        metadata: item.metadata || {}
      });
    }

    // Recalcula os totais
    this.calculateTotals();
  }

  /**
   * Atualiza um item do pedido
   * @param {string} itemId ID do item
   * @param {Object} updateData Dados de atualização
   * @returns {boolean} Se a atualização foi bem sucedida
   */
  updateItem(itemId, updateData) {
    const itemIndex = this.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return false;

    // Atualiza o item com os novos dados
    this.items[itemIndex] = {
      ...this.items[itemIndex],
      ...updateData
    };

    // Recalcula os totais
    this.calculateTotals();
    return true;
  }

  /**
   * Remove um item do pedido
   * @param {string} itemId ID do item
   * @returns {boolean} Se a remoção foi bem sucedida
   */
  removeItem(itemId) {
    const initialLength = this.items.length;
    this.items = this.items.filter(item => item.id !== itemId);
    
    if (this.items.length !== initialLength) {
      // Recalcula os totais
      this.calculateTotals();
      return true;
    }
    
    return false;
  }

  /**
   * Atualiza o status do pedido
   * @param {string} newStatus Novo status
   * @param {string} note Nota opcional sobre a mudança de status
   */
  updateStatus(newStatus, note = '') {
    this.status = newStatus;
    this.updatedAt = new Date().toISOString();

    if (note) {
      this.addNote({
        author: 'system',
        content: `Status atualizado para ${newStatus}: ${note}`,
        isCustomerNote: false
      });
    }
  }

  /**
   * Adiciona uma nota ao pedido
   * @param {Object} note Nota a ser adicionada
   */
  addNote(note) {
    this.notes.push({
      id: `note_${this.notes.length + 1}`,
      author: note.author || 'system',
      content: note.content,
      isCustomerNote: note.isCustomerNote === true,
      createdAt: new Date().toISOString()
    });
    
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Aplica um cupom ao pedido
   * @param {Object} coupon Cupom a ser aplicado
   * @returns {boolean} Se o cupom foi aplicado com sucesso
   */
  applyCoupon(coupon) {
    // Verifica se o cupom já está aplicado
    const couponExists = this.coupons.some(c => c.code === coupon.code);
    if (couponExists) return false;

    // Adiciona o cupom à lista
    this.coupons.push({
      code: coupon.code,
      type: coupon.type,
      amount: coupon.amount,
      appliedAt: new Date().toISOString()
    });

    // Atualiza o desconto total
    if (coupon.type === 'percentage') {
      this.discountTotal += (this.itemsTotal * coupon.amount / 100);
    } else if (coupon.type === 'fixed') {
      this.discountTotal += coupon.amount;
    }

    // Recalcula os totais
    this.calculateTotals();
    return true;
  }

  /**
   * Valida os dados do pedido
   * @returns {Object} Resultado da validação {isValid: boolean, errors: string[]}
   */
  validate() {
    const errors = [];

    if (!this.customer || !this.customer.email) {
      errors.push('O e-mail do cliente é obrigatório');
    }

    if (!this.items || this.items.length === 0) {
      errors.push('O pedido deve ter pelo menos um item');
    }

    if (this.total < 0) {
      errors.push('O total do pedido não pode ser negativo');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Converte o pedido para um formato adequado para uma plataforma específica
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
   * Converte o pedido para um objeto simples
   * @returns {Object} Representação do pedido como objeto simples
   */
  toJSON() {
    return {
      id: this.id,
      number: this.number,
      customer: this.customer,
      billing: this.billing,
      shipping: this.shipping,
      items: this.items,
      itemsTotal: this.itemsTotal,
      discountTotal: this.discountTotal,
      shippingTotal: this.shippingTotal,
      taxTotal: this.taxTotal,
      total: this.total,
      currency: this.currency,
      status: this.status,
      paymentMethod: this.paymentMethod,
      paymentStatus: this.paymentStatus,
      shippingMethod: this.shippingMethod,
      notes: this.notes,
      coupons: this.coupons,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Cria uma instância de pedido a partir de um objeto específico de plataforma
   * @param {Object} platformData Dados da plataforma
   * @param {string} platform Nome da plataforma
   * @returns {Order} Nova instância de pedido
   */
  static fromPlatformFormat(platformData, platform) {
    // Implementação base que pode ser estendida por adaptadores específicos
    return new Order({
      ...platformData,
      metadata: { platform, originalData: platformData }
    });
  }
}

module.exports = Order;