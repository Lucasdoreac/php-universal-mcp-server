/**
 * AWS RDS Manager
 * 
 * Gerencia operações de banco de dados usando o Amazon RDS.
 * Permite criação de instâncias, gerenciamento de snapshots, configuração de security groups,
 * monitoramento de performance e muito mais.
 * 
 * @module providers/cloud/aws/rds
 */

const AWS = require('aws-sdk');
const Logger = require('../../../core/utils/logger');
const Cache = require('../../../core/utils/cache');

class RDSManager {
  /**
   * Inicializa o RDS Manager com configurações AWS
   * 
   * @param {Object} config Configuração de credenciais AWS
   * @param {string} config.region Região AWS
   * @param {string} config.accessKeyId Access Key
   * @param {string} config.secretAccessKey Secret Key
   * @param {Object} options Opções adicionais
   * @param {boolean} options.useCache Habilita cache para operações frequentes
   * @param {number} options.cacheTTL Tempo de vida do cache em segundos
   * @param {Object} options.eventEmitter Event emitter para notificações
   */
  constructor(config, options = {}) {
    this.config = config;
    this.rds = new AWS.RDS({
      region: config.region,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    });
    
    this.logger = new Logger('AWS-RDS');
    this.useCache = options.useCache || false;
    this.eventEmitter = options.eventEmitter;
    
    if (this.useCache) {
      this.cache = new Cache({
        ttl: options.cacheTTL || 300, // 5 minutos padrão
        namespace: 'aws-rds'
      });
    }
  }

  /**
   * Lista todas as instâncias de banco de dados
   * 
   * @param {Object} filters Filtros opcionais para a listagem
   * @returns {Promise<Array>} Lista de instâncias de banco de dados
   */
  async listDBInstances(filters = {}) {
    try {
      if (this.useCache) {
        const cacheKey = `db-instances-${JSON.stringify(filters)}`;
        const cachedInstances = this.cache.get(cacheKey);
        if (cachedInstances) return cachedInstances;
      }

      const params = {};
      if (filters.dbInstanceIdentifier) {
        params.DBInstanceIdentifier = filters.dbInstanceIdentifier;
      }
      
      const data = await this.rds.describeDBInstances(params).promise();
      
      if (this.useCache) {
        const cacheKey = `db-instances-${JSON.stringify(filters)}`;
        this.cache.set(cacheKey, data.DBInstances);
      }
      
      return data.DBInstances;
    } catch (error) {
      this.logger.error('Erro ao listar instâncias de banco de dados', error);
      throw new Error(`Falha ao listar instâncias de banco de dados: ${error.message}`);
    }
  }

