/**
 * Utilitários de formatação para exibição de valores no e-commerce
 */

/**
 * Formata um valor monetário
 * 
 * @param {number} value Valor a ser formatado
 * @param {string} currency Código da moeda (padrão: 'BRL')
 * @param {string} locale Localização para formatação (padrão: 'pt-BR')
 * @returns {string} Valor formatado como moeda
 */
function formatCurrency(value, currency = 'BRL', locale = 'pt-BR') {
  if (value === undefined || value === null) {
    return '-';
  }
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch (error) {
    console.error('Erro ao formatar moeda:', error);
    return `${value.toFixed(2)}`;
  }
}

/**
 * Formata um número com separadores de milhar
 * 
 * @param {number} value Valor a ser formatado
 * @param {string} locale Localização para formatação (padrão: 'pt-BR')
 * @returns {string} Número formatado
 */
function formatNumber(value, locale = 'pt-BR') {
  if (value === undefined || value === null) {
    return '-';
  }
  
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch (error) {
    console.error('Erro ao formatar número:', error);
    return `${value}`;
  }
}

/**
 * Formata um valor como porcentagem
 * 
 * @param {number} value Valor a ser formatado (0.1 = 10%)
 * @param {string} locale Localização para formatação (padrão: 'pt-BR')
 * @param {number} digits Número de casas decimais (padrão: 1)
 * @returns {string} Valor formatado como porcentagem
 */
function formatPercent(value, locale = 'pt-BR', digits = 1) {
  if (value === undefined || value === null) {
    return '-';
  }
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(value);
  } catch (error) {
    console.error('Erro ao formatar porcentagem:', error);
    return `${(value * 100).toFixed(digits)}%`;
  }
}

/**
 * Formata uma data
 * 
 * @param {Date|string} date Data a ser formatada
 * @param {string} format Formato da data ('short', 'medium', 'long', 'full' ou formato personalizado)
 * @param {string} locale Localização para formatação (padrão: 'pt-BR')
 * @returns {string} Data formatada
 */
function formatDate(date, format = 'short', locale = 'pt-BR') {
  if (!date) {
    return '-';
  }
  
  try {
    const dateObj = (typeof date === 'string') ? new Date(date) : date;
    
    if (format === 'short') {
      return dateObj.toLocaleDateString(locale);
    } else if (format === 'medium') {
      return dateObj.toLocaleDateString(locale, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } else if (format === 'long') {
      return dateObj.toLocaleDateString(locale, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else if (format === 'full') {
      return dateObj.toLocaleDateString(locale, { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    
    // Formato personalizado (simples)
    // Suporta: YYYY, MM, DD, HH, mm, ss
    return format
      .replace('YYYY', dateObj.getFullYear())
      .replace('MM', String(dateObj.getMonth() + 1).padStart(2, '0'))
      .replace('DD', String(dateObj.getDate()).padStart(2, '0'))
      .replace('HH', String(dateObj.getHours()).padStart(2, '0'))
      .replace('mm', String(dateObj.getMinutes()).padStart(2, '0'))
      .replace('ss', String(dateObj.getSeconds()).padStart(2, '0'));
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return String(date);
  }
}

/**
 * Trunca um texto longo para exibição
 * 
 * @param {string} text Texto a ser truncado
 * @param {number} maxLength Tamanho máximo (padrão: 100)
 * @param {string} suffix Sufixo para indicar truncamento (padrão: '...')
 * @returns {string} Texto truncado
 */
function truncateText(text, maxLength = 100, suffix = '...') {
  if (!text) {
    return '';
  }
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - suffix.length) + suffix;
}

module.exports = {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  truncateText
};