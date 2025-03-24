/**
 * Testes de integração para AWS RDS Manager
 * 
 * Para executar esses testes, é necessário configurar as credenciais AWS no ambiente
 * ou no arquivo de configuração de teste.
 * 
 * @jest-environment node
 */

const RDSManager = require('../../../providers/cloud/aws/rds');
const { v4: uuidv4 } = require('uuid');

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
      RDS: jest.fn().mockImplementation(() => {
        return {
          describeDBInstances: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              DBInstances: [
                {
                  DBInstanceIdentifier: 'test-db-1',
                  DBInstanceClass: 'db.t2.micro',
                  Engine: 'mysql',
                  DBInstanceStatus: 'available',
                  Endpoint: {
                    Address: 'test-db-1.example.com',
                    Port: 3306
                  },
                  AllocatedStorage: 20,
                  EngineVersion: '8.0.27'
                },
                {
                  DBInstanceIdentifier: 'test-db-2',
                  DBInstanceClass: 'db.t3.small',
                  Engine: 'postgres',
                  DBInstanceStatus: 'available',
                  Endpoint: {
                    Address: 'test-db-2.example.com',
                    Port: 5432
                  },
                  AllocatedStorage: 50,
                  EngineVersion: '13.4'
                }
              ]
            })
          }),
          createDBInstance: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              DBInstance: {
                DBInstanceIdentifier: 'test-new-db',
                DBInstanceClass: 'db.t2.micro',
                Engine: 'mysql',
                DBInstanceStatus: 'creating',
                AllocatedStorage: 20
              }
            })
          }),
          modifyDBInstance: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              DBInstance: {
                DBInstanceIdentifier: 'test-db-1',
                DBInstanceClass: 'db.t2.small',
                Engine: 'mysql',
                DBInstanceStatus: 'modifying',
                AllocatedStorage: 30
              }
            })
          }),
          deleteDBInstance: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              DBInstance: {
                DBInstanceIdentifier: 'test-db-1',
                DBInstanceStatus: 'deleting'
              }
            })
          }),
          startDBInstance: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              DBInstance: {
                DBInstanceIdentifier: 'test-db-1',
                DBInstanceStatus: 'starting'
              }
            })
          }),
          stopDBInstance: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              DBInstance: {
                DBInstanceIdentifier: 'test-db-1',
                DBInstanceStatus: 'stopping'
              }
            })
          }),
          rebootDBInstance: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              DBInstance: {
                DBInstanceIdentifier: 'test-db-1',
                DBInstanceStatus: 'rebooting'
              }
            })
          }),
          createDBSnapshot: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              DBSnapshot: {
                DBSnapshotIdentifier: 'test-snapshot',
                DBInstanceIdentifier: 'test-db-1',
                SnapshotCreateTime: new Date(),
                Status: 'creating'
              }
            })
          }),
          describeDBSnapshots: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              DBSnapshots: [
                {
                  DBSnapshotIdentifier: 'test-snapshot-1',
                  DBInstanceIdentifier: 'test-db-1',
                  SnapshotCreateTime: new Date(),
                  Status: 'available'
                },
                {
                  DBSnapshotIdentifier: 'test-snapshot-2',
                  DBInstanceIdentifier: 'test-db-1',
                  SnapshotCreateTime: new Date(),
                  Status: 'available'
                }
              ]
            })
          }),
          restoreDBInstanceFromDBSnapshot: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              DBInstance: {
                DBInstanceIdentifier: 'test-restored-db',
                DBInstanceStatus: 'creating',
                Engine: 'mysql'
              }
            })
          }),
          describeEvents: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              Events: [
                {
                  SourceIdentifier: 'test-db-1',
                  SourceType: 'db-instance',
                  Message: 'DB instance started',
                  Date: new Date(),
                  EventCategories: ['availability']
                },
                {
                  SourceIdentifier: 'test-db-1',
                  SourceType: 'db-instance',
                  Message: 'DB instance stopped',
                  Date: new Date(),
                  EventCategories: ['availability']
                }
              ]
            })
          }),
          describeDBParameterGroups: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              DBParameterGroups: [
                {
                  DBParameterGroupName: 'default.mysql8.0',
                  DBParameterGroupFamily: 'mysql8.0',
                  Description: 'Default parameter group for mysql8.0'
                },
                {
                  DBParameterGroupName: 'default.postgres13',
                  DBParameterGroupFamily: 'postgres13',
                  Description: 'Default parameter group for postgres13'
                }
              ]
            })
          }),
          describeDBParameters: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              Parameters: [
                {
                  ParameterName: 'max_connections',
                  ParameterValue: '100',
                  Description: 'Maximum number of connections',
                  DataType: 'integer',
                  IsModifiable: true
                },
                {
                  ParameterName: 'innodb_buffer_pool_size',
                  ParameterValue: '134217728',
                  Description: 'InnoDB buffer pool size in bytes',
                  DataType: 'integer',
                  IsModifiable: true
                }
              ]
            })
          }),
          describeDBEngineVersions: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              DBEngineVersions: [
                {
                  Engine: 'mysql',
                  EngineVersion: '8.0.27',
                  DBEngineDescription: 'MySQL Community Edition',
                  DBEngineVersionDescription: 'MySQL 8.0.27'
                },
                {
                  Engine: 'postgres',
                  EngineVersion: '13.4',
                  DBEngineDescription: 'PostgreSQL',
                  DBEngineVersionDescription: 'PostgreSQL 13.4'
                }
              ]
            })
          })
        };
      }),
      CloudWatch: jest.fn().mockImplementation(() => {
        return {
          getMetricStatistics: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              Datapoints: [
                {
                  Timestamp: new Date(Date.now() - 300000),
                  Average: 5.23,
                  Maximum: 12.87,
                  Minimum: 1.12,
                  Unit: 'Percent'
                },
                {
                  Timestamp: new Date(),
                  Average: 7.45,
                  Maximum: 15.32,
                  Minimum: 2.18,
                  Unit: 'Percent'
                }
              ]
            })
          })
        };
      })
    };
  });
}

