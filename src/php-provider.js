/**
 * PHP Provider - Implementação de funções para PHP
 * Define as funções específicas para operações com PHP
 */

const BaseProvider = require('./providers/BaseProvider');
const PHPExecutor = require('./php-executor');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class PHPProvider extends BaseProvider {
  /**
   * Construtor do PHP Provider
   * @param {Object} config - Configuração do provider
   */
  constructor(config = {}) {
    super(config);
    
    // Inicializa o executor PHP
    this.phpExecutor = new PHPExecutor(config.php || {});
    
    // Verifica disponibilidade do PHP
    this.phpAvailable = false;
    this.phpInfo = null;
    
    // Inicializa
    this.initialize();
  }

  /**
   * Inicializa o provider
   */
  async initialize() {
    try {
      // Verifica disponibilidade do PHP
      this.phpAvailable = await this.phpExecutor.checkPHPAvailability();
      
      if (this.phpAvailable) {
        // Obtém informações do PHP
        this.phpInfo = await this.phpExecutor.getPHPInfo();
      }
    } catch (error) {
      console.warn('Erro ao inicializar PHP Provider:', error.message);
      this.phpAvailable = false;
    }
  }

  /**
   * Retorna o nome do provider
   */
  getName() {
    return 'php-provider';
  }

  /**
   * Verifica se o provider está disponível
   */
  isAvailable() {
    return this.phpAvailable;
  }

  /**
   * Executa um comando no provider
   * @param {Object} payload - Payload do comando
   */
  async execute(payload) {
    if (!this.phpAvailable) {
      return {
        success: false,
        error: 'PHP não disponível',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const action = payload.action || '';
      
      switch (action) {
        case 'executeCode':
          return await this.executePhpCode(payload);
        
        case 'executeFile':
          return await this.executePhpFile(payload);
        
        case 'checkSyntax':
          return await this.checkPhpSyntax(payload);
        
        case 'getInfo':
          return {
            success: true,
            phpInfo: this.phpInfo,
            timestamp: new Date().toISOString()
          };
        
        default:
          return {
            success: false,
            error: `Ação desconhecida: ${action}`,
            timestamp: new Date().toISOString()
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Executa código PHP
   * @param {Object} payload - Payload do comando
   */
  async executePhpCode(payload) {
    const { code, input, options } = payload;
    
    if (!code) {
      return {
        success: false,
        error: 'Código PHP não fornecido',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      let result;
      
      if (input) {
        // Se houver entrada, executa com input
        result = await this.phpExecutor.executeWithInput(code, input, options);
      } else {
        // Execução normal
        result = await this.phpExecutor.executeCode(code, options);
      }
      
      return {
        success: result.success,
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Executa um arquivo PHP
   * @param {Object} payload - Payload do comando
   */
  async executePhpFile(payload) {
    const { filePath, options } = payload;
    
    if (!filePath) {
      return {
        success: false,
        error: 'Caminho do arquivo não fornecido',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      // Verifica se o arquivo existe
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: `Arquivo não encontrado: ${filePath}`,
          timestamp: new Date().toISOString()
        };
      }
      
      // Executa o arquivo
      const result = await this.phpExecutor.executeFile(filePath, options);
      
      return {
        success: result.success,
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Verifica a sintaxe do código PHP
   * @param {Object} payload - Payload do comando
   */
  async checkPhpSyntax(payload) {
    const { code } = payload;
    
    if (!code) {
      return {
        success: false,
        error: 'Código PHP não fornecido',
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      // Adiciona <?php se não existir
      let phpCode = code;
      if (!phpCode.trim().startsWith('<?php')) {
        phpCode = `<?php\n${phpCode}`;
      }
      
      // Salva o código em um arquivo temporário
      const tempFilename = path.join(
        this.phpExecutor.config.tempDir,
        `php_syntax_${crypto.randomUUID()}.php`
      );
      
      await fs.promises.writeFile(tempFilename, phpCode, 'utf8');
      
      // Executa o PHP com a opção de verificação de sintaxe
      const result = await this.phpExecutor.executeFile(tempFilename, {
        args: ['-l'] // Opção -l para verificação de sintaxe
      });
      
      // Remove o arquivo temporário
      await fs.promises.unlink(tempFilename);
      
      // Analisa o resultado da verificação
      const isSyntaxValid = result.output.includes('No syntax errors detected');
      
      return {
        success: isSyntaxValid,
        valid: isSyntaxValid,
        output: result.output,
        error: result.error,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        valid: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Cria um stream para execução contínua
   * @param {Object} payload - Payload do comando
   */
  createStream(payload) {
    const streamId = crypto.randomUUID();
    const emitter = new EventEmitter();
    
    // Executa a operação em background
    this._executeStreamOperation(streamId, payload, emitter);
    
    return {
      id: streamId,
      emitter: emitter
    };
  }

  /**
   * Executa uma operação de stream
   * @param {string} streamId - ID do stream
   * @param {Object} payload - Payload do comando
   * @param {EventEmitter} emitter - Emissor de eventos
   */
  async _executeStreamOperation(streamId, payload, emitter) {
    try {
      // Emite evento de início
      emitter.emit('start', { 
        id: streamId, 
        timestamp: new Date().toISOString() 
      });
      
      // Determina o tipo de operação
      const action = payload.action || '';
      let result;
      
      switch (action) {
        case 'executeCode':
          // Separa o código em partes para simular execução progressiva
          const parts = this._splitCodeForStream(payload.code);
          let currentCode = '';
          
          // Executa cada parte e emite atualizações
          for (let i = 0; i < parts.length; i++) {
            currentCode += parts[i];
            
            // Executa o código acumulado
            const execResult = await this.phpExecutor.executeCode(currentCode);
            
            // Calcula o progresso
            const progress = Math.round((i + 1) / parts.length * 100);
            
            // Emite evento de dados
            emitter.emit('data', {
              id: streamId,
              progress,
              result: execResult,
              timestamp: new Date().toISOString()
            });
            
            // Aguarda um pouco para simular processamento
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          // Executa o código completo para o resultado final
          result = await this.phpExecutor.executeCode(payload.code, payload.options);
          break;
        
        case 'executeFile':
          // Executa o arquivo
          result = await this.phpExecutor.executeFile(payload.filePath, payload.options);
          break;
        
        default:
          throw new Error(`Ação de stream não suportada: ${action}`);
      }
      
      // Emite evento de conclusão
      emitter.emit('end', {
        id: streamId,
        completed: true,
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Emite evento de erro
      emitter.emit('error', {
        id: streamId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Divide o código em partes para simulação de execução progressiva
   * @param {string} code - Código a ser dividido
   * @returns {Array<string>} Partes do código
   */
  _splitCodeForStream(code) {
    // Divide o código em linhas
    const lines = code.split('\n');
    
    // Se houver poucas linhas, retorna diretamente
    if (lines.length <= 5) {
      return [code];
    }
    
    // Divide em partes de aproximadamente 5 linhas
    const chunkSize = Math.max(1, Math.ceil(lines.length / 5));
    const parts = [];
    
    for (let i = 0; i < lines.length; i += chunkSize) {
      parts.push(lines.slice(i, i + chunkSize).join('\n') + '\n');
    }
    
    return parts;
  }

  /**
   * Fecha um stream ativo
   * @param {Object} stream - Stream a ser fechado
   */
  closeStream(stream) {
    if (!stream || !stream.emitter) return;
    
    // Emite evento de fechamento
    stream.emitter.emit('close', {
      id: stream.id,
      reason: 'user_closed',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Cancela a execução de um comando
   * @param {string} sessionId - ID da sessão
   */
  cancel(sessionId) {
    return {
      success: true,
      message: `Sessão ${sessionId} cancelada`,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = PHPProvider;