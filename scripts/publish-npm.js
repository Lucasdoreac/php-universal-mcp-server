/**
 * Script para publicação direta no npm
 * 
 * Este script:
 * 1. Verifica a versão atual no npm
 * 2. Compara com a versão local
 * 3. Incrementa automaticamente se necessário
 * 4. Publica a nova versão
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Caminho para o package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');

try {
  console.log('\n=============================================');
  console.log(' PUBLICAÇÃO AUTOMÁTICA NO NPM');
  console.log('=============================================\n');
  
  // Verificando login no npm
  console.log('🔐 Verificando login no npm...');
  try {
    const whoami = execSync('npm whoami', { encoding: 'utf8' }).trim();
    console.log(`✅ Logado como: ${whoami}`);
  } catch (error) {
    console.log('⚠️ Você não está logado no npm.');
    console.log('🔐 Execute o comando abaixo e tente novamente:');
    console.log('npm login');
    process.exit(1);
  }
  
  // Verificando versão atual no npm
  console.log('\n🔍 Verificando versão atual no npm...');
  
  let npmVersion;
  try {
    npmVersion = execSync('npm view php-universal-mcp-server version', { encoding: 'utf8' }).trim();
    console.log(`📦 Versão atual no npm: ${npmVersion}`);
  } catch (error) {
    console.log('⚠️ Não foi possível obter a versão atual do npm. O pacote pode não existir ainda.');
    npmVersion = '0.0.0';
  }
  
  // Ler o package.json atual
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const localVersion = packageJson.version;
  
  console.log(`📋 Versão local: ${localVersion}`);
  
  // Comparar versões
  if (localVersion === npmVersion) {
    console.log('\n⚠️ A versão local é igual à versão no npm. É necessário incrementar a versão.');
    
    // Incrementar a versão patch
    const versionParts = localVersion.split('.');
    versionParts[2] = parseInt(versionParts[2]) + 1;
    const newVersion = versionParts.join('.');
    
    console.log(`🔄 Incrementando versão para: ${newVersion}`);
    
    // Atualizar package.json
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log('✅ package.json atualizado!');
  }
  
  // Publicar no npm
  console.log('\n🚀 Publicando no npm...');
  execSync('npm publish', { stdio: 'inherit' });
  
  console.log('\n✅ Pacote publicado com sucesso!');
  
  // Ler o package.json novamente para obter a versão final
  const updatedPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  console.log(`\n📱 Para instalar a nova versão, execute:`);
  console.log(`npm install -g php-universal-mcp-server@${updatedPackageJson.version}`);
  
  console.log('\n💬 Para configurar o Claude Desktop com inicialização automática:');
  console.log(`{
  "mcpServers": {
    "php-universal": {
      "command": "npx",
      "args": [
        "-y",
        "php-universal-mcp-server"
      ]
    }
  }
}`);
  
} catch (error) {
  console.error(`\n❌ Erro: ${error.message}`);
  process.exit(1);
}