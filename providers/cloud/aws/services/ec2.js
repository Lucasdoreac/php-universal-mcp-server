/**
 * Módulo para gerenciamento de EC2 na AWS
 * @module providers/cloud/aws/services/ec2
 */

const fs = require('fs');
const path = require('path');

/**
 * Classe para gerenciamento de instâncias EC2 para hospedagem PHP
 */
class EC2Service {
  /**
   * Cria uma instância do serviço EC2
   * @param {Object} AWS - SDK da AWS configurado
   * @param {Object} config - Configuração específica do EC2
   */
  constructor(AWS, config = {}) {
    this.AWS = AWS;
    this.config = config;
    this.ec2 = new AWS.EC2();
    this.ssmClient = new AWS.SSM();
    this.cloudWatchClient = new AWS.CloudWatch();
  }

  /**
   * Obtém métricas das instâncias EC2
   * @returns {Promise<Object>} Métricas das instâncias
   */
  async getMetrics() {
    try {
      // Obter número de instâncias
      const instances = await this.ec2.describeInstances({
        Filters: [
          {
            Name: 'instance-state-name',
            Values: ['pending', 'running', 'stopping', 'stopped']
          }
        ]
      }).promise();
      
      // Contar instâncias
      let instanceCount = 0;
      instances.Reservations.forEach(reservation => {
        instanceCount += reservation.Instances.length;
      });
      
      // Classificar instâncias por estado
      const instancesByState = {
        running: 0,
        stopped: 0,
        pending: 0,
        stopping: 0
      };
      
      instances.Reservations.forEach(reservation => {
        reservation.Instances.forEach(instance => {
          const state = instance.State.Name;
          if (instancesByState[state] !== undefined) {
            instancesByState[state]++;
          }
        });
      });
      
      // Obter métricas de utilização de CPU
      const endTime = new Date();
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - 24);
      
      const cpuMetrics = await this.cloudWatchClient.getMetricStatistics({
        Namespace: 'AWS/EC2',
        MetricName: 'CPUUtilization',
        Dimensions: [],
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600,
        Statistics: ['Average', 'Maximum']
      }).promise();
      
      return {
        instanceCount,
        instancesByState,
        cpuUtilization: cpuMetrics.Datapoints.map(dp => ({
          timestamp: dp.Timestamp,
          average: dp.Average,
          maximum: dp.Maximum
        }))
      };
    } catch (error) {
      console.error('Erro ao obter métricas do EC2:', error);
      throw error;
    }
  }

  /**
   * Cria uma nova instância EC2 para hospedar um site PHP
   * @param {Object} siteConfig - Configuração do site
   * @returns {Promise<Object>} Informações da instância criada
   */
  async createPhpSite(siteConfig) {
    try {
      // Configurações padrão para a instância EC2
      const amiId = this.config.phpAmiId || 'ami-0c55b159cbfafe1f0'; // Ubuntu Server 20.04 LTS (exemplo)
      const instanceType = siteConfig.instanceType || 't2.micro';
      const keyName = this.config.keyName;
      
      if (!keyName) {
        throw new Error('Par de chaves não configurado para EC2');
      }
      
      // Criar grupo de segurança para o site
      const securityGroupName = `php-site-${siteConfig.name}-sg`;
      
      const sgResult = await this.ec2.createSecurityGroup({
        GroupName: securityGroupName,
        Description: `Security group for PHP site ${siteConfig.name}`
      }).promise();
      
      const securityGroupId = sgResult.GroupId;
      
      // Configurar regras do grupo de segurança
      await this.ec2.authorizeSecurityGroupIngress({
        GroupId: securityGroupId,
        IpPermissions: [
          {
            // HTTP
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            IpRanges: [{ CidrIp: '0.0.0.0/0' }]
          },
          {
            // HTTPS
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            IpRanges: [{ CidrIp: '0.0.0.0/0' }]
          },
          {
            // SSH (para administração)
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            IpRanges: [{ CidrIp: this.config.adminIpCidr || '0.0.0.0/0' }]
          }
        ]
      }).promise();
      
      // Script de inicialização para configurar o servidor web
      const userData = Buffer.from(`#!/bin/bash
# Atualizar sistema
apt-get update
apt-get upgrade -y

# Instalar servidor web e PHP
apt-get install -y apache2 php libapache2-mod-php php-mysql php-curl php-gd php-mbstring php-xml php-xmlrpc php-zip

# Configurar servidor web
echo "<VirtualHost *:80>
  ServerName ${siteConfig.domain}
  ServerAlias www.${siteConfig.domain}
  DocumentRoot /var/www/html/${siteConfig.name}
  
  <Directory /var/www/html/${siteConfig.name}>
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
  </Directory>
  
  ErrorLog \${APACHE_LOG_DIR}/error.log
  CustomLog \${APACHE_LOG_DIR}/access.log combined
</VirtualHost>" > /etc/apache2/sites-available/${siteConfig.name}.conf

# Criar diretório do site
mkdir -p /var/www/html/${siteConfig.name}
echo "<?php phpinfo(); ?>" > /var/www/html/${siteConfig.name}/index.php

# Ativar configuração do site
a2ensite ${siteConfig.name}.conf
systemctl reload apache2
`).toString('base64');
      
      // Criar a instância
      const instanceResult = await this.ec2.runInstances({
        ImageId: amiId,
        InstanceType: instanceType,
        KeyName: keyName,
        MinCount: 1,
        MaxCount: 1,
        SecurityGroupIds: [securityGroupId],
        UserData: userData,
        TagSpecifications: [
          {
            ResourceType: 'instance',
            Tags: [
              { Key: 'Name', Value: `php-site-${siteConfig.name}` },
              { Key: 'SiteId', Value: siteConfig.name },
              { Key: 'Domain', Value: siteConfig.domain },
              { Key: 'ManagedBy', Value: 'php-universal-mcp-server' }
            ]
          }
        ]
      }).promise();
      
      const instanceId = instanceResult.Instances[0].InstanceId;
      
      // Esperar a instância estar em execução
      await this.ec2.waitFor('instanceRunning', {
        InstanceIds: [instanceId]
      }).promise();
      
      // Obter informações da instância
      const describeResult = await this.ec2.describeInstances({
        InstanceIds: [instanceId]
      }).promise();
      
      const instance = describeResult.Reservations[0].Instances[0];
      
      return {
        id: instance.InstanceId,
        name: siteConfig.name,
        domain: siteConfig.domain,
        publicIp: instance.PublicIpAddress,
        privateIp: instance.PrivateIpAddress,
        status: instance.State.Name,
        type: instanceType,
        securityGroupId,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao criar site PHP no EC2:', error);
      throw error;
    }
  }

  /**
   * Lista todos os sites PHP hospedados em instâncias EC2
   * @param {Object} filters - Filtros para a listagem
   * @returns {Promise<Array>} Lista de sites PHP
   */
  async listPhpSites(filters = {}) {
    try {
      const instances = await this.ec2.describeInstances({
        Filters: [
          {
            Name: 'tag:ManagedBy',
            Values: ['php-universal-mcp-server']
          }
        ]
      }).promise();
      
      const sites = [];
      
      instances.Reservations.forEach(reservation => {
        reservation.Instances.forEach(instance => {
          // Extrair informações do site das tags
          const tags = instance.Tags || [];
          const siteIdTag = tags.find(tag => tag.Key === 'SiteId');
          const domainTag = tags.find(tag => tag.Key === 'Domain');
          
          if (siteIdTag && domainTag) {
            sites.push({
              id: instance.InstanceId,
              name: siteIdTag.Value,
              domain: domainTag.Value,
              publicIp: instance.PublicIpAddress,
              privateIp: instance.PrivateIpAddress,
              status: instance.State.Name,
              type: instance.InstanceType,
              securityGroupId: instance.SecurityGroups[0]?.GroupId,
              createdAt: instance.LaunchTime.toISOString()
            });
          }
        });
      });
      
      return sites;
    } catch (error) {
      console.error('Erro ao listar sites PHP no EC2:', error);
      throw error;
    }
  }

  /**
   * Obtém detalhes de um site PHP específico no EC2
   * @param {string} siteId - ID do site (instância EC2)
   * @returns {Promise<Object>} Detalhes do site
   */
  async getPhpSite(siteId) {
    try {
      const result = await this.ec2.describeInstances({
        InstanceIds: [siteId]
      }).promise();
      
      if (!result.Reservations[0] || !result.Reservations[0].Instances[0]) {
        throw new Error(`Site PHP não encontrado: ${siteId}`);
      }
      
      const instance = result.Reservations[0].Instances[0];
      const tags = instance.Tags || [];
      const siteIdTag = tags.find(tag => tag.Key === 'SiteId');
      const domainTag = tags.find(tag => tag.Key === 'Domain');
      
      if (!siteIdTag || !domainTag) {
        throw new Error(`Instância ${siteId} não é um site PHP gerenciado`);
      }
      
      // Obter métricas de CPU da instância
      const endTime = new Date();
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - 24);
      
      const cpuMetrics = await this.cloudWatchClient.getMetricStatistics({
        Namespace: 'AWS/EC2',
        MetricName: 'CPUUtilization',
        Dimensions: [
          {
            Name: 'InstanceId',
            Value: siteId
          }
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600,
        Statistics: ['Average', 'Maximum']
      }).promise();
      
      return {
        id: instance.InstanceId,
        name: siteIdTag.Value,
        domain: domainTag.Value,
        publicIp: instance.PublicIpAddress,
        privateIp: instance.PrivateIpAddress,
        status: instance.State.Name,
        type: instance.InstanceType,
        securityGroupId: instance.SecurityGroups[0]?.GroupId,
        createdAt: instance.LaunchTime.toISOString(),
        metrics: {
          cpuUtilization: cpuMetrics.Datapoints.map(dp => ({
            timestamp: dp.Timestamp,
            average: dp.Average,
            maximum: dp.Maximum
          }))
        }
      };
    } catch (error) {
      console.error(`Erro ao obter site PHP ${siteId} no EC2:`, error);
      throw error;
    }
  }

  /**
   * Atualiza um site PHP existente
   * @param {string} siteId - ID do site (instância EC2)
   * @param {Object} updates - Atualizações a serem aplicadas
   * @returns {Promise<Object>} Detalhes do site atualizado
   */
  async updatePhpSite(siteId, updates) {
    try {
      const site = await this.getPhpSite(siteId);
      
      if (updates.domain && updates.domain !== site.domain) {
        // Atualizar o domínio na configuração do servidor web
        const command = `sudo sed -i 's/ServerName ${site.domain}/ServerName ${updates.domain}/g' /etc/apache2/sites-available/${site.name}.conf && sudo sed -i 's/ServerAlias www.${site.domain}/ServerAlias www.${updates.domain}/g' /etc/apache2/sites-available/${site.name}.conf && sudo systemctl reload apache2`;
        
        await this.ssmClient.sendCommand({
          InstanceIds: [siteId],
          DocumentName: 'AWS-RunShellScript',
          Parameters: {
            commands: [command]
          }
        }).promise();
        
        // Atualizar a tag de domínio
        await this.ec2.createTags({
          Resources: [siteId],
          Tags: [
            { Key: 'Domain', Value: updates.domain }
          ]
        }).promise();
      }
      
      if (updates.instanceType && updates.instanceType !== site.type) {
        // Parar a instância antes de mudar o tipo
        await this.ec2.stopInstances({
          InstanceIds: [siteId]
        }).promise();
        
        // Aguardar a instância parar
        await this.ec2.waitFor('instanceStopped', {
          InstanceIds: [siteId]
        }).promise();
        
        // Mudar o tipo da instância
        await this.ec2.modifyInstanceAttribute({
          InstanceId: siteId,
          InstanceType: { Value: updates.instanceType }
        }).promise();
        
        // Iniciar a instância novamente
        await this.ec2.startInstances({
          InstanceIds: [siteId]
        }).promise();
        
        // Aguardar a instância iniciar
        await this.ec2.waitFor('instanceRunning', {
          InstanceIds: [siteId]
        }).promise();
      }
      
      // Obter informações atualizadas do site
      return await this.getPhpSite(siteId);
    } catch (error) {
      console.error(`Erro ao atualizar site PHP ${siteId} no EC2:`, error);
      throw error;
    }
  }

  /**
   * Exclui um site PHP
   * @param {string} siteId - ID do site (instância EC2)
   * @returns {Promise<boolean>} True se o site foi excluído com sucesso
   */
  async deletePhpSite(siteId) {
    try {
      const site = await this.getPhpSite(siteId);
      
      // Terminar a instância
      await this.ec2.terminateInstances({
        InstanceIds: [siteId]
      }).promise();
      
      // Aguardar a instância terminar
      await this.ec2.waitFor('instanceTerminated', {
        InstanceIds: [siteId]
      }).promise();
      
      // Excluir o grupo de segurança
      if (site.securityGroupId) {
        await this.ec2.deleteSecurityGroup({
          GroupId: site.securityGroupId
        }).promise();
      }
      
      return true;
    } catch (error) {
      console.error(`Erro ao excluir site PHP ${siteId} no EC2:`, error);
      throw error;
    }
  }

  /**
   * Cria um backup de um site PHP
   * @param {string} siteId - ID do site (instância EC2)
   * @returns {Promise<Object>} Informações do backup criado
   */
  async backupPhpSite(siteId) {
    try {
      const site = await this.getPhpSite(siteId);
      
      // Criar snapshot do volume raiz
      const describeResult = await this.ec2.describeInstances({
        InstanceIds: [siteId]
      }).promise();
      
      const instance = describeResult.Reservations[0].Instances[0];
      const rootVolumeId = instance.BlockDeviceMappings.find(
        bdm => bdm.DeviceName === instance.RootDeviceName
      ).Ebs.VolumeId;
      
      // Criar snapshot
      const snapshotResult = await this.ec2.createSnapshot({
        VolumeId: rootVolumeId,
        Description: `Backup of PHP site ${site.name} (${site.domain})`,
        TagSpecifications: [
          {
            ResourceType: 'snapshot',
            Tags: [
              { Key: 'Name', Value: `php-site-${site.name}-backup` },
              { Key: 'SiteId', Value: site.name },
              { Key: 'Domain', Value: site.domain },
              { Key: 'ManagedBy', Value: 'php-universal-mcp-server' },
              { Key: 'InstanceId', Value: siteId }
            ]
          }
        ]
      }).promise();
      
      return {
        id: snapshotResult.SnapshotId,
        siteId,
        siteName: site.name,
        domain: site.domain,
        createdAt: snapshotResult.StartTime.toISOString(),
        status: snapshotResult.State
      };
    } catch (error) {
      console.error(`Erro ao criar backup do site PHP ${siteId} no EC2:`, error);
      throw error;
    }
  }

  /**
   * Restaura um site PHP a partir de um backup
   * @param {string} siteId - ID do site (instância EC2)
   * @param {string} backupId - ID do backup (snapshot)
   * @returns {Promise<Object>} Informações do site restaurado
   */
  async restorePhpSite(siteId, backupId) {
    try {
      // Verificar se o snapshot existe
      const snapshotResult = await this.ec2.describeSnapshots({
        SnapshotIds: [backupId]
      }).promise();
      
      if (!snapshotResult.Snapshots[0]) {
        throw new Error(`Backup não encontrado: ${backupId}`);
      }
      
      // Obter informações da instância
      const site = await this.getPhpSite(siteId);
      
      // Parar a instância
      await this.ec2.stopInstances({
        InstanceIds: [siteId]
      }).promise();
      
      // Aguardar a instância parar
      await this.ec2.waitFor('instanceStopped', {
        InstanceIds: [siteId]
      }).promise();
      
      // Obter o volume raiz
      const describeResult = await this.ec2.describeInstances({
        InstanceIds: [siteId]
      }).promise();
      
      const instance = describeResult.Reservations[0].Instances[0];
      const rootDeviceName = instance.RootDeviceName;
      const rootVolumeId = instance.BlockDeviceMappings.find(
        bdm => bdm.DeviceName === rootDeviceName
      ).Ebs.VolumeId;
      
      // Destacar o volume atual
      await this.ec2.detachVolume({
        VolumeId: rootVolumeId
      }).promise();
      
      // Aguardar o volume ser destacado
      await this.ec2.waitFor('volumeAvailable', {
        VolumeIds: [rootVolumeId]
      }).promise();
      
      // Criar novo volume a partir do snapshot
      const volumeResult = await this.ec2.createVolume({
        SnapshotId: backupId,
        AvailabilityZone: instance.Placement.AvailabilityZone,
        TagSpecifications: [
          {
            ResourceType: 'volume',
            Tags: [
              { Key: 'Name', Value: `php-site-${site.name}-volume` },
              { Key: 'SiteId', Value: site.name },
              { Key: 'ManagedBy', Value: 'php-universal-mcp-server' }
            ]
          }
        ]
      }).promise();
      
      // Aguardar o novo volume ficar disponível
      await this.ec2.waitFor('volumeAvailable', {
        VolumeIds: [volumeResult.VolumeId]
      }).promise();
      
      // Anexar o novo volume à instância
      await this.ec2.attachVolume({
        VolumeId: volumeResult.VolumeId,
        InstanceId: siteId,
        Device: rootDeviceName
      }).promise();
      
      // Aguardar o volume ser anexado
      await this.ec2.waitFor('volumeInUse', {
        VolumeIds: [volumeResult.VolumeId]
      }).promise();
      
      // Iniciar a instância
      await this.ec2.startInstances({
        InstanceIds: [siteId]
      }).promise();
      
      // Aguardar a instância iniciar
      await this.ec2.waitFor('instanceRunning', {
        InstanceIds: [siteId]
      }).promise();
      
      // Excluir o volume antigo
      await this.ec2.deleteVolume({
        VolumeId: rootVolumeId
      }).promise();
      
      // Obter informações atualizadas do site
      return await this.getPhpSite(siteId);
    } catch (error) {
      console.error(`Erro ao restaurar site PHP ${siteId} no EC2:`, error);
      throw error;
    }
  }
}

module.exports = EC2Service;