  /**
   * Cria uma nova instância de banco de dados
   * 
   * @param {Object} params Parâmetros para criação do banco de dados
   * @param {string} params.dbInstanceIdentifier Identificador da instância
   * @param {string} params.engine Engine do DB (mysql, postgres, etc)
   * @param {string} params.dbInstanceClass Tipo da instância (db.t2.micro, etc)
   * @param {string} params.masterUsername Usuário master
   * @param {string} params.masterUserPassword Senha do usuário master
   * @param {number} params.allocatedStorage Tamanho do storage em GB
   * @param {Object} options Opções adicionais
   * @returns {Promise<Object>} Instância de banco de dados criada
   */
  async createDBInstance(params, options = {}) {
    try {
      const dbParams = {
        DBInstanceIdentifier: params.dbInstanceIdentifier,
        Engine: params.engine,
        DBInstanceClass: params.dbInstanceClass,
        MasterUsername: params.masterUsername,
        MasterUserPassword: params.masterUserPassword,
        AllocatedStorage: params.allocatedStorage
      };
      
      // Adicionar parâmetros opcionais
      if (params.dbName) {
        dbParams.DBName = params.dbName;
      }
      
      if (params.port) {
        dbParams.Port = params.port;
      }
      
      if (params.publiclyAccessible !== undefined) {
        dbParams.PubliclyAccessible = params.publiclyAccessible;
      }
      
      if (params.vpcSecurityGroupIds) {
        dbParams.VpcSecurityGroupIds = params.vpcSecurityGroupIds;
      }
      
      if (params.dbSubnetGroupName) {
        dbParams.DBSubnetGroupName = params.dbSubnetGroupName;
      }
      
      if (params.multiAZ !== undefined) {
        dbParams.MultiAZ = params.multiAZ;
      }
      
      // Opções de backup
      if (params.backupRetentionPeriod) {
        dbParams.BackupRetentionPeriod = params.backupRetentionPeriod;
      }
      
      if (params.preferredBackupWindow) {
        dbParams.PreferredBackupWindow = params.preferredBackupWindow;
      }
      
      if (params.preferredMaintenanceWindow) {
        dbParams.PreferredMaintenanceWindow = params.preferredMaintenanceWindow;
      }
      
      // Tags
      if (params.tags) {
        dbParams.Tags = params.tags;
      }
      
      const data = await this.rds.createDBInstance(dbParams).promise();
      
      // Invalidar cache
      if (this.useCache) {
        this.cache.del('db-instances-{}');
      }
      
      // Emitir evento
      if (this.eventEmitter) {
        this.eventEmitter.emit('rds:instance:created', {
          dbInstanceIdentifier: params.dbInstanceIdentifier,
          timestamp: new Date().toISOString()
        });
      }
      
      this.logger.info(`Instância de banco de dados criada: ${params.dbInstanceIdentifier}`);
      return data.DBInstance;
    } catch (error) {
      this.logger.error(`Erro ao criar instância de banco de dados ${params.dbInstanceIdentifier}`, error);
      throw new Error(`Falha ao criar instância de banco de dados: ${error.message}`);
    }
  }

  /**
   * Obtém informações sobre uma instância de banco de dados
   * 
   * @param {string} dbInstanceIdentifier Identificador da instância
   * @returns {Promise<Object>} Informações da instância de banco de dados
   */
  async getDBInstance(dbInstanceIdentifier) {
    try {
      if (this.useCache) {
        const cacheKey = `db-instance-${dbInstanceIdentifier}`;
        const cachedInstance = this.cache.get(cacheKey);
        if (cachedInstance) return cachedInstance;
      }

      const data = await this.rds.describeDBInstances({
        DBInstanceIdentifier: dbInstanceIdentifier
      }).promise();
      
      if (!data.DBInstances || data.DBInstances.length === 0) {
        throw new Error(`Instância de banco de dados não encontrada: ${dbInstanceIdentifier}`);
      }
      
      const instance = data.DBInstances[0];
      
      if (this.useCache) {
        const cacheKey = `db-instance-${dbInstanceIdentifier}`;
        this.cache.set(cacheKey, instance);
      }
      
      return instance;
    } catch (error) {
      this.logger.error(`Erro ao obter instância de banco de dados ${dbInstanceIdentifier}`, error);
      throw new Error(`Falha ao obter instância de banco de dados: ${error.message}`);
    }
  }

