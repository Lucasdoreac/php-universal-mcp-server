/**
 * AWSProvider Integration Tests
 * 
 * @jest-environment node
 */

const AWS = require('aws-sdk');
const AWSProvider = require('../../../../providers/cloud/aws/index');
const EC2Manager = require('../../../../providers/cloud/aws/ec2');

// Mock para AWS
jest.mock('aws-sdk', () => ({
  config: {
    update: jest.fn()
  },
  Credentials: jest.fn(),
  EC2: jest.fn()
}));

// Mock para os gerenciadores de serviços
jest.mock('../../../../providers/cloud/aws/ec2', () => {
  return jest.fn().mockImplementation(() => ({
    listInstances: jest.fn().mockResolvedValue([]),
    createInstance: jest.fn().mockResolvedValue({}),
    controlInstance: jest.fn().mockResolvedValue({}),
    getMetrics: jest.fn().mockResolvedValue({})
  }));
});

describe('AWSProvider', () => {
  let awsProvider;
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

    // Instanciar o provedor AWS
    awsProvider = new AWSProvider({ 
      logger: mockLogger 
    });
  });

  describe('constructor', () => {
    it('deve criar uma instância com as opções padrão', () => {
      expect(awsProvider).toBeInstanceOf(AWSProvider);
      expect(awsProvider.options.region).toBe('us-east-1');
      expect(awsProvider.options.apiVersion).toBe('latest');
      expect(awsProvider.initialized).toBe(false);
      expect(awsProvider.logger).toBe(mockLogger);
    });

    it('deve substituir opções padrão quando fornecidas', () => {
      const customOptions = {
        region: 'eu-west-1',
        apiVersion: '2019-01-01',
        logger: mockLogger
      };

      const customAwsProvider = new AWSProvider(customOptions);
      expect(customAwsProvider.options.region).toBe('eu-west-1');
      expect(customAwsProvider.options.apiVersion).toBe('2019-01-01');
    });
  });

  describe('initialize', () => {
    it('deve inicializar o provider corretamente', async () => {
      // Credenciais de teste
      const credentials = {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        sessionToken: 'session-token'
      };

      // Executar o método
      const result = await awsProvider.initialize(credentials);

      // Verificar resultado
      expect(result).toBe(true);
      expect(awsProvider.initialized).toBe(true);
      expect(awsProvider.credentials).toBe(credentials);

      // Verificar inicialização da AWS
      expect(AWS.config.update).toHaveBeenCalledWith({
        credentials: expect.any(AWS.Credentials),
        region: 'us-east-1'
      });
      expect(AWS.Credentials).toHaveBeenCalledWith({
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        sessionToken: 'session-token'
      });
      
      // Verificar inicialização dos gerenciadores de serviços
      expect(EC2Manager).toHaveBeenCalledWith({ 
        aws: AWS, 
        logger: mockLogger 
      });
      
      expect(mockLogger.info).toHaveBeenCalledWith('Inicializando AWS Provider');
      expect(mockLogger.info).toHaveBeenCalledWith('AWS Provider inicializado com sucesso');
    });

    it('deve lidar com erros durante a inicialização', async () => {
      // Forçar um erro
      AWS.Credentials.mockImplementationOnce(() => {
        throw new Error('Invalid credentials');
      });

      // Credenciais de teste
      const credentials = {
        accessKeyId: 'invalid',
        secretAccessKey: 'invalid'
      };

      // Executar o método e verificar que o erro é propagado
      await expect(awsProvider.initialize(credentials)).rejects.toThrow('Invalid credentials');
      expect(mockLogger.error).toHaveBeenCalledWith('Erro ao inicializar AWS Provider:', expect.any(Error));
      expect(awsProvider.initialized).toBe(false);
    });
  });

  describe('_checkInitialized', () => {
    it('deve lançar erro quando o provider não está inicializado', () => {
      expect(() => awsProvider._checkInitialized())
        .toThrow('AWS Provider não está inicializado. Chame initialize() primeiro.');
    });

    it('não deve lançar erro quando o provider está inicializado', async () => {
      awsProvider.initialized = true;
      expect(() => awsProvider._checkInitialized()).not.toThrow();
    });
  });

  describe('métodos do EC2', () => {
    beforeEach(async () => {
      // Inicializar o provider para os testes
      awsProvider.initialized = true;
      awsProvider.ec2 = new EC2Manager({ aws: AWS, logger: mockLogger });
    });

    it('listInstances deve chamar o método correspondente do EC2Manager', async () => {
      await awsProvider.listInstances();
      expect(awsProvider.ec2.listInstances).toHaveBeenCalled();
    });

    it('createInstance deve chamar o método correspondente do EC2Manager', async () => {
      const options = { imageId: 'ami-12345', instanceType: 't2.micro' };
      await awsProvider.createInstance(options);
      expect(awsProvider.ec2.createInstance).toHaveBeenCalledWith(options);
    });

    it('controlInstance deve chamar o método correspondente do EC2Manager', async () => {
      await awsProvider.controlInstance('i-12345', 'start');
      expect(awsProvider.ec2.controlInstance).toHaveBeenCalledWith('i-12345', 'start');
    });
  });

  describe('usageMetrics', () => {
    beforeEach(async () => {
      // Inicializar o provider para os testes
      awsProvider.initialized = true;
      
      // Mock para os gerenciadores de serviço
      awsProvider.ec2 = { getMetrics: jest.fn().mockResolvedValue({}) };
      awsProvider.s3 = { getMetrics: jest.fn().mockResolvedValue({}) };
      awsProvider.rds = { getMetrics: jest.fn().mockResolvedValue({}) };
      awsProvider.lambda = { getMetrics: jest.fn().mockResolvedValue({}) };
      awsProvider.cloudfront = { getMetrics: jest.fn().mockResolvedValue({}) };
    });

    it('deve obter métricas do serviço apropriado', async () => {
      await awsProvider.getUsageMetrics('ec2', { period: '1d' });
      expect(awsProvider.ec2.getMetrics).toHaveBeenCalledWith({ period: '1d' });
      
      await awsProvider.getUsageMetrics('s3', { period: '1d' });
      expect(awsProvider.s3.getMetrics).toHaveBeenCalledWith({ period: '1d' });
      
      await awsProvider.getUsageMetrics('rds', { period: '1d' });
      expect(awsProvider.rds.getMetrics).toHaveBeenCalledWith({ period: '1d' });
      
      await awsProvider.getUsageMetrics('lambda', { period: '1d' });
      expect(awsProvider.lambda.getMetrics).toHaveBeenCalledWith({ period: '1d' });
      
      await awsProvider.getUsageMetrics('cloudfront', { period: '1d' });
      expect(awsProvider.cloudfront.getMetrics).toHaveBeenCalledWith({ period: '1d' });
    });

    it('deve lançar erro para serviço não suportado', async () => {
      await expect(awsProvider.getUsageMetrics('unsupported', {}))
        .rejects.toThrow('Serviço não suportado: unsupported');
    });
  });

  describe('switchRegion', () => {
    beforeEach(async () => {
      // Inicializar o provider para os testes
      awsProvider.initialized = true;
    });

    it('deve alterar a região corretamente', async () => {
      // Limpar mocks
      jest.clearAllMocks();
      
      // Executar o método
      const result = await awsProvider.switchRegion('eu-central-1');

      // Verificar resultado
      expect(result).toBe(true);
      expect(awsProvider.options.region).toBe('eu-central-1');
      
      // Verificar atualização da configuração AWS
      expect(AWS.config.update).toHaveBeenCalledWith({ region: 'eu-central-1' });
      
      // Verificar reinicialização dos gerenciadores de serviço
      expect(EC2Manager).toHaveBeenCalled();
      
      expect(mockLogger.info).toHaveBeenCalledWith('Região alterada para eu-central-1');
    });

    it('deve lançar erro se houver problema na troca de região', async () => {
      // Forçar um erro
      AWS.config.update.mockImplementationOnce(() => {
        throw new Error('Region change failed');
      });

      // Executar o método e verificar que o erro é propagado
      await expect(awsProvider.switchRegion('invalid-region')).rejects.toThrow('Region change failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Erro ao alterar região para invalid-region:', expect.any(Error));
    });
  });

  describe('getPhpEnvironmentInfo', () => {
    beforeEach(async () => {
      // Inicializar o provider para os testes
      awsProvider.initialized = true;
    });

    it('deve retornar informações do ambiente PHP', async () => {
      // Executar o método
      const result = await awsProvider.getPhpEnvironmentInfo();

      // Verificar resultado
      expect(result).toHaveProperty('ec2Instances');
      expect(result).toHaveProperty('elasticBeanstalk');
      expect(result).toHaveProperty('lambda');
      expect(result).toHaveProperty('lightsail');
      
      expect(result.ec2Instances).toHaveProperty('phpVersions');
      expect(result.ec2Instances.phpVersions).toContain('8.0');
      expect(result.ec2Instances.phpVersions).toContain('8.1');
      
      expect(result.elasticBeanstalk).toHaveProperty('platforms');
      expect(result.lambda).toHaveProperty('phpLayers');
      expect(result.lightsail).toHaveProperty('phpBlueprints');
    });
  });
});
