/**
 * Marketplace Repository Integration Tests
 * 
 * @jest-environment node
 */

const path = require('path');
const fs = require('fs');
const NodeCache = require('node-cache');
const Repository = require('../../../../modules/marketplace/core/repository');

// Mock para axios (usado para requisições HTTP ao repositório)
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn()
}));

// Mock para fs
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn()
}));

// Mock para NodeCache
jest.mock('node-cache', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    flushAll: jest.fn()
  }));
});

describe('Repository', () => {
  let repository;
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

    // Instanciar o repositório
    repository = new Repository({ 
      logger: mockLogger 
    });
  });

  describe('constructor', () => {
    it('deve criar uma instância com as opções padrão', () => {
      expect(repository).toBeInstanceOf(Repository);
      expect(repository.options.baseUrl).toBe('https://marketplace.php-universal-mcp.com/api');
      expect(repository.options.cacheEnabled).toBe(true);
      expect(repository.options.cacheTTL).toBe(3600);
      expect(repository.logger).toBe(mockLogger);
      expect(repository.cache).toBeInstanceOf(NodeCache);
      expect(repository.categories).toBeInstanceOf(Array);
      expect(repository.categories.length).toBeGreaterThan(0);
      expect(fs.existsSync).toHaveBeenCalled();
      
      // Se o diretório de plugins não existir, deve criá-lo
      if (!fs.existsSync.mock.results[0].value) {
        expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
      }
    });

    it('deve substituir opções padrão quando fornecidas', () => {
      const customOptions = {
        baseUrl: 'https://custom.marketplace.com/api',
        cacheEnabled: false,
        cacheTTL: 7200,
        logger: mockLogger
      };

      const customRepository = new Repository(customOptions);
      expect(customRepository.options.baseUrl).toBe('https://custom.marketplace.com/api');
      expect(customRepository.options.cacheEnabled).toBe(false);
      expect(customRepository.options.cacheTTL).toBe(7200);
      expect(customRepository.cache).toBeInstanceOf(NodeCache);
    });
  });

  describe('_getCached', () => {
    it('deve retornar null quando cache desabilitado', () => {
      // Criar repositório com cache desabilitado
      const noCache = new Repository({ 
        cacheEnabled: false, 
        logger: mockLogger 
      });
      
      // Verificar que _getCached retorna null
      expect(noCache._getCached('test-key')).toBeNull();
      expect(noCache.cache.get).not.toHaveBeenCalled();
    });

    it('deve chamar cache.get quando cache habilitado', () => {
      // Mock para retornar um valor do cache
      repository.cache.get.mockReturnValueOnce('cached-value');
      
      // Verificar que _getCached retorna o valor do cache
      const result = repository._getCached('test-key');
      expect(result).toBe('cached-value');
      expect(repository.cache.get).toHaveBeenCalledWith('test-key');
    });
  });

  describe('_setCached', () => {
    it('não deve fazer nada quando cache desabilitado', () => {
      // Criar repositório com cache desabilitado
      const noCache = new Repository({ 
        cacheEnabled: false, 
        logger: mockLogger 
      });
      
      // Verificar que _setCached não chama cache.set
      noCache._setCached('test-key', 'test-value');
      expect(noCache.cache.set).not.toHaveBeenCalled();
    });

    it('deve chamar cache.set quando cache habilitado', () => {
      // Verificar que _setCached chama cache.set com os parâmetros corretos
      repository._setCached('test-key', 'test-value', 1800);
      expect(repository.cache.set).toHaveBeenCalledWith('test-key', 'test-value', 1800);
    });

    it('deve usar o TTL padrão quando não fornecido', () => {
      // Verificar que _setCached usa o TTL padrão quando não fornecido
      repository._setCached('test-key', 'test-value');
      expect(repository.cache.set).toHaveBeenCalledWith('test-key', 'test-value', 3600);
    });
  });

  describe('_cacheKey', () => {
    it('deve gerar chave de cache correta para objetos vazios', () => {
      const key = repository._cacheKey('prefix', {});
      expect(key).toMatch(/^prefix:[a-f0-9]{32}$/);
    });

    it('deve gerar a mesma chave para o mesmo conjunto de parâmetros', () => {
      const params = { a: 1, b: 'test', c: true };
      const key1 = repository._cacheKey('prefix', params);
      const key2 = repository._cacheKey('prefix', params);
      expect(key1).toBe(key2);
    });

    it('deve gerar a mesma chave independente da ordem dos parâmetros', () => {
      const params1 = { a: 1, b: 'test' };
      const params2 = { b: 'test', a: 1 };
      const key1 = repository._cacheKey('prefix', params1);
      const key2 = repository._cacheKey('prefix', params2);
      expect(key1).toBe(key2);
    });

    it('deve ignorar valores undefined e null', () => {
      const params1 = { a: 1, b: 'test', c: undefined, d: null };
      const params2 = { a: 1, b: 'test' };
      const key1 = repository._cacheKey('prefix', params1);
      const key2 = repository._cacheKey('prefix', params2);
      expect(key1).toBe(key2);
    });
  });

  describe('getPlugins', () => {
    it('deve retornar plugins do cache se disponíveis', async () => {
      // Configurar o mock do cache para retornar dados
      const cachedPlugins = {
        plugins: [{ id: 'plugin-1', name: 'Test Plugin' }],
        total: 1
      };
      repository.cache.get.mockReturnValueOnce(cachedPlugins);

      // Executar método
      const result = await repository.getPlugins();

      // Verificar se usou cache e não fez chamada externa
      expect(result).toBe(cachedPlugins);
      expect(repository.cache.get).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Retornando plugins do cache');
    });

    it('deve gerar plugins de exemplo quando não há no cache', async () => {
      // Mock para gerar plugins (espiar o método privado)
      const examplePlugins = [
        { id: 'plugin-1', name: 'Test Plugin 1' },
        { id: 'plugin-2', name: 'Test Plugin 2' }
      ];
      repository._generateExamplePlugins = jest.fn().mockReturnValue(examplePlugins);

      // Executar método
      const result = await repository.getPlugins();

      // Verificar resultado
      expect(result).toHaveProperty('plugins');
      expect(result).toHaveProperty('total');
      expect(result.plugins.length).toBe(2);
      expect(repository._generateExamplePlugins).toHaveBeenCalled();
      expect(repository.cache.set).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Buscando plugins do repositório');
    });

    it('deve aplicar filtros de busca corretamente', async () => {
      // Plugin fictícios para testar filtros
      const examplePlugins = [
        { 
          id: 'plugin-1', 
          name: 'SEO Plugin', 
          description: 'SEO optimization',
          category: 'seo',
          tags: ['seo', 'optimization'],
          author: 'SEO Experts',
          isPaid: false
        },
        { 
          id: 'plugin-2', 
          name: 'Analytics Pro', 
          description: 'Advanced analytics',
          category: 'analytics',
          tags: ['analytics', 'reports'],
          author: 'Data Wizards',
          isPaid: true
        },
        { 
          id: 'plugin-3', 
          name: 'Social Share', 
          description: 'Social media integration',
          category: 'social-media',
          tags: ['social', 'sharing'],
          author: 'Social Experts',
          isPaid: false
        }
      ];
      
      repository._generateExamplePlugins = jest.fn().mockReturnValue(examplePlugins);

      // Testar filtro por query (termo de busca)
      let result = await repository.getPlugins({ query: 'seo' });
      expect(result.plugins.length).toBe(1);
      expect(result.plugins[0].id).toBe('plugin-1');
      
      // Testar filtro por categoria
      result = await repository.getPlugins({ category: 'analytics' });
      expect(result.plugins.length).toBe(1);
      expect(result.plugins[0].id).toBe('plugin-2');
      
      // Testar filtro por tags
      result = await repository.getPlugins({ tags: 'social,sharing' });
      expect(result.plugins.length).toBe(1);
      expect(result.plugins[0].id).toBe('plugin-3');
      
      // Testar filtro por autor
      result = await repository.getPlugins({ author: 'experts' });
      expect(result.plugins.length).toBe(2); // Deve encontrar SEO Experts e Social Experts
      
      // Testar filtro por isPaid
      result = await repository.getPlugins({ paid: false });
      expect(result.plugins.length).toBe(2); // Os plugins gratuitos
      
      // Testar combinação de filtros
      result = await repository.getPlugins({ 
        category: 'seo', 
        paid: false 
      });
      expect(result.plugins.length).toBe(1);
      expect(result.plugins[0].id).toBe('plugin-1');
    });

    it('deve aplicar ordenação corretamente', async () => {
      // Plugin fictícios para testar ordenação
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const examplePlugins = [
        { 
          id: 'plugin-1', 
          name: 'SEO Plugin',
          rating: 3.5,
          downloads: 100,
          createdAt: lastWeek.toISOString(),
          updatedAt: yesterday.toISOString()
        },
        { 
          id: 'plugin-2', 
          name: 'Analytics Pro',
          rating: 4.8,
          downloads: 50,
          createdAt: yesterday.toISOString(),
          updatedAt: now.toISOString()
        },
        { 
          id: 'plugin-3', 
          name: 'Social Share',
          rating: 4.2,
          downloads: 200,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        }
      ];
      
      repository._generateExamplePlugins = jest.fn().mockReturnValue(examplePlugins);

      // Ordenar por rating (crescente)
      let result = await repository.getPlugins({ sort: 'rating:asc' });
      expect(result.plugins[0].id).toBe('plugin-1'); // Menor rating
      expect(result.plugins[2].id).toBe('plugin-2'); // Maior rating
      
      // Ordenar por rating (decrescente)
      result = await repository.getPlugins({ sort: 'rating:desc' });
      expect(result.plugins[0].id).toBe('plugin-2'); // Maior rating
      expect(result.plugins[2].id).toBe('plugin-1'); // Menor rating
      
      // Ordenar por downloads
      result = await repository.getPlugins({ sort: 'downloads:desc' });
      expect(result.plugins[0].id).toBe('plugin-3'); // Mais downloads
      expect(result.plugins[2].id).toBe('plugin-2'); // Menos downloads
      
      // Ordenar por data de criação
      result = await repository.getPlugins({ sort: 'created:desc' });
      expect(result.plugins[0].id).toBe('plugin-3'); // Mais recente
      expect(result.plugins[2].id).toBe('plugin-1'); // Mais antigo
      
      // Ordenar por data de atualização
      result = await repository.getPlugins({ sort: 'updated:desc' });
      expect(result.plugins[0].id).toBe('plugin-2'); // ou plugin-3, ambos atualizados hoje
    });

    it('deve aplicar paginação corretamente', async () => {
      // Gerar 20 plugins de exemplo
      const examplePlugins = Array.from({ length: 20 }, (_, i) => ({
        id: `plugin-${i+1}`,
        name: `Plugin ${i+1}`
      }));
      
      repository._generateExamplePlugins = jest.fn().mockReturnValue(examplePlugins);

      // Página 1, 5 itens por página
      let result = await repository.getPlugins({ 
        page: 1, 
        limit: 5 
      });
      expect(result.plugins.length).toBe(5);
      expect(result.total).toBe(20);
      expect(result.totalPages).toBe(4);
      expect(result.plugins[0].id).toBe('plugin-1');
      expect(result.plugins[4].id).toBe('plugin-5');
      
      // Página 2, 5 itens por página
      result = await repository.getPlugins({ 
        page: 2, 
        limit: 5 
      });
      expect(result.plugins.length).toBe(5);
      expect(result.plugins[0].id).toBe('plugin-6');
      expect(result.plugins[4].id).toBe('plugin-10');
      
      // Última página, possivelmente incompleta
      result = await repository.getPlugins({ 
        page: 4, 
        limit: 7 
      });
      expect(result.plugins.length).toBeLessThanOrEqual(7);
      expect(result.page).toBe(4);
    });

    it('deve lidar com erros durante a busca', async () => {
      // Forçar um erro no método de geração de plugins
      repository._generateExamplePlugins = jest.fn().mockImplementation(() => {
        throw new Error('Failed to generate plugins');
      });

      // Executar método e verificar erro
      await expect(repository.getPlugins())
        .rejects.toThrow('Failed to generate plugins');
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro ao buscar plugins:', 
        expect.any(Error)
      );
    });
  });

  describe('getPluginInfo', () => {
    it('deve retornar plugin do cache se disponível', async () => {
      // Configurar o mock do cache para retornar dados
      const cachedPlugin = { 
        id: 'plugin-1', 
        name: 'Test Plugin',
        version: '1.2.0'
      };
      repository.cache.get.mockReturnValueOnce(cachedPlugin);

      // Executar método
      const result = await repository.getPluginInfo('plugin-1');

      // Verificar se usou cache e não fez chamada externa
      expect(result).toBe(cachedPlugin);
      expect(repository.cache.get).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Retornando plugin plugin-1 do cache');
    });

    it('deve lançar erro quando plugin não existe', async () => {
      // Mock para simular plugin não encontrado
      repository._generateExamplePlugins = jest.fn().mockReturnValue([]);

      // Executar método e verificar erro
      await expect(repository.getPluginInfo('non-existent'))
        .rejects.toThrow('Plugin non-existent não encontrado');
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro ao obter informações do plugin non-existent:', 
        expect.any(Error)
      );
    });

    it('deve retornar detalhes estendidos para um plugin existente', async () => {
      // Plugin fictício para teste
      const examplePlugins = [
        { 
          id: 'test-plugin', 
          name: 'Test Plugin',
          description: 'A test plugin',
          version: '1.2.0',
          category: 'testing',
          author: 'Test Author',
          isPaid: false,
          rating: 4.5,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-02-01T00:00:00.000Z'
        }
      ];
      
      repository._generateExamplePlugins = jest.fn().mockReturnValue(examplePlugins);

      // Executar método
      const result = await repository.getPluginInfo('test-plugin');

      // Verificar resultado
      expect(result).toHaveProperty('id', 'test-plugin');
      expect(result).toHaveProperty('name', 'Test Plugin');
      
      // Verificar propriedades extras
      expect(result).toHaveProperty('longDescription');
      expect(result).toHaveProperty('requirements');
      expect(result).toHaveProperty('images');
      expect(result).toHaveProperty('documentation');
      expect(result).toHaveProperty('support');
      expect(result).toHaveProperty('versions');
      expect(result).toHaveProperty('reviews');
      
      // Verificar versões
      expect(result.versions).toHaveLength(2); // versão atual + versão inicial
      expect(result.versions[0].version).toBe('1.2.0');
      
      // Verificar reviews
      expect(Array.isArray(result.reviews)).toBe(true);
      expect(result.reviews.length).toBeGreaterThan(0);
      
      // Verificar cache
      expect(repository.cache.set).toHaveBeenCalled();
    });
  });

  describe('downloadPlugin', () => {
    it('deve rejeitar quando plugin não existe', async () => {
      // Mock para verificar plugin não encontrado
      repository.getPluginInfo = jest.fn().mockResolvedValue(null);

      // Executar método e verificar erro
      await expect(repository.downloadPlugin('non-existent'))
        .rejects.toThrow('Plugin non-existent não encontrado');
    });

    it('deve rejeitar quando versão não existe', async () => {
      // Mock para plugin com versões
      repository.getPluginInfo = jest.fn().mockResolvedValue({
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.2.0',
        versions: [
          { version: '1.2.0' },
          { version: '1.1.0' }
        ]
      });

      // Executar método e verificar erro
      await expect(repository.downloadPlugin('test-plugin', '1.0.0'))
        .rejects.toThrow('Versão 1.0.0 não encontrada para o plugin test-plugin');
    });

    it('deve baixar plugin corretamente', async () => {
      // Mock para plugin
      repository.getPluginInfo = jest.fn().mockResolvedValue({
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.2.0',
        versions: [
          { version: '1.2.0' },
          { version: '1.1.0' }
        ]
      });

      // Executar método
      const result = await repository.downloadPlugin('test-plugin');

      // Verificar resultado
      expect(result).toHaveProperty('pluginId', 'test-plugin');
      expect(result).toHaveProperty('version', '1.2.0');
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('timestamp');
      
      // Verificar que o diretório foi criado
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Baixando plugin test-plugin');
    });

    it('deve baixar versão específica quando fornecida', async () => {
      // Mock para plugin
      repository.getPluginInfo = jest.fn().mockResolvedValue({
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.2.0',
        versions: [
          { version: '1.2.0' },
          { version: '1.1.0' }
        ]
      });

      // Executar método
      const result = await repository.downloadPlugin('test-plugin', '1.1.0');

      // Verificar resultado
      expect(result).toHaveProperty('version', '1.1.0');
    });

    it('deve lidar com erros durante o download', async () => {
      // Mock para plugin
      repository.getPluginInfo = jest.fn().mockResolvedValue({
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.2.0',
        versions: [
          { version: '1.2.0' }
        ]
      });

      // Forçar erro no fs
      fs.writeFileSync.mockImplementationOnce(() => {
        throw new Error('Write error');
      });

      // Executar método e verificar erro
      await expect(repository.downloadPlugin('test-plugin'))
        .rejects.toThrow('Write error');
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro ao baixar plugin test-plugin:', 
        expect.any(Error)
      );
    });
  });

  describe('publishPlugin', () => {
    it('deve validar campos obrigatórios', async () => {
      // Testes para campos obrigatórios
      await expect(repository.publishPlugin({}, './source'))
        .rejects.toThrow('Nome do plugin é obrigatório');
      
      await expect(repository.publishPlugin({ name: 'Test' }, './source'))
        .rejects.toThrow('Versão do plugin é obrigatória');
      
      await expect(repository.publishPlugin({ 
        name: 'Test', 
        version: '1.0.0'
      }, './source'))
        .rejects.toThrow('Descrição do plugin é obrigatória');
      
      await expect(repository.publishPlugin({ 
        name: 'Test', 
        version: '1.0.0', 
        description: 'Test plugin'
      }, './source'))
        .rejects.toThrow('Autor do plugin é obrigatório');
      
      await expect(repository.publishPlugin({ 
        name: 'Test', 
        version: '1.0.0', 
        description: 'Test plugin',
        author: 'Test Author'
      }, './source'))
        .rejects.toThrow('Categoria inválida');
    });

    it('deve verificar se o caminho do código-fonte existe', async () => {
      // Mock para fs.existsSync para retornar false
      fs.existsSync.mockReturnValueOnce(false);

      // Plugin válido
      const plugin = {
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        category: 'utility'
      };

      // Executar método e verificar erro
      await expect(repository.publishPlugin(plugin, './nonexistent'))
        .rejects.toThrow('Caminho do código-fonte não encontrado: ./nonexistent');
    });

    it('deve publicar plugin corretamente', async () => {
      // Plugin válido
      const plugin = {
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        category: 'utility'
      };

      // Executar método
      const result = await repository.publishPlugin(plugin, './source');

      // Verificar resultado
      expect(result).toHaveProperty('pluginId');
      expect(result).toHaveProperty('name', 'Test Plugin');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('publishedAt');
      expect(result).toHaveProperty('status', 'published');
      expect(result).toHaveProperty('url');
      
      expect(mockLogger.info).toHaveBeenCalledWith('Publicando plugin: Test Plugin');
    });

    it('deve gerar ID único quando não fornecido', async () => {
      // Plugin sem ID
      const plugin = {
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        category: 'utility'
      };

      // Executar método
      const result = await repository.publishPlugin(plugin, './source');

      // Verificar que ID foi gerado
      expect(result.pluginId).toMatch(/^test-plugin-[a-f0-9]{8}$/);
    });

    it('deve usar ID existente quando fornecido', async () => {
      // Plugin com ID
      const plugin = {
        id: 'custom-id',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        category: 'utility'
      };

      // Executar método
      const result = await repository.publishPlugin(plugin, './source');

      // Verificar que ID foi mantido
      expect(result.pluginId).toBe('custom-id');
    });

    it('deve preencher campos faltantes com valores padrão', async () => {
      // Plugin mínimo
      const plugin = {
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        category: 'utility'
      };

      // Executar método
      const result = await repository.publishPlugin(plugin, './source');

      // Os valores padrão devem ter sido adicionados no plugin original
      expect(plugin).toHaveProperty('tags');
      expect(plugin).toHaveProperty('isPaid', false);
      expect(plugin).toHaveProperty('rating', 5);
      expect(plugin).toHaveProperty('downloads', 0);
      expect(plugin).toHaveProperty('createdAt');
      expect(plugin).toHaveProperty('updatedAt');
    });

    it('deve lidar com erros durante a publicação', async () => {
      // Plugin válido
      const plugin = {
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin',
        author: 'Test Author',
        category: 'utility'
      };

      // Forçar erro
      jest.useFakeTimers();
      setTimeout.mockImplementationOnce(() => {
        throw new Error('Upload failed');
      });

      // Executar método e verificar erro
      await expect(repository.publishPlugin(plugin, './source'))
        .rejects.toThrow('Upload failed');
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro ao publicar plugin:', 
        expect.any(Error)
      );
    });
  });

  describe('getMarketplaceStats', () => {
    it('deve retornar estatísticas do cache se disponíveis', async () => {
      // Configurar o mock do cache para retornar dados
      const cachedStats = {
        totalPlugins: 20,
        freePlugins: 15,
        paidPlugins: 5
      };
      repository.cache.get.mockReturnValueOnce(cachedStats);

      // Executar método
      const result = await repository.getMarketplaceStats();

      // Verificar se usou cache e não fez chamada externa
      expect(result).toBe(cachedStats);
      expect(repository.cache.get).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Retornando estatísticas do cache');
    });

    it('deve calcular estatísticas corretamente', async () => {
      // Plugins fictícios para estatísticas
      const examplePlugins = Array.from({ length: 20 }, (_, i) => ({
        id: `plugin-${i+1}`,
        name: `Plugin ${i+1}`,
        category: repository.categories[i % repository.categories.length],
        rating: 3 + Math.random() * 2,
        downloads: Math.floor(Math.random() * 1000),
        isPaid: i % 5 === 0,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - i * 43200000).toISOString()
      }));
      
      repository._generateExamplePlugins = jest.fn().mockReturnValue(examplePlugins);

      // Executar método
      const result = await repository.getMarketplaceStats();

      // Verificar estrutura do resultado
      expect(result).toHaveProperty('totalPlugins', 20);
      expect(result).toHaveProperty('freePlugins');
      expect(result).toHaveProperty('paidPlugins');
      expect(result.freePlugins + result.paidPlugins).toBe(20);
      
      // Verificar contagens por categoria
      expect(result).toHaveProperty('categoryCounts');
      expect(Object.keys(result.categoryCounts).length).toBeGreaterThan(0);
      
      // Verificar top plugins
      expect(result).toHaveProperty('topDownloaded');
      expect(Array.isArray(result.topDownloaded)).toBe(true);
      expect(result.topDownloaded.length).toBeLessThanOrEqual(5);
      
      expect(result).toHaveProperty('topRated');
      expect(Array.isArray(result.topRated)).toBe(true);
      
      expect(result).toHaveProperty('newest');
      expect(Array.isArray(result.newest)).toBe(true);
      
      expect(result).toHaveProperty('updated');
      expect(Array.isArray(result.updated)).toBe(true);
      
      // Verificar cache
      expect(repository.cache.set).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Obtendo estatísticas do marketplace');
    });

    it('deve lidar com erros ao obter estatísticas', async () => {
      // Forçar erro
      repository._generateExamplePlugins = jest.fn().mockImplementation(() => {
        throw new Error('Failed to generate plugins');
      });

      // Executar método e verificar erro
      await expect(repository.getMarketplaceStats())
        .rejects.toThrow('Failed to generate plugins');
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro ao obter estatísticas do marketplace:', 
        expect.any(Error)
      );
    });
  });
});