// Gerar identificadores únicos para testes
const testDBInstanceIdentifier = `php-universal-mcp-test-${uuidv4().substring(0, 8).toLowerCase()}`;
let rdsManager;

beforeAll(() => {
  // Inicializar RDSManager antes de todos os testes
  rdsManager = new RDSManager(config, { useCache: true });
});

describe('AWS RDS Manager - Operações Básicas', () => {
  // Pular testes que requerem credenciais reais se estivermos no modo de mock
  const conditionalTest = process.env.TEST_MODE === 'mock' ? test : (process.env.AWS_ACCESS_KEY_ID ? test : test.skip);
  
  conditionalTest('Deve listar instâncias de banco de dados', async () => {
    const instances = await rdsManager.listDBInstances();
    expect(Array.isArray(instances)).toBe(true);
    if (instances.length > 0) {
      expect(instances[0]).toHaveProperty('DBInstanceIdentifier');
      expect(instances[0]).toHaveProperty('Engine');
      expect(instances[0]).toHaveProperty('DBInstanceStatus');
    }
  });
  
  conditionalTest('Deve listar engines de banco de dados disponíveis', async () => {
    const engines = await rdsManager.listDBEngines();
    expect(Array.isArray(engines)).toBe(true);
    if (engines.length > 0) {
      expect(engines[0]).toHaveProperty('Engine');
      expect(engines[0]).toHaveProperty('EngineVersion');
    }
  });
  
  conditionalTest('Deve listar parameter groups', async () => {
    const parameterGroups = await rdsManager.listDBParameterGroups();
    expect(Array.isArray(parameterGroups)).toBe(true);
    if (parameterGroups.length > 0) {
      expect(parameterGroups[0]).toHaveProperty('DBParameterGroupName');
      expect(parameterGroups[0]).toHaveProperty('DBParameterGroupFamily');
    }
  });
});

