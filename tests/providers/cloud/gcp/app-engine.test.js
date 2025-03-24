/**
 * App Engine Manager Integration Tests
 * 
 * @jest-environment node
 */

const AppEngineManager = require('../../../../providers/cloud/gcp/app-engine');

describe('AppEngineManager', () => {
  let appEngineManager;
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

    // Credenciais de teste
    const credentials = {
      type: 'service_account',
      project_id: 'test-project',
      private_key_id: 'key123',
      private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgk...\n-----END PRIVATE KEY-----\n',
      client_email: 'test@test-project.iam.gserviceaccount.com',
      client_id: '123456789',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test%40test-project.iam.gserviceaccount.com'
    };

    // Instanciar o gerenciador App Engine
    appEngineManager = new AppEngineManager({ 
      projectId: 'test-project', 
      credentials: credentials, 
      logger: mockLogger 
    });
  });

  describe('constructor', () => {
    it('deve lançar erro quando projectId não é fornecido', () => {
      expect(() => new AppEngineManager({ 
        credentials: {}, 
        logger: mockLogger 
      })).toThrow('O ID do projeto GCP é obrigatório');
    });

    it('deve lançar erro quando credentials não são fornecidas', () => {
      expect(() => new AppEngineManager({ 
        projectId: 'test-project', 
        logger: mockLogger 
      })).toThrow('As credenciais GCP são obrigatórias');
    });

    it('deve criar uma instância válida com opções corretas', () => {
      expect(appEngineManager).toBeInstanceOf(AppEngineManager);
      expect(appEngineManager.projectId).toBe('test-project');
      expect(appEngineManager.logger).toBe(mockLogger);
    });
  });

  describe('listApplications', () => {
    it('deve listar aplicações App Engine corretamente', async () => {
      // Executar o método
      const result = await appEngineManager.listApplications();

      // Verificar resultado
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
      
      // Verificar a primeira aplicação
      const app = result[0];
      expect(app).toHaveProperty('name', `apps/test-project`);
      expect(app).toHaveProperty('id', 'test-project');
      expect(app).toHaveProperty('servingStatus', 'SERVING');
      expect(app).toHaveProperty('defaultHostname', `test-project.appspot.com`);
      
      expect(mockLogger.info).toHaveBeenCalledWith(`Listando aplicações App Engine para o projeto test-project`);
    });

    it('deve lidar com erros corretamente', async () => {
      // Sobrescrever o método para gerar um erro
      appEngineManager.logger.info = jest.fn().mockImplementation(() => {
        throw new Error('API Error');
      });

      // Executar método e verificar que o erro é propagado
      await expect(appEngineManager.listApplications()).rejects.toThrow('API Error');
      expect(mockLogger.error).toHaveBeenCalledWith(`Erro ao listar aplicações App Engine: API Error`);
    });
  });

  describe('deployApplication', () => {
    it('deve lançar erro para opções incompletas', async () => {
      // Sem source
      await expect(appEngineManager.deployApplication({
        runtime: 'php81'
      })).rejects.toThrow('Caminho para o código-fonte é obrigatório');

      // Sem runtime
      await expect(appEngineManager.deployApplication({
        source: './app'
      })).rejects.toThrow('Runtime PHP é obrigatório');

      // Runtime inválido
      await expect(appEngineManager.deployApplication({
        source: './app',
        runtime: 'php83' // não está na lista de válidos
      })).rejects.toThrow(/Runtime inválido/);
    });

    it('deve implantar aplicação corretamente', async () => {
      // Opções de implantação
      const options = {
        source: './app',
        runtime: 'php81',
        service: 'default',
        version: 'v1'
      };

      // Executar o método
      const result = await appEngineManager.deployApplication(options);

      // Verificar resultado
      expect(result).toHaveProperty('name', `apps/test-project/services/default/versions/v1`);
      expect(result).toHaveProperty('id', 'v1');
      expect(result).toHaveProperty('serviceId', 'default');
      expect(result).toHaveProperty('runtime', 'php81');
      expect(result).toHaveProperty('env', 'standard');
      expect(result).toHaveProperty('servingStatus', 'SERVING');
      expect(result).toHaveProperty('versionUrl');
      
      expect(mockLogger.info).toHaveBeenCalledWith(`Implantando aplicação App Engine no projeto test-project`);
    });
  });

  describe('getVersions', () => {
    it('deve obter versões de um serviço', async () => {
      // Executar o método
      const result = await appEngineManager.getVersions('default');

      // Verificar resultado
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Verificar a primeira versão
      const version = result[0];
      expect(version).toHaveProperty('name', expect.stringContaining('apps/test-project/services/default/versions/'));
      expect(version).toHaveProperty('id');
      expect(version).toHaveProperty('serviceId', 'default');
      expect(version).toHaveProperty('runtime');
      expect(version).toHaveProperty('servingStatus');
      
      expect(mockLogger.info).toHaveBeenCalledWith(`Obtendo versões do serviço default no projeto test-project`);
    });
  });

  describe('migrateTraffic', () => {
    it('deve validar o valor do split', async () => {
      // Valor de split inválido (fora do intervalo 0-100)
      await expect(appEngineManager.migrateTraffic('default', 'v1', -10))
        .rejects.toThrow('A porcentagem do tráfego deve estar entre 0 e 100');
      
      await expect(appEngineManager.migrateTraffic('default', 'v1', 110))
        .rejects.toThrow('A porcentagem do tráfego deve estar entre 0 e 100');
    });

    it('deve migrar tráfego corretamente', async () => {
      // Executar o método
      const result = await appEngineManager.migrateTraffic('default', 'v1', 75);

      // Verificar resultado
      expect(result).toHaveProperty('name', `apps/test-project/services/default`);
      expect(result).toHaveProperty('id', 'default');
      expect(result).toHaveProperty('split');
      expect(result.split).toHaveProperty('allocations');
      expect(result.split.allocations).toHaveProperty('v1', 0.75); // 75% convertido para 0.75
      
      expect(mockLogger.info).toHaveBeenCalledWith(`Migrando 75% do tráfego do serviço default para a versão v1`);
    });
  });

  describe('startVersion', () => {
    it('deve iniciar uma versão', async () => {
      // Executar o método
      const result = await appEngineManager.startVersion('default', 'v1');

      // Verificar resultado
      expect(result).toHaveProperty('name', `apps/test-project/services/default/versions/v1`);
      expect(result).toHaveProperty('id', 'v1');
      expect(result).toHaveProperty('serviceId', 'default');
      expect(result).toHaveProperty('servingStatus', 'SERVING');
      
      expect(mockLogger.info).toHaveBeenCalledWith(`Iniciando versão v1 do serviço default`);
    });
  });

  describe('stopVersion', () => {
    it('deve parar uma versão', async () => {
      // Executar o método
      const result = await appEngineManager.stopVersion('default', 'v1');

      // Verificar resultado
      expect(result).toHaveProperty('name', `apps/test-project/services/default/versions/v1`);
      expect(result).toHaveProperty('id', 'v1');
      expect(result).toHaveProperty('serviceId', 'default');
      expect(result).toHaveProperty('servingStatus', 'STOPPED');
      
      expect(mockLogger.info).toHaveBeenCalledWith(`Parando versão v1 do serviço default`);
    });
  });

  describe('deleteVersion', () => {
    it('deve excluir uma versão', async () => {
      // Executar o método
      const result = await appEngineManager.deleteVersion('default', 'v1');

      // Verificar resultado
      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(`Excluindo versão v1 do serviço default`);
    });
  });

  describe('getLogs', () => {
    it('deve obter logs com opções padrão', async () => {
      // Executar o método
      const result = await appEngineManager.getLogs();

      // Verificar resultado
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(100); // Valor padrão do limit
      
      // Verificar formato dos logs
      const log = result[0];
      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('severity');
      expect(log).toHaveProperty('service');
      expect(log).toHaveProperty('message');
      
      // Verificar ordenação (mais recente primeiro)
      const timestamps = result.map(log => new Date(log.timestamp).getTime());
      expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
      
      expect(mockLogger.info).toHaveBeenCalledWith(`Obtendo logs`);
    });

    it('deve obter logs com filtros específicos', async () => {
      // Executar o método com opções
      const options = {
        serviceId: 'my-service',
        versionId: 'v2',
        limit: 50
      };
      
      const result = await appEngineManager.getLogs(options);

      // Verificar resultado
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(50);
      
      expect(mockLogger.info).toHaveBeenCalledWith(`Obtendo logs do serviço my-service da versão v2`);
    });
  });

  describe('getMetrics', () => {
    it('deve validar o tipo de métrica', async () => {
      // Tipo de métrica inválido
      await expect(appEngineManager.getMetrics('default', 'INVALID'))
        .rejects.toThrow('Tipo de métrica inválido');
    });

    it('deve obter métricas com formato correto', async () => {
      // Tipos de métricas válidos
      const metricTypes = ['CPU', 'MEMORY', 'INSTANCES', 'LATENCY'];
      
      // Testar cada tipo
      for (const metricType of metricTypes) {
        // Executar o método
        const result = await appEngineManager.getMetrics('default', metricType);

        // Verificar resultado
        expect(result).toHaveProperty('metricType', metricType);
        expect(result).toHaveProperty('serviceId', 'default');
        expect(result).toHaveProperty('unit');
        expect(result).toHaveProperty('points');
        expect(Array.isArray(result.points)).toBe(true);
        expect(result.points.length).toBe(24); // 24 pontos (horas)
        
        // Verificar formato de cada ponto
        result.points.forEach(point => {
          expect(point).toHaveProperty('timestamp');
          expect(point).toHaveProperty('value');
        });
        
        expect(mockLogger.info).toHaveBeenCalledWith(`Obtendo métricas ${metricType} do serviço default`);
      }
    });
  });
});
