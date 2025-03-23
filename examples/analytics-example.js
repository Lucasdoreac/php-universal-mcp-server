/**
 * Exemplo de uso do Sistema de Analytics no PHP Universal MCP Server
 * 
 * Este arquivo demonstra como utilizar o sistema de analytics e geração de relatórios
 * para visualizar métricas e desempenho da loja.
 */

const { MCPServer } = require('../src/server');
const path = require('path');
const fs = require('fs');

// Inicializar o servidor MCP com configuração
const server = new MCPServer({
  configPath: path.join(__dirname, '../config/config.json')
});

/**
 * Exemplo 1: Gerar um relatório de vendas
 * Este exemplo mostra como gerar um relatório detalhado de vendas
 */
async function gerarRelatorioVendas() {
  try {
    // Definir período do relatório (últimos 30 dias)
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - 30);
    
    const dateRange = {
      startDate: inicio.toISOString(),
      endDate: hoje.toISOString()
    };
    
    // Gerar relatório detalhado
    const relatorio = await server.execute('reports.sales', {
      siteId: 'site123',
      dateRange,
      options: {
        groupBy: 'day',
        includeTax: true,
        includeShipping: true
      }
    });
    
    console.log('=== Relatório de Vendas ===');
    console.log(`Período: ${new Date(dateRange.startDate).toLocaleDateString()} a ${new Date(dateRange.endDate).toLocaleDateString()}`);
    console.log(`Total de Vendas: R$ ${relatorio.data.totals.sales.toFixed(2)}`);
    console.log(`Total de Pedidos: ${relatorio.data.totals.orders}`);
    console.log(`Valor Médio do Pedido: R$ ${relatorio.data.averages.orderValue.toFixed(2)}`);
    
    // Salvar o relatório em um arquivo para referência futura
    fs.writeFileSync(
      path.join(__dirname, 'relatorio-vendas.json'),
      JSON.stringify(relatorio.data, null, 2)
    );
    
    return relatorio.data;
  } catch (error) {
    console.error('Erro ao gerar relatório de vendas:', error.message);
    throw error;
  }
}

/**
 * Exemplo 2: Gerar um relatório de desempenho de produtos
 * Este exemplo mostra como analisar o desempenho dos produtos da loja
 */
async function gerarRelatorioDesempenhoProdutos() {
  try {
    // Definir período do relatório (último trimestre)
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setMonth(inicio.getMonth() - 3);
    
    const dateRange = {
      startDate: inicio.toISOString(),
      endDate: hoje.toISOString()
    };
    
    // Gerar relatório de produtos
    const relatorio = await server.execute('reports.products', {
      siteId: 'site123',
      dateRange,
      options: {
        includeCategories: true,
        sortBy: 'revenue'
      }
    });
    
    console.log('\n=== Relatório de Desempenho de Produtos ===');
    console.log(`Período: ${new Date(dateRange.startDate).toLocaleDateString()} a ${new Date(dateRange.endDate).toLocaleDateString()}`);
    console.log(`Total de Produtos Vendidos: ${relatorio.data.totals.quantitySold} unidades`);
    console.log(`Receita Total: R$ ${relatorio.data.totals.revenue.toFixed(2)}`);
    
    // Mostrar top 5 produtos
    console.log('\nProdutos mais vendidos:');
    relatorio.data.topProducts.slice(0, 5).forEach((produto, index) => {
      console.log(`${index + 1}. ${produto.name} - ${produto.quantitySold} un. - R$ ${produto.revenue.toFixed(2)}`);
    });
    
    // Mostrar categorias de maior desempenho
    if (relatorio.data.categories && relatorio.data.categories.top) {
      console.log('\nCategorias com melhor desempenho:');
      relatorio.data.categories.top.forEach((categoria, index) => {
        console.log(`${index + 1}. ${categoria.name} - ${categoria.products} produtos - R$ ${categoria.revenue.toFixed(2)}`);
      });
    }
    
    return relatorio.data;
  } catch (error) {
    console.error('Erro ao gerar relatório de produtos:', error.message);
    throw error;
  }
}

/**
 * Exemplo 3: Gerar um relatório de estoque
 * Este exemplo mostra como analisar a situação do estoque
 */
async function gerarRelatorioEstoque() {
  try {
    // Gerar relatório de estoque (sem necessidade de período)
    const relatorio = await server.execute('reports.inventory', {
      siteId: 'site123',
      options: {
        includeVariants: true,
        includeLowStock: true
      }
    });
    
    console.log('\n=== Relatório de Estoque ===');
    console.log(`Total de Produtos: ${relatorio.data.totals.products}`);
    console.log(`Valor Total em Estoque: R$ ${relatorio.data.totals.stockValue.toFixed(2)}`);
    console.log(`Quantidade Total em Estoque: ${relatorio.data.totals.stockQuantity} unidades`);
    
    // Alertas de estoque
    console.log('\nAlertas de Estoque:');
    console.log(`Produtos Sem Estoque: ${relatorio.data.stockCategories.outOfStock.count}`);
    console.log(`Produtos com Estoque Baixo: ${relatorio.data.stockCategories.lowStock.count}`);
    console.log(`Produtos com Estoque Excessivo: ${relatorio.data.stockCategories.excessStock.count}`);
    
    // Listar produtos sem estoque
    if (relatorio.data.stockCategories.outOfStock.items.length > 0) {
      console.log('\nProdutos Sem Estoque:');
      relatorio.data.stockCategories.outOfStock.items.slice(0, 5).forEach((produto, index) => {
        console.log(`${index + 1}. ${produto.name} (ID: ${produto.id}) - Última venda: ${new Date(produto.lastSoldDate || Date.now()).toLocaleDateString()}`);
      });
    }
    
    return relatorio.data;
  } catch (error) {
    console.error('Erro ao gerar relatório de estoque:', error.message);
    throw error;
  }
}