// Testes de criação e gerenciamento de instâncias reais - executar apenas em ambientes de teste controlados
describe('AWS RDS Manager - Gerenciamento de Instâncias', () => {
  const mockTest = process.env.TEST_MODE === 'mock' ? test : test.skip;
  
  mockTest('Deve criar uma instância de banco de dados', async () => {
    const params = {
      dbInstanceIdentifier: testDBInstanceIdentifier,
      engine: 'mysql',
      dbInstanceClass: 'db.t2.micro',
      masterUsername: 'admin',
      masterUserPassword: 'StrongPassword123!',
      allocatedStorage: 20,
      dbName: 'testdb',
      port: 3306,
      publiclyAccessible: true
    };
    
    const instance = await rdsManager.createDBInstance(params);
    expect(instance).toHaveProperty('DBInstanceIdentifier', testDBInstanceIdentifier);
    expect(instance).toHaveProperty('Engine', 'mysql');
  });
  
  mockTest('Deve modificar uma instância de banco de dados', async () => {
    const params = {
      DBInstanceClass: 'db.t2.small',
      AllocatedStorage: 30,
      BackupRetentionPeriod: 7,
      ApplyImmediately: true
    };
    
    const instance = await rdsManager.modifyDBInstance(testDBInstanceIdentifier, params);
    expect(instance).toHaveProperty('DBInstanceIdentifier', testDBInstanceIdentifier);
    expect(instance).toHaveProperty('DBInstanceClass', 'db.t2.small');
  });
  
  mockTest('Deve criar um snapshot de uma instância de banco de dados', async () => {
    const snapshotIdentifier = `${testDBInstanceIdentifier}-snapshot`;
    const snapshot = await rdsManager.createDBSnapshot(testDBInstanceIdentifier, snapshotIdentifier);
    
    expect(snapshot).toHaveProperty('DBSnapshotIdentifier', snapshotIdentifier);
    expect(snapshot).toHaveProperty('DBInstanceIdentifier', testDBInstanceIdentifier);
  });
  
  mockTest('Deve listar snapshots de uma instância de banco de dados', async () => {
    const snapshots = await rdsManager.listDBSnapshots({
      dbInstanceIdentifier: testDBInstanceIdentifier
    });
    
    expect(Array.isArray(snapshots)).toBe(true);
    if (snapshots.length > 0) {
      expect(snapshots[0]).toHaveProperty('DBSnapshotIdentifier');
      expect(snapshots[0]).toHaveProperty('DBInstanceIdentifier', testDBInstanceIdentifier);
    }
  });
  
  mockTest('Deve reiniciar uma instância de banco de dados', async () => {
    const instance = await rdsManager.rebootDBInstance(testDBInstanceIdentifier);
    expect(instance).toHaveProperty('DBInstanceIdentifier', testDBInstanceIdentifier);
    expect(instance).toHaveProperty('DBInstanceStatus', 'rebooting');
  });
  
  mockTest('Deve restaurar uma instância de banco de dados a partir de um snapshot', async () => {
    const restoredInstanceId = `${testDBInstanceIdentifier}-restored`;
    const snapshots = await rdsManager.listDBSnapshots({
      dbInstanceIdentifier: testDBInstanceIdentifier
    });
    
    if (snapshots && snapshots.length > 0) {
      const snapshotId = snapshots[0].DBSnapshotIdentifier;
      const instance = await rdsManager.restoreDBInstanceFromSnapshot(snapshotId, restoredInstanceId);
      
      expect(instance).toHaveProperty('DBInstanceIdentifier', restoredInstanceId);
    } else {
      console.warn('Nenhum snapshot disponível para teste de restauração');
    }
  });
  
  mockTest('Deve excluir uma instância de banco de dados', async () => {
    const instance = await rdsManager.deleteDBInstance(testDBInstanceIdentifier, true);
    expect(instance).toHaveProperty('DBInstanceIdentifier', testDBInstanceIdentifier);
    expect(instance).toHaveProperty('DBInstanceStatus', 'deleting');
  });
});

describe('AWS RDS Manager - Monitoramento', () => {
  const mockTest = process.env.TEST_MODE === 'mock' ? test : test.skip;
  
  mockTest('Deve obter eventos de uma instância de banco de dados', async () => {
    const events = await rdsManager.listEvents({
      sourceType: 'db-instance',
      sourceIdentifier: 'test-db-1'
    });
    
    expect(Array.isArray(events)).toBe(true);
    if (events.length > 0) {
      expect(events[0]).toHaveProperty('SourceIdentifier');
      expect(events[0]).toHaveProperty('Message');
      expect(events[0]).toHaveProperty('Date');
    }
  });
  
  mockTest('Deve obter métricas de uma instância de banco de dados', async () => {
    const metric = await rdsManager.getDBMetric('test-db-1', 'CPUUtilization');
    
    expect(metric).toHaveProperty('dbInstanceIdentifier', 'test-db-1');
    expect(metric).toHaveProperty('metricName', 'CPUUtilization');
    expect(metric).toHaveProperty('datapoints');
    expect(Array.isArray(metric.datapoints)).toBe(true);
  });
  
  mockTest('Deve obter múltiplas métricas comuns de uma instância de banco de dados', async () => {
    const metrics = await rdsManager.getDBMetrics('test-db-1');
    
    expect(metrics).toHaveProperty('dbInstanceIdentifier', 'test-db-1');
    expect(metrics).toHaveProperty('metrics');
    expect(metrics.metrics).toHaveProperty('CPUUtilization');
    expect(metrics.metrics).toHaveProperty('FreeableMemory');
    expect(metrics.metrics).toHaveProperty('DatabaseConnections');
  });
});