  /**
   * Modifica uma instância de banco de dados existente
   * 
   * @param {string} dbInstanceIdentifier Identificador da instância
   * @param {Object} params Parâmetros para modificação
   * @param {boolean} applyImmediately Aplicar alterações imediatamente ou na janela de manutenção
   * @returns {Promise<Object>} Instância de banco de dados modificada
   */
  async modifyDBInstance(dbInstanceIdentifier, params, applyImmediately = false) {
    try {
      const dbParams = {
        DBInstanceIdentifier: dbInstanceIdentifier,
        ApplyImmediately: applyImmediately
      };
      
      // Adicionar parâmetros a serem modificados
      const validParams = [
        'AllocatedStorage',
        'DBInstanceClass',
        'MasterUserPassword',
        'DBName',
        'BackupRetentionPeriod',
        'PreferredBackupWindow',
        'PreferredMaintenanceWindow',
        'MultiAZ',
        'EngineVersion',
        'AllowMajorVersionUpgrade',
        'AutoMinorVersionUpgrade',
        'VpcSecurityGroupIds',
        'DBParameterGroupName',
        'OptionGroupName',
        'PubliclyAccessible',
        'Port',
        'StorageType',
        'Iops',
        'CACertificateIdentifier'
      ];
      
      for (const param of validParams) {
        if (params[param] !== undefined) {
          dbParams[param] = params[param];
        }
      }
      
      const data = await this.rds.modifyDBInstance(dbParams).promise();
      
      // Invalidar cache
      if (this.useCache) {
        this.cache.del(`db-instance-${dbInstanceIdentifier}`);
        this.cache.del('db-instances-{}');
      }
      
      // Emitir evento
      if (this.eventEmitter) {
        this.eventEmitter.emit('rds:instance:modified', {
          dbInstanceIdentifier,
          timestamp: new Date().toISOString(),
          applyImmediately
        });
      }
      
      this.logger.info(`Instância de banco de dados modificada: ${dbInstanceIdentifier}`);
      return data.DBInstance;
    } catch (error) {
      this.logger.error(`Erro ao modificar instância de banco de dados ${dbInstanceIdentifier}`, error);
      throw new Error(`Falha ao modificar instância de banco de dados: ${error.message}`);
    }
  }

  /**
   * Exclui uma instância de banco de dados
   * 
   * @param {string} dbInstanceIdentifier Identificador da instância
   * @param {boolean} skipFinalSnapshot Pular criação do snapshot final
   * @param {string} finalSnapshotIdentifier Identificador do snapshot final (requerido se skipFinalSnapshot for false)
   * @returns {Promise<Object>} Instância de banco de dados excluída
   */
  async deleteDBInstance(dbInstanceIdentifier, skipFinalSnapshot = false, finalSnapshotIdentifier = null) {
    try {
      const params = {
        DBInstanceIdentifier: dbInstanceIdentifier,
        SkipFinalSnapshot: skipFinalSnapshot
      };
      
      if (!skipFinalSnapshot) {
        if (!finalSnapshotIdentifier) {
          finalSnapshotIdentifier = `${dbInstanceIdentifier}-final-snapshot-${Date.now()}`;
        }
        params.FinalDBSnapshotIdentifier = finalSnapshotIdentifier;
      }
      
      const data = await this.rds.deleteDBInstance(params).promise();
      
      // Invalidar cache
      if (this.useCache) {
        this.cache.del(`db-instance-${dbInstanceIdentifier}`);
        this.cache.del('db-instances-{}');
      }
      
      // Emitir evento
      if (this.eventEmitter) {
        this.eventEmitter.emit('rds:instance:deleted', {
          dbInstanceIdentifier,
          timestamp: new Date().toISOString(),
          finalSnapshotIdentifier: skipFinalSnapshot ? null : finalSnapshotIdentifier
        });
      }
      
      this.logger.info(`Instância de banco de dados excluída: ${dbInstanceIdentifier}`);
      return data.DBInstance;
    } catch (error) {
      this.logger.error(`Erro ao excluir instância de banco de dados ${dbInstanceIdentifier}`, error);
      throw new Error(`Falha ao excluir instância de banco de dados: ${error.message}`);
    }
  }

