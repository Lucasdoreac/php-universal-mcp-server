/**
 * Cloud Storage Manager Integration Tests
 * 
 * @jest-environment node
 */

const CloudStorageManager = require('../../../../providers/cloud/gcp/cloud-storage');

describe('CloudStorageManager', () => {
  let storageManager;
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

    // Instanciar o gerenciador Cloud Storage
    storageManager = new CloudStorageManager({ 
      projectId: 'test-project', 
      credentials: credentials, 
      logger: mockLogger 
    });
  });

  describe('constructor', () => {
    it('deve lançar erro quando projectId não é fornecido', () => {
      expect(() => new CloudStorageManager({ 
        credentials: {}, 
        logger: mockLogger 
      })).toThrow('O ID do projeto GCP é obrigatório');
    });

    it('deve lançar erro quando credentials não são fornecidas', () => {
      expect(() => new CloudStorageManager({ 
        projectId: 'test-project', 
        logger: mockLogger 
      })).toThrow('As credenciais GCP são obrigatórias');
    });

    it('deve criar uma instância válida com opções corretas', () => {
      expect(storageManager).toBeInstanceOf(CloudStorageManager);
      expect(storageManager.projectId).toBe('test-project');
      expect(storageManager.logger).toBe(mockLogger);
    });
  });

  describe('listBuckets', () => {
    it('deve listar buckets corretamente', async () => {
      // Executar o método
      const result = await storageManager.listBuckets();

      // Verificar resultado
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      
      // Verificar propriedades do primeiro bucket
      const bucket = result[0];
      expect(bucket).toHaveProperty('name', 'test-project-assets');
      expect(bucket).toHaveProperty('location');
      expect(bucket).toHaveProperty('storageClass');
      expect(bucket).toHaveProperty('timeCreated');
      expect(bucket).toHaveProperty('updated');
      expect(bucket).toHaveProperty('iamConfiguration');
      expect(bucket).toHaveProperty('lifecycle');
      expect(bucket).toHaveProperty('labels');
      
      expect(mockLogger.info).toHaveBeenCalledWith('Listando buckets do projeto test-project');
    });

    it('deve lidar com erros corretamente', async () => {
      // Sobrescrever o método para gerar um erro
      mockLogger.info = jest.fn().mockImplementation(() => {
        throw new Error('API Error');
      });

      // Executar método e verificar que o erro é propagado
      await expect(storageManager.listBuckets()).rejects.toThrow('API Error');
      expect(mockLogger.error).toHaveBeenCalledWith('Erro ao listar buckets: API Error');
    });
  });

  describe('createBucket', () => {
    it('deve rejeitar quando o nome não é fornecido', async () => {
      await expect(storageManager.createBucket({}))
        .rejects.toThrow('Nome do bucket é obrigatório');
    });

    it('deve criar bucket com opções padrão', async () => {
      // Opções mínimas
      const options = {
        name: 'new-test-bucket'
      };

      // Executar o método
      const result = await storageManager.createBucket(options);

      // Verificar resultado
      expect(result).toHaveProperty('name', 'new-test-bucket');
      expect(result).toHaveProperty('location', 'us-central1'); // valor padrão
      expect(result).toHaveProperty('storageClass', 'STANDARD'); // valor padrão
      expect(result).toHaveProperty('timeCreated');
      expect(result).toHaveProperty('updated');
      
      expect(mockLogger.info).toHaveBeenCalledWith('Criando bucket new-test-bucket na localização us-central1');
    });

    it('deve criar bucket com opções personalizadas', async () => {
      // Opções completas
      const options = {
        name: 'new-test-bucket',
        location: 'europe-west1',
        storageClass: 'NEARLINE',
        labels: {
          environment: 'test',
          purpose: 'testing'
        }
      };

      // Executar o método
      const result = await storageManager.createBucket(options);

      // Verificar resultado
      expect(result).toHaveProperty('name', 'new-test-bucket');
      expect(result).toHaveProperty('location', 'europe-west1');
      expect(result).toHaveProperty('storageClass', 'NEARLINE');
      expect(result).toHaveProperty('labels.environment', 'test');
      expect(result).toHaveProperty('labels.purpose', 'testing');
      
      expect(mockLogger.info).toHaveBeenCalledWith('Criando bucket new-test-bucket na localização europe-west1');
    });
  });

  describe('listObjects', () => {
    it('deve listar objetos com opções padrão', async () => {
      // Executar o método
      const result = await storageManager.listObjects('test-bucket');

      // Verificar resultado
      expect(result).toHaveProperty('objects');
      expect(Array.isArray(result.objects)).toBe(true);
      expect(result.objects.length).toBe(10); // 10 objetos fictícios
      
      // Verificar propriedades de um objeto
      const object = result.objects[0];
      expect(object).toHaveProperty('name');
      expect(object).toHaveProperty('bucket', 'test-bucket');
      expect(object).toHaveProperty('contentType');
      expect(object).toHaveProperty('size');
      expect(object).toHaveProperty('timeCreated');
      
      expect(mockLogger.info).toHaveBeenCalledWith('Listando objetos do bucket test-bucket');
    });

    it('deve listar objetos com prefixo', async () => {
      // Executar o método com prefixo
      const result = await storageManager.listObjects('test-bucket', { 
        prefix: 'folder/' 
      });

      // Verificar resultado
      expect(result.objects[0].name).toMatch(/^folder\//);
      
      expect(mockLogger.info).toHaveBeenCalledWith('Listando objetos do bucket test-bucket com prefixo folder/');
    });

    it('deve retornar prefixos quando delimiter é fornecido', async () => {
      // Executar o método com delimiter
      const result = await storageManager.listObjects('test-bucket', { 
        delimiter: '/' 
      });

      // Verificar resultado
      expect(result).toHaveProperty('prefixes');
      expect(Array.isArray(result.prefixes)).toBe(true);
      expect(result.prefixes.length).toBeGreaterThan(0);
      expect(result.prefixes[0]).toHaveProperty('prefix');
    });
  });

  describe('uploadFile', () => {
    it('deve validar parâmetros obrigatórios', async () => {
      // Sem bucket
      await expect(storageManager.uploadFile(null, 'destination.txt', 'content'))
        .rejects.toThrow('Nome do bucket é obrigatório');
      
      // Sem destination
      await expect(storageManager.uploadFile('test-bucket', null, 'content'))
        .rejects.toThrow('Caminho de destino é obrigatório');
      
      // Sem source
      await expect(storageManager.uploadFile('test-bucket', 'destination.txt', null))
        .rejects.toThrow('Fonte do arquivo é obrigatória');
    });

    it('deve fazer upload de string corretamente', async () => {
      // Parâmetros
      const bucketName = 'test-bucket';
      const destination = 'folder/file.txt';
      const content = 'Hello World!';
      const options = {
        contentType: 'text/plain',
        metadata: {
          custom: 'value'
        }
      };

      // Executar o método
      const result = await storageManager.uploadFile(bucketName, destination, content, options);

      // Verificar resultado
      expect(result).toHaveProperty('name', destination);
      expect(result).toHaveProperty('bucket', bucketName);
      expect(result).toHaveProperty('contentType', 'text/plain');
      expect(result).toHaveProperty('size', 12); // 'Hello World!'.length
      expect(result).toHaveProperty('timeCreated');
      expect(result).toHaveProperty('updated');
      expect(result).toHaveProperty('metadata.custom', 'value');
      
      expect(mockLogger.info).toHaveBeenCalledWith(`Fazendo upload para ${bucketName}/${destination}`);
    });

    it('deve fazer upload de Buffer corretamente', async () => {
      // Parâmetros
      const bucketName = 'test-bucket';
      const destination = 'folder/file.bin';
      const content = Buffer.from([0x01, 0x02, 0x03, 0x04]);
      const options = {
        contentType: 'application/octet-stream'
      };

      // Executar o método
      const result = await storageManager.uploadFile(bucketName, destination, content, options);

      // Verificar resultado
      expect(result).toHaveProperty('size', 4); // Buffer.length
      expect(result).toHaveProperty('contentType', 'application/octet-stream');
    });

    it('deve usar contentType padrão quando não fornecido', async () => {
      // Executar o método sem contentType
      const result = await storageManager.uploadFile('test-bucket', 'file.txt', 'content');

      // Verificar resultado
      expect(result).toHaveProperty('contentType', 'application/octet-stream');
    });
  });

  describe('getFile', () => {
    it('deve validar parâmetros obrigatórios', async () => {
      // Sem bucket
      await expect(storageManager.getFile(null, 'file.txt'))
        .rejects.toThrow('Nome do bucket é obrigatório');
      
      // Sem fileName
      await expect(storageManager.getFile('test-bucket', null))
        .rejects.toThrow('Nome do arquivo é obrigatório');
    });

    it('deve obter arquivo corretamente', async () => {
      // Parâmetros
      const bucketName = 'test-bucket';
      const fileName = 'folder/file.txt';

      // Executar o método
      const result = await storageManager.getFile(bucketName, fileName);

      // Verificar resultado
      expect(result).toHaveProperty('name', fileName);
      expect(result).toHaveProperty('bucket', bucketName);
      expect(result).toHaveProperty('contentType');
      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('timeCreated');
      expect(result).toHaveProperty('updated');
      expect(result).toHaveProperty('contents');
      expect(Buffer.isBuffer(result.contents)).toBe(true);
      
      expect(mockLogger.info).toHaveBeenCalledWith(`Obtendo arquivo ${bucketName}/${fileName}`);
    });
  });

  describe('deleteFile', () => {
    it('deve validar parâmetros obrigatórios', async () => {
      // Sem bucket
      await expect(storageManager.deleteFile(null, 'file.txt'))
        .rejects.toThrow('Nome do bucket é obrigatório');
      
      // Sem fileName
      await expect(storageManager.deleteFile('test-bucket', null))
        .rejects.toThrow('Nome do arquivo é obrigatório');
    });

    it('deve excluir arquivo corretamente', async () => {
      // Parâmetros
      const bucketName = 'test-bucket';
      const fileName = 'folder/file.txt';

      // Executar o método
      const result = await storageManager.deleteFile(bucketName, fileName);

      // Verificar resultado
      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(`Excluindo arquivo ${bucketName}/${fileName}`);
    });
  });

  describe('getMetrics', () => {
    it('deve retornar métricas formatadas corretamente', async () => {
      // Espiar método listBuckets
      const listBucketsSpy = jest.spyOn(storageManager, 'listBuckets');
      
      // Executar o método
      const result = await storageManager.getMetrics();

      // Verificar estrutura do resultado
      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('totalBuckets');
      expect(result.summary).toHaveProperty('totalStorage');
      expect(result.summary).toHaveProperty('totalObjects');
      expect(result.summary).toHaveProperty('averageObjectSize');
      
      expect(result).toHaveProperty('byRegion');
      expect(result).toHaveProperty('byStorageClass');
      expect(result).toHaveProperty('objectCounts');
      expect(result).toHaveProperty('storageUsed');
      
      // Verificar séries temporais
      expect(Array.isArray(result.objectCounts)).toBe(true);
      expect(result.objectCounts.length).toBe(31); // 31 dias
      expect(result.objectCounts[0]).toHaveProperty('date');
      expect(result.objectCounts[0]).toHaveProperty('count');
      
      expect(Array.isArray(result.storageUsed)).toBe(true);
      expect(result.storageUsed.length).toBe(31); // 31 dias
      expect(result.storageUsed[0]).toHaveProperty('date');
      expect(result.storageUsed[0]).toHaveProperty('sizeGB');
      
      // Verificar que listBuckets foi chamado
      expect(listBucketsSpy).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Obtendo métricas do Cloud Storage');
    });

    it('deve lidar com erros ao obter métricas', async () => {
      // Forçar um erro no método listBuckets
      jest.spyOn(storageManager, 'listBuckets').mockRejectedValueOnce(new Error('Failed to list buckets'));

      // Executar método e verificar erro
      await expect(storageManager.getMetrics())
        .rejects.toThrow('Failed to list buckets');
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro ao obter métricas do Cloud Storage: Failed to list buckets',
        expect.any(Error)
      );
    });
  });
});
