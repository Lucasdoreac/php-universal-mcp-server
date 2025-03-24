/**
 * EC2 Manager
 * 
 * Gerenciador para serviços AWS EC2 (Amazon Elastic Compute Cloud)
 * @module providers/cloud/aws/ec2
 * @version 1.0.0
 */

/**
 * Classe de gerenciamento de instâncias EC2
 */
class EC2Manager {
  /**
   * Cria uma nova instância do gerenciador EC2
   * @param {Object} options - Opções de configuração
   * @param {Object} options.aws - Instância do AWS SDK
   * @param {Object} options.logger - Logger para registrar operações
   */
  constructor(options = {}) {
    if (!options.aws) {
      throw new Error('A instância do AWS SDK é necessária');
    }
    
    this.aws = options.aws;
    this.ec2 = new this.aws.EC2({ apiVersion: '2016-11-15' });
    this.logger = options.logger || console;
  }
  
  /**
   * Lista todas as instâncias EC2
   * @param {Object} [filters] - Filtros opcionais
   * @returns {Promise<Array>} Lista de instâncias EC2
   */
  async listInstances(filters = {}) {
    try {
      this.logger.info('Listando instâncias EC2');
      
      const params = {};
      
      if (filters.instanceIds) {
        params.InstanceIds = filters.instanceIds;
      }
      
      if (filters.filters) {
        params.Filters = filters.filters;
      }
      
      const data = await this.ec2.describeInstances(params).promise();
      
      // Transformar os dados em um formato mais amigável
      const instances = [];
      
      for (const reservation of data.Reservations) {
        for (const instance of reservation.Instances) {
          const tags = {};
          
          if (instance.Tags) {
            for (const tag of instance.Tags) {
              tags[tag.Key] = tag.Value;
            }
          }
          
          // Encontrar o nome da instância nas tags
          const name = tags.Name || `Instância ${instance.InstanceId}`;
          
          // Extrair IPs
          const publicIp = instance.PublicIpAddress || null;
          const privateIp = instance.PrivateIpAddress || null;
          
          instances.push({
            id: instance.InstanceId,
            name: name,
            type: instance.InstanceType,
            state: instance.State.Name,
            availabilityZone: instance.Placement.AvailabilityZone,
            publicIp: publicIp,
            privateIp: privateIp,
            keyName: instance.KeyName || null,
            securityGroups: instance.SecurityGroups,
            launchTime: instance.LaunchTime,
            platform: instance.Platform || 'linux',
            architecture: instance.Architecture,
            rootDeviceType: instance.RootDeviceType,
            rootDeviceName: instance.RootDeviceName,
            blockDevices: instance.BlockDeviceMappings,
            tags: tags,
            vpcId: instance.VpcId,
            subnetId: instance.SubnetId,
            monitoring: instance.Monitoring.State
          });
        }
      }
      
      this.logger.info(`${instances.length} instâncias EC2 encontradas`);
      return instances;
    } catch (error) {
      this.logger.error('Erro ao listar instâncias EC2:', error);
      throw error;
    }
  }
  
  /**
   * Obtém detalhes de uma instância EC2 específica
   * @param {string} instanceId - ID da instância
   * @returns {Promise<Object>} Detalhes da instância
   */
  async getInstance(instanceId) {
    try {
      this.logger.info(`Obtendo detalhes da instância EC2 ${instanceId}`);
      
      const instances = await this.listInstances({ instanceIds: [instanceId] });
      
      if (instances.length === 0) {
        throw new Error(`Instância EC2 ${instanceId} não encontrada`);
      }
      
      return instances[0];
    } catch (error) {
      this.logger.error(`Erro ao obter detalhes da instância EC2 ${instanceId}:`, error);
      throw error;
    }
  }
  
