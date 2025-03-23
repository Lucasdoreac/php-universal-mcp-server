/**
 * Testes para o FTP Uploader
 */
const FTPUploader = require('../src/ftp-uploader');
const path = require('path');
const fs = require('fs');

// Mock do cliente FTP
jest.mock('basic-ftp', () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      return {
        ftp: {
          verbose: true
        },
        access: jest.fn().mockResolvedValue(true),
        ensureDir: jest.fn().mockResolvedValue(true),
        uploadFromDir: jest.fn().mockResolvedValue(true),
        close: jest.fn()
      };
    })
  };
});

describe('FTP Uploader', () => {
  let uploader;
  const testSitesDir = path.join(__dirname, 'fixtures', 'sites');
  
  beforeEach(() => {
    // Configura o uploader com diretório de testes
    uploader = new FTPUploader({
      sitesDir: testSitesDir
    });
    
    // Garante que o diretório de testes exista
    if (!fs.existsSync(testSitesDir)) {
      fs.mkdirSync(testSitesDir, { recursive: true });
    }
    
    // Cria um site de teste
    const testSiteDir = path.join(testSitesDir, 'teste.com');
    if (!fs.existsSync(testSiteDir)) {
      fs.mkdirSync(testSiteDir, { recursive: true });
      fs.writeFileSync(path.join(testSiteDir, 'index.php'), '<?php echo "Teste"; ?>');
    }
  });
  
  test('Deve fazer upload de um site com sucesso', async () => {
    const result = await uploader.uploadSite({
      domain: 'teste.com',
      ftpHost: 'ftp.exemplo.com',
      ftpUser: 'usuario',
      ftpPassword: 'senha'
    });
    
    expect(result.success).toBeTruthy();
    expect(result.domain).toBe('teste.com');
    expect(result.ftpHost).toBe('ftp.exemplo.com');
  });
  
  test('Deve retornar erro quando o domínio não existir', async () => {
    const result = await uploader.uploadSite({
      domain: 'nao-existe.com',
      ftpHost: 'ftp.exemplo.com',
      ftpUser: 'usuario',
      ftpPassword: 'senha'
    });
    
    expect(result.success).toBeFalsy();
    expect(result.error).toContain('não encontrado');
  });
  
  test('Deve retornar erro quando as credenciais estiverem incompletas', async () => {
    const result = await uploader.uploadSite({
      domain: 'teste.com'
    });
    
    expect(result.success).toBeFalsy();
    expect(result.error).toContain('Credenciais FTP incompletas');
  });
});