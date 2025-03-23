/**
 * Library Manager
 * Gerencia bibliotecas PHP para e-commerce e desenvolvimento web
 */
const fs = require('fs').promises;
const path = require('path');

class LibraryManager {
  /**
   * Inicializa o gerenciador de bibliotecas
   * @param {Object} config - Configurações do gerenciador
   */
  constructor(config = {}) {
    this.config = {
      libraryPath: config.libraryPath || path.join(__dirname, '..', '..', 'modules', 'libraries'),
      autoloadEnabled: config.autoloadEnabled !== undefined ? config.autoloadEnabled : true,
      defaultLibraries: config.defaultLibraries || [],
      ...config
    };
    
    // Mapeamento de bibliotecas disponíveis
    this.libraries = {
      // Bibliotecas para e-commerce
      'woocommerce': {
        path: 'ecommerce/woocommerce.php',
        dependencies: ['http-client']
      },
      'shopify': {
        path: 'ecommerce/shopify.php',
        dependencies: ['http-client']
      },
      'magento': {
        path: 'ecommerce/magento.php',
        dependencies: ['http-client']
      },
      'opencart': {
        path: 'ecommerce/opencart.php',
        dependencies: ['http-client']
      },
      
      // Bibliotecas para desenvolvimento web
      'http-client': {
        path: 'web/http-client.php',
        dependencies: []
      },
      'template-engine': {
        path: 'web/template-engine.php',
        dependencies: []
      },
      'form-validator': {
        path: 'web/form-validator.php',
        dependencies: []
      },
      'database': {
        path: 'web/database.php',
        dependencies: []
      },
      'image-processor': {
        path: 'web/image-processor.php',
        dependencies: []
      },
      
      // Utilitários
      'utils': {
        path: 'utils/general.php',
        dependencies: []
      },
      'security': {
        path: 'utils/security.php',
        dependencies: []
      },
      'logger': {
        path: 'utils/logger.php',
        dependencies: []
      }
    };
    
    // Inicialização
    this._init();
  }

  /**
   * Inicializa o gerenciador de bibliotecas
   * @private
   */
  async _init() {
    try {
      // Verifica se o diretório de bibliotecas existe
      await this._ensureLibraryDirectories();
    } catch (error) {
      console.warn(`Erro ao inicializar gerenciador de bibliotecas: ${error.message}`);
    }
  }

