/**
 * Testes de integração para AWS S3 Manager
 * 
 * Para executar esses testes, é necessário configurar as credenciais AWS no ambiente
 * ou no arquivo de configuração de teste.
 * 
 * @jest-environment node
 */

const S3Manager = require('../../../providers/cloud/aws/s3');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Configurações para testes
let config = {
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
};

// Substitua por mock se estiver em modo de teste simulado
if (process.env.TEST_MODE === 'mock') {
  jest.mock('aws-sdk', () => {
    return {
      S3: jest.fn().mockImplementation(() => {
        return {
          listBuckets: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              Buckets: [
                { Name: 'test-bucket-1', CreationDate: new Date() },
                { Name: 'test-bucket-2', CreationDate: new Date() }
              ]
            })
          }),
          createBucket: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              Location: 'http://test-bucket.s3.amazonaws.com/'
            })
          }),
          deleteBucket: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({})
          }),
          listObjects: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              Contents: [
                { Key: 'test-file-1.txt', Size: 1024, LastModified: new Date() },
                { Key: 'test-file-2.jpg', Size: 2048, LastModified: new Date() }
              ],
              IsTruncated: false
            })
          }),
          upload: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              Location: 'https://test-bucket.s3.amazonaws.com/test-file.txt',
              ETag: '"d41d8cd98f00b204e9800998ecf8427e"'
            })
          }),
          getObject: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              Body: Buffer.from('test content'),
              ContentType: 'text/plain',
              LastModified: new Date(),
              Metadata: {},
              ETag: '"d41d8cd98f00b204e9800998ecf8427e"'
            })
          }),
          deleteObject: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({})
          }),
          putBucketWebsite: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({})
          }),
          putBucketPolicy: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({})
          }),
          getBucketLocation: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              LocationConstraint: 'us-east-1'
            })
          }),
          getBucketAcl: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              Owner: { ID: 'test-owner', DisplayName: 'Test Owner' },
              Grants: []
            })
          }),
          getBucketWebsite: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              IndexDocument: { Suffix: 'index.html' },
              ErrorDocument: { Key: 'error.html' }
            })
          }),
          getSignedUrl: jest.fn().mockReturnValue('https://test-bucket.s3.amazonaws.com/test-file.txt?signature=xyz')
        };
      })
    };
  });
}

// Gerar um nome de bucket único para testes
const testBucketName = `php-universal-mcp-test-${uuidv4().substring(0, 8).toLowerCase()}`;
let s3Manager;

beforeAll(() => {
  // Inicializar S3Manager antes de todos os testes
  s3Manager = new S3Manager(config, { useCache: true });
});

describe('AWS S3 Manager - Operações Básicas', () => {
  // Pular testes que requerem credenciais reais se estivermos no modo de mock
  const conditionalTest = process.env.TEST_MODE === 'mock' ? test : (process.env.AWS_ACCESS_KEY_ID ? test : test.skip);
  
  conditionalTest('Deve listar buckets corretamente', async () => {
    const buckets = await s3Manager.listBuckets();
    expect(Array.isArray(buckets)).toBe(true);
    if (buckets.length > 0) {
      expect(buckets[0]).toHaveProperty('Name');
      expect(buckets[0]).toHaveProperty('CreationDate');
    }
  });
  
  conditionalTest('Deve criar, obter informações e excluir um bucket', async () => {
    // Criar um bucket para teste
    const result = await s3Manager.createBucket(testBucketName);
    expect(result).toHaveProperty('bucket', testBucketName);
    expect(result).toHaveProperty('location');
    
    // Pequena pausa para garantir que o bucket foi criado corretamente
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Obter informações sobre o bucket
    const info = await s3Manager.getBucketInfo(testBucketName);
    expect(info).toHaveProperty('name', testBucketName);
    expect(info).toHaveProperty('region');
    
    // Excluir o bucket após o teste
    const deleteResult = await s3Manager.deleteBucket(testBucketName);
    expect(deleteResult).toBe(true);
  });
});

