/**
 * Helpers para templates Bootstrap no PHP Universal MCP Server
 * Funções auxiliares para uso em templates Handlebars
 */

const helpers = {
  /**
   * Capitaliza a primeira letra de uma string
   * @param {string} text - Texto a ser capitalizado
   * @returns {string} Texto com a primeira letra em maiúscula
   */
  capitalize: function(text) {
    if (typeof text !== 'string' || !text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  },
  
  /**
   * Verifica se um número é par
   * @param {number} num - Número a ser verificado
   * @returns {boolean} Verdadeiro se o número for par
   */
  isEven: function(num) {
    return num % 2 === 0;
  },
  
  /**
   * Verifica se um número é ímpar
   * @param {number} num - Número a ser verificado
   * @returns {boolean} Verdadeiro se o número for ímpar
   */
  isOdd: function(num) {
    return num % 2 !== 0;
  },
  
  /**
   * Trunca um texto para o número especificado de caracteres
   * @param {string} text - Texto a ser truncado
   * @param {number} length - Comprimento máximo
   * @returns {string} Texto truncado com "..." se necessário
   */
  truncate: function(text, length) {
    if (typeof text !== 'string' || !text) return '';
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
  },
  
  /**
   * Gera iniciais a partir de um nome
   * @param {string} name - Nome completo
   * @returns {string} Iniciais (até 2 letras)
   */
  initials: function(name) {
    if (typeof name !== 'string' || !name) return '';
    const parts = name.split(' ').filter(part => part.length > 0);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  },
  
  /**
   * Multiplica dois números (útil para calcular delays de animação)
   * @param {number} a - Primeiro número
   * @param {number} b - Segundo número
   * @returns {number} Produto
   */
  multiply: function(a, b) {
    return a * b;
  },
  
  /**
   * Subtrai o segundo número do primeiro
   * @param {number} a - Primeiro número
   * @param {number} b - Segundo número
   * @returns {number} Diferença
   */
  subtract: function(a, b) {
    return a - b;
  },
  
  /**
   * Divide o primeiro número pelo segundo
   * @param {number} a - Numerador
   * @param {number} b - Denominador
   * @returns {number} Quociente
   */
  divideBy: function(a, b) {
    return a / b;
  },
  
  /**
   * Formata um valor como moeda
   * @param {number} value - Valor a ser formatado
   * @param {string} locale - Localidade (padrão: 'pt-BR')
   * @param {string} currency - Moeda (padrão: 'BRL')
   * @returns {string} Valor formatado como moeda
   */
  formatCurrency: function(value, locale = 'pt-BR', currency = 'BRL') {
    if (isNaN(value)) return '';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(value);
  },
  
  /**
   * Executa um bloco n vezes
   * @param {number} n - Número de repetições
   * @param {object} options - Opções do bloco Handlebars
   * @returns {string} HTML gerado
   */
  times: function(n, options) {
    let result = '';
    for (let i = 0; i < n; i++) {
      result += options.fn(i);
    }
    return result;
  },
  
  /**
   * Compara dois valores
   * @param {*} a - Primeiro valor
   * @param {*} b - Segundo valor
   * @param {string} operator - Operador ('eq', 'neq', 'lt', 'gt', 'lte', 'gte')
   * @param {object} options - Opções do bloco Handlebars
   * @returns {string} Resultado do bloco
   */
  compare: function(a, b, operator, options) {
    let result;
    switch (operator) {
      case 'eq':
        result = a === b;
        break;
      case 'neq':
        result = a !== b;
        break;
      case 'lt':
        result = a < b;
        break;
      case 'gt':
        result = a > b;
        break;
      case 'lte':
        result = a <= b;
        break;
      case 'gte':
        result = a >= b;
        break;
      default:
        throw new Error(`Operador inválido: ${operator}`);
    }
    
    return result ? options.fn(this) : options.inverse(this);
  },
  
  /**
   * Cria um objeto a partir de pares chave-valor
   * @param {object} options - Opções do bloco Handlebars
   * @returns {object} Objeto criado
   */
  object: function() {
    const obj = {};
    for (let i = 0; i < arguments.length - 1; i += 2) {
      obj[arguments[i]] = arguments[i + 1];
    }
    return obj;
  },
  
  /**
   * Retorna o primeiro item de um array
   * @param {Array} array - Array
   * @returns {*} Primeiro item do array
   */
  firstItem: function(array) {
    if (!Array.isArray(array) || array.length === 0) return null;
    return array[0];
  },
  
  /**
   * Retorna o último item de um array
   * @param {Array} array - Array
   * @returns {*} Último item do array
   */
  lastItem: function(array) {
    if (!Array.isArray(array) || array.length === 0) return null;
    return array[array.length - 1];
  },
  
  /**
   * Extrai categorias únicas de uma lista de projetos
   * @param {Array} projects - Lista de projetos
   * @returns {Array} Lista de categorias únicas
   */
  uniqueCategories: function(projects) {
    if (!Array.isArray(projects)) return [];
    const categories = projects.map(project => project.category).filter(Boolean);
    return [...new Set(categories)];
  },
  
  /**
   * Gera um número aleatório entre min e max
   * @param {number} max - Valor máximo
   * @returns {number} Número aleatório
   */
  random: function(max) {
    return Math.floor(Math.random() * max);
  },
  
  /**
   * Fornece a data atual formatada
   * @param {string} format - Formato da data ('short', 'long', 'numeric')
   * @returns {string} Data formatada
   */
  currentDate: function(format = 'short') {
    const now = new Date();
    
    switch (format) {
      case 'long':
        return now.toLocaleDateString('pt-BR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'numeric':
        return now.toLocaleDateString('pt-BR');
      default:
        return now.toLocaleDateString('pt-BR', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        });
    }
  }
};

module.exports = helpers;