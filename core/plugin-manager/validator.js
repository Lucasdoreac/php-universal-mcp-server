/**
 * Plugin Validator
 * 
 * Valida a estrutura e segurança de plugins
 * @version 1.0.0
 */

class PluginValidator {
  constructor() {
    // Lista de palavras-chave proibidas para segurança
    this.PROHIBITED_KEYWORDS = [
      'child_process',      // Execução de processos do sistema
      'exec(',              // Execução de comandos
      'spawn(',             // Spawning de processos
      'fork(',              // Forking de processos
      'eval(',              // Avaliação dinâmica de código
      'Function(',          // Construtor Function
      'crypto.createCipher', // Cifras antigas (usar createCipheriv)
      'createDecipheriv'     // Decifrar (apenas em contextos específicos)
    ];
    
    // Hooks válidos que podem ser registrados
    this.VALID_HOOKS = [
      'server:started',
      'server:shutdown',
      'plugin:loaded',
      'plugin:deactivated',
      'error',
      'product:created',
      'product:updated',
      'product:deleted',
      'order:created',
      'order:updated',
      'order:deleted',
      'customer:created',
      'customer:updated'
    ];
  }
  
  /**
   * Valida um plugin
   */
  validate(PluginClass, pluginInfo = {}) {
    try {
      // Verificar se é uma classe válida
      if (typeof PluginClass !== 'function') {
        return { valid: false, error: 'Plugin deve ser uma classe' };
      }
      
      // Verificar informações estáticas do plugin
      if (!PluginClass.info) {
        return { valid: false, error: 'Plugin deve ter uma propriedade estática "info"' };
      }
      
      const info = PluginClass.info;
      
      // Verificar propriedades obrigatórias
      if (!info.name) {
        return { valid: false, error: 'Plugin deve ter um nome' };
      }
      
      if (!info.version) {
        return { valid: false, error: 'Plugin deve ter uma versão' };
      }
      
      // Verificar hooks
      if (info.hooks && Array.isArray(info.hooks)) {
        for (const hook of info.hooks) {
          if (!this.VALID_HOOKS.includes(hook)) {
            return { valid: false, error: `Hook "${hook}" não é válido` };
          }
        }
      }
      
      // Validar interface do plugin
      const requiredMethods = ['initialize', 'deactivate'];
      
      for (const method of requiredMethods) {
        if (typeof PluginClass.prototype[method] !== 'function') {
          return { valid: false, error: `Plugin deve implementar o método "${method}"` };
        }
      }
      
      // Se chegamos até aqui, o plugin é válido
      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Erro ao validar plugin: ${error.message}` };
    }
  }
  
  /**
   * Analisa o código do plugin em busca de problemas de segurança
   * Nota: Esta é uma implementação básica e não substitui uma análise completa
   */
  scanForSecurityIssues(code) {
    if (typeof code !== 'string') {
      return { safe: false, issues: ['Código deve ser uma string'] };
    }
    
    const issues = [];
    
    // Verificar uso de palavras-chave proibidas
    this.PROHIBITED_KEYWORDS.forEach(keyword => {
      if (code.includes(keyword)) {
        issues.push(`Código contém palavra-chave proibida: ${keyword}`);
      }
    });
    
    // Verificar acesso a propriedades sensíveis
    const sensitivePatterns = [
      /\.\.\/\.\.\//, // Acesso a diretórios acima (../../../../)
      /process\.env/,  // Acesso a variáveis de ambiente
      /require\(.*\)/, // Requer dinâmico com variável
      /\.__proto__/,   // Acesso a __proto__
      /Object\.prototype/ // Modificação de protótipos
    ];
    
    sensitivePatterns.forEach(pattern => {
      if (pattern.test(code)) {
        issues.push(`Código contém padrão potencialmente perigoso: ${pattern}`);
      }
    });
    
    return { 
      safe: issues.length === 0,
      issues: issues
    };
  }
}

module.exports = PluginValidator;
