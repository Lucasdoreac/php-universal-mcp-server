/**
 * PHP Executor - Executa código PHP com segurança
 * Versão aprimorada do executor original
 */
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');

class PHPExecutor {
  /**
   * Inicializa o executor de PHP
   * @param {Object} config - Configuração do executor
   */
  constructor(config = {}) {
    this.config = {
      phpPath: config.phpPath || this._detectPHPBinary(),
      tempDir: config.tempDir || os.tmpdir(),
      timeout: config.timeout || 30000, // 30 segundos
      maxBuffer: config.maxBuffer || 1024 * 1024 * 5, // 5MB
      secureMode: config.secureMode !== undefined ? config.secureMode : true,
      ...config
    };
    
    // Verificamos se o diretório temporário existe
    this._ensureTempDir();
  }

  /**
   * Detecta o binário do PHP no sistema
   * @returns {string} Caminho para o binário do PHP
   * @private
   */
  _detectPHPBinary() {
    // Tenta encontrar o PHP no PATH do sistema
    if (process.platform === 'win32') {
      // Windows
      return 'php.exe';
    } else {
      // Unix/Linux/macOS
      return 'php';
    }
  }

  /**
   * Garante que o diretório temporário exista
   * @private
   */
  async _ensureTempDir() {
    try {
      const tempDir = path.join(this.config.tempDir, 'php-runtime-tmp');
      await fs.mkdir(tempDir, { recursive: true });
      this.config.tempDir = tempDir;
    } catch (err) {
      // Se falhar, mantém o diretório original
      console.warn(`Não foi possível criar diretório temporário: ${err.message}`);
    }
  }

  /**
   * Gera um nome de arquivo temporário único
   * @param {string} prefix - Prefixo para o nome do arquivo
   * @returns {string} Caminho para o arquivo temporário
   * @private
   */
  _generateTempFilename(prefix = 'php_exec_') {
    const uuid = crypto.randomUUID();
    return path.join(this.config.tempDir, `${prefix}${uuid}.php`);
  }

  /**
   * Executa código PHP diretamente
   * @param {string} code - Código PHP a ser executado
   * @param {Object} options - Opções de execução
   * @returns {Promise<Object>} Resultado da execução
   */
  async executeCode(code, options = {}) {
    // Adiciona <?php se não existir
    if (!code.trim().startsWith('<?php')) {
      code = `<?php\n${code}`;
    }

    // Adiciona diretivas de segurança se o modo seguro estiver ativado
    if (this.config.secureMode && !options.disableSecureMode) {
      code = this._addSecurityDirectives(code, options.ini || {});
    }

    // Gera um nome de arquivo temporário
    const tempFilename = this._generateTempFilename();

    try {
      // Salva o código em um arquivo temporário
      await fs.writeFile(tempFilename, code, 'utf8');
      
      // Executa o arquivo PHP
      const result = await this._executeFile(tempFilename, options);
      
      // Remove o arquivo temporário
      await fs.unlink(tempFilename).catch(() => {});
      
      return result;
    } catch (error) {
      // Tenta remover o arquivo temporário mesmo em caso de erro
      await fs.unlink(tempFilename).catch(() => {});
      
      throw error;
    }
  }

  /**
   * Adiciona diretivas de segurança ao código PHP
   * @param {string} code - Código PHP original
   * @param {Object} ini - Configurações ini adicionais
   * @returns {string} Código PHP com diretivas de segurança
   * @private
   */
  _addSecurityDirectives(code, ini = {}) {
    // Define limites de segurança padrão
    const securityIni = {
      memory_limit: ini.memory_limit || '128M',
      max_execution_time: ini.max_execution_time || '30',
      display_errors: ini.display_errors || 'On',
      error_reporting: ini.error_reporting || 'E_ALL',
      disable_functions: ini.disable_functions || 'exec,passthru,shell_exec,system,proc_open,popen,parse_ini_file,show_source',
      ...ini
    };
    
    // Converte configurações ini em diretivas
    const iniDirectives = Object.entries(securityIni)
      .map(([key, value]) => `ini_set('${key}', '${value}');`)
      .join('\n');
    
    // Adiciona diretivas após a tag <?php
    return code.replace(/^<\?php\s*/, `<?php\n${iniDirectives}\n\n`);
  }

  /**
   * Executa um arquivo PHP
   * @param {string} filePath - Caminho para o arquivo PHP
   * @param {Object} options - Opções de execução
   * @returns {Promise<Object>} Resultado da execução
   * @private
   */
  async _executeFile(filePath, options = {}) {
    return new Promise((resolve, reject) => {
      // Prepara os argumentos
      const args = [];
      
      // Adiciona configurações ini na linha de comando
      if (options.ini && typeof options.ini === 'object') {
        Object.entries(options.ini).forEach(([key, value]) => {
          args.push('-d', `${key}=${value}`);
        });
      }
      
      // Adiciona o arquivo
      args.push(filePath);
      
      // Adiciona argumentos personalizados
      if (options.args && Array.isArray(options.args)) {
        args.push(...options.args);
      }
      
      // Controle de timeout interno
      const timeoutMs = options.timeout || this.config.timeout;
      let timeoutId = null;
      
      // Executa o PHP
      const process = spawn(this.config.phpPath, args, {
        env: { ...process.env, ...options.env },
      });
      
      // Define o timeout
      if (timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          process.kill();
          reject(new Error(`Timeout de execução excedido (${timeoutMs}ms)`));
        }, timeoutMs);
      }
      
      let stdout = '';
      let stderr = '';
      
      // Coleta a saída padrão
      process.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        
        // Verifica se excedeu o limite de buffer
        if (stdout.length > this.config.maxBuffer) {
          process.kill();
          clearTimeout(timeoutId);
          reject(new Error('Output exceeded maximum buffer size'));
        }
      });
      
      // Coleta a saída de erro
      process.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        
        // Verifica se excedeu o limite de buffer
        if (stderr.length > this.config.maxBuffer) {
          process.kill();
          clearTimeout(timeoutId);
          reject(new Error('Error output exceeded maximum buffer size'));
        }
      });
      
      // Manipula o término do processo
      process.on('close', (code) => {
        // Limpa o timeout
        if (timeoutId) clearTimeout(timeoutId);
        
        resolve({
          success: code === 0,
          output: stdout,
          error: stderr,
          exitCode: code
        });
      });
      
      // Manipula erros do processo
      process.on('error', (error) => {
        // Limpa o timeout
        if (timeoutId) clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  /**
   * Executa múltiplos scripts PHP em paralelo
   * @param {Array<{code: string, options: Object}>} tasks - Array de tarefas a executar
   * @returns {Promise<Array<Object>>} Resultados das execuções
   */
  async executeMultiple(tasks) {
    return Promise.all(tasks.map(task => 
      this.executeCode(task.code, task.options || {})
    ));
  }

  /**
   * Verifica se o PHP está instalado e disponível
   * @returns {Promise<Object>} Status da verificação
   */
  async checkPHPAvailability() {
    try {
      const result = await this.executeCode('<?php echo PHP_VERSION;', {
        timeout: 5000,
        skipCache: true,
        disableSecureMode: true
      });
      
      return {
        available: result.success,
        version: result.output.trim(),
        error: result.success ? null : result.error
      };
    } catch (error) {
      return {
        available: false,
        version: null,
        error: error.message
      };
    }
  }
}

module.exports = PHPExecutor;