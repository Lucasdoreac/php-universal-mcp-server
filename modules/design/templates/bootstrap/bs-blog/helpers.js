/**
 * Helpers para o template de blog Bootstrap
 */
const Handlebars = require('handlebars');

/**
 * Registra todos os helpers necessários para o template de blog
 */
function registerHelpers() {
  // Helper para truncar texto com limite de caracteres
  Handlebars.registerHelper('truncate', function(text, limit) {
    if (!text) return '';
    
    if (text.length <= limit) {
      return text;
    }
    
    return text.substring(0, limit) + '...';
  });
  
  // Helper para formatar data
  Handlebars.registerHelper('formatDate', function(dateStr) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });
  
  // Helper para criar slug a partir de texto
  Handlebars.registerHelper('slugify', function(text) {
    if (!text) return '';
    
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  });
  
  // Helper para verificar se há posts destacados
  Handlebars.registerHelper('hasFeaturedPosts', function(posts) {
    if (!posts || !Array.isArray(posts)) return false;
    
    return posts.some(post => post.isFeatured);
  });
  
  // Helper para determinar a classe CSS com base na posição da barra lateral
  Handlebars.registerHelper('getSidebarClass', function(sidebarPosition) {
    if (sidebarPosition === 'none') {
      return 'col-lg-12';
    } else {
      return 'col-lg-8';
    }
  });
  
  // Helper para determinar a ordem de exibição com base na posição da barra lateral
  Handlebars.registerHelper('getSidebarOrder', function(sidebarPosition, elementType) {
    if (sidebarPosition === 'left' && elementType === 'content') {
      return '2';
    } else if (sidebarPosition === 'left' && elementType === 'sidebar') {
      return '1';
    } else {
      return elementType === 'content' ? '1' : '2';
    }
  });
  
  // Helper para obter a classe CSS com base no layout do blog
  Handlebars.registerHelper('getBlogLayoutClass', function(layout) {
    switch (layout) {
      case 'masonry':
        return 'bs-blog-masonry';
      case 'grid':
        return 'bs-blog-grid row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4';
      default:
        return '';
    }
  });
  
  // Helper para negar uma comparação de igualdade
  Handlebars.registerHelper('not-eq', function(a, b) {
    return a !== b;
  });
  
  // Helper para verificar se um valor é menor que outro
  Handlebars.registerHelper('lt', function(a, b) {
    return a < b;
  });
  
  // Helper para verificar se um valor é maior que outro
  Handlebars.registerHelper('gt', function(a, b) {
    return a > b;
  });
  
  // Helper para comparar igualdade de dois valores
  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });
  
  // Helper para dividir um número por outro
  Handlebars.registerHelper('divide', function(a, b) {
    return Math.floor(a / b);
  });
  
  // Helper para juntar itens de um array com delimitador
  Handlebars.registerHelper('join', function(array, delimiter) {
    if (!array || !Array.isArray(array)) return '';
    
    return array.join(delimiter);
  });
  
  // Helper para gerar um número aleatório (útil para IDs únicos)
  Handlebars.registerHelper('random', function(max) {
    return Math.floor(Math.random() * max);
  });
}

module.exports = {
  registerHelpers
};