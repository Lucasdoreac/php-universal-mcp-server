/**
 * Resource Limiter
 * Controla limites de recursos para execução de código PHP
 */
const os = require('os');

class ResourceLimiter {
  /**
   * Inicializa o limitador de recursos
   * @param {Object} config - Configuração de limites
   */
  constructor(config = {}) {
    this.config = {
      // Limites de CPU
      cpuLimit: config.cpuLimit || 80, // % máxima de CPU
      
      // Limites de memória
      memoryLimit: config.memoryLimit || 128, // MB
      systemMemoryLimit: config.systemMemoryLimit || 90, // % máxima de memória do sistema
      
      // Limites de execução
      maxExecutions: config.maxExecutions || 1000,
      concurrentExecutions: config.concurrentExecutions || 5,
      
      // Limites de tempo
      executionTimeLimit: config.executionTimeLimit || 30000, // ms
      
      // Controle de rate limiting
      rateLimit: config.rateLimit || 100, // requisições por minuto
      rateLimitWindow: config.rateLimitWindow || 60000, // janela de 1 minuto
      
      ...config
    };
    
    // Estado interno
    this.state = {
      activeExecutions: 0,
      executionHistory: [],
      lastSystemCheck: 0
    };
  }

  /**
   * Verifica todos os limites de recursos
   * @param {number} executionCount - Contador atual de execuções
   * @returns {Promise<boolean>} True se dentro dos limites, rejeita com erro caso contrário
   */
  async checkLimits(executionCount) {
    // Verifica limite de execuções totais
    if (executionCount >= this.config.maxExecutions) {
      throw new Error(`Limite máximo de execuções excedido (${this.config.maxExecutions})`);
    }
    
    // Verifica limite de execuções concorrentes
    if (this.state.activeExecutions >= this.config.concurrentExecutions) {
      throw new Error(`Limite de execuções concorrentes excedido (${this.config.concurrentExecutions})`);
    }
    
    // Verifica rate limiting
    if (!this._checkRateLimit()) {
      throw new Error(`Rate limit excedido (${this.config.rateLimit} requisições por ${this.config.rateLimitWindow / 1000}s)`);
    }
    
    // Verifica recursos do sistema (a cada 5 segundos)
    const now = Date.now();
    if (now - this.state.lastSystemCheck > 5000) {
      this.state.lastSystemCheck = now;
      
      const systemResources = await this._checkSystemResources();
      if (!systemResources.withinLimits) {
        throw new Error(systemResources.message);
      }
    }
    
    // Incrementa contador de execuções ativas
    this.state.activeExecutions++;
    
    // Registra execução para rate limiting
    this._recordExecution();
    
    return true;
  }

  /**
   * Marca uma execução como concluída
   */
  releaseExecution() {
    if (this.state.activeExecutions > 0) {
      this.state.activeExecutions--;
    }
  }

  /**
   * Verifica recursos do sistema (CPU e memória)
   * @returns {Promise<Object>} Estado dos recursos do sistema
   * @private
   */
  async _checkSystemResources() {
    try {
      // Verifica uso de memória do sistema
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const memUsagePercent = ((totalMem - freeMem) / totalMem) * 100;
      
      if (memUsagePercent > this.config.systemMemoryLimit) {
        return {
          withinLimits: false,
          message: `Uso de memória do sistema excedido (${memUsagePercent.toFixed(2)}% > ${this.config.systemMemoryLimit}%)`
        };
      }
      
      // Verifica CPU
      const cpuUsage = await this._getCPUUsage();
      if (cpuUsage > this.config.cpuLimit) {
        return {
          withinLimits: false,
          message: `Uso de CPU excedido (${cpuUsage.toFixed(2)}% > ${this.config.cpuLimit}%)`
        };
      }
      
      return { withinLimits: true };
    } catch (error) {
      // Em caso de erro na verificação, permite a execução
      console.warn('Erro ao verificar recursos do sistema:', error.message);
      return { withinLimits: true };
    }
  }

  /**
   * Obtém o uso atual de CPU
   * @returns {Promise<number>} Percentual de uso de CPU
   * @private
   */
  async _getCPUUsage() {
    return new Promise(resolve => {
      const startMeasure = this._getCPUSample();
      
      // Aguarda um curto período para medir diferença
      setTimeout(() => {
        const endMeasure = this._getCPUSample();
        
        let idleDifference = endMeasure.idle - startMeasure.idle;
        let totalDifference = endMeasure.total - startMeasure.total;
        
        // Calcula porcentagem de uso
        let percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
        resolve(percentageCPU);
      }, 100);
    });
  }

  /**
   * Obtém uma amostra do estado da CPU
   * @returns {Object} Amostra da CPU
   * @private
   */
  _getCPUSample() {
    const cpus = os.cpus();
    
    let idle = 0;
    let total = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        total += cpu.times[type];
      }
      idle += cpu.times.idle;
    }
    
    return {
      idle,
      total
    };
  }

  /**
   * Verifica se está dentro do rate limit
   * @returns {boolean} True se dentro do limite
   * @private
   */
  _checkRateLimit() {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindow;
    
    // Filtra execuções dentro da janela de tempo
    this.state.executionHistory = this.state.executionHistory.filter(
      timestamp => timestamp >= windowStart
    );
    
    // Verifica se excedeu o limite
    return this.state.executionHistory.length < this.config.rateLimit;
  }

  /**
   * Registra uma execução para controle de rate limit
   * @private
   */
  _recordExecution() {
    this.state.executionHistory.push(Date.now());
  }

  /**
   * Obtém estatísticas atuais de recursos
   * @returns {Object} Estatísticas de recursos
   */
  getStats() {
    return {
      activeExecutions: this.state.activeExecutions,
      recentExecutions: this.state.executionHistory.length,
      memoryUsage: process.memoryUsage(),
      systemMemory: {
        total: os.totalmem(),
        free: os.freemem(),
        usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2) + '%'
      }
    };
  }

  /**
   * Reseta todos os contadores de recursos
   */
  reset() {
    this.state.activeExecutions = 0;
    this.state.executionHistory = [];
    this.state.lastSystemCheck = 0;
  }
}

module.exports = ResourceLimiter;