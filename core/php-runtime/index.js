/**
 * PHP Runtime Engine
 * Fornece um ambiente seguro para execução de código PHP com limitação de recursos,
 * captura estruturada de saídas e sistema de cache para otimização.
 */

const PHPExecutor = require('./lib/php-executor');
const ResourceLimiter = require('./lib/resource-limiter');
const OutputCapture = require('./lib/output-capture');
const LibraryManager = require('./lib/library-manager');
const CacheSystem = require('./lib/cache-system');

class PHPRuntimeEngine {
  /**
   * Inicializa o PHP Runtime Engine com configurações
   * @param {Object} config - Configurações do engine
   */
  constructor(config = {}) {
    this.config = {
      // Configurações padrão do runtime
      phpPath: config.phpPath || 'php',
      timeout: config.timeout || 30000, // 30 segundos
      memoryLimit: config.memoryLimit || 128, // 128MB
      maxExecutions: config.maxExecutions || 1000,
      cacheEnabled: config.cacheEnabled !== undefined ? config.cacheEnabled : true,
      cacheLifetime: config.cacheLifetime || 3600, // 1 hora em segundos
      libraries: config.libraries || [],
      ...config
    };

    // Inicializa os componentes
    this.executor = new PHPExecutor(this.config);
    this.limiter = new ResourceLimiter(this.config);
    this.outputCapture = new OutputCapture();
    this.libraryManager = new LibraryManager(this.config);
    this.cacheSystem = new CacheSystem(this.config);
    
    // Contador de execuções
    this.executionCount = 0;
  }

  /**
   * Executa código PHP no ambiente seguro
   * @param {string} code - Código PHP a ser executado
   * @param {Object} options - Opções de execução
   * @returns {Promise<Object>} Resultado da execução
   */
  async execute(code, options = {}) {
    // Verifica se o código está no cache
    const cacheKey = this.cacheSystem.generateKey(code, options);
    
    if (this.config.cacheEnabled && !options.skipCache) {
      const cachedResult = await this.cacheSystem.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }
    
    // Verifica limites de recursos
    try {
      await this.limiter.checkLimits(this.executionCount);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        output: '',
        type: 'limit_exceeded'
      };
    }
    
    // Incrementa contador de execuções
    this.executionCount++;
    
    // Prepara o código com bibliotecas necessárias
    const preparedCode = await this.libraryManager.prepareCode(code, options.libraries || []);
    
    // Define limites PHP.ini para esta execução
    const execOptions = {
      ...options,
      ini: {
        memory_limit: `${this.config.memoryLimit}M`,
        max_execution_time: Math.floor(this.config.timeout / 1000),
        ...options.ini
      }
    };
    
    // Executa o código
    let result;
    try {
      result = await this.executor.executeCode(preparedCode, execOptions);
      
      // Processa a saída
      result = this.outputCapture.process(result);
      
      // Armazena no cache se for bem-sucedido
      if (result.success && this.config.cacheEnabled && !options.skipCache) {
        await this.cacheSystem.set(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        output: '',
        type: 'execution_error'
      };
    }
  }

  /**
   * Limpa o cache do sistema
   * @returns {Promise<void>}
   */
  async clearCache() {
    return this.cacheSystem.clear();
  }

  /**
   * Reseta o contador de execuções
   */
  resetExecutionCount() {
    this.executionCount = 0;
  }

  /**
   * Obtém informações sobre o ambiente PHP
   * @returns {Promise<Object>} Informações do ambiente
   */
  async getEnvironmentInfo() {
    // Usa código PHP para obter informações do ambiente
    const code = `<?php
      echo json_encode([
        'version' => PHP_VERSION,
        'extensions' => get_loaded_extensions(),
        'ini' => ini_get_all(),
        'os' => PHP_OS,
        'sapi' => php_sapi_name()
      ]);
    `;
    
    const result = await this.executor.executeCode(code, { skipCache: true });
    
    if (result.success) {
      try {
        const info = JSON.parse(result.output);
        return {
          success: true,
          info: {
            ...info,
            runtime: {
              executionCount: this.executionCount,
              memoryLimit: this.config.memoryLimit,
              timeout: this.config.timeout,
              cacheEnabled: this.config.cacheEnabled,
              libraries: await this.libraryManager.getInstalledLibraries()
            }
          }
        };
      } catch (e) {
        return {
          success: false,
          error: 'Failed to parse environment info',
          output: result.output
        };
      }
    } else {
      return result;
    }
  }
}

module.exports = PHPRuntimeEngine;