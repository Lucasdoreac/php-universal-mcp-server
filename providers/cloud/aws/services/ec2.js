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
   * Obtém métricas do serviço EC2
   * @returns {Promise<Object>} Métricas do serviço EC2
   */
  async getMetrics() {
    try {
      // Obter número de instâncias em execução
      const instances = await this.ec2.describeInstances({
        Filters: [
          {
            Name: 'instance-state-name',
            Values: ['running']
          }
        ]
      }).promise();

      // Contar instâncias em execução
      let runningInstances = 0;
      instances.Reservations.forEach(reservation => {
        runningInstances += reservation.Instances.length;
      });

      // Obter métricas básicas de CPU para instâncias gerenciadas pelo servidor
      const metrics = {
        runningInstances,
        instancesMetrics: []
      };

      // Para cada instância, tenta obter métricas de CPU
      for (const reservation of instances.Reservations) {
        for (const instance of reservation.Instances) {
          try {
            // Verificar se a instância tem a tag que indica que é gerenciada por este servidor
            const managedByUs = instance.Tags && instance.Tags.some(tag => 
              tag.Key === 'ManagedBy' && tag.Value === 'php-universal-mcp-server'
            );

            if (managedByUs) {
              // Obter métricas de CPU para esta instância
              const cpuMetrics = await this.cloudWatchClient.getMetricStatistics({
                Namespace: 'AWS/EC2',
                MetricName: 'CPUUtilization',
                Dimensions: [
                  {
                    Name: 'InstanceId',
                    Value: instance.InstanceId
                  }
                ],
                StartTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
                EndTime: new Date(),
                Period: 3600, // Agregado por hora
                Statistics: ['Average']
              }).promise();

              metrics.instancesMetrics.push({
                instanceId: instance.InstanceId,
                instanceType: instance.InstanceType,
                state: instance.State.Name,
                publicDnsName: instance.PublicDnsName,
                cpuMetrics: cpuMetrics.Datapoints
              });
            }
          } catch (error) {
            console.error(`Erro ao obter métricas para instância ${instance.InstanceId}:`, error);
          }
        }
      }

      return metrics;
    } catch (error) {
      console.error('Erro ao obter métricas do EC2:', error);
      throw error;
    }
  }

  /**
   * Cria um site PHP em uma instância EC2
   * @param {Object} siteConfig - Configuração do site
   * @param {string} siteConfig.name - Nome do site
   * @param {string} siteConfig.domain - Domínio do site
   * @param {string} siteConfig.instanceType - Tipo de instância EC2 (padrão: t2.micro)
   * @param {string} siteConfig.phpVersion - Versão do PHP (padrão: 7.4)
   * @returns {Promise<Object>} Informações do site criado
   */
  async createPhpSite(siteConfig) {
    try {
      // Verificar configuração mínima
      if (!siteConfig.name) {
        throw new Error('Nome do site é obrigatório');
      }

      // Definir valores padrão
      const instanceType = siteConfig.instanceType || 't2.micro';
      const phpVersion = siteConfig.phpVersion || '7.4';

      // Script de inicialização para instalar PHP e configurar o site
      const userData = Buffer.from(`#!/bin/bash
# Atualizar pacotes
apt-get update
apt-get upgrade -y

# Instalar Apache e PHP
apt-get install -y apache2 php${phpVersion} php${phpVersion}-mysql php${phpVersion}-curl php${phpVersion}-gd php${phpVersion}-mbstring php${phpVersion}-xml php${phpVersion}-zip

# Configurar virtual host para o site
cat > /etc/apache2/sites-available/${siteConfig.name}.conf << EOF
<VirtualHost *:80>
    ServerName ${siteConfig.domain || siteConfig.name}
    DocumentRoot /var/www/html/${siteConfig.name}
    
    <Directory /var/www/html/${siteConfig.name}>
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog \${APACHE_LOG_DIR}/${siteConfig.name}-error.log
    CustomLog \${APACHE_LOG_DIR}/${siteConfig.name}-access.log combined
</VirtualHost>
EOF

# Criar diretório para o site
mkdir -p /var/www/html/${siteConfig.name}
echo "<?php phpinfo(); ?>" > /var/www/html/${siteConfig.name}/index.php
chown -R www-data:www-data /var/www/html/${siteConfig.name}

# Ativar o site e reiniciar Apache
a2ensite ${siteConfig.name}.conf
systemctl restart apache2

# Instalar certbot para SSL
apt-get install -y certbot python3-certbot-apache

# Tentativa de obter certificado SSL se o domínio estiver configurado
if [[ "${siteConfig.domain}" != "" ]]; then
  certbot --non-interactive --agree-tos -m webmaster@${siteConfig.domain} --apache -d ${siteConfig.domain}
fi

# Configurar monitoramento básico
apt-get install -y awscli amazon-cloudwatch-agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
  "metrics": {
    "metrics_collected": {
      "cpu": {
        "resources": ["*"],
        "measurement": ["cpu_usage_idle", "cpu_usage_user", "cpu_usage_system"]
      },
      "mem": {
        "measurement": ["mem_used_percent"]
      },
      "disk": {
        "resources": ["/"],
        "measurement": ["disk_used_percent"]
      }
    }
  }
}
EOF

# Iniciar agente CloudWatch
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent
      `).toString('base64');

      // Criar grupo de segurança para o site
      const sgParams = {
        Description: `Security group for PHP site ${siteConfig.name}`,
        GroupName: `php-site-${siteConfig.name}-sg`,
        TagSpecifications: [
          {
            ResourceType: 'security-group',
            Tags: [
              {
                Key: 'Name',
                Value: `php-site-${siteConfig.name}-sg`
              },
              {
                Key: 'ManagedBy',
                Value: 'php-universal-mcp-server'
              }
            ]
          }
        ]
      };

      const sgResult = await this.ec2.createSecurityGroup(sgParams).promise();
      const securityGroupId = sgResult.GroupId;

      // Adicionar regras de entrada para HTTP e HTTPS
      await this.ec2.authorizeSecurityGroupIngress({
        GroupId: securityGroupId,
        IpPermissions: [
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            IpRanges: [{ CidrIp: '0.0.0.0/0' }]
          },
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            IpRanges: [{ CidrIp: '0.0.0.0/0' }]
          },
          {
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            IpRanges: [{ CidrIp: this.config.allowedSshCidr || '0.0.0.0/0' }]
          }
        ]
      }).promise();

      // Criar instância EC2
      const instanceParams = {
        ImageId: this.config.amiId || 'ami-0c55b159cbfafe1f0', // Ubuntu 20.04 LTS
        InstanceType: instanceType,
        MinCount: 1,
        MaxCount: 1,
        UserData: userData,
        SecurityGroupIds: [securityGroupId],
        TagSpecifications: [
          {
            ResourceType: 'instance',
            Tags: [
              {
                Key: 'Name',
                Value: `php-site-${siteConfig.name}`
              },
              {
                Key: 'ManagedBy',
                Value: 'php-universal-mcp-server'
              },
              {
                Key: 'SiteId',
                Value: siteConfig.name
              }
            ]
          }
        ]
      };

      // Adicionar chave SSH se configurada
      if (this.config.keyPairName) {
        instanceParams.KeyName = this.config.keyPairName;
      }

      const instanceResult = await this.ec2.runInstances(instanceParams).promise();
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

      // Criar registro no banco de dados local (exemplo simplificado)
      const siteInfo = {
        id: siteConfig.name,
        domain: siteConfig.domain,
        instanceId: instanceId,
        publicDnsName: instance.PublicDnsName,
        publicIp: instance.PublicIpAddress,
        securityGroupId: securityGroupId,
        phpVersion: phpVersion,
        createdAt: new Date().toISOString(),
        status: 'running'
      };

      return siteInfo;
    } catch (error) {
      console.error('Erro ao criar site PHP no EC2:', error);
      throw error;
    }
  }

  /**
   * Lista todos os sites PHP hospedados no EC2
   * @param {Object} filters - Filtros para a listagem
   * @returns {Promise<Array>} Lista de sites PHP
   */
  async listPhpSites(filters = {}) {
    try {
      // Buscar instâncias com a tag ManagedBy=php-universal-mcp-server
      const instances = await this.ec2.describeInstances({
        Filters: [
          {
            Name: 'tag:ManagedBy',
            Values: ['php-universal-mcp-server']
          }
        ]
      }).promise();

      // Formatar informações de cada site
      const sites = [];
      
      instances.Reservations.forEach(reservation => {
        reservation.Instances.forEach(instance => {
          // Encontrar tag do SiteId
          const siteIdTag = instance.Tags.find(tag => tag.Key === 'SiteId');
          
          if (siteIdTag) {
            sites.push({
              id: siteIdTag.Value,
              instanceId: instance.InstanceId,
              publicDnsName: instance.PublicDnsName,
              publicIp: instance.PublicIpAddress,
              instanceType: instance.InstanceType,
              state: instance.State.Name,
              launchTime: instance.LaunchTime
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
   * @param {string} siteId - ID do site
   * @returns {Promise<Object>} Detalhes do site
   */
  async getPhpSite(siteId) {
    try {
      // Buscar instância com a tag SiteId específica
      const instances = await this.ec2.describeInstances({
        Filters: [
          {
            Name: 'tag:SiteId',
            Values: [siteId]
          },
          {
            Name: 'tag:ManagedBy',
            Values: ['php-universal-mcp-server']
          }
        ]
      }).promise();

      if (!instances.Reservations || instances.Reservations.length === 0 || 
          !instances.Reservations[0].Instances || instances.Reservations[0].Instances.length === 0) {
        throw new Error(`Site PHP não encontrado: ${siteId}`);
      }

      const instance = instances.Reservations[0].Instances[0];

      // Obter métricas do site nos últimos 7 dias
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);

      const cpuMetrics = await this.cloudWatchClient.getMetricStatistics({
        Namespace: 'AWS/EC2',
        MetricName: 'CPUUtilization',
        Dimensions: [
          {
            Name: 'InstanceId',
            Value: instance.InstanceId
          }
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 86400, // Agregação diária
        Statistics: ['Average', 'Maximum']
      }).promise();

      // Formatar resposta
      return {
        id: siteId,
        instanceId: instance.InstanceId,
        publicDnsName: instance.PublicDnsName,
        publicIp: instance.PublicIpAddress,
        instanceType: instance.InstanceType,
        state: instance.State.Name,
        launchTime: instance.LaunchTime,
        tags: instance.Tags,
        metrics: {
          cpu: cpuMetrics.Datapoints
        }
      };
    } catch (error) {
      console.error(`Erro ao obter site PHP ${siteId} no EC2:`, error);
      throw error;
    }
  }

  /**
   * Atualiza um site PHP no EC2
   * @param {string} siteId - ID do site
   * @param {Object} updates - Atualizações a serem aplicadas
   * @returns {Promise<Object>} Detalhes do site atualizado
   */
  async updatePhpSite(siteId, updates) {
    try {
      // Obter detalhes atuais do site
      const site = await this.getPhpSite(siteId);
      
      // Preparar comandos para atualizar configurações do site
      let commands = [];
      
      // Atualizar configuração de domínio se solicitado
      if (updates.domain) {
        commands.push(
          `cat > /etc/apache2/sites-available/${siteId}.conf << EOF
<VirtualHost *:80>
    ServerName ${updates.domain}
    DocumentRoot /var/www/html/${siteId}
    
    <Directory /var/www/html/${siteId}>
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog \${APACHE_LOG_DIR}/${siteId}-error.log
    CustomLog \${APACHE_LOG_DIR}/${siteId}-access.log combined
</VirtualHost>
EOF`,
          'systemctl restart apache2',
          // Atualizar certificado SSL para o novo domínio
          `certbot --non-interactive --agree-tos -m webmaster@${updates.domain} --apache -d ${updates.domain}`
        );
      }
      
      // Atualizar versão do PHP se solicitado
      if (updates.phpVersion) {
        commands.push(
          `apt-get update`,
          `apt-get install -y php${updates.phpVersion} php${updates.phpVersion}-mysql php${updates.phpVersion}-curl php${updates.phpVersion}-gd php${updates.phpVersion}-mbstring php${updates.phpVersion}-xml php${updates.phpVersion}-zip`,
          'systemctl restart apache2'
        );
      }
      
      // Se houver comandos para executar
      if (commands.length > 0) {
        // Executar comando na instância usando SSM Run Command
        await this.ssmClient.sendCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [site.instanceId],
          Parameters: {
            commands: commands
          }
        }).promise();
      }
      
      // Atualizar tipo de instância se solicitado
      if (updates.instanceType && updates.instanceType !== site.instanceType) {
        // Parar a instância
        await this.ec2.stopInstances({
          InstanceIds: [site.instanceId]
        }).promise();
        
        // Esperar que a instância esteja parada
        await this.ec2.waitFor('instanceStopped', {
          InstanceIds: [site.instanceId]
        }).promise();
        
        // Atualizar tipo de instância
        await this.ec2.modifyInstanceAttribute({
          InstanceId: site.instanceId,
          InstanceType: {
            Value: updates.instanceType
          }
        }).promise();
        
        // Iniciar a instância novamente
        await this.ec2.startInstances({
          InstanceIds: [site.instanceId]
        }).promise();
        
        // Esperar que a instância esteja em execução
        await this.ec2.waitFor('instanceRunning', {
          InstanceIds: [site.instanceId]
        }).promise();
      }
      
      // Obter detalhes atualizados do site
      return await this.getPhpSite(siteId);
    } catch (error) {
      console.error(`Erro ao atualizar site PHP ${siteId} no EC2:`, error);
      throw error;
    }
  }

  /**
   * Exclui um site PHP no EC2
   * @param {string} siteId - ID do site
   * @returns {Promise<boolean>} True se o site foi excluído com sucesso
   */
  async deletePhpSite(siteId) {
    try {
      // Obter detalhes do site
      const site = await this.getPhpSite(siteId);
      
      // Obter ID do grupo de segurança
      const securityGroups = await this.ec2.describeSecurityGroups({
        Filters: [
          {
            Name: 'group-name',
            Values: [`php-site-${siteId}-sg`]
          }
        ]
      }).promise();
      
      // Terminar a instância
      await this.ec2.terminateInstances({
        InstanceIds: [site.instanceId]
      }).promise();
      
      // Esperar que a instância seja terminada
      await this.ec2.waitFor('instanceTerminated', {
        InstanceIds: [site.instanceId]
      }).promise();
      
      // Excluir grupo de segurança se encontrado
      if (securityGroups.SecurityGroups.length > 0) {
        const securityGroupId = securityGroups.SecurityGroups[0].GroupId;
        
        await this.ec2.deleteSecurityGroup({
          GroupId: securityGroupId
        }).promise();
      }
      
      return true;
    } catch (error) {
      console.error(`Erro ao excluir site PHP ${siteId} no EC2:`, error);
      throw error;
    }
  }

  /**
   * Cria um backup de um site PHP no EC2
   * @param {string} siteId - ID do site
   * @returns {Promise<Object>} Informações do backup criado
   */
  async backupPhpSite(siteId) {
    try {
      // Obter detalhes do site
      const site = await this.getPhpSite(siteId);
      
      // Criar uma AMI (imagem) da instância
      const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const imageName = `backup-${siteId}-${backupTimestamp}`;
      
      const imageResult = await this.ec2.createImage({
        InstanceId: site.instanceId,
        Name: imageName,
        Description: `Backup do site PHP ${siteId} criado em ${new Date().toISOString()}`,
        TagSpecifications: [
          {
            ResourceType: 'image',
            Tags: [
              {
                Key: 'Name',
                Value: imageName
              },
              {
                Key: 'ManagedBy',
                Value: 'php-universal-mcp-server'
              },
              {
                Key: 'SiteId',
                Value: siteId
              },
              {
                Key: 'BackupType',
                Value: 'site-backup'
              }
            ]
          }
        ]
      }).promise();
      
      // Registrar backup (exemplo simplificado)
      const backupInfo = {
        id: imageResult.ImageId,
        siteId: siteId,
        name: imageName,
        createdAt: new Date().toISOString(),
        type: 'ami'
      };
      
      return backupInfo;
    } catch (error) {
      console.error(`Erro ao criar backup do site PHP ${siteId} no EC2:`, error);
      throw error;
    }
  }

  /**
   * Restaura um site PHP a partir de um backup no EC2
   * @param {string} siteId - ID do site
   * @param {string} backupId - ID do backup (AMI ID)
   * @returns {Promise<Object>} Informações do site restaurado
   */
  async restorePhpSite(siteId, backupId) {
    try {
      // Obter detalhes do backup (AMI)
      const images = await this.ec2.describeImages({
        ImageIds: [backupId]
      }).promise();
      
      if (!images.Images || images.Images.length === 0) {
        throw new Error(`Backup não encontrado: ${backupId}`);
      }
      
      // Obter detalhes do site existente
      let existingSite;
      try {
        existingSite = await this.getPhpSite(siteId);
      } catch (error) {
        // Site não existe, continuamos com a restauração
      }
      
      // Se o site existe, excluí-lo primeiro
      if (existingSite) {
        await this.deletePhpSite(siteId);
      }
      
      // Criar grupo de segurança para o site restaurado
      const sgParams = {
        Description: `Security group for restored PHP site ${siteId}`,
        GroupName: `php-site-${siteId}-sg`,
        TagSpecifications: [
          {
            ResourceType: 'security-group',
            Tags: [
              {
                Key: 'Name',
                Value: `php-site-${siteId}-sg`
              },
              {
                Key: 'ManagedBy',
                Value: 'php-universal-mcp-server'
              }
            ]
          }
        ]
      };
      
      const sgResult = await this.ec2.createSecurityGroup(sgParams).promise();
      const securityGroupId = sgResult.GroupId;
      
      // Adicionar regras de entrada para HTTP e HTTPS
      await this.ec2.authorizeSecurityGroupIngress({
        GroupId: securityGroupId,
        IpPermissions: [
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            IpRanges: [{ CidrIp: '0.0.0.0/0' }]
          },
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            IpRanges: [{ CidrIp: '0.0.0.0/0' }]
          },
          {
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            IpRanges: [{ CidrIp: this.config.allowedSshCidr || '0.0.0.0/0' }]
          }
        ]
      }).promise();
      
      // Lançar nova instância a partir da AMI
      const instanceParams = {
        ImageId: backupId,
        InstanceType: this.config.instanceType || 't2.micro',
        MinCount: 1,
        MaxCount: 1,
        SecurityGroupIds: [securityGroupId],
        TagSpecifications: [
          {
            ResourceType: 'instance',
            Tags: [
              {
                Key: 'Name',
                Value: `php-site-${siteId}`
              },
              {
                Key: 'ManagedBy',
                Value: 'php-universal-mcp-server'
              },
              {
                Key: 'SiteId',
                Value: siteId
              },
              {
                Key: 'RestoredFrom',
                Value: backupId
              }
            ]
          }
        ]
      };
      
      // Adicionar chave SSH se configurada
      if (this.config.keyPairName) {
        instanceParams.KeyName = this.config.keyPairName;
      }
      
      const instanceResult = await this.ec2.runInstances(instanceParams).promise();
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
      
      // Registrar site restaurado (exemplo simplificado)
      const siteInfo = {
        id: siteId,
        instanceId: instanceId,
        publicDnsName: instance.PublicDnsName,
        publicIp: instance.PublicIpAddress,
        securityGroupId: securityGroupId,
        restoredFrom: backupId,
        restoredAt: new Date().toISOString(),
        status: 'running'
      };
      
      return siteInfo;
    } catch (error) {
      console.error(`Erro ao restaurar site PHP ${siteId} no EC2:`, error);
      throw error;
    }
  }
}

module.exports = EC2Service;