  /**
   * Cria uma nova instância EC2
   * @param {Object} options - Opções de configuração da instância
   * @param {string} options.imageId - ID da AMI (Amazon Machine Image)
   * @param {string} options.instanceType - Tipo da instância (ex: t2.micro)
   * @param {number} options.minCount - Número mínimo de instâncias (padrão: 1)
   * @param {number} options.maxCount - Número máximo de instâncias (padrão: 1)
   * @param {string} [options.keyName] - Nome do par de chaves para acesso SSH
   * @param {Array<string>} [options.securityGroupIds] - IDs dos grupos de segurança
   * @param {Array<Object>} [options.tags] - Tags para a instância
   * @param {string} [options.userData] - Script de inicialização (Base64)
   * @returns {Promise<Object>} Detalhes da instância criada
   */
  async createInstance(options) {
    try {
      this.logger.info('Criando instância EC2');
      
      const params = {
        ImageId: options.imageId,
        InstanceType: options.instanceType,
        MinCount: options.minCount || 1,
        MaxCount: options.maxCount || 1,
        TagSpecifications: []
      };
      
      // Adicionar par de chaves (opcional)
      if (options.keyName) {
        params.KeyName = options.keyName;
      }
      
      // Adicionar grupos de segurança (opcional)
      if (options.securityGroupIds && options.securityGroupIds.length > 0) {
        params.SecurityGroupIds = options.securityGroupIds;
      }
      
      // Adicionar script de inicialização (opcional)
      if (options.userData) {
        params.UserData = options.userData;
      }
      
      // Adicionar tags (opcional)
      if (options.tags && options.tags.length > 0) {
        const tagSpecification = {
          ResourceType: 'instance',
          Tags: options.tags.map(tag => ({
            Key: tag.key,
            Value: tag.value
          }))
        };
        
        params.TagSpecifications.push(tagSpecification);
      }
      
      // Criar a instância
      const data = await this.ec2.runInstances(params).promise();
      
      // Obter o ID da instância criada
      const instanceId = data.Instances[0].InstanceId;
      
      this.logger.info(`Instância EC2 ${instanceId} criada com sucesso`);
      
      // Aguardar a inicialização da instância
      await this._waitForInstance(instanceId, 'running');
      
      // Retornar detalhes da instância
      return this.getInstance(instanceId);
    } catch (error) {
      this.logger.error('Erro ao criar instância EC2:', error);
      throw error;
    }
  }
  
