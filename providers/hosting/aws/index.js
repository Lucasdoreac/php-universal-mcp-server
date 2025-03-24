/**
 * AWS Provider
 * 
 * Provedor para serviços Amazon Web Services (EC2, S3, RDS, etc)
 * @version 1.0.0
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const ssh2 = require('ssh2');
const sftpPromises = require('sftp-promises');

class AWSProvider {
  constructor(options = {}) {
    this.options = {
      region: 'us-east-1', // Região padrão
      ...options
    };
    
    this.initialized = false;
    this.clients = {};
  }
  
  /**
   * Inicializa o provedor AWS
   * @param {Object} credentials - Credenciais de autenticação
   */
  async initialize(credentials) {
    try {
      this.credentials = credentials;
      
      // Configurar AWS SDK
      AWS.config.update({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        region: this.options.region
      });
      
      // Inicializar clientes para serviços AWS
      this.clients.ec2 = new AWS.EC2();
      this.clients.s3 = new AWS.S3();
      this.clients.rds = new AWS.RDS();
      this.clients.route53 = new AWS.Route53();
      this.clients.cloudfront = new AWS.CloudFront();
      
      this.initialized = true;
      
      return true;
    } catch (error) {
      console.error('Erro ao inicializar AWS Provider:', error);
      throw error;
    }
  }
  
  /**
   * Verifica se o provider está inicializado
   */
  checkInitialized() {
    if (!this.initialized) {
      throw new Error('AWS Provider não está inicializado. Chame initialize() primeiro.');
    }
  }
  
  /**
   * Lista todas as instâncias EC2
   */
  async listInstances() {
    try {
      this.checkInitialized();
      
      const response = await this.clients.ec2.describeInstances().promise();
      
      const instances = [];
      
      for (const reservation of response.Reservations) {
        for (const instance of reservation.Instances) {
          const nameTag = instance.Tags?.find(tag => tag.Key === 'Name');
          
          instances.push({
            id: instance.InstanceId,
            type: instance.InstanceType,
            state: instance.State.Name,
            publicIp: instance.PublicIpAddress,
            privateIp: instance.PrivateIpAddress,
            name: nameTag ? nameTag.Value : undefined,
            launchTime: instance.LaunchTime,
            zone: instance.Placement.AvailabilityZone
          });
        }
      }
      
      return instances;
    } catch (error) {
      console.error('Erro ao listar instâncias EC2:', error);
      throw error;
    }
  }
  
  /**
   * Cria uma nova instância EC2
   * @param {Object} options - Opções para criação da instância
   */
  async createInstance(options) {
    try {
      this.checkInitialized();
      
      const {
        imageId,
        instanceType = 't2.micro',
        keyName,
        securityGroupIds = [],
        subnetId,
        userData = '',
        tagName = '',
        ebsSize = 8,
        ebsType = 'gp2'
      } = options;
      
      if (!imageId) {
        throw new Error('ImageId é obrigatório');
      }
      
      if (!keyName) {
        throw new Error('KeyName é obrigatório');
      }
      
      // Configurar os parâmetros para a instância
      const params = {
        ImageId: imageId,
        InstanceType: instanceType,
        KeyName: keyName,
        MinCount: 1,
        MaxCount: 1,
        SecurityGroupIds: securityGroupIds,
        UserData: userData ? Buffer.from(userData).toString('base64') : undefined,
        BlockDeviceMappings: [
          {
            DeviceName: '/dev/sda1',
            Ebs: {
              VolumeSize: ebsSize,
              VolumeType: ebsType,
              DeleteOnTermination: true
            }
          }
        ]
      };
      
      if (subnetId) {
        params.SubnetId = subnetId;
      }
      
      // Criar a instância
      const result = await this.clients.ec2.runInstances(params).promise();
      const instanceId = result.Instances[0].InstanceId;
      
      // Adicionar tags se fornecidas
      if (tagName) {
        await this.clients.ec2.createTags({
          Resources: [instanceId],
          Tags: [
            {
              Key: 'Name',
              Value: tagName
            }
          ]
        }).promise();
      }
      
      return {
        instanceId,
        instanceType,
        imageId,
        state: result.Instances[0].State.Name
      };
    } catch (error) {
      console.error('Erro ao criar instância EC2:', error);
      throw error;
    }
  }
  
  /**
   * Inicia uma instância EC2
   * @param {string} instanceId - ID da instância a iniciar
   */
  async startInstance(instanceId) {
    try {
      this.checkInitialized();
      
      const result = await this.clients.ec2.startInstances({
        InstanceIds: [instanceId]
      }).promise();
      
      return {
        instanceId,
        previousState: result.StartingInstances[0].PreviousState.Name,
        currentState: result.StartingInstances[0].CurrentState.Name
      };
    } catch (error) {
      console.error(`Erro ao iniciar instância EC2 ${instanceId}:`, error);
      throw error;
    }
  }
  
  /**
   * Para uma instância EC2
   * @param {string} instanceId - ID da instância a parar
   */
  async stopInstance(instanceId) {
    try {
      this.checkInitialized();
      
      const result = await this.clients.ec2.stopInstances({
        InstanceIds: [instanceId]
      }).promise();
      
      return {
        instanceId,
        previousState: result.StoppingInstances[0].PreviousState.Name,
        currentState: result.StoppingInstances[0].CurrentState.Name
      };
    } catch (error) {
      console.error(`Erro ao parar instância EC2 ${instanceId}:`, error);
      throw error;
    }
  }
  
  /**
   * Termina (remove) uma instância EC2
   * @param {string} instanceId - ID da instância a terminar
   */
  async terminateInstance(instanceId) {
    try {
      this.checkInitialized();
      
      const result = await this.clients.ec2.terminateInstances({
        InstanceIds: [instanceId]
      }).promise();
      
      return {
        instanceId,
        previousState: result.TerminatingInstances[0].PreviousState.Name,
        currentState: result.TerminatingInstances[0].CurrentState.Name
      };
    } catch (error) {
      console.error(`Erro ao terminar instância EC2 ${instanceId}:`, error);
      throw error;
    }
  }
  
  /**
   * Lista todos os buckets S3
   */
  async listBuckets() {
    try {
      this.checkInitialized();
      
      const response = await this.clients.s3.listBuckets().promise();
      
      return response.Buckets.map(bucket => ({
        name: bucket.Name,
        creationDate: bucket.CreationDate
      }));
    } catch (error) {
      console.error('Erro ao listar buckets S3:', error);
      throw error;
    }
  }
  
  /**
   * Cria um novo bucket S3
   * @param {string} name - Nome do bucket
   * @param {Object} options - Opções adicionais
   */
  async createBucket(name, options = {}) {
    try {
      this.checkInitialized();
      
      const {
        acl = 'private',
        region = this.options.region
      } = options;
      
      const params = {
        Bucket: name,
        ACL: acl
      };
      
      // Se a região não for us-east-1 (padrão), é necessário especificar
      if (region !== 'us-east-1') {
        params.CreateBucketConfiguration = {
          LocationConstraint: region
        };
      }
      
      const result = await this.clients.s3.createBucket(params).promise();
      
      return {
        name,
        location: result.Location,
        success: true
      };
    } catch (error) {
      console.error(`Erro ao criar bucket S3 ${name}:`, error);
      throw error;
    }
  }
  
  /**
   * Faz upload de um arquivo para o S3
   * @param {string} bucketName - Nome do bucket
   * @param {string} key - Chave do objeto (caminho)
   * @param {string|Buffer} content - Conteúdo do arquivo
   * @param {Object} options - Opções adicionais
   */
  async uploadToS3(bucketName, key, content, options = {}) {
    try {
      this.checkInitialized();
      
      const {
        contentType = 'application/octet-stream',
        acl = 'private'
      } = options;
      
      const params = {
        Bucket: bucketName,
        Key: key,
        Body: content,
        ContentType: contentType,
        ACL: acl
      };
      
      const result = await this.clients.s3.putObject(params).promise();
      
      return {
        bucket: bucketName,
        key,
        etag: result.ETag,
        success: true
      };
    } catch (error) {
      console.error(`Erro ao fazer upload para S3 (${bucketName}/${key}):`, error);
      throw error;
    }
  }
  
  /**
   * Faz download de um arquivo do S3
   * @param {string} bucketName - Nome do bucket
   * @param {string} key - Chave do objeto (caminho)
   */
  async downloadFromS3(bucketName, key) {
    try {
      this.checkInitialized();
      
      const params = {
        Bucket: bucketName,
        Key: key
      };
      
      const result = await this.clients.s3.getObject(params).promise();
      
      return {
        bucket: bucketName,
        key,
        content: result.Body,
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        etag: result.ETag
      };
    } catch (error) {
      console.error(`Erro ao fazer download do S3 (${bucketName}/${key}):`, error);
      throw error;
    }
  }
  
  /**
   * Lista instâncias de banco de dados RDS
   */
  async listDatabases() {
    try {
      this.checkInitialized();
      
      const response = await this.clients.rds.describeDBInstances().promise();
      
      return response.DBInstances.map(db => ({
        id: db.DBInstanceIdentifier,
        engine: db.Engine,
        status: db.DBInstanceStatus,
        endpoint: db.Endpoint ? `${db.Endpoint.Address}:${db.Endpoint.Port}` : null,
        allocatedStorage: db.AllocatedStorage,
        instanceClass: db.DBInstanceClass,
        multiAZ: db.MultiAZ,
        engineVersion: db.EngineVersion,
        publiclyAccessible: db.PubliclyAccessible
      }));
    } catch (error) {
      console.error('Erro ao listar instâncias RDS:', error);
      throw error;
    }
  }
  
  /**
   * Cria uma nova instância de banco de dados RDS
   * @param {Object} options - Opções para criação do banco
   */
  async createDatabase(options) {
    try {
      this.checkInitialized();
      
      const {
        dbName,
        engine = 'mysql',
        engineVersion = '8.0',
        masterUsername,
        masterPassword,
        instanceClass = 'db.t2.micro',
        allocatedStorage = 20,
        storageType = 'gp2',
        multiAZ = false,
        publiclyAccessible = false
      } = options;
      
      if (!dbName) {
        throw new Error('Nome da instância de banco de dados é obrigatório');
      }
      
      if (!masterUsername || !masterPassword) {
        throw new Error('Credenciais de administrador são obrigatórias');
      }
      
      const params = {
        DBInstanceIdentifier: dbName,
        AllocatedStorage: allocatedStorage,
        DBInstanceClass: instanceClass,
        Engine: engine,
        EngineVersion: engineVersion,
        MasterUsername: masterUsername,
        MasterUserPassword: masterPassword,
        StorageType: storageType,
        MultiAZ: multiAZ,
        PubliclyAccessible: publiclyAccessible
      };
      
      const result = await this.clients.rds.createDBInstance(params).promise();
      
      return {
        id: result.DBInstance.DBInstanceIdentifier,
        engine: result.DBInstance.Engine,
        status: result.DBInstance.DBInstanceStatus,
        instanceClass: result.DBInstance.DBInstanceClass,
        allocatedStorage: result.DBInstance.AllocatedStorage
      };
    } catch (error) {
      console.error('Erro ao criar instância RDS:', error);
      throw error;
    }
  }
  
  /**
   * Conecta a uma instância EC2 via SSH e executa um comando
   * @param {string} instanceIp - IP da instância
   * @param {string} keyPath - Caminho para a chave privada
   * @param {string} command - Comando a ser executado
   * @param {Object} options - Opções adicionais
   */
  async executeSSHCommand(instanceIp, keyPath, command, options = {}) {
    try {
      const {
        username = 'ec2-user',
        port = 22,
        timeout = 10000 // 10 segundos
      } = options;
      
      return new Promise((resolve, reject) => {
        const conn = new ssh2.Client();
        let stdout = '';
        let stderr = '';
        
        conn.on('ready', () => {
          conn.exec(command, (err, stream) => {
            if (err) {
              conn.end();
              return reject(err);
            }
            
            stream.on('close', (code, signal) => {
              conn.end();
              resolve({
                stdout,
                stderr,
                exitCode: code
              });
            });
            
            stream.on('data', (data) => {
              stdout += data.toString();
            });
            
            stream.stderr.on('data', (data) => {
              stderr += data.toString();
            });
          });
        });
        
        conn.on('error', (err) => {
          reject(err);
        });
        
        conn.connect({
          host: instanceIp,
          port,
          username,
          privateKey: fs.readFileSync(keyPath),
          readyTimeout: timeout
        });
      });
    } catch (error) {
      console.error(`Erro ao executar comando SSH em ${instanceIp}:`, error);
      throw error;
    }
  }
  
  /**
   * Upload de arquivos para instância EC2 via SFTP
   * @param {string} instanceIp - IP da instância
   * @param {string} keyPath - Caminho para a chave privada
   * @param {string} localPath - Caminho local do arquivo/diretório
   * @param {string} remotePath - Caminho remoto de destino
   * @param {Object} options - Opções adicionais
   */
  async uploadViaSSH(instanceIp, keyPath, localPath, remotePath, options = {}) {
    try {
      const {
        username = 'ec2-user',
        port = 22,
        recursive = false
      } = options;
      
      const config = {
        host: instanceIp,
        port,
        username,
        privateKey: fs.readFileSync(keyPath)
      };
      
      const sftp = new sftpPromises.Client();
      await sftp.connect(config);
      
      if (recursive && fs.statSync(localPath).isDirectory()) {
        // Upload recursivo de diretório
        const uploadDir = async (src, dest) => {
          try {
            // Verificar se o diretório remoto existe, caso contrário, criar
            try {
              await sftp.stat(dest);
            } catch (err) {
              await sftp.mkdir(dest);
            }
            
            const files = fs.readdirSync(src);
            
            for (const file of files) {
              const srcPath = path.join(src, file);
              const destPath = path.join(dest, file);
              
              if (fs.statSync(srcPath).isDirectory()) {
                await uploadDir(srcPath, destPath);
              } else {
                await sftp.put(srcPath, destPath);
              }
            }
          } catch (error) {
            console.error(`Erro ao fazer upload do diretório ${src}:`, error);
            throw error;
          }
        };
        
        await uploadDir(localPath, remotePath);
      } else {
        // Upload de arquivo único
        await sftp.put(localPath, remotePath);
      }
      
      await sftp.end();
      
      return {
        success: true,
        source: localPath,
        destination: `${username}@${instanceIp}:${remotePath}`
      };
    } catch (error) {
      console.error(`Erro ao fazer upload via SSH para ${instanceIp}:`, error);
      throw error;
    }
  }
  
  /**
   * Gerencia regras DNS no Route53
   * @param {string} hostedZoneId - ID da zona hospedada
   * @param {Array} changes - Array de mudanças a serem feitas
   */
  async updateDNS(hostedZoneId, changes) {
    try {
      this.checkInitialized();
      
      const params = {
        ChangeBatch: {
          Changes: changes.map(change => ({
            Action: change.action || 'UPSERT',
            ResourceRecordSet: {
              Name: change.name,
              Type: change.type || 'A',
              TTL: change.ttl || 300,
              ResourceRecords: [
                {
                  Value: change.value
                }
              ]
            }
          })),
          Comment: 'Update via PHP Universal MCP Server'
        },
        HostedZoneId: hostedZoneId
      };
      
      const result = await this.clients.route53.changeResourceRecordSets(params).promise();
      
      return {
        success: true,
        changeId: result.ChangeInfo.Id,
        status: result.ChangeInfo.Status
      };
    } catch (error) {
      console.error(`Erro ao atualizar DNS na zona ${hostedZoneId}:`, error);
      throw error;
    }
  }
  
  /**
   * Cria uma distribuição CloudFront
   * @param {Object} options - Opções para a distribuição
   */
  async createCloudFrontDistribution(options) {
    try {
      this.checkInitialized();
      
      const {
        originDomain,
        originId = 'PHPUniversalMCPOrigin',
        enabled = true,
        defaultRootObject = 'index.php',
        priceClass = 'PriceClass_100', // Use PriceClass_All para distribuição global
        aliases = [],
        certificateArn = null
      } = options;
      
      if (!originDomain) {
        throw new Error('Domínio de origem é obrigatório');
      }
      
      // Configuração básica para uma distribuição CloudFront
      const distributionConfig = {
        CallerReference: `php-universal-mcp-${Date.now()}`,
        Comment: 'Created via PHP Universal MCP Server',
        DefaultRootObject: defaultRootObject,
        Enabled: enabled,
        Origins: {
          Quantity: 1,
          Items: [
            {
              Id: originId,
              DomainName: originDomain,
              CustomOriginConfig: {
                HTTPPort: 80,
                HTTPSPort: 443,
                OriginProtocolPolicy: 'match-viewer',
                OriginSslProtocols: {
                  Quantity: 1,
                  Items: ['TLSv1.2']
                },
                OriginReadTimeout: 30,
                OriginKeepaliveTimeout: 5
              }
            }
          ]
        },
        DefaultCacheBehavior: {
          TargetOriginId: originId,
          ViewerProtocolPolicy: 'redirect-to-https',
          AllowedMethods: {
            Quantity: 7,
            Items: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
            CachedMethods: {
              Quantity: 3,
              Items: ['GET', 'HEAD', 'OPTIONS']
            }
          },
          CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6', // CachingOptimized
          OriginRequestPolicyId: 'b689b0a8-53d0-40ab-baf2-68738e2966ac', // AllViewerExceptHostHeader
          Compress: true
        },
        PriceClass: priceClass
      };
      
      // Adicionar aliases e certificado se fornecidos
      if (aliases.length > 0) {
        distributionConfig.Aliases = {
          Quantity: aliases.length,
          Items: aliases
        };
        
        if (certificateArn) {
          distributionConfig.ViewerCertificate = {
            ACMCertificateArn: certificateArn,
            SSLSupportMethod: 'sni-only',
            MinimumProtocolVersion: 'TLSv1.2_2021'
          };
        }
      }
      
      const params = {
        DistributionConfig: distributionConfig
      };
      
      const result = await this.clients.cloudfront.createDistribution(params).promise();
      
      return {
        id: result.Distribution.Id,
        domainName: result.Distribution.DomainName,
        status: result.Distribution.Status,
        enabled: result.Distribution.Enabled
      };
    } catch (error) {
      console.error('Erro ao criar distribuição CloudFront:', error);
      throw error;
    }
  }
}

module.exports = AWSProvider;