  /**
   * Inicia uma instância de banco de dados
   * 
   * @param {string} dbInstanceIdentifier Identificador da instância
   * @returns {Promise<Object>} Instância de banco de dados iniciada
   */
  async startDBInstance(dbInstanceIdentifier) {
    try {
      const data = await this.rds.startDBInstance({
        DBInstanceIdentifier: dbInstanceIdentifier
      }).promise();
      
      // Invalidar cache
      if (this.useCache) {
        this.cache.del(`db-instance-${dbInstanceIdentifier}`);
        this.cache.del('db-instances-{}');
      }
      
      // Emitir evento
      if (this.eventEmitter) {
        this.eventEmitter.emit('rds:instance:started', {
          dbInstanceIdentifier,
          timestamp: new Date().toISOString()
        });
      }
      
      this.logger.info(`Instância de banco de dados iniciada: ${dbInstanceIdentifier}`);
      return data.DBInstance;
    } catch (error) {
      this.logger.error(`Erro ao iniciar instância de banco de dados ${dbInstanceIdentifier}`, error);
      throw new Error(`Falha ao iniciar instância de banco de dados: ${error.message}`);
    }
  }

  /**
   * Para uma instância de banco de dados
   * 
   * @param {string} dbInstanceIdentifier Identificador da instância
   * @returns {Promise<Object>} Instância de banco de dados parada
   */
  async stopDBInstance(dbInstanceIdentifier) {
    try {
      const data = await this.rds.stopDBInstance({
        DBInstanceIdentifier: dbInstanceIdentifier
      }).promise();
      
      // Invalidar cache
      if (this.useCache) {
        this.cache.del(`db-instance-${dbInstanceIdentifier}`);
        this.cache.del('db-instances-{}');
      }
      
      // Emitir evento
      if (this.eventEmitter) {
        this.eventEmitter.emit('rds:instance:stopped', {
          dbInstanceIdentifier,
          timestamp: new Date().toISOString()
        });
      }
      
      this.logger.info(`Instância de banco de dados parada: ${dbInstanceIdentifier}`);
      return data.DBInstance;
    } catch (error) {
      this.logger.error(`Erro ao parar instância de banco de dados ${dbInstanceIdentifier}`, error);
      throw new Error(`Falha ao parar instância de banco de dados: ${error.message}`);
    }
  }

  /**
   * Reinicia uma instância de banco de dados
   * 
   * @param {string} dbInstanceIdentifier Identificador da instância
   * @param {boolean} forceFailover Forçar failover para a réplica se for Multi-AZ
   * @returns {Promise<Object>} Instância de banco de dados reiniciada
   */
  async rebootDBInstance(dbInstanceIdentifier, forceFailover = false) {
    try {
      const data = await this.rds.rebootDBInstance({
        DBInstanceIdentifier: dbInstanceIdentifier,
        ForceFailover: forceFailover
      }).promise();
      
      // Invalidar cache
      if (this.useCache) {
        this.cache.del(`db-instance-${dbInstanceIdentifier}`);
        this.cache.del('db-instances-{}');
      }
      
      // Emitir evento
      if (this.eventEmitter) {
        this.eventEmitter.emit('rds:instance:rebooted', {
          dbInstanceIdentifier,
          timestamp: new Date().toISOString(),
          forceFailover
        });
      }
      
      this.logger.info(`Instância de banco de dados reiniciada: ${dbInstanceIdentifier}`);
      return data.DBInstance;
    } catch (error) {
      this.logger.error(`Erro ao reiniciar instância de banco de dados ${dbInstanceIdentifier}`, error);
      throw new Error(`Falha ao reiniciar instância de banco de dados: ${error.message}`);
    }
  }

  /**
   * Cria um snapshot de uma instância de banco de dados
   * 
   * @param {string} dbInstanceIdentifier Identificador da instância
   * @param {string} snapshotIdentifier Identificador do snapshot
   * @param {Array} tags Tags a serem aplicadas ao snapshot
   * @returns {Promise<Object>} Snapshot criado
   */
  async createDBSnapshot(dbInstanceIdentifier, snapshotIdentifier, tags = []) {
    try {
      const params = {
        DBInstanceIdentifier: dbInstanceIdentifier,
        DBSnapshotIdentifier: snapshotIdentifier
      };
      
      if (tags && tags.length > 0) {
        params.Tags = tags;
      }
      
      const data = await this.rds.createDBSnapshot(params).promise();
      
      // Emitir evento
      if (this.eventEmitter) {
        this.eventEmitter.emit('rds:snapshot:created', {
          dbInstanceIdentifier,
          snapshotIdentifier,
          timestamp: new Date().toISOString()
        });
      }
      
      this.logger.info(`Snapshot criado para instância de banco de dados ${dbInstanceIdentifier}: ${snapshotIdentifier}`);
      return data.DBSnapshot;
    } catch (error) {
      this.logger.error(`Erro ao criar snapshot para instância de banco de dados ${dbInstanceIdentifier}`, error);
      throw new Error(`Falha ao criar snapshot: ${error.message}`);
    }
  }

