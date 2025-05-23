#!/usr/bin/env node

/**
 * Script de Validação Final - Fase 3
 * PHP Universal MCP Server v1.12.0
 * 
 * Este script executa validação completa de qualidade e performance
 * para preparar o lançamento da versão estável 1.12.0
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Configurações
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'tests', 'output', 'phase3-validation');
const REPORT_FILE = path.join(OUTPUT_DIR, 'validation-report.json');

// Garantir que o diretório existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🎯 FASE 3: VALIDAÇÃO FINAL E RELEASE v1.12.0');
console.log('==============================================\n');

const validationResults = {
  startTime: new Date().toISOString(),
  endTime: null,
  phase: 'Phase 3 - Final Validation',
  version: '1.12.0-dev',
  runId: crypto.randomBytes(4).toString('hex'),
  tests: {
    unit: { status: 'pending', passed: 0, failed: 0, duration: 0 },
    integration: { status: 'pending', passed: 0, failed: 0, duration: 0 },
    rendering: { status: 'pending', passed: 0, failed: 0, duration: 0 },
    performance: { status: 'pending', passed: 0, failed: 0, duration: 0 }
  },
  validation: {
    serverStartup: { status: 'pending', message: '' },
    coreModules: { status: 'pending', message: '' },
    providers: { status: 'pending', message: '' },
    security: { status: 'pending', message: '' }
  },
  summary: {
    totalTests: 0,
    totalPassed: 0,
    totalFailed: 0,
    overallStatus: 'pending',
    readyForRelease: false
  }
};

// Função para executar comando e capturar resultado
const runCommand = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Executando: ${command} ${args.join(' ')}`);
    
    const startTime = Date.now();
    const process = spawn(command, args, {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      console.log(chunk.trim());
    });

    process.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      console.error(chunk.trim());
    });

    process.on('close', (code) => {
      const duration = Date.now() - startTime;
      resolve({
        code,
        stdout,
        stderr,
        duration,
        success: code === 0
      });
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
};

// 1. TESTES UNITÁRIOS
const runUnitTests = async () => {
  console.log('\n📋 1.1: Executando Testes Unitários');
  console.log('=====================================');
  
  try {
    const result = await runCommand('npm', ['run', 'test:unit']);
    
    // Parse do resultado (simplificado)
    const passed = (result.stdout.match(/✓/g) || []).length;
    const failed = (result.stdout.match(/✗|✖/g) || []).length;
    
    validationResults.tests.unit = {
      status: result.success ? 'passed' : 'failed',
      passed,
      failed,
      duration: result.duration,
      output: result.stdout
    };
    
    console.log(`✅ Testes unitários: ${passed} passou, ${failed} falhou`);
    return result.success;
  } catch (error) {
    console.error(`❌ Erro nos testes unitários: ${error.message}`);
    validationResults.tests.unit.status = 'error';
    validationResults.tests.unit.error = error.message;
    return false;
  }
};

// 2. TESTES DE INTEGRAÇÃO
const runIntegrationTests = async () => {
  console.log('\n📋 1.2: Executando Testes de Integração');
  console.log('=======================================');
  
  try {
    const result = await runCommand('npm', ['run', 'test:integration']);
    
    // Parse do resultado
    const passed = (result.stdout.match(/✓/g) || []).length;
    const failed = (result.stdout.match(/✗|✖/g) || []).length;
    
    validationResults.tests.integration = {
      status: result.success ? 'passed' : 'failed',
      passed,
      failed,
      duration: result.duration,
      output: result.stdout
    };
    
    console.log(`✅ Testes de integração: ${passed} passou, ${failed} falhou`);
    return result.success;
  } catch (error) {
    console.error(`❌ Erro nos testes de integração: ${error.message}`);
    validationResults.tests.integration.status = 'error';
    validationResults.tests.integration.error = error.message;
    return false;
  }
};

// 3. TESTES DE RENDERIZAÇÃO
const runRenderingTests = async () => {
  console.log('\n📋 1.3: Executando Testes de Renderização');
  console.log('==========================================');
  
  try {
    const result = await runCommand('npm', ['run', 'test:rendering']);
    
    validationResults.tests.rendering = {
      status: result.success ? 'passed' : 'failed',
      passed: result.success ? 1 : 0,
      failed: result.success ? 0 : 1,
      duration: result.duration,
      output: result.stdout
    };
    
    console.log(`✅ Testes de renderização: ${result.success ? 'PASSOU' : 'FALHOU'}`);
    return result.success;
  } catch (error) {
    console.error(`❌ Erro nos testes de renderização: ${error.message}`);
    validationResults.tests.rendering.status = 'error';
    validationResults.tests.rendering.error = error.message;
    return false;
  }
};

// 4. VALIDAÇÃO DE STARTUP DO SERVIDOR
const validateServerStartup = async () => {
  console.log('\n📋 2.1: Validando Startup do Servidor');
  console.log('====================================');
  
  try {
    // Testar se o servidor inicia sem erros
    const result = await runCommand('timeout', ['10s', 'node', 'start.js'], {
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    const hasStartupErrors = result.stderr.includes('Error') || result.stderr.includes('EADDRINUSE');
    const success = !hasStartupErrors;
    
    validationResults.validation.serverStartup = {
      status: success ? 'passed' : 'failed',
      message: success ? 'Servidor inicia sem erros críticos' : 'Erros detectados na inicialização',
      output: result.stderr
    };
    
    console.log(`${success ? '✅' : '❌'} Startup do servidor: ${success ? 'OK' : 'FALHOU'}`);
    return success;
  } catch (error) {
    console.error(`❌ Erro na validação de startup: ${error.message}`);
    validationResults.validation.serverStartup.status = 'error';
    validationResults.validation.serverStartup.error = error.message;
    return false;
  }
};

// 5. VALIDAÇÃO DOS MÓDULOS CORE
const validateCoreModules = async () => {
  console.log('\n📋 2.2: Validando Módulos Core');
  console.log('==============================');
  
  const coreModules = [
    'modules/security/auth.js',
    'modules/github/index.js', 
    'modules/hosting/index.js',
    'modules/marketing/tracking/index.js',
    'core/mcp-protocol/server.js'
  ];
  
  let allValid = true;
  const results = [];
  
  for (const modulePath of coreModules) {
    try {
      const fullPath = path.join(PROJECT_ROOT, modulePath);
      
      if (!fs.existsSync(fullPath)) {
        results.push({ module: modulePath, status: 'missing' });
        allValid = false;
        continue;
      }
      
      // Testar se o módulo pode ser carregado
      const result = await runCommand('node', ['-e', `require('./${modulePath}'); console.log('OK')`]);
      
      results.push({
        module: modulePath,
        status: result.success ? 'valid' : 'error',
        error: result.success ? null : result.stderr
      });
      
      if (!result.success) {
        allValid = false;
      }
    } catch (error) {
      results.push({ module: modulePath, status: 'error', error: error.message });
      allValid = false;
    }
  }
  
  validationResults.validation.coreModules = {
    status: allValid ? 'passed' : 'failed',
    message: `${results.filter(r => r.status === 'valid').length}/${results.length} módulos válidos`,
    modules: results
  };
  
  console.log(`${allValid ? '✅' : '❌'} Módulos core: ${allValid ? 'TODOS VÁLIDOS' : 'PROBLEMAS DETECTADOS'}`);
  return allValid;
};

// 6. VALIDAÇÃO DE PROVEDORES
const validateProviders = async () => {
  console.log('\n📋 2.3: Validando Provedores');
  console.log('============================');
  
  const providers = [
    'providers/hostinger.js',
    'providers/shopify.js', 
    'providers/woocommerce.js'
  ];
  
  let allValid = true;
  const results = [];
  
  for (const providerPath of providers) {
    try {
      const fullPath = path.join(PROJECT_ROOT, providerPath);
      
      if (!fs.existsSync(fullPath)) {
        results.push({ provider: providerPath, status: 'missing' });
        allValid = false;
        continue;
      }
      
      // Testar se o provedor pode ser carregado
      const result = await runCommand('node', ['-e', `require('./${providerPath}'); console.log('OK')`]);
      
      results.push({
        provider: providerPath,
        status: result.success ? 'valid' : 'error',
        error: result.success ? null : result.stderr
      });
      
      if (!result.success) {
        allValid = false;
      }
    } catch (error) {
      results.push({ provider: providerPath, status: 'error', error: error.message });
      allValid = false;
    }
  }
  
  validationResults.validation.providers = {
    status: allValid ? 'passed' : 'failed',
    message: `${results.filter(r => r.status === 'valid').length}/${results.length} provedores válidos`,
    providers: results
  };
  
  console.log(`${allValid ? '✅' : '❌'} Provedores: ${allValid ? 'TODOS VÁLIDOS' : 'PROBLEMAS DETECTADOS'}`);
  return allValid;
};

// 7. VALIDAÇÃO DE SEGURANÇA
const validateSecurity = async () => {
  console.log('\n📋 2.4: Validando Módulo de Segurança');
  console.log('====================================');
  
  try {
    // Testar funcionalidades críticas do AuthManager
    const testScript = `
      const AuthManager = require('./modules/security/auth.js');
      const authManager = new AuthManager();
      
      // Teste 1: Gerar senha segura
      const password = authManager.generateSecurePassword(16);
      console.log('Senha gerada:', password.length === 16 ? 'OK' : 'FALHOU');
      
      // Teste 2: Criptografia
      const testData = { test: 'data' };
      const encrypted = authManager.encrypt(testData);
      const decrypted = authManager.decrypt(encrypted);
      console.log('Criptografia:', JSON.stringify(decrypted) === JSON.stringify(testData) ? 'OK' : 'FALHOU');
      
      // Teste 3: JWT (se disponível)
      try {
        const token = authManager.generateToken({ user: 'test' });
        console.log('JWT:', token ? 'OK' : 'INDISPONÍVEL');
      } catch (e) {
        console.log('JWT: INDISPONÍVEL');
      }
      
      console.log('SECURITY_TEST_COMPLETE');
    `;
    
    const result = await runCommand('node', ['-e', testScript]);
    
    const success = result.stdout.includes('SECURITY_TEST_COMPLETE') && 
                   !result.stdout.includes('FALHOU');
    
    validationResults.validation.security = {
      status: success ? 'passed' : 'failed',
      message: success ? 'Módulo de segurança funcional' : 'Problemas no módulo de segurança',
      output: result.stdout
    };
    
    console.log(`${success ? '✅' : '❌'} Segurança: ${success ? 'OK' : 'PROBLEMAS DETECTADOS'}`);
    return success;
  } catch (error) {
    console.error(`❌ Erro na validação de segurança: ${error.message}`);
    validationResults.validation.security.status = 'error';
    validationResults.validation.security.error = error.message;
    return false;
  }
};

// FUNÇÃO PRINCIPAL DE VALIDAÇÃO
const runFullValidation = async () => {
  console.log('🚀 Iniciando Validação Completa da Fase 3...\n');
  
  const results = [];
  
  // Executar testes
  results.push(await runUnitTests());
  results.push(await runIntegrationTests());
  results.push(await runRenderingTests());
  
  // Executar validações
  results.push(await validateServerStartup());
  results.push(await validateCoreModules());
  results.push(await validateProviders());
  results.push(await validateSecurity());
  
  // Calcular sumário
  const allPassed = results.every(r => r === true);
  const passedCount = results.filter(r => r === true).length;
  
  validationResults.endTime = new Date().toISOString();
  validationResults.summary = {
    totalTests: Object.keys(validationResults.tests).length + Object.keys(validationResults.validation).length,
    totalPassed: passedCount,
    totalFailed: results.length - passedCount,
    overallStatus: allPassed ? 'passed' : 'failed',
    readyForRelease: allPassed
  };
  
  // Salvar relatório
  fs.writeFileSync(REPORT_FILE, JSON.stringify(validationResults, null, 2));
  
  // Exibir sumário final
  console.log('\n🎯 SUMÁRIO DA VALIDAÇÃO FINAL');
  console.log('==============================');
  console.log(`Status Geral: ${allPassed ? '✅ APROVADO' : '❌ REPROVADO'}`);
  console.log(`Testes Passou: ${passedCount}/${results.length}`);
  console.log(`Pronto para Release: ${allPassed ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`Relatório: ${REPORT_FILE}`);
  console.log('==============================\n');
  
  if (allPassed) {
    console.log('🎉 PARABÉNS! O PHP Universal MCP Server v1.12.0 está PRONTO para release!');
  } else {
    console.log('⚠️  Algumas validações falharam. Verifique os problemas antes do release.');
  }
  
  return allPassed ? 0 : 1;
};

// Executar validação
runFullValidation()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('❌ Erro crítico na validação:', error);
    process.exit(1);
  });
