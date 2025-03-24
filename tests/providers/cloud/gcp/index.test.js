/**
 * GCPProvider Integration Tests
 * 
 * @jest-environment node
 */

const GCPProvider = require('../../../../providers/cloud/gcp/index');
const AppEngineManager = require('../../../../providers/cloud/gcp/app-engine');

// Mock para App Engine e outros gerenciadores
jest.mock('../../../../providers/cloud/gcp/app-engine', () => {
  return jest.fn().mockImplementation(() => ({
    listApplications: jest.fn().mockResolvedValue([]),
    deployApplication: jest.fn().mockResolvedValue({}),
    getVersions: jest.fn().mockResolvedValue([])
  }));
});

// Configurar mocks para os outros gerenciadores mencionados no Provider
['cloud-storage', 'cloud-sql', 'cloud-functions', 'compute-engine'].forEach(module => {
  jest.mock(`../../../../providers/cloud/gcp/${module}`, () => {
    return jest.fn().mockImplementation(() => ({}));
  });
});

describe('GCPProvider', () => {
  let gcpProvider;
  let mockLogger;

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

    // Instanciar o provedor GCP
    gcpProvider = new GCPProvider({ 
      logger: mockLogger 
    });
  });

  describe('constructor', () => {
    it('deve criar uma instância com as opções padrão', () => {
      expect(gcpProvider).toBeInstanceOf(GCPProvider);
      expect(gcpProvider.options.projectId).toBeNull();
      expect(gcpProvider.options.region).toBe('us-central1');
      expect(gcpProvider.initialized).toBe(false);
      expect(gcpProvider.logger).toBe(mockLogger);
    });

    it('deve substituir opções padrão quando fornecidas', () => {
      const customOptions = {
        projectId: 'custom-project',
        region: 'europe-west1',
        logger: mockLogger
      };

      const customGcpProvider = new GCPProvider(customOptions);
      expect(customGcpProvider.options.projectId).toBe('custom-project');
      expect(customGcpProvider.options.region).toBe('europe-west1');
    });
  });

  describe('initialize', () => {
    it('deve rejeitar credenciais sem projectId', async () => {
      const credentials = { keyFile: {} };
      await expect(gcpProvider.initialize(credentials))
        .rejects.toThrow('O ID do projeto GCP é obrigatório');
    });

    it('deve inicializar o provider corretamente', async () => {
      // Credenciais de teste
      const credentials = {
        projectId: 'test-project',
        keyFile: {
          type: 'service_account',
          project_id: 'test-project',
          private_key_id: 'key123',
          private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgk...\n-----END PRIVATE KEY-----\n',
          client_email: 'test@test-project.iam.gserviceaccount.com'
        }
      };

      // Executar o método
      const result = await gcpProvider.initialize(credentials);

      // Verificar resultado
      expect(result).toBe(true);
      expect(gcpProvider.initialized).toBe(true);
      expect(gcpProvider.credentials).toBe(credentials);
      expect(gcpProvider.options.projectId).toBe('test-project');
      
      // Verificar inicialização dos gerenciadores de serviços
      expect(AppEngineManager).toHaveBeenCalledWith({
        projectId: 'test-project',
        credentials: credentials,
        logger: mockLogger
      });
      
      expect(mockLogger.info).toHaveBeenCalledWith('Inicializando GCP Provider');
      expect(mockLogger.info).toHaveBeenCalledWith(`GCP Provider inicializado com sucesso para projeto test-project`);
    });

    it('deve lidar com erros durante a inicialização', async () => {
      // Sobrescrever o método do logger para forçar um erro
      mockLogger.info = jest.fn().mockImplementationOnce(() => {
        throw new Error('Initialization failed');
      });

      // Credenciais de teste
      const credentials = {
        projectId: 'test-project',
        keyFile: {}
      };

      // Executar o método e verificar que o erro é propagado
      await expect(gcpProvider.initialize(credentials))
        .rejects.toThrow('Initialization failed');
      
      expect(gcpProvider.initialized).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro ao inicializar GCP Provider:', 
        expect.any(Error)
      );
    });
  });

  describe('_checkInitialized', () => {
    it('deve lançar erro quando o provider não está inicializado', () => {
      expect(() => gcpProvider._checkInitialized())
        .toThrow('GCP Provider não está inicializado. Chame initialize() primeiro.');
    });

    it('não deve lançar erro quando o provider está inicializado', async () => {
      gcpProvider.initialized = true;
      expect(() => gcpProvider._checkInitialized()).not.toThrow();
    });
  });

  describe('App Engine methods', () => {
    beforeEach(() => {
      // Configurar provider como inicializado
      gcpProvider.initialized = true;
      
      // Configurar gerenciador App Engine
      gcpProvider.appEngine = {
        listApplications: jest.fn().mockResolvedValue([{
          name: 'apps/test-project',
          id: 'test-project'
        }]),
        deployApplication: jest.fn().mockResolvedValue({
          name: 'apps/test-project/services/default/versions/v1',
          id: 'v1',
          serviceId: 'default'
        }),
        getVersions: jest.fn().mockResolvedValue([{
          name: 'apps/test-project/services/default/versions/v1',
          id: 'v1',
          serviceId: 'default'
        }])
      };
    });

    it('listAppEngineApplications deve chamar o método correspondente', async () => {
      const result = await gcpProvider.listAppEngineApplications();
      expect(gcpProvider.appEngine.listApplications).toHaveBeenCalled();
      expect(result).toEqual([{
        name: 'apps/test-project',
        id: 'test-project'
      }]);
    });

    it('deployAppEngineApplication deve chamar o método correspondente', async () => {
      const options = {
        source: './app',
        runtime: 'php81'
      };
      
      const result = await gcpProvider.deployAppEngineApplication(options);
      expect(gcpProvider.appEngine.deployApplication).toHaveBeenCalledWith(options);
      expect(result).toEqual({
        name: 'apps/test-project/services/default/versions/v1',
        id: 'v1',
        serviceId: 'default'
      });
    });

    it('getAppEngineVersions deve chamar o método correspondente', async () => {
      const result = await gcpProvider.getAppEngineVersions('default');
      expect(gcpProvider.appEngine.getVersions).toHaveBeenCalledWith('default');
      expect(result).toEqual([{
        name: 'apps/test-project/services/default/versions/v1',
        id: 'v1',
        serviceId: 'default'
      }]);
    });
  });

  describe('Cloud Storage methods', () => {
    beforeEach(() => {
      // Configurar provider como inicializado
      gcpProvider.initialized = true;
      
      // Configurar gerenciador Cloud Storage
      gcpProvider.cloudStorage = {
        listBuckets: jest.fn().mockResolvedValue([{
          name: 'test-bucket',
          location: 'us-central1'
        }]),
        createBucket: jest.fn().mockResolvedValue({
          name: 'new-bucket',
          location: 'us-central1'
        }),
        listObjects: jest.fn().mockResolvedValue([{
          name: 'file.txt',
          size: '1024'
        }]),
        uploadFile: jest.fn().mockResolvedValue({
          name: 'uploaded.txt',
          size: '2048'
        })
      };
    });

    it('listStorageBuckets deve chamar o método correspondente', async () => {
      const result = await gcpProvider.listStorageBuckets();
      expect(gcpProvider.cloudStorage.listBuckets).toHaveBeenCalled();
      expect(result).toEqual([{
        name: 'test-bucket',
        location: 'us-central1'
      }]);
    });

    it('createStorageBucket deve chamar o método correspondente', async () => {
      const options = {
        name: 'new-bucket',
        location: 'us-central1'
      };
      
      const result = await gcpProvider.createStorageBucket(options);
      expect(gcpProvider.cloudStorage.createBucket).toHaveBeenCalledWith(options);
      expect(result).toEqual({
        name: 'new-bucket',
        location: 'us-central1'
      });
    });

    it('listStorageObjects deve chamar o método correspondente', async () => {
      const options = { prefix: 'folder/' };
      
      const result = await gcpProvider.listStorageObjects('test-bucket', options);
      expect(gcpProvider.cloudStorage.listObjects).toHaveBeenCalledWith('test-bucket', options);
      expect(result).toEqual([{
        name: 'file.txt',
        size: '1024'
      }]);
    });

    it('uploadStorageFile deve chamar o método correspondente', async () => {
      const result = await gcpProvider.uploadStorageFile(
        'test-bucket', 
        'uploaded.txt', 
        Buffer.from('test content'),
        { contentType: 'text/plain' }
      );
      
      expect(gcpProvider.cloudStorage.uploadFile).toHaveBeenCalledWith(
        'test-bucket', 
        'uploaded.txt', 
        Buffer.from('test content'),
        { contentType: 'text/plain' }
      );
      
      expect(result).toEqual({
        name: 'uploaded.txt',
        size: '2048'
      });
    });
  });

  describe('Cloud SQL methods', () => {
    beforeEach(() => {
      // Configurar provider como inicializado
      gcpProvider.initialized = true;
      
      // Configurar gerenciador Cloud SQL
      gcpProvider.cloudSQL = {
        listInstances: jest.fn().mockResolvedValue([{
          name: 'test-instance',
          databaseVersion: 'MYSQL_8_0'
        }]),
        createInstance: jest.fn().mockResolvedValue({
          name: 'new-instance',
          databaseVersion: 'MYSQL_8_0'
        }),
        listDatabases: jest.fn().mockResolvedValue([{
          name: 'db1'
        }])
      };
    });

    it('listSQLInstances deve chamar o método correspondente', async () => {
      const result = await gcpProvider.listSQLInstances();
      expect(gcpProvider.cloudSQL.listInstances).toHaveBeenCalled();
      expect(result).toEqual([{
        name: 'test-instance',
        databaseVersion: 'MYSQL_8_0'
      }]);
    });

    it('createSQLInstance deve chamar o método correspondente', async () => {
      const options = {
        name: 'new-instance',
        databaseVersion: 'MYSQL_8_0'
      };
      
      const result = await gcpProvider.createSQLInstance(options);
      expect(gcpProvider.cloudSQL.createInstance).toHaveBeenCalledWith(options);
      expect(result).toEqual({
        name: 'new-instance',
        databaseVersion: 'MYSQL_8_0'
      });
    });

    it('listSQLDatabases deve chamar o método correspondente', async () => {
      const result = await gcpProvider.listSQLDatabases('test-instance');
      expect(gcpProvider.cloudSQL.listDatabases).toHaveBeenCalledWith('test-instance');
      expect(result).toEqual([{
        name: 'db1'
      }]);
    });
  });

  describe('switchRegion', () => {
    beforeEach(() => {
      // Configurar provider como inicializado
      gcpProvider.initialized = true;
      gcpProvider.options.projectId = 'test-project';
      gcpProvider.credentials = { projectId: 'test-project' };
    });

    it('deve atualizar a região e reinicializar serviços regionais', async () => {
      // Limpar mocks
      jest.clearAllMocks();
      
      // Executar o método
      const result = await gcpProvider.switchRegion('europe-west1');

      // Verificar resultado
      expect(result).toBe(true);
      expect(gcpProvider.options.region).toBe('europe-west1');
      
      // Verificar reinicialização de serviços regionais (comme cloudFunctions)
      expect(mockLogger.info).toHaveBeenCalledWith('Região alterada para europe-west1');
    });

    it('deve lidar com erros ao trocar a região', async () => {
      // Forçar um erro
      mockLogger.info = jest.fn().mockImplementationOnce(() => {
        throw new Error('Region change failed');
      });

      // Executar o método e verificar erro
      await expect(gcpProvider.switchRegion('invalid-region'))
        .rejects.toThrow('Region change failed');
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro ao alterar região para invalid-region:', 
        expect.any(Error)
      );
    });
  });

  describe('getPhpRuntimeInfo', () => {
    beforeEach(() => {
      // Configurar provider como inicializado
      gcpProvider.initialized = true;
    });

    it('deve retornar informações sobre runtimes PHP', async () => {
      // Executar o método
      const result = await gcpProvider.getPhpRuntimeInfo();

      // Verificar estrutura do resultado
      expect(result).toHaveProperty('appEngine');
      expect(result.appEngine).toHaveProperty('phpRuntimes');
      expect(result.appEngine.phpRuntimes).toContain('php74');
      expect(result.appEngine.phpRuntimes).toContain('php80');
      expect(result.appEngine.phpRuntimes).toContain('php81');
      
      expect(result).toHaveProperty('cloudFunctions');
      expect(result.cloudFunctions).toHaveProperty('supportedPHPVersions');
      
      expect(result).toHaveProperty('computeEngine');
      expect(result.computeEngine).toHaveProperty('phpImages');
    });

    it('deve lidar com erros ao obter informações de runtime', async () => {
      // Forçar um erro
      mockLogger.info = jest.fn().mockImplementationOnce(() => {
        throw new Error('Failed to get PHP runtime info');
      });

      // Executar o método e verificar erro
      await expect(gcpProvider.getPhpRuntimeInfo())
        .rejects.toThrow('Failed to get PHP runtime info');
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro ao obter informações do PHP Runtime:', 
        expect.any(Error)
      );
    });
  });
});
