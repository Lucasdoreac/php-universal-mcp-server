/**
 * AWS S3 Manager
 * 
 * Gerencia operações de armazenamento de objetos usando o AWS S3.
 * Permite criação de buckets, upload/download de arquivos, gerenciamento de permissões,
 * configuração de websites estáticos e muito mais.
 * 
 * @module providers/cloud/aws/s3
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const Logger = require('../../../core/utils/logger');
const Cache = require('../../../core/utils/cache');

class S3Manager {
  /**
   * Inicializa o S3 Manager com configurações AWS
   * 
   * @param {Object} config Configuração de credenciais AWS
   * @param {string} config.region Região AWS
   * @param {string} config.accessKeyId Access Key
   * @param {string} config.secretAccessKey Secret Key
   * @param {Object} options Opções adicionais
   * @param {boolean} options.useCache Habilita cache para operações frequentes
   * @param {number} options.cacheTTL Tempo de vida do cache em segundos
   */
  constructor(config, options = {}) {
    this.config = config;
    this.s3 = new AWS.S3({
      region: config.region,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    });
    
    this.logger = new Logger('AWS-S3');
    this.useCache = options.useCache || false;
    
    if (this.useCache) {
      this.cache = new Cache({
        ttl: options.cacheTTL || 300, // 5 minutos padrão
        namespace: 'aws-s3'
      });
    }
  }

  /**
   * Lista todos os buckets da conta
   * 
   * @returns {Promise<Array>} Lista de buckets
   */
  async listBuckets() {
    try {
      if (this.useCache) {
        const cachedBuckets = this.cache.get('all-buckets');
        if (cachedBuckets) return cachedBuckets;
      }

      const data = await this.s3.listBuckets().promise();
      
      if (this.useCache) {
        this.cache.set('all-buckets', data.Buckets);
      }
      
      return data.Buckets;
    } catch (error) {
      this.logger.error('Erro ao listar buckets', error);
      throw new Error(`Falha ao listar buckets: ${error.message}`);
    }
  }

  /**
   * Cria um novo bucket S3
   * 
   * @param {string} bucketName Nome do bucket
   * @param {Object} options Opções para criação do bucket
   * @param {string} options.acl Controle de acesso (private, public-read, etc)
   * @param {string} options.region Região AWS para o bucket
   * @returns {Promise<Object>} Informações do bucket criado
   */
  async createBucket(bucketName, options = {}) {
    try {
      const params = {
        Bucket: bucketName,
        ACL: options.acl || 'private'
      };
      
      // Adiciona configuração de região se especificada
      if (options.region && options.region !== this.config.region) {
        params.CreateBucketConfiguration = {
          LocationConstraint: options.region
        };
      }
      
      const result = await this.s3.createBucket(params).promise();
      
      // Invalidar cache se estiver sendo usado
      if (this.useCache) {
        this.cache.del('all-buckets');
      }
      
      this.logger.info(`Bucket criado: ${bucketName}`);
      return {
        bucket: bucketName,
        location: result.Location,
        region: options.region || this.config.region,
        created: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Erro ao criar bucket ${bucketName}`, error);
      throw new Error(`Falha ao criar bucket: ${error.message}`);
    }
  }

  /**
   * Exclui um bucket S3
   * 
   * @param {string} bucketName Nome do bucket
   * @param {boolean} force Se verdadeiro, primeiro remove todos os objetos
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async deleteBucket(bucketName, force = false) {
    try {
      // Se force=true, exclui todos os objetos primeiro
      if (force) {
        await this.emptyBucket(bucketName);
      }
      
      await this.s3.deleteBucket({ Bucket: bucketName }).promise();
      
      // Invalidar cache se estiver sendo usado
      if (this.useCache) {
        this.cache.del('all-buckets');
        this.cache.del(`bucket-${bucketName}`);
      }
      
      this.logger.info(`Bucket excluído: ${bucketName}`);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao excluir bucket ${bucketName}`, error);
      throw new Error(`Falha ao excluir bucket: ${error.message}`);
    }
  }

  /**
   * Remove todos os objetos de um bucket
   * 
   * @param {string} bucketName Nome do bucket
   * @returns {Promise<Object>} Resultado da operação
   */
  async emptyBucket(bucketName) {
    try {
      // Listagem de objetos pode ser paginada, então precisamos processar todas as páginas
      let isTruncated = true;
      let marker;
      
      while (isTruncated) {
        const params = { Bucket: bucketName };
        if (marker) params.Marker = marker;
        
        const data = await this.s3.listObjects(params).promise();
        
        // Se não tem objetos, termina o loop
        if (data.Contents.length === 0) break;
        
        // Configura parâmetros para deleção em massa
        const deleteParams = {
          Bucket: bucketName,
          Delete: { Objects: [] }
        };
        
        // Adiciona objetos para deleção
        data.Contents.forEach(({ Key }) => {
          deleteParams.Delete.Objects.push({ Key });
        });
        
        // Executa deleção em massa
        await this.s3.deleteObjects(deleteParams).promise();
        
        // Verifica se há mais objetos
        isTruncated = data.IsTruncated;
        if (isTruncated) {
          marker = data.Contents.slice(-1)[0].Key;
        }
      }
      
      // Invalidar cache
      if (this.useCache) {
        this.cache.del(`bucket-${bucketName}-objects`);
      }
      
      this.logger.info(`Bucket esvaziado: ${bucketName}`);
      return { success: true, bucket: bucketName };
    } catch (error) {
      this.logger.error(`Erro ao esvaziar bucket ${bucketName}`, error);
      throw new Error(`Falha ao esvaziar bucket: ${error.message}`);
    }
  }

  /**
   * Lista objetos em um bucket S3
   * 
   * @param {string} bucketName Nome do bucket
   * @param {Object} options Opções de listagem
   * @param {string} options.prefix Prefixo para filtrar objetos
   * @param {number} options.maxKeys Número máximo de objetos a retornar
   * @returns {Promise<Array>} Lista de objetos
   */
  async listObjects(bucketName, options = {}) {
    try {
      const cacheKey = `bucket-${bucketName}-objects${options.prefix ? '-' + options.prefix : ''}`;
      
      if (this.useCache) {
        const cachedObjects = this.cache.get(cacheKey);
        if (cachedObjects) return cachedObjects;
      }
      
      const params = {
        Bucket: bucketName,
        Prefix: options.prefix || '',
        MaxKeys: options.maxKeys || 1000
      };
      
      const data = await this.s3.listObjects(params).promise();
      
      if (this.useCache) {
        this.cache.set(cacheKey, data.Contents);
      }
      
      return data.Contents;
    } catch (error) {
      this.logger.error(`Erro ao listar objetos do bucket ${bucketName}`, error);
      throw new Error(`Falha ao listar objetos: ${error.message}`);
    }
  }

  /**
   * Faz upload de um arquivo para o S3
   * 
   * @param {string} bucketName Nome do bucket
   * @param {string} key Caminho/nome do objeto no S3
   * @param {string|Buffer} fileContent Conteúdo do arquivo ou caminho local
   * @param {Object} options Opções adicionais
   * @param {string} options.contentType Tipo de conteúdo do arquivo
   * @param {string} options.acl Configuração de ACL
   * @returns {Promise<Object>} Informações do upload
   */
  async uploadFile(bucketName, key, fileContent, options = {}) {
    try {
      let content = fileContent;
      
      // Se fileContent for uma string de caminho de arquivo, lê o arquivo
      if (typeof fileContent === 'string' && fs.existsSync(fileContent)) {
        content = await readFile(fileContent);
      }
      
      const params = {
        Bucket: bucketName,
        Key: key,
        Body: content,
        ContentType: options.contentType || this._getContentType(key),
        ACL: options.acl || 'private'
      };
      
      // Adiciona metadados se fornecidos
      if (options.metadata) {
        params.Metadata = options.metadata;
      }
      
      const data = await this.s3.upload(params).promise();
      
      // Invalidar cache
      if (this.useCache) {
        this.cache.del(`bucket-${bucketName}-objects`);
      }
      
      this.logger.info(`Arquivo enviado: ${key} para ${bucketName}`);
      return {
        bucket: bucketName,
        key: key,
        location: data.Location,
        etag: data.ETag
      };
    } catch (error) {
      this.logger.error(`Erro ao fazer upload para ${bucketName}/${key}`, error);
      throw new Error(`Falha ao fazer upload: ${error.message}`);
    }
  }

  /**
   * Obtém um objeto do S3
   * 
   * @param {string} bucketName Nome do bucket
   * @param {string} key Caminho/nome do objeto no S3
   * @returns {Promise<Object>} Objeto e metadados
   */
  async getObject(bucketName, key) {
    try {
      const cacheKey = `object-${bucketName}-${key}`;
      
      if (this.useCache) {
        const cachedObject = this.cache.get(cacheKey);
        if (cachedObject) return cachedObject;
      }
      
      const data = await this.s3.getObject({
        Bucket: bucketName,
        Key: key
      }).promise();
      
      const result = {
        content: data.Body,
        contentType: data.ContentType,
        lastModified: data.LastModified,
        metadata: data.Metadata,
        etag: data.ETag
      };
      
      if (this.useCache) {
        // Não armazenamos o conteúdo no cache, apenas metadados
        const metadataOnly = { ...result };
        delete metadataOnly.content;
        this.cache.set(cacheKey, metadataOnly);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Erro ao obter objeto ${bucketName}/${key}`, error);
      throw new Error(`Falha ao obter objeto: ${error.message}`);
    }
  }

  /**
   * Exclui um objeto do S3
   * 
   * @param {string} bucketName Nome do bucket
   * @param {string} key Caminho/nome do objeto no S3
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async deleteObject(bucketName, key) {
    try {
      await this.s3.deleteObject({
        Bucket: bucketName,
        Key: key
      }).promise();
      
      // Invalidar cache
      if (this.useCache) {
        this.cache.del(`bucket-${bucketName}-objects`);
        this.cache.del(`object-${bucketName}-${key}`);
      }
      
      this.logger.info(`Objeto excluído: ${bucketName}/${key}`);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao excluir objeto ${bucketName}/${key}`, error);
      throw new Error(`Falha ao excluir objeto: ${error.message}`);
    }
  }

  /**
   * Configura um bucket para hospedagem de website estático
   * 
   * @param {string} bucketName Nome do bucket
   * @param {Object} config Configuração do website
   * @param {string} config.indexDocument Documento de índice (ex: index.html)
   * @param {string} config.errorDocument Documento de erro (ex: error.html)
   * @returns {Promise<Object>} Informações da configuração
   */
  async configureWebsite(bucketName, config) {
    try {
      const params = {
        Bucket: bucketName,
        WebsiteConfiguration: {
          IndexDocument: {
            Suffix: config.indexDocument || 'index.html'
          }
        }
      };
      
      // Adiciona documento de erro se fornecido
      if (config.errorDocument) {
        params.WebsiteConfiguration.ErrorDocument = {
          Key: config.errorDocument
        };
      }
      
      await this.s3.putBucketWebsite(params).promise();
      
      // Obtém URL do website
      const websiteUrl = this._getWebsiteUrl(bucketName, this.config.region);
      
      this.logger.info(`Website configurado para o bucket: ${bucketName}`);
      return {
        bucket: bucketName,
        websiteUrl,
        indexDocument: config.indexDocument,
        errorDocument: config.errorDocument
      };
    } catch (error) {
      this.logger.error(`Erro ao configurar website para ${bucketName}`, error);
      throw new Error(`Falha ao configurar website: ${error.message}`);
    }
  }

  /**
   * Configura políticas de controle de acesso para um bucket
   * 
   * @param {string} bucketName Nome do bucket
   * @param {Object} policy Política em formato JSON
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async setBucketPolicy(bucketName, policy) {
    try {
      await this.s3.putBucketPolicy({
        Bucket: bucketName,
        Policy: typeof policy === 'string' ? policy : JSON.stringify(policy)
      }).promise();
      
      this.logger.info(`Política configurada para o bucket: ${bucketName}`);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao configurar política para ${bucketName}`, error);
      throw new Error(`Falha ao configurar política: ${error.message}`);
    }
  }

  /**
   * Gera uma URL pré-assinada para acesso temporário a um objeto
   * 
   * @param {string} bucketName Nome do bucket
   * @param {string} key Caminho/nome do objeto no S3
   * @param {number} expiresIn Tempo de expiração em segundos
   * @returns {string} URL pré-assinada
   */
  getSignedUrl(bucketName, key, expiresIn = 3600) {
    try {
      const url = this.s3.getSignedUrl('getObject', {
        Bucket: bucketName,
        Key: key,
        Expires: expiresIn
      });
      
      return url;
    } catch (error) {
      this.logger.error(`Erro ao gerar URL assinada para ${bucketName}/${key}`, error);
      throw new Error(`Falha ao gerar URL assinada: ${error.message}`);
    }
  }

  /**
   * Obtém informações sobre um bucket
   * 
   * @param {string} bucketName Nome do bucket
   * @returns {Promise<Object>} Informações do bucket
   */
  async getBucketInfo(bucketName) {
    try {
      const cacheKey = `bucket-${bucketName}`;
      
      if (this.useCache) {
        const cachedInfo = this.cache.get(cacheKey);
        if (cachedInfo) return cachedInfo;
      }
      
      // Obtém localização do bucket
      const location = await this.s3.getBucketLocation({
        Bucket: bucketName
      }).promise();
      
      // Verifica se o bucket existe obtendo ACL
      const acl = await this.s3.getBucketAcl({
        Bucket: bucketName
      }).promise();
      
      // Tentativa de obter configuração de website (pode falhar se não configurado)
      let websiteConfig = null;
      try {
        websiteConfig = await this.s3.getBucketWebsite({
          Bucket: bucketName
        }).promise();
      } catch (e) {
        // Website não configurado, ignorar erro
      }
      
      const info = {
        name: bucketName,
        region: location.LocationConstraint || 'us-east-1', // S3 usa string vazia para us-east-1
        owner: acl.Owner,
        acl: acl.Grants,
        website: websiteConfig,
        websiteUrl: websiteConfig ? this._getWebsiteUrl(bucketName, location.LocationConstraint || 'us-east-1') : null
      };
      
      if (this.useCache) {
        this.cache.set(cacheKey, info);
      }
      
      return info;
    } catch (error) {
      this.logger.error(`Erro ao obter informações do bucket ${bucketName}`, error);
      throw new Error(`Falha ao obter informações do bucket: ${error.message}`);
    }
  }

  /**
   * Obtém o tipo de conteúdo baseado na extensão do arquivo
   * 
   * @private
   * @param {string} filename Nome do arquivo
   * @returns {string} Tipo de conteúdo MIME
   */
  _getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
      '.txt': 'text/plain',
      '.xml': 'application/xml',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2'
      // Adicionar mais tipos conforme necessário
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }

  /**
   * Gera a URL de website para um bucket S3
   * 
   * @private
   * @param {string} bucketName Nome do bucket
   * @param {string} region Região AWS
   * @returns {string} URL do website
   */
  _getWebsiteUrl(bucketName, region) {
    // Tratamento especial para us-east-1 que tem formato diferente
    if (region === 'us-east-1') {
      return `http://${bucketName}.s3-website-us-east-1.amazonaws.com`;
    }
    
    return `http://${bucketName}.s3-website-${region}.amazonaws.com`;
  }
}

module.exports = S3Manager;