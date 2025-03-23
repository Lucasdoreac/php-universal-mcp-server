/**
 * Exemplo de uso do provedor Hostinger
 * 
 * Este arquivo demonstra como utilizar o provedor Hostinger
 * para operações básicas com o PHP Universal MCP Server.
 */

const HostingerProvider = require('../providers/hostinger');

// Inicialização básica com API Key
async function basicExample() {
  console.log('Executando exemplo básico de uso do provedor Hostinger...');
  
  try {
    // Inicializa o provedor com configuração básica
    const hostinger = new HostingerProvider({
      apiKey: 'SUA_API_KEY_AQUI'
    });
    
    // Inicializa o provedor
    const initialized = await hostinger.initialize();
    console.log('Inicialização:', initialized ? 'Sucesso' : 'Falha');
    
    if (!initialized) return;
    
    // Lista websites
    console.log('\nListando websites...');
    const sites = await hostinger.listSites();
    console.log(`${sites.length} sites encontrados`);
    
    if (sites.length > 0) {
      // Mostra detalhes do primeiro site
      console.log('\nDetalhes do primeiro site:');
      const firstSite = await hostinger.getSite(sites[0].id);
      console.log(JSON.stringify(firstSite, null, 2));
    }
    
    // Exemplo de criação de site (comentado para evitar criação acidental)
    /*
    console.log('\nCriando novo site...');
    const newSite = await hostinger.createSite({
      domain: 'meunovosite.com',
      plan: 'business',
      title: 'Meu Novo Site'
    });
    console.log('Site criado:', newSite.id);
    */
    
  } catch (error) {
    console.error('Erro no exemplo básico:', error.message);
  }
}

// Exemplo com módulos específicos (domínio, banco de dados, arquivos)
async function advancedExample() {
  console.log('\nExecutando exemplo avançado com módulos específicos...');
  
  try {
    // Inicializa o provedor
    const hostinger = new HostingerProvider({
      apiKey: 'SUA_API_KEY_AQUI'
    });
    await hostinger.initialize();
    
    // Obtém API e módulos internos
    const api = hostinger.api;
    const domainManager = hostinger.domainManager;
    const dbManager = hostinger.dbManager;
    const fileManager = hostinger.fileManager;
    
    // Exemplo de manipulação de domínios
    console.log('\nListando domínios...');
    const domains = await domainManager.listDomains();
    console.log(`${domains.length} domínios encontrados`);
    
    // Exemplo de manipulação de DNS (comentado para evitar alterações acidentais)
    /*
    if (domains.length > 0) {
      console.log('\nListando registros DNS do primeiro domínio...');
      const dnsRecords = await domainManager.listDnsRecords(domains[0].name);
      console.log(`${dnsRecords.length} registros DNS encontrados`);
      
      console.log('\nAdicionando registro DNS...');
      await domainManager.createDnsRecord(domains[0].name, {
        type: 'TXT',
        name: 'teste',
        content: 'v=php-universal-mcp-server-test',
        ttl: 3600
      });
    }
    */
    
    // Exemplo de manipulação de bancos de dados (comentado para evitar alterações acidentais)
    /*
    if (sites && sites.length > 0) {
      console.log('\nListando bancos de dados do primeiro site...');
      const databases = await dbManager.listDatabases(sites[0].id);
      console.log(`${databases.length} bancos de dados encontrados`);
      
      console.log('\nCriando banco de dados...');
      await dbManager.createMysqlDatabase(sites[0].id, {
        name: 'testdb',
        username: 'testuser',
        password: 'StrongP@ssw0rd!'
      });
    }
    */
    
    // Exemplo de manipulação de arquivos (comentado para evitar alterações acidentais)
    /*
    if (sites && sites.length > 0) {
      console.log('\nConectando ao FTP...');
      await fileManager.connect(sites[0].id);
      
      console.log('\nListando arquivos...');
      const files = await fileManager.listFiles('/');
      console.log(`${files.length} arquivos/diretórios encontrados`);
      
      console.log('\nUpload de arquivo...');
      await fileManager.uploadFile('./examples/test.txt', '/test.txt');
      
      console.log('\nDesconectando do FTP...');
      await fileManager.disconnect();
    }
    */
    
  } catch (error) {
    console.error('Erro no exemplo avançado:', error.message);
  }
}

// Executa exemplos
async function runExamples() {
  await basicExample();
  await advancedExample();
  console.log('\nExemplos concluídos!');
}

// Executa se este arquivo for executado diretamente
if (require.main === module) {
  runExamples().catch(console.error);
}