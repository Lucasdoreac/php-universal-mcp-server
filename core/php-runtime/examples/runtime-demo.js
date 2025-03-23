/**
 * Demonstração do PHP Runtime Engine
 */
const PHPRuntimeEngine = require('../index');

// Cria uma instância do runtime
const runtime = new PHPRuntimeEngine({
  // Configura com valores personalizados
  memoryLimit: 256,      // 256MB de memória
  timeout: 10000,        // 10 segundos
  cacheEnabled: true,    // Ativa cache
  defaultLibraries: ['utils'] // Carrega biblioteca utils por padrão
});

// Script PHP para testar recursão e limites
const fibonacciScript = `<?php
  /**
   * Calcula o número de Fibonacci recursivamente
   */
  function fibonacci($n) {
    if ($n <= 1) return $n;
    return fibonacci($n - 1) + fibonacci($n - 2);
  }
  
  // Recebe o número como parâmetro ou usa padrão
  $num = isset($argv[1]) ? (int)$argv[1] : 30;
  
  // Calcula e retorna o resultado
  $result = fibonacci($num);
  echo json_encode([
    'number' => $num,
    'fibonacci' => $result,
    'memory' => memory_get_usage(true) / 1024 / 1024 . ' MB',
    'peak_memory' => memory_get_peak_usage(true) / 1024 / 1024 . ' MB'
  ]);
`;

// Script para testar saídas de erro
const errorScript = `<?php
  // Força diferentes tipos de erros
  
  // 1. Aviso
  $undefined_var = $non_existent;
  
  // 2. Notice
  $array = [];
  echo $array['key'];
  
  // 3. Parse error (comentado)
  // if (true) {
  //   echo "Missing closing brace";
  
  // 4. Fatal error
  non_existent_function();
`;

// Script para testar bibliotecas
const libraryScript = `<?php
  // Usa biblioteca de utilidades carregada automaticamente
  use MCP\\Utils\\Utils;
  
  // Cria instância da biblioteca
  $utils = new Utils();
  
  // Usa método de exemplo
  $result = $utils->exampleMethod('teste');
  
  echo "Resultado da biblioteca: " . $result;
`;

// Função para executar testes
async function runTests() {
  console.log('=== PHP Runtime Engine Demo ===\n');
  
  try {
    // 1. Verifica ambiente PHP
    console.log('Verificando ambiente PHP...');
    const envInfo = await runtime.getEnvironmentInfo();
    console.log(`PHP versão: ${envInfo.info.version}`);
    console.log(`Extensões carregadas: ${envInfo.info.extensions.length}`);
    console.log(`Sistema: ${envInfo.info.os} / SAPI: ${envInfo.info.sapi}`);
    console.log();
    
    // 2. Teste Fibonacci (execução normal)
    console.log('Executando cálculo de Fibonacci...');
    const fib1 = await runtime.execute(fibonacciScript, {
      args: ['30']
    });
    console.log('Resultado:', fib1.success ? JSON.parse(fib1.output) : fib1.error);
    console.log();
    
    // 3. Teste de cache (deve ser mais rápido)
    console.log('Executando novamente com cache...');
    console.time('Com cache');
    const fib2 = await runtime.execute(fibonacciScript, {
      args: ['30']
    });
    console.timeEnd('Com cache');
    console.log('Resultado (do cache):', fib2.success ? JSON.parse(fib2.output) : fib2.error);
    console.log();
    
    // 4. Testar limites (deve falhar)
    console.log('Testando limites (Fibonacci 45 - deve falhar por timeout)...');
    try {
      const fibLarge = await runtime.execute(fibonacciScript, {
        args: ['45'],
        skipCache: true
      });
      console.log('Resultado:', fibLarge.success ? JSON.parse(fibLarge.output) : fibLarge.error);
    } catch (error) {
      console.log('Erro esperado:', error.message);
    }
    console.log();
    
    // 5. Teste de erros
    console.log('Testando erros e captura...');
    const errorResult = await runtime.execute(errorScript);
    console.log('Resultado de erro:', {
      success: errorResult.success,
      errorInfo: errorResult.errorInfo
    });
    console.log();
    
    // 6. Teste de biblioteca
    console.log('Testando carregamento de biblioteca...');
    // Primeiro, instala a biblioteca Utils se não existir
    const libraries = await runtime.libraryManager.getInstalledLibraries();
    const utilsLib = libraries.find(lib => lib.name === 'utils');
    
    if (!utilsLib || !utilsLib.installed) {
      console.log('Instalando biblioteca Utils...');
      await runtime.libraryManager.installLibrary('utils');
    }
    
    const libResult = await runtime.execute(libraryScript);
    console.log('Resultado:', libResult.output);
    console.log();
    
    // 7. Informações do cache
    console.log('Estatísticas do cache:');
    const cacheStats = await runtime.cacheSystem.getStats();
    console.log(cacheStats);
    
  } catch (error) {
    console.error('Erro na demonstração:', error);
  }
}

// Executa os testes
runTests().then(() => {
  console.log('\nDemonstração concluída!');
});