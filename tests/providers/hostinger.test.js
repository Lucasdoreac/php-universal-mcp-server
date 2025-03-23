/**
 * Testes unitários para o provedor Hostinger
 */

const { expect } = require('chai');
const sinon = require('sinon');
const axios = require('axios');
const EventEmitter = require('events');

const HostingerProvider = require('../../providers/hostinger');
const HostingerAuth = require('../../providers/hostinger/auth');
const HostingerAPI = require('../../providers/hostinger/api');

describe('Hostinger Provider', () => {
  let provider;
  let axiosStub;

  beforeEach(() => {
    // Configura os stubs para o Axios
    axiosStub = sinon.stub(axios, 'create');
    axiosStub.returns({
      get: sinon.stub(),
      post: sinon.stub(),
      put: sinon.stub(),
      patch: sinon.stub(),
      delete: sinon.stub()
    });

    // Inicializa o provedor com chave de API falsa
    provider = new HostingerProvider({
      apiKey: 'test-api-key'
    });
  });

  afterEach(() => {
    // Restaura os stubs
    sinon.restore();
  });

  describe('Constructor', () => {
    it('should initialize with provided API key', () => {
      expect(provider.apiKey).to.equal('test-api-key');
      expect(provider.apiEndpoint).to.equal('https://api.hostinger.com/v1');
      expect(provider instanceof EventEmitter).to.be.true;
    });

    it('should use custom API endpoint if provided', () => {
      const customProvider = new HostingerProvider({
        apiKey: 'test-api-key',
        apiEndpoint: 'https://custom-api.hostinger.com'
      });
      expect(customProvider.apiEndpoint).to.equal('https://custom-api.hostinger.com');
    });
  });

  describe('initialize()', () => {
    it('should successfully initialize when API call succeeds', async () => {
      // Configura o mock da resposta de sucesso
      const axiosInstance = axiosStub.firstCall.returnValue;
      axiosInstance.get.withArgs('/account').resolves({
        data: { id: 'test-account', status: 'active' }
      });

      const result = await provider.initialize();
      expect(result).to.be.true;
      expect(provider.accountInfo).to.deep.equal({ id: 'test-account', status: 'active' });
    });

    it('should fail initialization when API call fails', async () => {
      // Configura o mock da resposta de erro
      const axiosInstance = axiosStub.firstCall.returnValue;
      axiosInstance.get.withArgs('/account').rejects(new Error('API Error'));

      const result = await provider.initialize();
      expect(result).to.be.false;
    });

    it('should emit an initialized event on success', async () => {
      // Configura o mock da resposta de sucesso
      const axiosInstance = axiosStub.firstCall.returnValue;
      axiosInstance.get.withArgs('/account').resolves({
        data: { id: 'test-account', status: 'active' }
      });

      // Configura espião para o evento
      const eventSpy = sinon.spy();
      provider.on('initialized', eventSpy);

      await provider.initialize();
      expect(eventSpy.calledOnce).to.be.true;
      expect(eventSpy.calledWith(true)).to.be.true;
    });

    it('should emit an error event on failure', async () => {
      // Configura o mock da resposta de erro
      const axiosInstance = axiosStub.firstCall.returnValue;
      axiosInstance.get.withArgs('/account').rejects(new Error('API Error'));

      // Configura espião para o evento
      const eventSpy = sinon.spy();
      provider.on('error', eventSpy);

      await provider.initialize();
      expect(eventSpy.calledOnce).to.be.true;
      expect(eventSpy.firstCall.args[0].message).to.include('Falha ao inicializar');
    });
  });

  describe('listSites()', () => {
    beforeEach(() => {
      // Configura o provedor como inicializado
      provider.accountInfo = { id: 'test-account', status: 'active' };
    });

    it('should return list of sites on successful API call', async () => {
      // Configura o mock da resposta de sucesso
      const axiosInstance = axiosStub.firstCall.returnValue;
      axiosInstance.get.withArgs('/websites').resolves({
        data: [
          { id: 'site1', domain: 'example1.com', status: 'active' },
          { id: 'site2', domain: 'example2.com', status: 'pending' }
        ]
      });

      const sites = await provider.listSites();
      expect(sites).to.be.an('array').with.lengthOf(2);
      expect(sites[0].id).to.equal('site1');
      expect(sites[1].domain).to.equal('example2.com');
    });

    it('should throw error and emit event when API call fails', async () => {
      // Configura o mock da resposta de erro
      const axiosInstance = axiosStub.firstCall.returnValue;
      axiosInstance.get.withArgs('/websites').rejects(new Error('API Error'));

      // Configura espião para o evento
      const eventSpy = sinon.spy();
      provider.on('error', eventSpy);

      try {
        await provider.listSites();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('API Error');
        expect(eventSpy.calledOnce).to.be.true;
        expect(eventSpy.firstCall.args[0].message).to.include('Falha ao listar sites');
      }
    });
  });

  describe('getSite()', () => {
    beforeEach(() => {
      // Configura o provedor como inicializado
      provider.accountInfo = { id: 'test-account', status: 'active' };
    });

    it('should return site details on successful API call', async () => {
      // Configura o mock da resposta de sucesso
      const axiosInstance = axiosStub.firstCall.returnValue;
      axiosInstance.get.withArgs('/websites/site1').resolves({
        data: { id: 'site1', domain: 'example.com', status: 'active' }
      });

      const site = await provider.getSite('site1');
      expect(site).to.be.an('object');
      expect(site.id).to.equal('site1');
      expect(site.domain).to.equal('example.com');
    });

    it('should throw error and emit event when API call fails', async () => {
      // Configura o mock da resposta de erro
      const axiosInstance = axiosStub.firstCall.returnValue;
      axiosInstance.get.withArgs('/websites/site1').rejects(new Error('API Error'));

      // Configura espião para o evento
      const eventSpy = sinon.spy();
      provider.on('error', eventSpy);

      try {
        await provider.getSite('site1');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('API Error');
        expect(eventSpy.calledOnce).to.be.true;
        expect(eventSpy.firstCall.args[0].message).to.include('Falha ao obter detalhes do site');
      }
    });
  });

  describe('createSite()', () => {
    beforeEach(() => {
      // Configura o provedor como inicializado
      provider.accountInfo = { id: 'test-account', status: 'active' };
    });

    it('should create a site on successful API call', async () => {
      // Configura o mock da resposta de sucesso
      const axiosInstance = axiosStub.firstCall.returnValue;
      axiosInstance.post.withArgs('/websites').resolves({
        data: { id: 'new-site', domain: 'newsite.com', status: 'created' }
      });

      // Configura espião para o evento
      const eventSpy = sinon.spy();
      provider.on('site-created', eventSpy);

      const options = { domain: 'newsite.com', plan: 'business' };
      const site = await provider.createSite(options);
      
      expect(site).to.be.an('object');
      expect(site.id).to.equal('new-site');
      expect(site.domain).to.equal('newsite.com');
      expect(eventSpy.calledOnce).to.be.true;
      expect(eventSpy.firstCall.args[0]).to.deep.equal(site);
    });

    it('should throw error and emit event when API call fails', async () => {
      // Configura o mock da resposta de erro
      const axiosInstance = axiosStub.firstCall.returnValue;
      axiosInstance.post.withArgs('/websites').rejects(new Error('API Error'));

      // Configura espião para o evento
      const eventSpy = sinon.spy();
      provider.on('error', eventSpy);

      try {
        await provider.createSite({ domain: 'newsite.com' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('API Error');
        expect(eventSpy.calledOnce).to.be.true;
        expect(eventSpy.firstCall.args[0].message).to.include('Falha ao criar site');
      }
    });
  });

  describe('updateSite()', () => {
    beforeEach(() => {
      // Configura o provedor como inicializado
      provider.accountInfo = { id: 'test-account', status: 'active' };
    });

    it('should update a site on successful API call', async () => {
      // Configura o mock da resposta de sucesso
      const axiosInstance = axiosStub.firstCall.returnValue;
      axiosInstance.patch.withArgs('/websites/site1').resolves({
        data: { id: 'site1', domain: 'example.com', status: 'active', title: 'Updated Title' }
      });

      // Configura espião para o evento
      const eventSpy = sinon.spy();
      provider.on('site-updated', eventSpy);

      const updates = { title: 'Updated Title' };
      const site = await provider.updateSite('site1', updates);
      
      expect(site).to.be.an('object');
      expect(site.id).to.equal('site1');
      expect(site.title).to.equal('Updated Title');
      expect(eventSpy.calledOnce).to.be.true;
      expect(eventSpy.firstCall.args[0]).to.deep.equal(site);
    });

    it('should throw error and emit event when API call fails', async () => {
      // Configura o mock da resposta de erro
      const axiosInstance = axiosStub.firstCall.returnValue;
      axiosInstance.patch.withArgs('/websites/site1').rejects(new Error('API Error'));

      // Configura espião para o evento
      const eventSpy = sinon.spy();
      provider.on('error', eventSpy);

      try {
        await provider.updateSite('site1', { title: 'Updated Title' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('API Error');
        expect(eventSpy.calledOnce).to.be.true;
        expect(eventSpy.firstCall.args[0].message).to.include('Falha ao atualizar site');
      }
    });
  });

  describe('deleteSite()', () => {
    beforeEach(() => {
      // Configura o provedor como inicializado
      provider.accountInfo = { id: 'test-account', status: 'active' };
    });

    it('should delete a site on successful API call', async () => {
      // Configura o mock da resposta de sucesso
      const axiosInstance = axiosStub.firstCall.returnValue;
      axiosInstance.delete.withArgs('/websites/site1').resolves({});

      // Configura espião para o evento
      const eventSpy = sinon.spy();
      provider.on('site-deleted', eventSpy);

      const result = await provider.deleteSite('site1');
      
      expect(result).to.be.true;
      expect(eventSpy.calledOnce).to.be.true;
      expect(eventSpy.firstCall.args[0]).to.deep.equal({ siteId: 'site1' });
    });

    it('should throw error and emit event when API call fails', async () => {
      // Configura o mock da resposta de erro
      const axiosInstance = axiosStub.firstCall.returnValue;
      axiosInstance.delete.withArgs('/websites/site1').rejects(new Error('API Error'));

      // Configura espião para o evento
      const eventSpy = sinon.spy();
      provider.on('error', eventSpy);

      try {
        await provider.deleteSite('site1');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('API Error');
        expect(eventSpy.calledOnce).to.be.true;
        expect(eventSpy.firstCall.args[0].message).to.include('Falha ao remover site');
      }
    });
  });

  // Testes para os demais métodos seguiriam o mesmo padrão
});

describe('Hostinger Auth', () => {
  let auth;
  let fsStub;
  let cryptoStub;
  let axiosStub;

  beforeEach(() => {
    // Configurar stubs para FS
    fsStub = {
      existsSync: sinon.stub(),
      readFileSync: sinon.stub(),
      writeFileSync: sinon.stub()
    };
    sinon.stub(require('fs'), 'existsSync').callsFake(fsStub.existsSync);
    sinon.stub(require('fs'), 'readFileSync').callsFake(fsStub.readFileSync);
    sinon.stub(require('fs'), 'writeFileSync').callsFake(fsStub.writeFileSync);

    // Configurar stubs para Crypto
    cryptoStub = {
      createCipher: sinon.stub(),
      createDecipher: sinon.stub(),
      createHash: sinon.stub()
    };
    sinon.stub(require('crypto'), 'createCipher').callsFake(cryptoStub.createCipher);
    sinon.stub(require('crypto'), 'createDecipher').callsFake(cryptoStub.createDecipher);
    sinon.stub(require('crypto'), 'createHash').callsFake(cryptoStub.createHash);

    // Configurar mock para hash
    const hashMock = {
      update: sinon.stub().returnsThis(),
      digest: sinon.stub().returns('mocked-hash')
    };
    cryptoStub.createHash.returns(hashMock);

    // Configurar mocks para cipher/decipher
    const cipherMock = {
      update: sinon.stub().returns('encrypted-'),
      final: sinon.stub().returns('data')
    };
    const decipherMock = {
      update: sinon.stub().returns('decrypted-'),
      final: sinon.stub().returns('data')
    };
    cryptoStub.createCipher.returns(cipherMock);
    cryptoStub.createDecipher.returns(decipherMock);

    // Configurar stub para Axios
    axiosStub = sinon.stub(axios, 'post');

    // Inicializar auth com configuração de teste
    auth = new HostingerAuth({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      tokenStoragePath: './test-tokens'
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Constructor', () => {
    it('should initialize with provided credentials', () => {
      expect(auth.clientId).to.equal('test-client-id');
      expect(auth.clientSecret).to.equal('test-client-secret');
      expect(auth.tokenStoragePath).to.equal('./test-tokens');
    });

    it('should try to load tokens on initialization', () => {
      expect(fsStub.existsSync.calledOnce).to.be.true;
    });
  });

  describe('getAuthToken()', () => {
    it('should return apiKey if available', async () => {
      const apiKeyAuth = new HostingerAuth({
        apiKey: 'direct-api-key'
      });

      const token = await apiKeyAuth.getAuthToken();
      expect(token).to.equal('direct-api-key');
    });

    it('should return existing token if valid', async () => {
      auth.tokens = {
        accessToken: 'existing-token',
        expiresAt: Date.now() + 3600000 // Valid for 1 hour
      };

      const token = await auth.getAuthToken();
      expect(token).to.equal('existing-token');
    });

    it('should refresh token if available but expired', async () => {
      auth.tokens = {
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() - 3600000 // Expired 1 hour ago
      };

      // Mock da resposta de refresh
      axiosStub.resolves({
        data: {
          access_token: 'new-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer'
        }
      });

      const token = await auth.getAuthToken();
      expect(token).to.equal('new-token');
      expect(auth.tokens.accessToken).to.equal('new-token');
      expect(auth.tokens.refreshToken).to.equal('new-refresh-token');
    });

    it('should authenticate if no token available', async () => {
      auth.tokens = {};

      // Mock da resposta de autenticação
      axiosStub.resolves({
        data: {
          access_token: 'fresh-token',
          refresh_token: 'fresh-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer'
        }
      });

      const token = await auth.getAuthToken();
      expect(token).to.equal('fresh-token');
      expect(auth.tokens.accessToken).to.equal('fresh-token');
      expect(auth.tokens.refreshToken).to.equal('fresh-refresh-token');
    });
  });

  // Testes adicionais para criptografia, salvamento de tokens, etc.
});

// Testes similares podem ser criados para HostingerAPI e outros módulos