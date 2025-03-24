/**
 * EC2Manager Integration Tests
 * 
 * @jest-environment node
 */

const AWS = require('aws-sdk');
const EC2Manager = require('../../../../providers/cloud/aws/ec2');

// Mock para a SDK da AWS
jest.mock('aws-sdk', () => {
  const mockEC2 = {
    describeInstances: jest.fn().mockReturnThis(),
    runInstances: jest.fn().mockReturnThis(),
    startInstances: jest.fn().mockReturnThis(),
    stopInstances: jest.fn().mockReturnThis(),
    rebootInstances: jest.fn().mockReturnThis(),
    terminateInstances: jest.fn().mockReturnThis(),
    describeImages: jest.fn().mockReturnThis(),
    describeInstanceTypes: jest.fn().mockReturnThis(),
    describeSecurityGroups: jest.fn().mockReturnThis(),
    createImage: jest.fn().mockReturnThis(),
    waitFor: jest.fn().mockReturnThis(),
    promise: jest.fn()
  };

  return {
    EC2: jest.fn(() => mockEC2),
    config: {
      update: jest.fn()
    }
  };
});

describe('EC2Manager', () => {
  let ec2Manager;
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

    // Instanciar o gerenciador EC2
    ec2Manager = new EC2Manager({ 
      aws: AWS, 
      logger: mockLogger 
    });
  });

  describe('constructor', () => {
    it('deve lançar erro quando AWS SDK não é fornecido', () => {
      expect(() => new EC2Manager({ logger: mockLogger }))
        .toThrow('A instância do AWS SDK é necessária');
    });

    it('deve criar uma instância válida com opções corretas', () => {
      expect(ec2Manager).toBeInstanceOf(EC2Manager);
      expect(ec2Manager.aws).toBe(AWS);
      expect(ec2Manager.logger).toBe(mockLogger);
      expect(AWS.EC2).toHaveBeenCalledWith({ apiVersion: '2016-11-15' });
    });
  });

  describe('listInstances', () => {
    it('deve listar instâncias corretamente', async () => {
      // Setup mock
      const mockResponse = {
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-1234567890abcdef0',
                InstanceType: 't2.micro',
                State: { Name: 'running' },
                Placement: { AvailabilityZone: 'us-east-1a' },
                PublicIpAddress: '12.34.56.78',
                PrivateIpAddress: '172.31.0.1',
                Tags: [
                  { Key: 'Name', Value: 'Test Instance' }
                ],
                SecurityGroups: [
                  { GroupId: 'sg-123456', GroupName: 'default' }
                ],
                LaunchTime: new Date(),
                Architecture: 'x86_64',
                RootDeviceType: 'ebs',
                RootDeviceName: '/dev/sda1',
                BlockDeviceMappings: [],
                VpcId: 'vpc-123456',
                SubnetId: 'subnet-123456',
                Monitoring: { State: 'enabled' }
              }
            ]
          }
        ]
      };

      ec2Manager.ec2.promise.mockResolvedValueOnce(mockResponse);

      // Executar método
      const result = await ec2Manager.listInstances();

      // Verificar resultado
      expect(ec2Manager.ec2.describeInstances).toHaveBeenCalled();
      expect(ec2Manager.ec2.promise).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('i-1234567890abcdef0');
      expect(result[0].name).toBe('Test Instance');
      expect(result[0].state).toBe('running');
      expect(mockLogger.info).toHaveBeenCalledWith('Listando instâncias EC2');
      expect(mockLogger.info).toHaveBeenCalledWith('1 instâncias EC2 encontradas');
    });

    it('deve aplicar filtros quando fornecidos', async () => {
      // Setup mock
      ec2Manager.ec2.promise.mockResolvedValueOnce({
        Reservations: []
      });

      // Executar método com filtros
      const filters = {
        instanceIds: ['i-1234567890abcdef0'],
        filters: [
          { Name: 'instance-state-name', Values: ['running'] }
        ]
      };

      await ec2Manager.listInstances(filters);

      // Verificar que os filtros foram aplicados
      expect(ec2Manager.ec2.describeInstances).toHaveBeenCalledWith({
        InstanceIds: ['i-1234567890abcdef0'],
        Filters: [
          { Name: 'instance-state-name', Values: ['running'] }
        ]
      });
    });

    it('deve lidar com erros corretamente', async () => {
      // Setup mock para lançar um erro
      const error = new Error('AWS API Error');
      ec2Manager.ec2.promise.mockRejectedValueOnce(error);

      // Executar método e verificar que o erro é tratado
      await expect(ec2Manager.listInstances()).rejects.toThrow('AWS API Error');
      expect(mockLogger.error).toHaveBeenCalledWith('Erro ao listar instâncias EC2:', error);
    });
  });

  describe('getInstance', () => {
    it('deve obter detalhes de uma instância específica', async () => {
      // Setup mock para listInstances
      const mockInstance = {
        id: 'i-1234567890abcdef0',
        name: 'Test Instance',
        state: 'running'
      };

      // Sobrescrever o método listInstances
      ec2Manager.listInstances = jest.fn().mockResolvedValueOnce([mockInstance]);

      // Executar método
      const result = await ec2Manager.getInstance('i-1234567890abcdef0');

      // Verificar resultado
      expect(ec2Manager.listInstances).toHaveBeenCalledWith({
        instanceIds: ['i-1234567890abcdef0']
      });
      expect(result).toEqual(mockInstance);
      expect(mockLogger.info).toHaveBeenCalledWith('Obtendo detalhes da instância EC2 i-1234567890abcdef0');
    });

    it('deve lançar erro quando a instância não é encontrada', async () => {
      // Setup mock para listInstances retornar array vazio
      ec2Manager.listInstances = jest.fn().mockResolvedValueOnce([]);

      // Executar método e verificar erro
      await expect(ec2Manager.getInstance('i-nonexistent')).rejects.toThrow(
        'Instância EC2 i-nonexistent não encontrada'
      );
    });
  });

  describe('createInstance', () => {
    it('deve criar uma instância corretamente', async () => {
      // Setup mock para runInstances
      const mockRunInstancesResponse = {
        Instances: [
          { InstanceId: 'i-new1234567890' }
        ]
      };
      ec2Manager.ec2.promise.mockResolvedValueOnce(mockRunInstancesResponse);

      // Mock para _waitForInstance
      ec2Manager._waitForInstance = jest.fn().mockResolvedValueOnce(true);

      // Mock para getInstance
      const mockInstanceDetails = {
        id: 'i-new1234567890',
        name: 'New Instance',
        state: 'running'
      };
      ec2Manager.getInstance = jest.fn().mockResolvedValueOnce(mockInstanceDetails);

      // Opções para criação de instância
      const options = {
        imageId: 'ami-12345678',
        instanceType: 't2.micro',
        keyName: 'my-key',
        securityGroupIds: ['sg-123456'],
        tags: [
          { key: 'Name', value: 'New Instance' }
        ],
        userData: 'IyEvYmluL2Jhc2gKZWNobyAiSGVsbG8gV29ybGQi' // Base64 encoded
      };

      // Executar método
      const result = await ec2Manager.createInstance(options);

      // Verificar resultado
      expect(ec2Manager.ec2.runInstances).toHaveBeenCalledWith(expect.objectContaining({
        ImageId: 'ami-12345678',
        InstanceType: 't2.micro',
        MinCount: 1,
        MaxCount: 1,
        KeyName: 'my-key',
        SecurityGroupIds: ['sg-123456'],
        UserData: 'IyEvYmluL2Jhc2gKZWNobyAiSGVsbG8gV29ybGQi',
        TagSpecifications: [
          {
            ResourceType: 'instance',
            Tags: [
              { Key: 'Name', Value: 'New Instance' }
            ]
          }
        ]
      }));
      
      expect(ec2Manager._waitForInstance).toHaveBeenCalledWith('i-new1234567890', 'running');
      expect(ec2Manager.getInstance).toHaveBeenCalledWith('i-new1234567890');
      expect(result).toEqual(mockInstanceDetails);
      expect(mockLogger.info).toHaveBeenCalledWith('Criando instância EC2');
      expect(mockLogger.info).toHaveBeenCalledWith('Instância EC2 i-new1234567890 criada com sucesso');
    });
  });

  describe('controlInstance', () => {
    const actions = [
      { action: 'start', method: 'startInstances', waitFor: 'running' },
      { action: 'stop', method: 'stopInstances', waitFor: 'stopped' },
      { action: 'reboot', method: 'rebootInstances', waitFor: 'running' },
      { action: 'terminate', method: 'terminateInstances', waitFor: 'terminated' }
    ];

    actions.forEach(({ action, method, waitFor }) => {
      it(`deve executar a ação ${action} corretamente`, async () => {
        // Setup mocks
        ec2Manager.ec2.promise.mockResolvedValueOnce({}); // Mock para a ação
        
        // Mock para _waitForInstance exceto para reboot
        if (action !== 'reboot') {
          ec2Manager._waitForInstance = jest.fn().mockResolvedValueOnce(true);
        } else {
          // Reboot não chama _waitForInstance, em vez disso, usa setTimeout
          jest.useFakeTimers();
        }

        // Mock para getInstance
        const mockInstanceDetails = {
          id: 'i-test1234',
          state: waitFor
        };
        ec2Manager.getInstance = jest.fn().mockResolvedValueOnce(mockInstanceDetails);

        // Executar método
        const result = await ec2Manager.controlInstance('i-test1234', action);

        // Verificar resultado
        expect(ec2Manager.ec2[method]).toHaveBeenCalledWith({
          InstanceIds: ['i-test1234']
        });
        
        if (action !== 'reboot') {
          expect(ec2Manager._waitForInstance).toHaveBeenCalledWith('i-test1234', waitFor);
        } else {
          // Para reboot, verificar setTimeout
          expect(setTimeout).toHaveBeenCalledTimes(1);
          expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 10000);
          jest.runAllTimers(); // Executar setTimeout
        }
        
        expect(ec2Manager.getInstance).toHaveBeenCalledWith('i-test1234');
        expect(result).toEqual(mockInstanceDetails);
        expect(mockLogger.info).toHaveBeenCalledWith(`Executando ação ${action} na instância EC2 i-test1234`);
        expect(mockLogger.info).toHaveBeenCalledWith(`Ação ${action} concluída na instância EC2 i-test1234`);
      });
    });

    it('deve lançar erro para ação inválida', async () => {
      await expect(ec2Manager.controlInstance('i-test1234', 'invalid')).rejects.toThrow(
        'Ação inválida: invalid'
      );
    });
  });

  describe('getMetrics', () => {
    it('deve retornar métricas formatadas corretamente', async () => {
      // Mock para listInstances
      const mockInstances = [
        { id: 'i-1', state: 'running', type: 't2.micro', availabilityZone: 'us-east-1a' },
        { id: 'i-2', state: 'running', type: 't2.small', availabilityZone: 'us-east-1b' },
        { id: 'i-3', state: 'stopped', type: 't2.micro', availabilityZone: 'us-east-1a' }
      ];
      ec2Manager.listInstances = jest.fn().mockResolvedValueOnce(mockInstances);

      // Executar método
      const result = await ec2Manager.getMetrics();

      // Verificar resultado
      expect(ec2Manager.listInstances).toHaveBeenCalled();
      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('total', 3);
      expect(result.summary).toHaveProperty('running', 2);
      expect(result.summary).toHaveProperty('stopped', 1);
      expect(result).toHaveProperty('byType');
      expect(result.byType).toHaveProperty('t2.micro', 2);
      expect(result.byType).toHaveProperty('t2.small', 1);
      expect(result).toHaveProperty('byRegion');
      expect(result).toHaveProperty('byState');
      expect(result).toHaveProperty('instanceMetrics');
      expect(result.instanceMetrics).toHaveLength(2); // Apenas instâncias em execução
      expect(mockLogger.info).toHaveBeenCalledWith('Obtendo métricas de instâncias EC2');
    });
  });
});