  /**
   * Lista snapshots de bancos de dados
   * 
   * @param {Object} filters Filtros opcionais para a listagem
   * @returns {Promise<Array>} Lista de snapshots
   */
  async listDBSnapshots(filters = {}) {
    try {
      if (this.useCache) {
        const cacheKey = `db-snapshots-${JSON.stringify(filters)}`;
        const cachedSnapshots = this.cache.get(cacheKey);
        if (cachedSnapshots) return cachedSnapshots;
      }

      const params = {};
      if (filters.dbInstanceIdentifier) {
        params.DBInstanceIdentifier = filters.dbInstanceIdentifier;
      }
      
      if (filters.snapshotType) {
        params.SnapshotType = filters.snapshotType;
      }
      
      if (filters.dbSnapshotIdentifier) {
        params.DBSnapshotIdentifier = filters.dbSnapshotIdentifier;
      }
      
      const data = await this.rds.describeDBSnapshots(params).promise();
      
      if (this.useCache) {
        const cacheKey = `db-snapshots-${JSON.stringify(filters)}`;
        this.cache.set(cacheKey, data.DBSnapshots);
      }
      
      return data.DBSnapshots;
    } catch (error) {
      this.logger.error('Erro ao listar snapshots de bancos de dados', error);
      throw new Error(`Falha ao listar snapshots: ${error.message}`);
    }
  }

  /**
   * Restaura uma instância de banco de dados a partir de um snapshot
   * 
   * @param {string} snapshotIdentifier Identificador do snapshot
   * @param {string} dbInstanceIdentifier Identificador da nova instância
   * @param {Object} options Opções adicionais para restauração
   * @returns {Promise<Object>} Instância de banco de dados restaurada
   */
  async restoreDBInstanceFromSnapshot(snapshotIdentifier, dbInstanceIdentifier, options = {}) {
    try {
      const params = {
        DBSnapshotIdentifier: snapshotIdentifier,
        DBInstanceIdentifier: dbInstanceIdentifier
      };
      
      // Adicionar parâmetros opcionais
      const validOptions = [
        'DBInstanceClass',
        'Port',
        'AvailabilityZone',
        'DBSubnetGroupName',
        'MultiAZ',
        'PubliclyAccessible',
        'AutoMinorVersionUpgrade',
        'VpcSecurityGroupIds',
        'StorageType',
        'Iops',
        'OptionGroupName',
        'DBParameterGroupName',
        'Tags'
      ];
      
      for (const option of validOptions) {
        if (options[option] !== undefined) {
          params[option] = options[option];
        }
      }
      
      const data = await this.rds.restoreDBInstanceFromDBSnapshot(params).promise();
      
      // Invalidar cache
      if (this.useCache) {
        this.cache.del('db-instances-{}');
      }
      
      // Emitir evento
      if (this.eventEmitter) {
        this.eventEmitter.emit('rds:instance:restored', {
          dbInstanceIdentifier,
          snapshotIdentifier,
          timestamp: new Date().toISOString()
        });
      }
      
      this.logger.info(`Instância de banco de dados restaurada do snapshot ${snapshotIdentifier} para ${dbInstanceIdentifier}`);
      return data.DBInstance;
    } catch (error) {
      this.logger.error(`Erro ao restaurar instância de banco de dados a partir do snapshot ${snapshotIdentifier}`, error);
      throw new Error(`Falha ao restaurar instância de banco de dados: ${error.message}`);
    }
  }

