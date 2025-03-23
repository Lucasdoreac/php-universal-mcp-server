/**
 * Output Capture
 * Processa e estrutura as saídas dos scripts PHP
 */
class OutputCapture {
  /**
   * Inicializa o sistema de captura de saída
   * @param {Object} config - Configurações de captura
   */
  constructor(config = {}) {
    this.config = {
      captureVarDump: true,
      parseJson: true,
      detectContentType: true,
      formatHtml: true,
      maxOutputSize: 1024 * 1024 * 5, // 5MB
      ...config
    };
  }

  /**
   * Processa o resultado da execução do PHP
   * @param {Object} result - Resultado da execução
   * @returns {Object} Resultado processado
   */
  process(result) {
    if (!result.success) {
      return this._processError(result);
    }
    
    // Processa a saída normal
    return this._processOutput(result);
  }

  /**
   * Processa uma saída de erro
   * @param {Object} result - Resultado da execução com erro
   * @returns {Object} Erro processado
   * @private
   */
  _processError(result) {
    // Analisa o erro para estruturá-lo melhor
    const errorInfo = this._parsePhpError(result.error);
    
    return {
      ...result,
      errorInfo
    };
  }

  /**
   * Processa uma saída normal
   * @param {Object} result - Resultado da execução
   * @returns {Object} Saída processada
   * @private
   */
  _processOutput(result) {
    const output = result.output;
    const processed = { ...result };
    
    // Detecta tipo de conteúdo
    if (this.config.detectContentType) {
      processed.contentType = this._detectContentType(output);
    }
    
    // Tenta fazer parse de JSON se a saída parecer JSON
    if (this.config.parseJson && this._looksLikeJson(output)) {
      try {
        processed.parsedOutput = JSON.parse(output);
        processed.outputType = 'json';
      } catch (e) {
        // Não é JSON válido, continua com o processamento normal
      }
    }
    
    // Processa var_dump se habilitado
    if (this.config.captureVarDump && output.includes('var_dump')) {
      processed.structuredDump = this._processVarDump(output);
    }
    
    // Processa saída HTML se necessário
    if (this.config.formatHtml && this._looksLikeHtml(output)) {
      processed.formattedHtml = this._formatHtml(output);
      processed.outputType = 'html';
    }
    
    return processed;
  }