describe('AWS S3 Manager - Operações de Objetos', () => {
  const conditionalTest = process.env.TEST_MODE === 'mock' ? test : (process.env.AWS_ACCESS_KEY_ID ? test : test.skip);
  
  // Bucket para testes de objetos
  const objectTestBucketName = `php-universal-mcp-obj-${uuidv4().substring(0, 8).toLowerCase()}`;
  const testFileName = 'test-file.txt';
  const testFileContent = 'Este é um arquivo de teste para o PHP Universal MCP Server';
  
  // Criar arquivo temporário para testes
  const tempFilePath = path.join(__dirname, '../../temp', testFileName);
  
  beforeAll(async () => {
    // Criar diretório temp se não existir
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Criar arquivo de teste
    fs.writeFileSync(tempFilePath, testFileContent);
    
    // Criar bucket para testes se estiver em modo real
    if (process.env.TEST_MODE !== 'mock' && process.env.AWS_ACCESS_KEY_ID) {
      try {
        await s3Manager.createBucket(objectTestBucketName);
        // Pequena pausa para garantir que o bucket foi criado corretamente
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error('Erro ao criar bucket para testes:', error);
      }
    }
  });
  
  afterAll(async () => {
    // Limpar arquivo temporário
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    // Excluir bucket de teste se estiver em modo real
    if (process.env.TEST_MODE !== 'mock' && process.env.AWS_ACCESS_KEY_ID) {
      try {
        await s3Manager.emptyBucket(objectTestBucketName);
        await s3Manager.deleteBucket(objectTestBucketName);
      } catch (error) {
        console.error('Erro ao excluir bucket de teste:', error);
      }
    }
  });
  
  conditionalTest('Deve fazer upload e baixar um arquivo corretamente', async () => {
    // Fazer upload do arquivo a partir de string
    const uploadResult = await s3Manager.uploadFile(
      objectTestBucketName,
      testFileName,
      testFileContent,
      { contentType: 'text/plain', acl: 'private' }
    );
    
    expect(uploadResult).toHaveProperty('bucket', objectTestBucketName);
    expect(uploadResult).toHaveProperty('key', testFileName);
    expect(uploadResult).toHaveProperty('location');
    expect(uploadResult).toHaveProperty('etag');
    
    // Obter o arquivo
    const fileData = await s3Manager.getObject(objectTestBucketName, testFileName);
    expect(fileData).toHaveProperty('content');
    
    // Verificar conteúdo do arquivo
    const content = fileData.content.toString('utf-8');
    expect(content).toBe(testFileContent);
    
    // Verificar metadados
    expect(fileData).toHaveProperty('contentType', 'text/plain');
    expect(fileData).toHaveProperty('lastModified');
  });
  
  conditionalTest('Deve fazer upload a partir de um arquivo em disco', async () => {
    const fileKey = 'upload-from-disk.txt';
    
    // Fazer upload do arquivo a partir do caminho no disco
    const uploadResult = await s3Manager.uploadFile(
      objectTestBucketName,
      fileKey,
      tempFilePath
    );
    
    expect(uploadResult).toHaveProperty('bucket', objectTestBucketName);
    expect(uploadResult).toHaveProperty('key', fileKey);
    
    // Obter o arquivo para verificar se o upload foi bem-sucedido
    const fileData = await s3Manager.getObject(objectTestBucketName, fileKey);
    const content = fileData.content.toString('utf-8');
    expect(content).toBe(testFileContent);
  });
  
  conditionalTest('Deve listar objetos em um bucket', async () => {
    // Listar objetos no bucket
    const objects = await s3Manager.listObjects(objectTestBucketName);
    
    expect(Array.isArray(objects)).toBe(true);
    if (objects.length > 0) {
      expect(objects[0]).toHaveProperty('Key');
      expect(objects[0]).toHaveProperty('Size');
      expect(objects[0]).toHaveProperty('LastModified');
    }
  });
  
  conditionalTest('Deve excluir um objeto corretamente', async () => {
    const deleteResult = await s3Manager.deleteObject(objectTestBucketName, testFileName);
    expect(deleteResult).toBe(true);
    
    // Verificar se o objeto foi excluído
    try {
      await s3Manager.getObject(objectTestBucketName, testFileName);
      // Se não lançar erro, falha no teste
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toContain('Falha ao obter objeto');
    }
  });
});