  /**
   * Controla o estado de uma instância EC2 (start, stop, reboot, terminate)
   * @param {string} instanceId - ID da instância
   * @param {string} action - Ação a ser executada (start, stop, reboot, terminate)
   * @returns {Promise<Object>} Resultado da operação
   */
  async controlInstance(instanceId, action) {
    try {
      this.logger.info(`Executando ação ${action} na instância EC2 ${instanceId}`);
      
      let methodName;
      let waitFor;
      
      switch (action.toLowerCase()) {
        case 'start':
          methodName = 'startInstances';
          waitFor = 'running';
          break;
        case 'stop':
          methodName = 'stopInstances';
          waitFor = 'stopped';
          break;
        case 'reboot':
          methodName = 'rebootInstances';
          waitFor = 'running';
          break;
        case 'terminate':
          methodName = 'terminateInstances';
          waitFor = 'terminated';
          break;
        default:
          throw new Error(`Ação inválida: ${action}`);
      }
      
      const params = {
        InstanceIds: [instanceId]
      };
      
      // Executar a ação
      await this.ec2[methodName](params).promise();
      
      // Aguardar a mudança de estado da instância (exceto para reboot)
      if (action.toLowerCase() !== 'reboot') {
        await this._waitForInstance(instanceId, waitFor);
      } else {
        // Aguardar 10 segundos para o reboot
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
      this.logger.info(`Ação ${action} concluída na instância EC2 ${instanceId}`);
      
      // Retornar detalhes atualizados da instância
      // No caso de terminate, a instância pode não estar mais acessível
      try {
        return await this.getInstance(instanceId);
      } catch (error) {
        return { instanceId, status: waitFor };
      }
    } catch (error) {
      this.logger.error(`Erro ao executar ação ${action} na instância EC2 ${instanceId}:`, error);
      throw error;
    }
  }
  
  /**
   * Aguarda uma instância EC2 atingir um determinado estado
   * @private
   * @param {string} instanceId - ID da instância
   * @param {string} state - Estado desejado
   * @returns {Promise<boolean>} Promise resolvida quando o estado for atingido
   */
  async _waitForInstance(instanceId, state) {
    try {
      this.logger.info(`Aguardando instância ${instanceId} atingir o estado '${state}'`);
      
      let methodName;
      
      switch (state) {
        case 'running':
          methodName = 'waitFor';
          break;
        case 'stopped':
          methodName = 'waitFor';
          break;
        case 'terminated':
          methodName = 'waitFor';
          break;
        default:
          throw new Error(`Estado inválido para aguardar: ${state}`);
      }
      
      const params = {
        InstanceIds: [instanceId]
      };
      
      await this.ec2[methodName](state)(params).promise();
      
      this.logger.info(`Instância ${instanceId} atingiu o estado '${state}'`);
      
      return true;
    } catch (error) {
      this.logger.error(`Erro ao aguardar instância ${instanceId} atingir o estado '${state}':`, error);
      throw error;
    }
  }
  
  /**
   * Modifica atributos de uma instância EC2
   * @param {string} instanceId - ID da instância
   * @param {Object} attributes - Atributos a serem modificados
   * @returns {Promise<Object>} Resultado da operação
   */
  async modifyInstanceAttributes(instanceId, attributes) {
    try {
      this.logger.info(`Modificando atributos da instância EC2 ${instanceId}`);
      
      const params = {
        InstanceId: instanceId
      };
      
      // Adicionar atributos a serem modificados
      for (const [key, value] of Object.entries(attributes)) {
        params[key] = value;
      }
      
      await this.ec2.modifyInstanceAttribute(params).promise();
      
      this.logger.info(`Atributos da instância EC2 ${instanceId} modificados com sucesso`);
      
      // Retornar detalhes atualizados da instância
      return this.getInstance(instanceId);
    } catch (error) {
      this.logger.error(`Erro ao modificar atributos da instância EC2 ${instanceId}:`, error);
      throw error;
    }
  }
  
  /**
   * Lista todas as AMIs disponíveis para o usuário
   * @param {Object} [filters] - Filtros opcionais
   * @returns {Promise<Array>} Lista de AMIs
   */
  async listImages(filters = {}) {
    try {
      this.logger.info('Listando AMIs');
      
      const params = {
        Owners: ['self', 'amazon']
      };
      
      if (filters.imageIds) {
        params.ImageIds = filters.imageIds;
      }
      
      if (filters.filters) {
        params.Filters = filters.filters;
      }
      
      const data = await this.ec2.describeImages(params).promise();
      
      // Transformar os dados em um formato mais amigável
      const images = data.Images.map(image => {
        const tags = {};
        
        if (image.Tags) {
          for (const tag of image.Tags) {
            tags[tag.Key] = tag.Value;
          }
        }
        
        return {
          id: image.ImageId,
          name: image.Name,
          description: image.Description,
          state: image.State,
          owner: image.OwnerId,
          isPublic: image.Public,
          architecture: image.Architecture,
          platform: image.Platform || 'linux',
          rootDeviceType: image.RootDeviceType,
          rootDeviceName: image.RootDeviceName,
          blockDeviceMappings: image.BlockDeviceMappings,
          virtualizationType: image.VirtualizationType,
          creationDate: image.CreationDate,
          tags: tags
        };
      });
      
      this.logger.info(`${images.length} AMIs encontradas`);
      return images;
    } catch (error) {
      this.logger.error('Erro ao listar AMIs:', error);
      throw error;
    }
  }
  
  /**
   * Lista todos os tipos de instâncias EC2 disponíveis
   * @returns {Promise<Array>} Lista de tipos de instâncias
   */
  async listInstanceTypes() {
    try {
      this.logger.info('Listando tipos de instâncias EC2');
      
      const data = await this.ec2.describeInstanceTypes().promise();
      
      // Transformar os dados em um formato mais amigável
      const instanceTypes = data.InstanceTypes.map(type => ({
        type: type.InstanceType,
        vCpus: type.VCpuInfo.DefaultVCpus,
        memory: type.MemoryInfo.SizeInMiB,
        architecture: type.ProcessorInfo.SupportedArchitectures[0],
        networkPerformance: type.NetworkInfo.NetworkPerformance,
        ebs: type.EbsInfo.EbsOptimizedSupport !== 'unsupported',
        isMultiSupported: type.HypervisorInfo.Hypervisor === 'nitro',
        family: type.InstanceType.split('.')[0]
      }));
      
      this.logger.info(`${instanceTypes.length} tipos de instâncias EC2 encontrados`);
      return instanceTypes;
    } catch (error) {
      this.logger.error('Erro ao listar tipos de instâncias EC2:', error);
      throw error;
    }
  }
  
  /**
   * Lista todos os grupos de segurança
   * @param {Object} [filters] - Filtros opcionais
   * @returns {Promise<Array>} Lista de grupos de segurança
   */
  async listSecurityGroups(filters = {}) {
    try {
      this.logger.info('Listando grupos de segurança');
      
      const params = {};
      
      if (filters.groupIds) {
        params.GroupIds = filters.groupIds;
      }
      
      if (filters.filters) {
        params.Filters = filters.filters;
      }
      
      const data = await this.ec2.describeSecurityGroups(params).promise();
      
      // Transformar os dados em um formato mais amigável
      const securityGroups = data.SecurityGroups.map(group => ({
        id: group.GroupId,
        name: group.GroupName,
        description: group.Description,
        vpcId: group.VpcId,
        inboundRules: group.IpPermissions.map(rule => ({
          protocol: rule.IpProtocol,
          fromPort: rule.FromPort,
          toPort: rule.ToPort,
          ipRanges: rule.IpRanges.map(range => ({
            cidr: range.CidrIp,
            description: range.Description
          }))
        })),
        outboundRules: group.IpPermissionsEgress.map(rule => ({
          protocol: rule.IpProtocol,
          fromPort: rule.FromPort,
          toPort: rule.ToPort,
          ipRanges: rule.IpRanges.map(range => ({
            cidr: range.CidrIp,
            description: range.Description
          }))
        }))
      }));
      
      this.logger.info(`${securityGroups.length} grupos de segurança encontrados`);
      return securityGroups;
    } catch (error) {
      this.logger.error('Erro ao listar grupos de segurança:', error);
      throw error;
    }
  }
  
  /**
   * Obtém métricas para instâncias EC2
   * @param {Object} options - Opções de filtragem e agrupamento
   * @returns {Promise<Object>} Métricas das instâncias
   */
  async getMetrics(options = {}) {
    try {
      this.logger.info('Obtendo métricas de instâncias EC2');
      
      // Em uma implementação real, usaríamos CloudWatch para obter métricas
      // Aqui retornamos dados de exemplo
      
      // Obter instâncias primeiro
      const instances = await this.listInstances(options.filters);
      
      // Métricas fictícias para demonstração
      const metrics = {
        summary: {
          total: instances.length,
          running: instances.filter(i => i.state === 'running').length,
          stopped: instances.filter(i => i.state === 'stopped').length,
          other: instances.filter(i => i.state !== 'running' && i.state !== 'stopped').length
        },
        byType: {},
        byRegion: {},
        byState: {},
        instanceMetrics: []
      };
      
      // Agrupar por tipo
      for (const instance of instances) {
        // Por tipo
        if (!metrics.byType[instance.type]) {
          metrics.byType[instance.type] = 0;
        }
        metrics.byType[instance.type]++;
        
        // Por região
        const region = instance.availabilityZone.slice(0, -1);
        if (!metrics.byRegion[region]) {
          metrics.byRegion[region] = 0;
        }
        metrics.byRegion[region]++;
        
        // Por estado
        if (!metrics.byState[instance.state]) {
          metrics.byState[instance.state] = 0;
        }
        metrics.byState[instance.state]++;
        
        // Métricas individuais para instâncias em execução
        if (instance.state === 'running') {
          metrics.instanceMetrics.push({
            id: instance.id,
            name: instance.name,
            cpuUtilization: Math.random() * 100,
            memoryUtilization: Math.random() * 100,
            networkIn: Math.random() * 1000,
            networkOut: Math.random() * 1000,
            diskReadOps: Math.floor(Math.random() * 1000),
            diskWriteOps: Math.floor(Math.random() * 1000),
            statusChecks: 'ok'
          });
        }
      }
      
      return metrics;
    } catch (error) {
      this.logger.error('Erro ao obter métricas de instâncias EC2:', error);
      throw error;
    }
  }
  
  /**
   * Cria uma AMI a partir de uma instância EC2
   * @param {string} instanceId - ID da instância
   * @param {string} name - Nome da AMI
   * @param {string} [description] - Descrição da AMI
   * @returns {Promise<Object>} Detalhes da AMI criada
   */
  async createImage(instanceId, name, description = '') {
    try {
      this.logger.info(`Criando AMI a partir da instância EC2 ${instanceId}`);
      
      const params = {
        InstanceId: instanceId,
        Name: name,
        Description: description,
        NoReboot: true // Não reiniciar a instância ao criar a AMI
      };
      
      const data = await this.ec2.createImage(params).promise();
      
      const imageId = data.ImageId;
      
      this.logger.info(`AMI ${imageId} criada com sucesso a partir da instância ${instanceId}`);
      
      // Aguardar a AMI ficar disponível
      await this._waitForImage(imageId, 'available');
      
      // Obter detalhes da AMI
      const images = await this.listImages({ imageIds: [imageId] });
      
      return images[0];
    } catch (error) {
      this.logger.error(`Erro ao criar AMI a partir da instância EC2 ${instanceId}:`, error);
      throw error;
    }
  }
  
  /**
   * Aguarda uma AMI atingir um determinado estado
   * @private
   * @param {string} imageId - ID da AMI
   * @param {string} state - Estado desejado
   * @returns {Promise<boolean>} Promise resolvida quando o estado for atingido
   */
  async _waitForImage(imageId, state) {
    try {
      this.logger.info(`Aguardando AMI ${imageId} atingir o estado '${state}'`);
      
      let methodName;
      
      switch (state) {
        case 'available':
          methodName = 'waitFor';
          break;
        default:
          throw new Error(`Estado inválido para aguardar: ${state}`);
      }
      
      const params = {
        ImageIds: [imageId]
      };
      
      await this.ec2[methodName]('imageAvailable')(params).promise();
      
      this.logger.info(`AMI ${imageId} atingiu o estado '${state}'`);
      
      return true;
    } catch (error) {
      this.logger.error(`Erro ao aguardar AMI ${imageId} atingir o estado '${state}':`, error);
      throw error;
    }
  }
}

module.exports = EC2Manager;