  /**
   * Lista os eventos RDS ocorridos
   * 
   * @param {Object} filters Filtros opcionais para a listagem
   * @param {number} maxResults Número máximo de resultados
   * @returns {Promise<Array>} Lista de eventos
   */
  async listEvents(filters = {}, maxResults = 100) {
    try {
      const params = {
        MaxRecords: maxResults
      };
      
      if (filters.sourceType) {
        params.SourceType = filters.sourceType;
      }
      
      if (filters.sourceIdentifier) {
        params.SourceIdentifier = filters.sourceIdentifier;
      }
      
      if (filters.startTime) {
        params.StartTime = new Date(filters.startTime);
      }
      
      if (filters.endTime) {
        params.EndTime = new Date(filters.endTime);
      }
      
      if (filters.duration) {
        params.Duration = filters.duration;
      }
      
      if (filters.eventCategories) {
        params.EventCategories = filters.eventCategories;
      }
      
      const data = await this.rds.describeEvents(params).promise();
      
      return data.Events;
    } catch (error) {
      this.logger.error('Erro ao listar eventos RDS', error);
      throw new Error(`Falha ao listar eventos: ${error.message}`);
    }
  }

  /**
   * Lista parameter groups disponíveis
   * 
   * @param {Object} filters Filtros opcionais para a listagem
   * @returns {Promise<Array>} Lista de parameter groups
   */
  async listDBParameterGroups(filters = {}) {
    try {
      if (this.useCache) {
        const cacheKey = `db-parameter-groups-${JSON.stringify(filters)}`;
        const cachedGroups = this.cache.get(cacheKey);
        if (cachedGroups) return cachedGroups;
      }

      const params = {};
      if (filters.dbParameterGroupName) {
        params.DBParameterGroupName = filters.dbParameterGroupName;
      }
      
      const data = await this.rds.describeDBParameterGroups(params).promise();
      
      if (this.useCache) {
        const cacheKey = `db-parameter-groups-${JSON.stringify(filters)}`;
        this.cache.set(cacheKey, data.DBParameterGroups);
      }
      
      return data.DBParameterGroups;
    } catch (error) {
      this.logger.error('Erro ao listar parameter groups', error);
      throw new Error(`Falha ao listar parameter groups: ${error.message}`);
    }
  }

  /**
   * Lista os parâmetros de um parameter group
   * 
   * @param {string} dbParameterGroupName Nome do parameter group
   * @param {Object} filters Filtros opcionais para a listagem
   * @returns {Promise<Array>} Lista de parâmetros
   */
  async listDBParameters(dbParameterGroupName, filters = {}) {
    try {
      if (this.useCache) {
        const cacheKey = `db-parameters-${dbParameterGroupName}-${JSON.stringify(filters)}`;
        const cachedParameters = this.cache.get(cacheKey);
        if (cachedParameters) return cachedParameters;
      }

      const params = {
        DBParameterGroupName: dbParameterGroupName
      };
      
      if (filters.source) {
        params.Source = filters.source;
      }
      
      const data = await this.rds.describeDBParameters(params).promise();
      
      if (this.useCache) {
        const cacheKey = `db-parameters-${dbParameterGroupName}-${JSON.stringify(filters)}`;
        this.cache.set(cacheKey, data.Parameters);
      }
      
      return data.Parameters;
    } catch (error) {
      this.logger.error(`Erro ao listar parâmetros do parameter group ${dbParameterGroupName}`, error);
      throw new Error(`Falha ao listar parâmetros: ${error.message}`);
    }
  }