describe('AWS RDS Manager - Cache e Otimização', () => {
  test('Deve utilizar cache para operações repetidas', async () => {
    // Criar um RDSManager com cache
    const cachedManager = new RDSManager(config, { useCache: true, cacheTTL: 60 });
    
    // Mock para o método listDBInstances do RDS
    const originalListDBInstances = cachedManager.rds.describeDBInstances;
    let callCount = 0;
    
    cachedManager.rds.describeDBInstances = jest.fn().mockImplementation(() => {
      callCount++;
      return {
        promise: () => Promise.resolve({
          DBInstances: [
            {
              DBInstanceIdentifier: 'test-db-1',
              Engine: 'mysql',
              DBInstanceStatus: 'available'
            }
          ]
        })
      };
    });
    
    // Primeira chamada - deve chamar o método real
    await cachedManager.listDBInstances();
    expect(callCount).toBe(1);
    
    // Segunda chamada - deve usar o cache
    await cachedManager.listDBInstances();
    expect(callCount).toBe(1); // Não deve ter incrementado
    
    // Restaurar o método original
    cachedManager.rds.describeDBInstances = originalListDBInstances;
  });
  
  test('Deve invalidar cache ao modificar recursos', async () => {
    // Criar um RDSManager com cache
    const cachedManager = new RDSManager(config, { useCache: true, cacheTTL: 60 });
    
    // Mock e espias para os métodos
    const mockListDBInstances = jest.fn().mockReturnValue({
      promise: () => Promise.resolve({
        DBInstances: [
          {
            DBInstanceIdentifier: 'test-db-1',
            Engine: 'mysql',
            DBInstanceStatus: 'available'
          }
        ]
      })
    });
    
    const mockModifyDBInstance = jest.fn().mockReturnValue({
      promise: () => Promise.resolve({
        DBInstance: {
          DBInstanceIdentifier: 'test-db-1',
          Engine: 'mysql',
          DBInstanceStatus: 'modifying'
        }
      })
    });
    
    const spyGetCache = jest.spyOn(cachedManager.cache, 'get');
    const spySetCache = jest.spyOn(cachedManager.cache, 'set');
    const spyDelCache = jest.spyOn(cachedManager.cache, 'del');
    
    // Substituir métodos por mocks
    cachedManager.rds.describeDBInstances = mockListDBInstances;
    cachedManager.rds.modifyDBInstance = mockModifyDBInstance;
    
    // Primeira listagem - deve armazenar em cache
    await cachedManager.listDBInstances();
    expect(mockListDBInstances).toHaveBeenCalledTimes(1);
    expect(spySetCache).toHaveBeenCalled();
    
    // Modificar instância - deve invalidar cache
    await cachedManager.modifyDBInstance('test-db-1', { AllocatedStorage: 30 });
    expect(mockModifyDBInstance).toHaveBeenCalledTimes(1);
    expect(spyDelCache).toHaveBeenCalledWith('db-instance-test-db-1');
    expect(spyDelCache).toHaveBeenCalledWith('db-instances-{}');
    
    // Restaurar spies
    spyGetCache.mockRestore();
    spySetCache.mockRestore();
    spyDelCache.mockRestore();
  });
});

// Se for mock, podemos testar o gerenciamento de erros
if (process.env.TEST_MODE === 'mock') {
  describe('AWS RDS Manager - Tratamento de Erros', () => {
    test('Deve tratar erros de criação de instância de banco de dados', async () => {
      // Sobrescrever método para simular erro
      const originalCreateDBInstance = rdsManager.rds.createDBInstance;
      rdsManager.rds.createDBInstance = jest.fn().mockReturnValue({
        promise: () => Promise.reject(new Error('DBInstanceAlreadyExists'))
      });
      
      // Testar tratamento de erro
      await expect(rdsManager.createDBInstance({
        dbInstanceIdentifier: 'existing-db',
        engine: 'mysql',
        dbInstanceClass: 'db.t2.micro',
        masterUsername: 'admin',
        masterUserPassword: 'password',
        allocatedStorage: 20
      })).rejects.toThrow('Falha ao criar instância de banco de dados');
      
      // Restaurar método original
      rdsManager.rds.createDBInstance = originalCreateDBInstance;
    });
    
    test('Deve tratar erros ao obter instância inexistente', async () => {
      // Sobrescrever método para simular erro
      const originalDescribeDBInstances = rdsManager.rds.describeDBInstances;
      rdsManager.rds.describeDBInstances = jest.fn().mockReturnValue({
        promise: () => Promise.reject(new Error('DBInstanceNotFound'))
      });
      
      // Testar tratamento de erro
      await expect(rdsManager.getDBInstance('non-existent-db')).rejects.toThrow('Falha ao obter instância de banco de dados');
      
      // Restaurar método original
      rdsManager.rds.describeDBInstances = originalDescribeDBInstances;
    });
  });
}