  /**
   * Garante que os diretórios de bibliotecas existam
   * @private
   */
  async _ensureLibraryDirectories() {
    const directories = [
      this.config.libraryPath,
      path.join(this.config.libraryPath, 'ecommerce'),
      path.join(this.config.libraryPath, 'web'),
      path.join(this.config.libraryPath, 'utils')
    ];
    
    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true }).catch(() => {});
    }
  }

  /**
   * Gera o código de autoload para as bibliotecas
   * @param {Array<string>} libraries - Nomes das bibliotecas a serem carregadas
   * @returns {string} Código PHP de autoload
   * @private
   */
  async _generateAutoloadCode(libraries) {
    // Inicializa com autoloader básico
    let code = `
      // Função de autoload personalizada
      spl_autoload_register(function($class) {
        // Mapeamento de namespaces para diretórios
        $namespaces = [
          'MCP\\\\Ecommerce\\\\' => __DIR__ . '/ecommerce',
          'MCP\\\\Web\\\\' => __DIR__ . '/web',
          'MCP\\\\Utils\\\\' => __DIR__ . '/utils',
        ];
        
        foreach ($namespaces as $prefix => $dir) {
          $len = strlen($prefix);
          if (strncmp($prefix, $class, $len) !== 0) {
            continue;
          }
          
          $relativeClass = substr($class, $len);
          $file = $dir . '/' . str_replace('\\\\', '/', $relativeClass) . '.php';
          
          if (file_exists($file)) {
            require $file;
            return true;
          }
        }
        
        return false;
      });
    `;
    
    // Se não houver bibliotecas específicas, retorna apenas o autoloader
    if (!libraries || libraries.length === 0) {
      return code;
    }
    
    // Caso contrário, adiciona código para carregar bibliotecas específicas
    code += "\n// Carregamento específico de bibliotecas\n";
    
    // Resolve dependências recursivamente
    const resolvedLibraries = await this._resolveDependencies(libraries);
    
    // Adiciona requires para cada biblioteca
    for (const lib of resolvedLibraries) {
      if (this.libraries[lib]) {
        const libPath = this.libraries[lib].path;
        code += `require_once __DIR__ . '/${libPath}';\n`;
      }
    }
    
    return code;
  }

  /**
   * Resolve dependências de bibliotecas recursivamente
   * @param {Array<string>} libraries - Bibliotecas solicitadas
   * @returns {Promise<Array<string>>} Lista completa de bibliotecas com dependências
   * @private
   */
  async _resolveDependencies(libraries) {
    const result = new Set();
    const queue = [...libraries];
    
    while (queue.length > 0) {
      const lib = queue.shift();
      
      if (result.has(lib)) continue;
      result.add(lib);
      
      // Adiciona dependências à fila
      if (this.libraries[lib] && this.libraries[lib].dependencies) {
        for (const dep of this.libraries[lib].dependencies) {
          if (!result.has(dep)) {
            queue.push(dep);
          }
        }
      }
    }
    
    return Array.from(result);
  }

  /**
   * Prepara código PHP com as bibliotecas necessárias
   * @param {string} code - Código PHP original
   * @param {Array<string>} libraries - Bibliotecas adicionais a incluir
   * @returns {Promise<string>} Código PHP com bibliotecas incluídas
   */
  async prepareCode(code, libraries = []) {
    // Combina bibliotecas padrão com as solicitadas
    const requestedLibraries = [
      ...this.config.defaultLibraries,
      ...libraries
    ];
    
    // Se o autoload estiver desativado, retorna o código original
    if (!this.config.autoloadEnabled || requestedLibraries.length === 0) {
      return code;
    }
    
    // Gera o código de autoload
    const autoloadCode = await this._generateAutoloadCode(requestedLibraries);
    
    // Adiciona o autoload após a tag PHP inicial
    return code.replace(/^<\?php\s*/, `<?php\n// Autoload de bibliotecas\n${autoloadCode}\n\n`);
  }

  /**
   * Verifica se uma biblioteca existe
   * @param {string} libraryName - Nome da biblioteca
   * @returns {Promise<boolean>} True se a biblioteca existir
   */
  async libraryExists(libraryName) {
    if (!this.libraries[libraryName]) {
      return false;
    }
    
    const libPath = path.join(this.config.libraryPath, this.libraries[libraryName].path);
    
    try {
      await fs.access(libPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtém lista de bibliotecas instaladas
   * @returns {Promise<Array<Object>>} Lista de bibliotecas disponíveis
   */
  async getInstalledLibraries() {
    const result = [];
    
    for (const [name, info] of Object.entries(this.libraries)) {
      const libPath = path.join(this.config.libraryPath, info.path);
      
      try {
        await fs.access(libPath);
        result.push({
          name,
          path: info.path,
          dependencies: info.dependencies,
          installed: true
        });
      } catch (error) {
        result.push({
          name,
          path: info.path,
          dependencies: info.dependencies,
          installed: false
        });
      }
    }
    
    return result;
  }

  /**
   * Instala uma biblioteca específica
   * @param {string} libraryName - Nome da biblioteca a instalar
   * @param {string} content - Conteúdo da biblioteca (opcional)
   * @returns {Promise<boolean>} True se instalada com sucesso
   */
  async installLibrary(libraryName, content = '') {
    if (!this.libraries[libraryName]) {
      throw new Error(`Biblioteca não encontrada: ${libraryName}`);
    }
    
    // Se não foi fornecido conteúdo, usa template padrão
    if (!content) {
      content = this._getDefaultLibraryTemplate(libraryName);
    }
    
    // Cria o diretório se necessário
    const libPath = path.join(this.config.libraryPath, this.libraries[libraryName].path);
    const libDir = path.dirname(libPath);
    
    await fs.mkdir(libDir, { recursive: true });
    
    // Salva o arquivo da biblioteca
    await fs.writeFile(libPath, content);
    
    return true;
  }

  /**
   * Gera um template padrão para uma biblioteca
   * @param {string} libraryName - Nome da biblioteca
   * @returns {string} Template de código PHP
   * @private
   */
  _getDefaultLibraryTemplate(libraryName) {
    // Determina o namespace com base no caminho
    let namespace = 'MCP';
    if (this.libraries[libraryName]) {
      const libPath = this.libraries[libraryName].path;
      
      if (libPath.startsWith('ecommerce/')) {
        namespace += '\\Ecommerce';
      } else if (libPath.startsWith('web/')) {
        namespace += '\\Web';
      } else if (libPath.startsWith('utils/')) {
        namespace += '\\Utils';
      }
    }
    
    const className = this._camelCase(libraryName);
    
    return `<?php
/**
 * ${className} - Biblioteca gerada automaticamente
 * Parte do PHP Universal MCP Server
 */
namespace ${namespace};

class ${className} {
  /**
   * Construtor da biblioteca
   */
  public function __construct() {
    // Inicialização da biblioteca
  }
  
  /**
   * Método de exemplo
   * @param mixed $param
   * @return string
   */
  public function exampleMethod($param) {
    return "Exemplo de método com parâmetro: " . var_export($param, true);
  }
}
`;
  }

  /**
   * Converte um nome de biblioteca para CamelCase
   * @param {string} str - String a converter
   * @returns {string} String em CamelCase
   * @private
   */
  _camelCase(str) {
    return str
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
}

module.exports = LibraryManager;