  /**
   * Analisa erros PHP para formato estruturado
   * @param {string} errorText - Texto de erro do PHP
   * @returns {Object} Informação estruturada do erro
   * @private
   */
  _parsePhpError(errorText) {
    if (!errorText) return null;
    
    // Padrões comuns de erros PHP
    const patterns = [
      // Fatal error: Uncaught Error: Call to undefined function xyz() in /path/to/file.php:123
      {
        pattern: /(?:Fatal error|Parse error|Error|Warning|Notice|Deprecated):\s+(?:Uncaught\s+)?(?:Error:\s+)?([^(]+?)(?:\(\))?\s+in\s+([^\s]+)\s+on\s+line\s+(\d+)/i,
        extract: (matches) => ({
          type: matches[0].split(':')[0].trim(),
          message: matches[1].trim(),
          file: matches[2],
          line: parseInt(matches[3], 10)
        })
      },
      // Stack trace:
      {
        pattern: /Stack trace:\n([\s\S]+?)(?:\n\n|\n$|$)/,
        extract: (matches) => {
          const stackTrace = matches[1]
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .map(line => {
              // #0 /path/to/file.php(123): function_name()
              const traceMatch = line.match(/#(\d+)\s+([^\(]+)\((\d+)\):\s+(.+)$/);
              if (traceMatch) {
                return {
                  index: parseInt(traceMatch[1], 10),
                  file: traceMatch[2],
                  line: parseInt(traceMatch[3], 10),
                  call: traceMatch[4]
                };
              }
              return line;
            });
          
          return { stackTrace };
        }
      }
    ];
    
    // Aplica todos os padrões e combina os resultados
    const errorInfo = {};
    
    for (const { pattern, extract } of patterns) {
      const matches = errorText.match(pattern);
      if (matches) {
        Object.assign(errorInfo, extract(matches));
      }
    }
    
    // Se nenhum padrão corresponder, retorna o texto bruto
    if (Object.keys(errorInfo).length === 0) {
      errorInfo.rawError = errorText;
    }
    
    return errorInfo;
  }

  /**
   * Detecta o tipo de conteúdo da saída
   * @param {string} output - Saída do PHP
   * @returns {string} Tipo de conteúdo detectado
   * @private
   */
  _detectContentType(output) {
    const trimmed = output.trim();
    
    if (this._looksLikeJson(trimmed)) {
      return 'application/json';
    }
    
    if (this._looksLikeHtml(trimmed)) {
      return 'text/html';
    }
    
    if (trimmed.startsWith('<?xml')) {
      return 'application/xml';
    }
    
    // Verifica se é apenas um número
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return 'text/plain; subtype=numeric';
    }
    
    // Verifica se é uma saída de var_dump
    if (trimmed.includes('array(') || trimmed.includes('object(')) {
      return 'text/plain; subtype=var_dump';
    }
    
    return 'text/plain';
  }

  /**
   * Verifica se a saída parece ser JSON
   * @param {string} output - Saída a verificar
   * @returns {boolean} True se parece JSON
   * @private
   */
  _looksLikeJson(output) {
    const trimmed = output.trim();
    return (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    );
  }

  /**
   * Verifica se a saída parece ser HTML
   * @param {string} output - Saída a verificar
   * @returns {boolean} True se parece HTML
   * @private
   */
  _looksLikeHtml(output) {
    const trimmed = output.trim();
    return (
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<html') ||
      (trimmed.includes('<') && trimmed.includes('>') && 
       (trimmed.includes('<div') || trimmed.includes('<p') || trimmed.includes('<span')))
    );
  }

  /**
   * Processa saída de var_dump para formato estruturado
   * @param {string} output - Saída contendo var_dump
   * @returns {Object|null} Representação estruturada ou null se não conseguir processar
   * @private
   */
  _processVarDump(output) {
    // Implementação simplificada - em um sistema real seria mais complexo
    // Esta é uma abordagem básica para capturar estruturas simples
    
    try {
      // Tenta extrair o conteúdo do var_dump
      const varDumpRegex = /array\((\d+)\) {\s*([\s\S]+?)\s*}/g;
      const matches = [...output.matchAll(varDumpRegex)];
      
      if (matches.length === 0) return null;
      
      const result = {};
      
      for (const match of matches) {
        const count = parseInt(match[1], 10);
        const content = match[2];
        
        // Processa os itens do array
        const itemRegex = /\[([^\]]+)]=>\s*([^\n]+)/g;
        const items = [...content.matchAll(itemRegex)];
        
        const processedItems = {};
        
        for (const item of items) {
          const key = item[1].trim();
          let value = item[2].trim();
          
          // Tenta converter o valor para o tipo correto
          if (value === 'NULL') {
            value = null;
          } else if (value === 'bool(true)') {
            value = true;
          } else if (value === 'bool(false)') {
            value = false;
          } else if (/^int\((\d+)\)$/.test(value)) {
            value = parseInt(value.match(/^int\((\d+)\)$/)[1], 10);
          } else if (/^float\(([\d.]+)\)$/.test(value)) {
            value = parseFloat(value.match(/^float\(([\d.]+)\)$/)[1]);
          } else if (/^string\(\d+\) "([^"]*)"$/.test(value)) {
            value = value.match(/^string\(\d+\) "([^"]*)"$/)[1];
          }
          
          processedItems[key] = value;
        }
        
        Object.assign(result, processedItems);
      }
      
      return result;
    } catch (error) {
      // Em caso de erro, retorna null
      return null;
    }
  }

  /**
   * Formata saída HTML para melhor visualização
   * @param {string} html - HTML a ser formatado
   * @returns {string} HTML formatado
   * @private
   */
  _formatHtml(html) {
    // Em um sistema real, usaria uma biblioteca como pretty
    // Esta é uma implementação muito básica
    return html
      .replace(/>\s+</g, '>\n<')  // Adiciona quebras de linha
      .replace(/(<[^\/].*?>)/g, '$1\n')  // Quebra de linha após tags de abertura
      .replace(/(<\/.*?>)/g, '\n$1');  // Quebra de linha antes de tags de fechamento
  }
}

module.exports = OutputCapture;