describe('AWS S3 Manager - Configurações de Website', () => {
  const conditionalTest = process.env.TEST_MODE === 'mock' ? test : (process.env.AWS_ACCESS_KEY_ID ? test : test.skip);
  
  // Bucket para testes de website
  const websiteTestBucketName = `php-universal-mcp-web-${uuidv4().substring(0, 8).toLowerCase()}`;
  
  beforeAll(async () => {
    // Criar bucket para testes se estiver em modo real
    if (process.env.TEST_MODE !== 'mock' && process.env.AWS_ACCESS_KEY_ID) {
      try {
        await s3Manager.createBucket(websiteTestBucketName);
        // Pequena pausa para garantir que o bucket foi criado corretamente
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error('Erro ao criar bucket para testes de website:', error);
      }
    }
  });
  
  afterAll(async () => {
    // Excluir bucket de teste se estiver em modo real
    if (process.env.TEST_MODE !== 'mock' && process.env.AWS_ACCESS_KEY_ID) {
      try {
        await s3Manager.emptyBucket(websiteTestBucketName);
        await s3Manager.deleteBucket(websiteTestBucketName);
      } catch (error) {
        console.error('Erro ao excluir bucket de teste de website:', error);
      }
    }
  });
  
  conditionalTest('Deve configurar um bucket para hospedagem de website', async () => {
    const websiteConfig = {
      indexDocument: 'index.html',
      errorDocument: 'error.html'
    };
    
    const result = await s3Manager.configureWebsite(websiteTestBucketName, websiteConfig);
    
    expect(result).toHaveProperty('bucket', websiteTestBucketName);
    expect(result).toHaveProperty('websiteUrl');
    expect(result).toHaveProperty('indexDocument', 'index.html');
    expect(result).toHaveProperty('errorDocument', 'error.html');
  });
  
  conditionalTest('Deve configurar uma política de acesso público para website', async () => {
    // Política para acesso público de leitura para todo o bucket
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${websiteTestBucketName}/*`
        }
      ]
    };
    
    const result = await s3Manager.setBucketPolicy(websiteTestBucketName, policy);
    expect(result).toBe(true);
  });
});

describe('AWS S3 Manager - Cache e Otimização', () => {
  test('Deve utilizar cache para operações repetidas', async () => {
    // Criar um S3Manager com cache
    const cachedManager = new S3Manager(config, { useCache: true, cacheTTL: 60 });
    
    // Mock para o método listBuckets do S3
    const originalListBuckets = cachedManager.s3.listBuckets;
    let callCount = 0;
    
    cachedManager.s3.listBuckets = jest.fn().mockImplementation(() => {
      callCount++;
      return {
        promise: () => Promise.resolve({
          Buckets: [
            { Name: 'test-bucket-1', CreationDate: new Date() },
            { Name: 'test-bucket-2', CreationDate: new Date() }
          ]
        })
      };
    });
    
    // Primeira chamada - deve chamar o método real
    await cachedManager.listBuckets();
    expect(callCount).toBe(1);
    
    // Segunda chamada - deve usar o cache
    await cachedManager.listBuckets();
    expect(callCount).toBe(1); // Não deve ter incrementado
    
    // Restaurar o método original
    cachedManager.s3.listBuckets = originalListBuckets;
  });
  
  test('Deve invalidar cache ao modificar recursos', async () => {
    // Criar um S3Manager com cache
    const cachedManager = new S3Manager(config, { useCache: true, cacheTTL: 60 });
    
    // Mock e espias para os métodos
    const mockListObjects = jest.fn().mockReturnValue({
      promise: () => Promise.resolve({
        Contents: [{ Key: 'test.txt' }],
        IsTruncated: false
      })
    });
    
    const mockUpload = jest.fn().mockReturnValue({
      promise: () => Promise.resolve({
        Location: 'http://test-bucket.s3.amazonaws.com/new-file.txt',
        ETag: 'test-etag'
      })
    });
    
    const spyGetCache = jest.spyOn(cachedManager.cache, 'get');
    const spySetCache = jest.spyOn(cachedManager.cache, 'set');
    const spyDelCache = jest.spyOn(cachedManager.cache, 'del');
    
    // Substituir métodos por mocks
    cachedManager.s3.listObjects = mockListObjects;
    cachedManager.s3.upload = mockUpload;
    
    // Primeira listagem - deve armazenar em cache
    await cachedManager.listObjects('test-bucket');
    expect(mockListObjects).toHaveBeenCalledTimes(1);
    expect(spySetCache).toHaveBeenCalled();
    
    // Upload de arquivo - deve invalidar cache
    await cachedManager.uploadFile('test-bucket', 'new-file.txt', 'test content');
    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(spyDelCache).toHaveBeenCalledWith('bucket-test-bucket-objects');
    
    // Restaurar spies
    spyGetCache.mockRestore();
    spySetCache.mockRestore();
    spyDelCache.mockRestore();
  });
});

// Se for mock, podemos testar o gerenciamento de erros
if (process.env.TEST_MODE === 'mock') {
  describe('AWS S3 Manager - Tratamento de Erros', () => {
    test('Deve tratar erros de criação de bucket corretamente', async () => {
      // Sobrescrever método para simular erro
      const originalCreateBucket = s3Manager.s3.createBucket;
      s3Manager.s3.createBucket = jest.fn().mockReturnValue({
        promise: () => Promise.reject(new Error('BucketAlreadyExists'))
      });
      
      // Testar tratamento de erro
      await expect(s3Manager.createBucket('existing-bucket')).rejects.toThrow('Falha ao criar bucket');
      
      // Restaurar método original
      s3Manager.s3.createBucket = originalCreateBucket;
    });
    
    test('Deve tratar erros de acesso a objetos inexistentes', async () => {
      // Sobrescrever método para simular erro
      const originalGetObject = s3Manager.s3.getObject;
      s3Manager.s3.getObject = jest.fn().mockReturnValue({
        promise: () => Promise.reject(new Error('NoSuchKey'))
      });
      
      // Testar tratamento de erro
      await expect(s3Manager.getObject('test-bucket', 'non-existent-key')).rejects.toThrow('Falha ao obter objeto');
      
      // Restaurar método original
      s3Manager.s3.getObject = originalGetObject;
    });
  });
}