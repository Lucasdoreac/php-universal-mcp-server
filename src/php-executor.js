/**
 * PHP Executor - Executa código PHP
 * Implementa a execução de código PHP em diferentes ambientes
 */
const { spawn } = require('child_process');
const fs = require('fs');
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
      phpBinary: config.phpBinary || this.detectPHPBinary(),
      tempDir: config.tempDir || os.tmpdir(),
      timeout: config.timeout || 30000, // 30 segundos
      maxBuffer: config.maxBuffer || 1024 * 1024 * 5, // 5MB
      ...config
    };
  }

  /**
   * Detecta o binário do PHP no sistema
   * @returns {string} Caminho para o binário do PHP
   */
  detectPHPBinary() {
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

    // Gera um nome de arquivo temporário
    const tempFilename = path.join(
      this.config.tempDir,
      `php_exec_${crypto.randomUUID()}.php`
    );

    try {
      // Salva o código em um arquivo temporário
      await fs.promises.writeFile(tempFilename, code, 'utf8');
      
      // Executa o arquivo PHP
      const result = await this.executeFile(tempFilename, options);
      
      // Remove o arquivo temporário
      await fs.promises.unlink(tempFilename);
      
      return result;
    } catch (error) {
      // Tenta remover o arquivo temporário mesmo em caso de erro
      try {
        await fs.promises.unlink(tempFilename);
      } catch (e) {
        // Ignora erros ao remover o arquivo
      }
      
      throw error;
    }
  }

  /**
   * Executa um arquivo PHP
   * @param {string} filePath - Caminho para o arquivo PHP
   * @param {Object} options - Opções de execução
   * @returns {Promise<Object>} Resultado da execução
   */
  executeFile(filePath, options = {}) {
    return new Promise((resolve, reject) => {
      // Prepara os argumentos
      const args = [filePath];
      
      // Adiciona argumentos personalizados
      if (options.args && Array.isArray(options.args)) {
        args.push(...options.args);
      }
      
      // Executa o PHP
      const process = spawn(this.config.phpBinary, args, {
        env: { ...options.env },
        timeout: options.timeout || this.config.timeout
      });
      
      let stdout = '';
      let stderr = '';
      
      // Coleta a saída padrão
      process.stdout.on('data', (data) => {
        stdout += data.toString();
        
        // Verifica se excedeu o limite de buffer
        if (stdout.length > this.config.maxBuffer) {
          process.kill();
          reject(new Error('Output exceeded maximum buffer size'));
        }
      });
      
      // Coleta a saída de erro
      process.stderr.on('data', (data) => {
        stderr += data.toString();
        
        // Verifica se excedeu o limite de buffer
        if (stderr.length > this.config.maxBuffer) {
          process.kill();
          reject(new Error('Error output exceeded maximum buffer size'));
        }
      });
      
      // Manipula o término do processo
      process.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output: stdout,
            error: stderr,
            exitCode: code
          });
        } else {
          resolve({
            success: false,
            output: stdout,
            error: stderr,
            exitCode: code
          });
        }
      });
      
      // Manipula erros do processo
      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Executa um script PHP com entrada de dados
   * @param {string} code - Código PHP
   * @param {string} input - Dados de entrada para o script
   * @param {Object} options - Opções de execução
   * @returns {Promise<Object>} Resultado da execução
   */
  async executeWithInput(code, input, options = {}) {
    // Adiciona <?php se não existir
    if (!code.trim().startsWith('<?php')) {
      code = `<?php\n${code}`;
    }

    // Gera nomes de arquivos temporários
    const tempFilename = path.join(
      this.config.tempDir,
      `php_exec_${crypto.randomUUID()}.php`
    );
    
    const inputFilename = path.join(
      this.config.tempDir,
      `php_input_${crypto.randomUUID()}.txt`
    );

    try {
      // Salva o código em um arquivo temporário
      await fs.promises.writeFile(tempFilename, code, 'utf8');
      
      // Salva a entrada em um arquivo temporário
      await fs.promises.writeFile(inputFilename, input, 'utf8');
      
      // Prepara os argumentos para redirecionamento de entrada
      const args = [`-f`, tempFilename];
      
      // Executa o PHP com redirecionamento de entrada
      const result = await new Promise((resolve, reject) => {
        const process = spawn(this.config.phpBinary, args, {
          env: { ...options.env },
          timeout: options.timeout || this.config.timeout
        });
        
        // Abre o arquivo de entrada e direciona para o processo
        const inputStream = fs.createReadStream(inputFilename);
        inputStream.pipe(process.stdin);
        
        let stdout = '';
        let stderr = '';
        
        // Coleta a saída padrão
        process.stdout.on('data', (data) => {
          stdout += data.toString();
          
          // Verifica se excedeu o limite de buffer
          if (stdout.length > this.config.maxBuffer) {
            process.kill();
            reject(new Error('Output exceeded maximum buffer size'));
          }
        });
        
        // Coleta a saída de erro
        process.stderr.on('data', (data) => {
          stderr += data.toString();
          
          // Verifica se excedeu o limite de buffer
          if (stderr.length > this.config.maxBuffer) {
            process.kill();
            reject(new Error('Error output exceeded maximum buffer size'));
          }
        });
        
        // Manipula o término do processo
        process.on('close', (code) => {
          if (code === 0) {
            resolve({
              success: true,
              output: stdout,
              error: stderr,
              exitCode: code
            });
          } else {
            resolve({
              success: false,
              output: stdout,
              error: stderr,
              exitCode: code
            });
          }
        });
        
        // Manipula erros do processo
        process.on('error', (error) => {
          reject(error);
        });
      });
      
      // Remove os arquivos temporários
      await fs.promises.unlink(tempFilename);
      await fs.promises.unlink(inputFilename);
      
      return result;
    } catch (error) {
      // Tenta remover os arquivos temporários mesmo em caso de erro
      try {
        await fs.promises.unlink(tempFilename);
        await fs.promises.unlink(inputFilename);
      } catch (e) {
        // Ignora erros ao remover os arquivos
      }
      
      throw error;
    }
  }

  /**
   * Verifica se o PHP está instalado e disponível
   * @returns {Promise<boolean>} Verdadeiro se o PHP estiver disponível
   */
  async checkPHPAvailability() {
    try {
      const result = await this.executeCode('<?php echo "PHP is available";');
      return result.success && result.output.includes('PHP is available');
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtém informações sobre a instalação do PHP
   * @returns {Promise<Object>} Informações do PHP
   */
  async getPHPInfo() {
    try {
      const versionResult = await this.executeCode('<?php echo PHP_VERSION;');
      const extensionsResult = await this.executeCode('<?php echo implode(",", get_loaded_extensions());');
      
      return {
        available: true,
        version: versionResult.output.trim(),
        extensions: extensionsResult.output.trim().split(','),
        binary: this.config.phpBinary
      };
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }
}

module.exports = PHPExecutor;