  /**
   * Obtém informações de engines de banco de dados disponíveis
   * 
   * @param {Object} filters Filtros opcionais para a listagem
   * @returns {Promise<Array>} Lista de engines disponíveis
   */
  async listDBEngines(filters = {}) {
    try {
      if (this.useCache) {
        const cacheKey = `db-engines-${JSON.stringify(filters)}`;
        const cachedEngines = this.cache.get(cacheKey);
        if (cachedEngines) return cachedEngines;
      }

      const params = {};
      if (filters.engine) {
        params.Engine = filters.engine;
      }
      
      if (filters.engineVersion) {
        params.EngineVersion = filters.engineVersion;
      }
      
      const data = await this.rds.describeDBEngineVersions(params).promise();
      
      if (this.useCache) {
        const cacheKey = `db-engines-${JSON.stringify(filters)}`;
        this.cache.set(cacheKey, data.DBEngineVersions);
      }
      
      return data.DBEngineVersions;
    } catch (error) {
      this.logger.error('Erro ao listar engines de banco de dados', error);
      throw new Error(`Falha ao listar engines: ${error.message}`);
    }
  }

  /**
   * Obtém métricas de performance para uma instância
   * 
   * @param {string} dbInstanceIdentifier Identificador da instância
   * @param {string} metricName Nome da métrica
   * @param {number} period Período em segundos
   * @param {Date} startTime Data de início
   * @param {Date} endTime Data de fim
   * @returns {Promise<Object>} Dados de métrica
   */
  async getDBMetric(dbInstanceIdentifier, metricName, period = 60, startTime = new Date(Date.now() - 3600000), endTime = new Date()) {
    try {
      // Usa CloudWatch para obter métricas de performance
      const cloudwatch = new AWS.CloudWatch({
        region: this.config.region,
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey
      });
      
      const params = {
        MetricName: metricName,
        Namespace: 'AWS/RDS',
        Period: period,
        StartTime: startTime,
        EndTime: endTime,
        Dimensions: [
          {
            Name: 'DBInstanceIdentifier',
            Value: dbInstanceIdentifier
          }
        ],
        Statistics: ['Average', 'Maximum', 'Minimum']
      };
      
      const data = await cloudwatch.getMetricStatistics(params).promise();
      
      return {
        dbInstanceIdentifier,
        metricName,
        period,
        startTime,
        endTime,
        datapoints: data.Datapoints
      };
    } catch (error) {
      this.logger.error(`Erro ao obter métrica ${metricName} para instância ${dbInstanceIdentifier}`, error);
      throw new Error(`Falha ao obter métrica: ${error.message}`);
    }
  }

  /**
   * Obtém múltiplas métricas comuns para uma instância
   * 
   * @param {string} dbInstanceIdentifier Identificador da instância
   * @param {Date} startTime Data de início
   * @param {Date} endTime Data de fim
   * @returns {Promise<Object>} Dados de métricas
   */
  async getDBMetrics(dbInstanceIdentifier, startTime = new Date(Date.now() - 3600000), endTime = new Date()) {
    try {
      // Lista de métricas comuns para monitoramento de RDS
      const commonMetrics = [
        'CPUUtilization',
        'FreeableMemory',
        'FreeStorageSpace',
        'DatabaseConnections',
        'ReadIOPS',
        'WriteIOPS',
        'ReadLatency',
        'WriteLatency'
      ];
      
      const metrics = {};
      
      // Obter cada métrica paralelamente
      await Promise.all(commonMetrics.map(async (metricName) => {
        try {
          metrics[metricName] = await this.getDBMetric(
            dbInstanceIdentifier,
            metricName,
            300, // 5 minutos
            startTime,
            endTime
          );
        } catch (error) {
          this.logger.error(`Erro ao obter métrica ${metricName}`, error);
          metrics[metricName] = { error: error.message };
        }
      }));
      
      return {
        dbInstanceIdentifier,
        startTime,
        endTime,
        metrics
      };
    } catch (error) {
      this.logger.error(`Erro ao obter métricas para instância ${dbInstanceIdentifier}`, error);
      throw new Error(`Falha ao obter métricas: ${error.message}`);
    }
  }
}

module.exports = RDSManager;