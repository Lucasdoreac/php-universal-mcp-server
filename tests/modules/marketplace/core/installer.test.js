/**
 * Marketplace Installer Integration Tests
 * 
 * @jest-environment node
 */

const path = require('path');
const fs = require('fs');
const Installer = require('../../../../modules/marketplace/core/installer');

// Mock para fs
jest.mock('fs', () => {
  const originalModule = jest.requireActual('fs');
  return {
    ...originalModule,
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    readFileSync: jest.fn(),
    renameSync: jest.fn()
  };
});

describe('Installer', () => {
  let installer;
  let mockLogger;
  let mockValidator;
  let tempPluginsPath;

  beforeEach(() => {
    // Limpar todos os mocks antes de cada teste
    jest.clearAllMocks();

    // Mock para o logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    };

    // Mock para o validator
    mockValidator = {
      validatePlugin: jest.fn().mockResolvedValue({ valid: true }),
      validatePluginSource: jest.fn().mockResolvedValue({ valid: true })
    };

    // Configurar caminho temporário para plugins
    tempPluginsPath = path.join(__dirname, '../../../../plugins');

    // Mock para fs.existsSync para retornar true para o diretório de plugins
    fs.existsSync.mockImplementation((pathToCheck) => {
      if (pathToCheck === tempPluginsPath) {
        return true;
      }
      if (pathToCheck === path.join(tempPluginsPath, 'registry.json')) {
        return false; // Nenhum registro ainda
      }
      return false;
    });

    // Instanciar o instalador
    installer = new Installer({
      localPluginsPath: tempPluginsPath,
      validator: mockValidator,
      logger: mockLogger
    });
  });

  describe('constructor', () => {
    it('deve lançar erro quando localPluginsPath não é fornecido', () => {
      expect(() => new Installer({
        validator: mockValidator,
        logger: mockLogger
      })).toThrow('Caminho para plugins locais é obrigatório');
    });

    it('deve criar diretório de plugins se não existir', () => {
      // Simular diretório inexistente
      fs.existsSync.mockReturnValueOnce(false);

      // Criar nova instância
      const newInstaller = new Installer({
        localPluginsPath: tempPluginsPath,
        validator: mockValidator,
        logger: mockLogger
      });

      // Verificar que o diretório foi criado
      expect(fs.mkdirSync).toHaveBeenCalledWith(tempPluginsPath, { recursive: true });
    });

    it('deve carregar plugins instalados do registro existente', () => {
      // Simular existência do arquivo de registro
      fs.existsSync.mockImplementation((pathToCheck) => {
        if (pathToCheck === path.join(tempPluginsPath, 'registry.json')) {
          return true;
        }
        return true;
      });

      // Simular conteúdo do registro
      const mockRegistry = {
        'test-plugin': {
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          status: 'active'
        },
        'another-plugin': {
          id: 'another-plugin',
          name: 'Another Plugin',
          version: '2.1.0',
          status: 'inactive'
        }
      };

      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockRegistry));

      // Criar nova instância
      const newInstaller = new Installer({
        localPluginsPath: tempPluginsPath,
        validator: mockValidator,
        logger: mockLogger
      });

      // Verificar que os plugins foram carregados
      expect(newInstaller.installedPlugins.size).toBe(2);
      expect(newInstaller.installedPlugins.get('test-plugin')).toEqual(mockRegistry['test-plugin']);
      expect(newInstaller.installedPlugins.get('another-plugin')).toEqual(mockRegistry['another-plugin']);
      expect(mockLogger.info).toHaveBeenCalledWith('Carregados 2 plugins instalados');
    });
  });

  describe('_saveInstalledPlugins', () => {
    it('deve salvar o registro de plugins', () => {
      // Adicionar alguns plugins ao registro
      installer.installedPlugins.set('test-plugin', {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        status: 'active'
      });

      installer.installedPlugins.set('another-plugin', {
        id: 'another-plugin',
        name: 'Another Plugin',
        version: '2.1.0',
        status: 'inactive'
      });

      // Executar o método
      installer._saveInstalledPlugins();

      // Verificar que o arquivo foi escrito
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join(tempPluginsPath, 'registry.json'),
        expect.any(String)
      );

      // Verificar conteúdo do arquivo
      const writtenContent = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenContent).toHaveProperty('test-plugin');
      expect(writtenContent).toHaveProperty('another-plugin');
      expect(writtenContent['test-plugin']).toEqual({
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        status: 'active'
      });

      expect(mockLogger.info).toHaveBeenCalledWith('Registro de plugins atualizado');
    });

    it('deve lidar com erros ao salvar', () => {
      // Forçar um erro ao salvar
      fs.writeFileSync.mockImplementationOnce(() => {
        throw new Error('Write error');
      });

      // Adicionar um plugin ao registro
      installer.installedPlugins.set('test-plugin', {
        id: 'test-plugin',
        name: 'Test Plugin'
      });

      // Executar o método e verificar erro
      expect(() => installer._saveInstalledPlugins()).toThrow('Write error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro ao salvar registro de plugins:',
        expect.any(Error)
      );
    });
  });

  describe('getInstalledPlugins', () => {
    it('deve retornar lista vazia quando não há plugins', async () => {
      const result = await installer.getInstalledPlugins();
      expect(result).toEqual([]);
    });

    it('deve retornar lista de plugins instalados', async () => {
      // Adicionar alguns plugins ao registro
      installer.installedPlugins.set('test-plugin', {
        id: 'test-plugin',
        name: 'Test Plugin'
      });

      installer.installedPlugins.set('another-plugin', {
        id: 'another-plugin',
        name: 'Another Plugin'
      });

      // Obter lista de plugins
      const result = await installer.getInstalledPlugins();

      // Verificar resultado
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        id: 'test-plugin',
        name: 'Test Plugin'
      });
      expect(result).toContainEqual({
        id: 'another-plugin',
        name: 'Another Plugin'
      });
    });
  });

  describe('isPluginInstalled', () => {
    it('deve retornar false para plugin não instalado', async () => {
      const result = await installer.isPluginInstalled('non-existent');
      expect(result).toBe(false);
    });

    it('deve retornar true para plugin instalado', async () => {
      // Adicionar um plugin ao registro
      installer.installedPlugins.set('test-plugin', {
        id: 'test-plugin',
        name: 'Test Plugin'
      });

      // Verificar que está instalado
      const result = await installer.isPluginInstalled('test-plugin');
      expect(result).toBe(true);
    });
  });

  describe('getInstalledPlugin', () => {
    it('deve retornar null para plugin não instalado', async () => {
      const result = await installer.getInstalledPlugin('non-existent');
      expect(result).toBeNull();
    });

    it('deve retornar informações do plugin instalado', async () => {
      // Adicionar um plugin ao registro
      const pluginInfo = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        status: 'active'
      };
      installer.installedPlugins.set('test-plugin', pluginInfo);

      // Obter informações do plugin
      const result = await installer.getInstalledPlugin('test-plugin');
      expect(result).toEqual(pluginInfo);
    });
  });

  describe('installPlugin', () => {
    it('deve retornar erro se plugin já está instalado', async () => {
      // Adicionar um plugin ao registro
      installer.installedPlugins.set('test-plugin', {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0'
      });

      // Tentar instalar novamente
      const result = await installer.installPlugin('test-plugin');

      // Verificar erro
      expect(result.success).toBe(false);
      expect(result.error).toContain('já está instalado');
    });

    it('deve atualizar se versão diferente é especificada para plugin existente', async () => {
      // Adicionar um plugin ao registro
      installer.installedPlugins.set('test-plugin', {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0'
      });

      // Espiar método updatePlugin
      installer.updatePlugin = jest.fn().mockResolvedValue({
        success: true,
        version: '2.0.0'
      });

      // Tentar instalar versão diferente
      const result = await installer.installPlugin('test-plugin', '2.0.0');

      // Verificar que updatePlugin foi chamado
      expect(installer.updatePlugin).toHaveBeenCalledWith('test-plugin', '2.0.0');
      expect(result.success).toBe(true);
    });

    it('deve instalar novo plugin corretamente', async () => {
      // Configurar mock para existsSync
      fs.existsSync.mockImplementation((pathToCheck) => {
        if (pathToCheck === path.join(tempPluginsPath, 'new-plugin')) {
          return false;
        }
        return true;
      });

      // Espiar método _saveInstalledPlugins
      const saveSpy = jest.spyOn(installer, '_saveInstalledPlugins');

      // Instalar novo plugin
      const result = await installer.installPlugin('new-plugin', '1.5.0');

      // Verificar resultado
      expect(result.success).toBe(true);
      expect(result.pluginInfo).toHaveProperty('id', 'new-plugin');
      expect(result.pluginInfo).toHaveProperty('version', '1.5.0');
      expect(result.pluginInfo).toHaveProperty('status', 'active');

      // Verificar que diretório foi criado
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        path.join(tempPluginsPath, 'new-plugin'),
        { recursive: true }
      );

      // Verificar que arquivo de manifesto foi criado
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join(tempPluginsPath, 'new-plugin', 'plugin.json'),
        expect.any(String)
      );

      // Verificar que plugin foi adicionado ao registro
      expect(installer.installedPlugins.get('new-plugin')).toEqual(result.pluginInfo);

      // Verificar que registro foi salvo
      expect(saveSpy).toHaveBeenCalled();

      expect(mockLogger.info).toHaveBeenCalledWith('Plugin new-plugin instalado com sucesso na versão 1.5.0');
    });

    it('deve usar versão padrão se não especificada', async () => {
      // Instalar novo plugin sem especificar versão
      const result = await installer.installPlugin('new-plugin');

      // Verificar que usou versão padrão
      expect(result.pluginInfo).toHaveProperty('version', '1.0.0');
    });

    it('deve lidar com erros durante a instalação', async () => {
      // Forçar um erro ao criar diretório
      fs.mkdirSync.mockImplementationOnce(() => {
        throw new Error('Directory creation failed');
      });

      // Tentar instalar plugin
      const result = await installer.installPlugin('new-plugin');

      // Verificar erro
      expect(result.success).toBe(false);
      expect(result.error).toBe('Directory creation failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro ao instalar plugin new-plugin:',
        expect.any(Error)
      );
    });
  });

  describe('updatePlugin', () => {
    it('deve retornar erro se plugin não está instalado', async () => {
      const result = await installer.updatePlugin('non-existent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('não está instalado');
    });

    it('deve retornar erro se plugin já está na versão especificada', async () => {
      // Adicionar um plugin ao registro
      installer.installedPlugins.set('test-plugin', {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0'
      });

      // Tentar atualizar para a mesma versão
      const result = await installer.updatePlugin('test-plugin', '1.0.0');

      // Verificar erro
      expect(result.success).toBe(false);
      expect(result.error).toContain('já está na versão 1.0.0');
    });

    it('deve atualizar para versão especificada', async () => {
      // Adicionar um plugin ao registro com caminho de instalação
      installer.installedPlugins.set('test-plugin', {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        installPath: path.join(tempPluginsPath, 'test-plugin')
      });

      // Espiar método _saveInstalledPlugins
      const saveSpy = jest.spyOn(installer, '_saveInstalledPlugins');

      // Atualizar para versão específica
      const result = await installer.updatePlugin('test-plugin', '2.0.0');

      // Verificar resultado
      expect(result.success).toBe(true);
      expect(result.pluginId).toBe('test-plugin');
      expect(result.previousVersion).toBe('1.0.0');
      expect(result.version).toBe('2.0.0');

      // Verificar que plugin foi atualizado no registro
      expect(installer.installedPlugins.get('test-plugin').version).toBe('2.0.0');

      // Verificar que arquivo de manifesto foi atualizado
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join(tempPluginsPath, 'test-plugin', 'plugin.json'),
        expect.any(String)
      );

      // Verificar que registro foi salvo
      expect(saveSpy).toHaveBeenCalled();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Plugin test-plugin atualizado com sucesso da versão 1.0.0 para 2.0.0'
      );
    });

    it('deve incrementar versão se não especificada', async () => {
      // Adicionar um plugin ao registro
      installer.installedPlugins.set('test-plugin', {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        installPath: path.join(tempPluginsPath, 'test-plugin')
      });

      // Atualizar sem especificar versão
      const result = await installer.updatePlugin('test-plugin');

      // Verificar que incrementou versão major
      expect(result.version).toBe('2.0.0');
    });
  });

  describe('uninstallPlugin', () => {
    it('deve retornar erro se plugin não está instalado', async () => {
      const result = await installer.uninstallPlugin('non-existent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('não está instalado');
    });

    it('deve desinstalar plugin corretamente', async () => {
      // Caminho de instalação do plugin
      const pluginPath = path.join(tempPluginsPath, 'test-plugin');

      // Adicionar um plugin ao registro
      installer.installedPlugins.set('test-plugin', {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        installPath: pluginPath
      });

      // Mock para existsSync para o caminho do plugin
      fs.existsSync.mockImplementation((pathToCheck) => {
        if (pathToCheck === pluginPath) {
          return true;
        }
        return false;
      });

      // Espiar método _saveInstalledPlugins
      const saveSpy = jest.spyOn(installer, '_saveInstalledPlugins');

      // Desinstalar plugin
      const result = await installer.uninstallPlugin('test-plugin');

      // Verificar resultado
      expect(result.success).toBe(true);
      expect(result.pluginId).toBe('test-plugin');

      // Verificar que plugin foi removido do registro
      expect(installer.installedPlugins.has('test-plugin')).toBe(false);

      // Verificar que diretório foi renomeado (simulando remoção)
      expect(fs.renameSync).toHaveBeenCalledWith(
        pluginPath,
        expect.stringContaining('test-plugin_uninstalled_')
      );

      // Verificar que registro foi salvo
      expect(saveSpy).toHaveBeenCalled();

      expect(mockLogger.info).toHaveBeenCalledWith('Plugin test-plugin desinstalado com sucesso');
    });
  });

  describe('activatePlugin', () => {
    it('deve retornar erro se plugin não está instalado', async () => {
      const result = await installer.activatePlugin('non-existent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('não está instalado');
    });

    it('deve retornar erro se plugin já está ativo', async () => {
      // Adicionar um plugin ativo ao registro
      installer.installedPlugins.set('test-plugin', {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        status: 'active'
      });

      // Tentar ativar novamente
      const result = await installer.activatePlugin('test-plugin');

      // Verificar erro
      expect(result.success).toBe(false);
      expect(result.error).toContain('já está ativo');
    });

    it('deve ativar plugin corretamente', async () => {
      // Caminho de instalação do plugin
      const pluginPath = path.join(tempPluginsPath, 'test-plugin');

      // Adicionar um plugin inativo ao registro
      installer.installedPlugins.set('test-plugin', {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        status: 'inactive',
        installPath: pluginPath
      });

      // Espiar método _saveInstalledPlugins
      const saveSpy = jest.spyOn(installer, '_saveInstalledPlugins');

      // Ativar plugin
      const result = await installer.activatePlugin('test-plugin');

      // Verificar resultado
      expect(result.success).toBe(true);
      expect(result.pluginId).toBe('test-plugin');
      expect(result.status).toBe('active');

      // Verificar que plugin foi atualizado no registro
      expect(installer.installedPlugins.get('test-plugin').status).toBe('active');

      // Verificar que arquivo de manifesto foi atualizado
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join(pluginPath, 'plugin.json'),
        expect.any(String)
      );

      // Verificar que registro foi salvo
      expect(saveSpy).toHaveBeenCalled();

      expect(mockLogger.info).toHaveBeenCalledWith('Plugin test-plugin ativado com sucesso');
    });
  });

  describe('deactivatePlugin', () => {
    it('deve retornar erro se plugin não está instalado', async () => {
      const result = await installer.deactivatePlugin('non-existent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('não está instalado');
    });

    it('deve retornar erro se plugin já está inativo', async () => {
      // Adicionar um plugin inativo ao registro
      installer.installedPlugins.set('test-plugin', {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        status: 'inactive'
      });

      // Tentar desativar novamente
      const result = await installer.deactivatePlugin('test-plugin');

      // Verificar erro
      expect(result.success).toBe(false);
      expect(result.error).toContain('já está inativo');
    });

    it('deve desativar plugin corretamente', async () => {
      // Caminho de instalação do plugin
      const pluginPath = path.join(tempPluginsPath, 'test-plugin');

      // Adicionar um plugin ativo ao registro
      installer.installedPlugins.set('test-plugin', {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        status: 'active',
        installPath: pluginPath
      });

      // Espiar método _saveInstalledPlugins
      const saveSpy = jest.spyOn(installer, '_saveInstalledPlugins');

      // Desativar plugin
      const result = await installer.deactivatePlugin('test-plugin');

      // Verificar resultado
      expect(result.success).toBe(true);
      expect(result.pluginId).toBe('test-plugin');
      expect(result.status).toBe('inactive');

      // Verificar que plugin foi atualizado no registro
      expect(installer.installedPlugins.get('test-plugin').status).toBe('inactive');

      // Verificar que arquivo de manifesto foi atualizado
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join(pluginPath, 'plugin.json'),
        expect.any(String)
      );

      // Verificar que registro foi salvo
      expect(saveSpy).toHaveBeenCalled();

      expect(mockLogger.info).toHaveBeenCalledWith('Plugin test-plugin desativado com sucesso');
    });
  });

  describe('configurePlugin', () => {
    it('deve retornar erro se plugin não está instalado', async () => {
      const result = await installer.configurePlugin('non-existent', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('não está instalado');
    });

    it('deve configurar plugin corretamente', async () => {
      // Caminho de instalação do plugin
      const pluginPath = path.join(tempPluginsPath, 'test-plugin');

      // Adicionar um plugin ao registro com configuração inicial
      installer.installedPlugins.set('test-plugin', {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        installPath: pluginPath,
        config: {
          setting1: 'value1'
        }
      });

      // Espiar método _saveInstalledPlugins
      const saveSpy = jest.spyOn(installer, '_saveInstalledPlugins');

      // Configurar plugin
      const newConfig = {
        setting2: 'value2',
        setting3: true
      };
      const result = await installer.configurePlugin('test-plugin', newConfig);

      // Verificar resultado
      expect(result.success).toBe(true);
      expect(result.pluginId).toBe('test-plugin');
      expect(result.config).toEqual({
        setting1: 'value1', // valor original
        setting2: 'value2', // novo valor
        setting3: true      // novo valor
      });

      // Verificar que plugin foi atualizado no registro
      expect(installer.installedPlugins.get('test-plugin').config).toEqual({
        setting1: 'value1',
        setting2: 'value2',
        setting3: true
      });

      // Verificar que arquivo de manifesto foi atualizado
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join(pluginPath, 'plugin.json'),
        expect.any(String)
      );

      // Verificar que registro foi salvo
      expect(saveSpy).toHaveBeenCalled();

      expect(mockLogger.info).toHaveBeenCalledWith('Plugin test-plugin configurado com sucesso');
    });
  });
});
