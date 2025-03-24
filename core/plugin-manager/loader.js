/**
 * Plugin Loader
 * 
 * Responsável por carregar e instalar plugins no sistema
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

class PluginLoader {
  constructor(manager) {
    this.manager = manager;
    this.pluginsDir = manager.options.pluginsDir;
  }
  
  /**
   * Carrega a classe de um plugin
   */
  loadPluginClass(pluginName) {
    const pluginPath = path.join(this.pluginsDir, pluginName);
    const mainFile = path.join(pluginPath, 'index.js');
    
    if (!fs.existsSync(mainFile)) {
      throw new Error(`Arquivo principal do plugin ${pluginName} não encontrado`);
    }
    
    try {
      // Limpar cache para permitir hot-reload
      delete require.cache[require.resolve(mainFile)];
      
      // Carregar classe do plugin
      const PluginClass = require(mainFile);
      return PluginClass;
    } catch (error) {
      throw new Error(`Erro ao carregar plugin ${pluginName}: ${error.message}`);
    }
  }
  
  /**
   * Instala um plugin a partir de uma fonte
   * Suporta: diretório local, arquivo zip, URL, código fonte
   */
  async installFromSource(source) {
    // Diretório local
    if (typeof source === 'string' && fs.existsSync(source) && fs.statSync(source).isDirectory()) {
      return await this.installFromDirectory(source);
    }
    
    // Código fonte (objeto com arquivos)
    if (typeof source === 'object' && source.name && source.files) {
      return await this.installFromSourceCode(source);
    }
    
    // URL (não implementado nesta versão)
    if (typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://'))) {
      throw new Error('Instalação a partir de URL não implementada nesta versão');
    }
    
    // Arquivo ZIP (não implementado nesta versão)
    if (typeof source === 'string' && source.endsWith('.zip')) {
      throw new Error('Instalação a partir de arquivo ZIP não implementada nesta versão');
    }
    
    throw new Error('Fonte do plugin não suportada');
  }
  
  /**
   * Instala um plugin a partir de um diretório local
   */
  async installFromDirectory(dirPath) {
    const dirName = path.basename(dirPath);
    const targetDir = path.join(this.pluginsDir, dirName);
    
    // Verificar se o plugin já existe
    if (fs.existsSync(targetDir)) {
      throw new Error(`Plugin ${dirName} já existe`);
    }
    
    // Verificar se o diretório contém um plugin válido
    const mainFile = path.join(dirPath, 'index.js');
    if (!fs.existsSync(mainFile)) {
      throw new Error(`Diretório não contém um plugin válido: ${dirPath}`);
    }
    
    // Copiar diretório do plugin
    this.copyDirectory(dirPath, targetDir);
    
    return dirName;
  }
  
  /**
   * Instala um plugin a partir de código fonte
   */
  async installFromSourceCode(source) {
    const { name, files } = source;
    const targetDir = path.join(this.pluginsDir, name);
    
    // Verificar se o plugin já existe
    if (fs.existsSync(targetDir)) {
      throw new Error(`Plugin ${name} já existe`);
    }
    
    // Criar diretório do plugin
    fs.mkdirSync(targetDir, { recursive: true });
    
    // Salvar arquivos do plugin
    for (const file of files) {
      if (!file.path || !file.content) continue;
      
      const filePath = path.join(targetDir, file.path);
      const dirName = path.dirname(filePath);
      
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
      }
      
      fs.writeFileSync(filePath, file.content, 'utf8');
    }
    
    return name;
  }
  
  /**
   * Remove um plugin
   */
  async removePlugin(pluginName) {
    const pluginDir = path.join(this.pluginsDir, pluginName);
    
    if (!fs.existsSync(pluginDir)) {
      throw new Error(`Plugin ${pluginName} não encontrado`);
    }
    
    this.removeDirectory(pluginDir);
    return true;
  }
  
  /**
   * Gera o hash de um plugin para verificação de integridade
   */
  generatePluginHash(pluginName) {
    const pluginDir = path.join(this.pluginsDir, pluginName);
    
    if (!fs.existsSync(pluginDir)) {
      throw new Error(`Plugin ${pluginName} não encontrado`);
    }
    
    const hash = createHash('sha256');
    this.hashDirectory(pluginDir, hash);
    
    return hash.digest('hex');
  }
  
  /**
   * Calcula o hash de um diretório recursivamente
   */
  hashDirectory(dir, hash) {
    const files = fs.readdirSync(dir);
    
    // Ordenar arquivos para garantir hash consistente
    files.sort().forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.hashDirectory(filePath, hash);
      } else {
        const content = fs.readFileSync(filePath);
        hash.update(`${file}:${content}`);
      }
    });
  }
  
  /**
   * Copia um diretório recursivamente
   */
  copyDirectory(source, target) {
    // Criar diretório de destino
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }
    
    // Copiar arquivos
    const files = fs.readdirSync(source);
    files.forEach(file => {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(target, file);
      const stat = fs.statSync(sourcePath);
      
      if (stat.isDirectory()) {
        this.copyDirectory(sourcePath, targetPath);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
      }
    });
  }
  
  /**
   * Remove um diretório recursivamente
   */
  removeDirectory(dir) {
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach(file => {
        const curPath = path.join(dir, file);
        if (fs.statSync(curPath).isDirectory()) {
          this.removeDirectory(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(dir);
    }
  }
}

module.exports = PluginLoader;