/**
 * Exemplo 4: Gerar um relatório de clientes
 * Este exemplo mostra como analisar o comportamento dos clientes
 */
async function gerarRelatorioClientes() {
  try {
    // Definir período do relatório (último ano)
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setFullYear(inicio.getFullYear() - 1);
    
    const dateRange = {
      startDate: inicio.toISOString(),
      endDate: hoje.toISOString()
    };
    
    // Gerar relatório de clientes
    const relatorio = await server.execute('reports.customers', {
      siteId: 'site123',
      dateRange,
      options: {
        includeOrders: true,
        segmentBy: 'purchases'
      }
    });
    
    console.log('\n=== Relatório de Clientes ===');
    console.log(`Período: ${new Date(dateRange.startDate).toLocaleDateString()} a ${new Date(dateRange.endDate).toLocaleDateString()}`);
    console.log(`Total de Clientes: ${relatorio.data.totals.customers}`);
    console.log(`Total de Pedidos: ${relatorio.data.totals.orders}`);
    console.log(`Receita Total: R$ ${relatorio.data.totals.revenue.toFixed(2)}`);
    
    // Segmentação de clientes
    console.log('\nSegmentação de Clientes:');
    console.log(`Novos Clientes: ${relatorio.data.segments.new.count} (${(relatorio.data.ratios.newCustomers * 100).toFixed(1)}%)`);
    console.log(`Clientes Recorrentes: ${relatorio.data.segments.returning.count} (${(relatorio.data.ratios.returningCustomers * 100).toFixed(1)}%)`);
    
    // Médias
    console.log('\nMétricas Médias:');
    console.log(`Valor Médio de Pedido: R$ ${relatorio.data.averages.orderValue.toFixed(2)}`);
    console.log(`Pedidos por Cliente: ${relatorio.data.averages.ordersPerCustomer.toFixed(1)}`);
    
    // Melhores clientes
    console.log('\nMelhores Clientes:');
    relatorio.data.topCustomers.slice(0, 5).forEach((cliente, index) => {
      console.log(`${index + 1}. ${cliente.name || cliente.email || `Cliente #${cliente.id}`} - ${cliente.orderCount} pedidos - R$ ${cliente.totalSpent.toFixed(2)}`);
    });
    
    return relatorio.data;
  } catch (error) {
    console.error('Erro ao gerar relatório de clientes:', error.message);
    throw error;
  }
}

/**
 * Exemplo 5: Gerar um dashboard de métricas
 * Este exemplo mostra como gerar um dashboard visual com as principais métricas
 */
async function gerarDashboard() {
  try {
    // Definir período do dashboard (últimos 30 dias)
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - 30);
    
    const dateRange = {
      startDate: inicio.toISOString(),
      endDate: hoje.toISOString()
    };
    
    // Gerar dashboard
    const dashboard = await server.execute('analytics.dashboard', {
      siteId: 'site123',
      dateRange,
      format: 'html' // Opções: 'html', 'json', 'chart'
    });
    
    if (dashboard.success) {
      console.log('\n=== Dashboard de Analytics Gerado ===');
      
      // Salvar o dashboard HTML em um arquivo
      const outputPath = path.join(__dirname, 'dashboard.html');
      fs.writeFileSync(outputPath, dashboard.data);
      
      console.log(`Dashboard salvo em: ${outputPath}`);
      console.log('Abra este arquivo em seu navegador para visualizar o dashboard completo.');
      
      // Salvar também a versão JSON para referência
      const jsonDashboard = await server.execute('analytics.dashboard', {
        siteId: 'site123',
        dateRange,
        format: 'json'
      });
      
      fs.writeFileSync(
        path.join(__dirname, 'dashboard-data.json'),
        JSON.stringify(jsonDashboard.data, null, 2)
      );
    } else {
      console.error('Erro ao gerar dashboard:', dashboard.error);
    }
  } catch (error) {
    console.error('Erro ao gerar dashboard:', error.message);
    throw error;
  }
}

/**
 * Função principal para executar todos os exemplos sequencialmente
 */
async function executarExemplos() {
  try {
    console.log('***** INICIANDO EXEMPLOS DE ANALYTICS *****');
    
    // Exemplo 1: Relatório de Vendas
    await gerarRelatorioVendas();
    
    // Exemplo 2: Relatório de Produtos
    await gerarRelatorioDesempenhoProdutos();
    
    // Exemplo 3: Relatório de Estoque
    await gerarRelatorioEstoque();
    
    // Exemplo 4: Relatório de Clientes
    await gerarRelatorioClientes();
    
    // Exemplo 5: Dashboard de Analytics
    await gerarDashboard();
    
    console.log('\n***** TODOS OS EXEMPLOS CONCLUÍDOS COM SUCESSO *****');
  } catch (error) {
    console.error('Erro ao executar exemplos:', error);
  } finally {
    // Encerrar o servidor MCP
    server.close();
  }
}

// Executar os exemplos se este arquivo for executado diretamente
if (require.main === module) {
  executarExemplos();
}

// Exportar funções para uso em outros exemplos
module.exports = {
  gerarRelatorioVendas,
  gerarRelatorioDesempenhoProdutos,
  gerarRelatorioEstoque,
  gerarRelatorioClientes,
  gerarDashboard,
  executarExemplos
};