/**
 * Exemplo de uso do Shopify Provider no PHP Universal MCP Server
 * 
 * Este arquivo demonstra como utilizar o provedor Shopify para
 * gerenciar lojas, produtos, pedidos e temas no Shopify.
 */

const { MCPServer } = require('../src/server');
const path = require('path');

// Inicializar o servidor MCP com configuração
const server = new MCPServer({
  configPath: path.join(__dirname, '../config/config.json')
});

/**
 * Exemplo 1: Criar um novo site Shopify
 * Este exemplo mostra como criar e configurar uma nova loja
 */
async function criarSiteShopify() {
  try {
    // Comando para criar novo site com o provedor Shopify
    const resultado = await server.execute('sites.create', {
      provider: 'shopify',
      options: {
        name: 'Minha Loja Shopify',
        shopName: 'minha-loja-teste',
        plan: 'basic',
        email: 'contato@minha-loja.com',
        senha: 'senha-segura-123'
      }
    });
    
    console.log('Loja criada com sucesso:', resultado);
    return resultado.siteId;
  } catch (error) {
    console.error('Erro ao criar loja Shopify:', error.message);
    throw error;
  }
}

/**
 * Exemplo 2: Adicionar produtos à loja Shopify
 * Este exemplo demonstra como adicionar produtos à loja
 */
async function adicionarProdutos(siteId) {
  try {
    // Adicionar produto simples
    const produtoSimples = await server.execute('products.create', {
      siteId,
      productData: {
        title: 'Camiseta Básica',
        body_html: '<p>Camiseta 100% algodão de alta qualidade</p>',
        vendor: 'Minha Marca',
        product_type: 'Vestuário',
        tags: 'camiseta, básico, algodão',
        variants: [
          {
            price: '49.90',
            sku: 'CAM-001',
            inventory_quantity: 100,
            weight: 0.2,
            weight_unit: 'kg',
            requires_shipping: true,
            taxable: true
          }
        ],
        options: [
          {
            name: 'Cor',
            values: ['Branco', 'Preto', 'Azul']
          },
          {
            name: 'Tamanho',
            values: ['P', 'M', 'G', 'GG']
          }
        ],
        images: [
          {
            src: 'https://cdn.exemplo.com/imagens/camiseta-basica.jpg',
            alt: 'Camiseta Básica'
          }
        ]
      }
    });
    
    console.log('Produto simples adicionado:', produtoSimples);
    
    // Adicionar produto com variantes
    const produtoVariantes = await server.execute('products.create', {
      siteId,
      productData: {
        title: 'Tênis Esportivo',
        body_html: '<p>Tênis ideal para corridas e caminhadas</p>',
        vendor: 'Minha Marca Esportiva',
        product_type: 'Calçados',
        tags: 'tênis, esporte, corrida',
        options: [
          {
            name: 'Cor',
            values: ['Preto', 'Branco', 'Vermelho']
          },
          {
            name: 'Tamanho',
            values: ['38', '39', '40', '41', '42', '43']
          }
        ],
        variants: [
          {
            title: 'Tênis Esportivo - Preto / 38',
            price: '199.90',
            sku: 'TE-P38',
            inventory_quantity: 10,
            option1: 'Preto',
            option2: '38'
          },
          {
            title: 'Tênis Esportivo - Preto / 39',
            price: '199.90',
            sku: 'TE-P39',
            inventory_quantity: 15,
            option1: 'Preto',
            option2: '39'
          },
          {
            title: 'Tênis Esportivo - Branco / 38',
            price: '199.90',
            sku: 'TE-B38',
            inventory_quantity: 8,
            option1: 'Branco',
            option2: '38'
          }
          // Outras variantes...
        ],
        images: [
          {
            src: 'https://cdn.exemplo.com/imagens/tenis-preto.jpg',
            alt: 'Tênis Esportivo Preto'
          },
          {
            src: 'https://cdn.exemplo.com/imagens/tenis-branco.jpg',
            alt: 'Tênis Esportivo Branco'
          }
        ]
      }
    });
    
    console.log('Produto com variantes adicionado:', produtoVariantes);
    
    return {
      produtoSimples,
      produtoVariantes
    };
  } catch (error) {
    console.error('Erro ao adicionar produtos:', error.message);
    throw error;
  }
}

/**
 * Exemplo 3: Listar e gerenciar pedidos
 * Este exemplo mostra como listar e processar pedidos
 */
async function gerenciarPedidos(siteId) {
  try {
    // Listar pedidos recentes
    const pedidos = await server.execute('orders.list', {
      siteId,
      filter: {
        limit: 10,
        status: 'any',
        financial_status: 'paid'
      }
    });
    
    console.log(`Encontrados ${pedidos.length} pedidos recentes:`);
    
    // Processar primeiro pedido da lista (exemplo)
    if (pedidos.length > 0) {
      const pedidoId = pedidos[0].id;
      
      // Marcar pedido como enviado
      const pedidoAtualizado = await server.execute('orders.process', {
        siteId,
        orderId: pedidoId,
        action: 'fulfill',
        data: {
          tracking_number: 'BR123456789',
          tracking_company: 'Correios',
          notify_customer: true
        }
      });
      
      console.log('Pedido marcado como enviado:', pedidoAtualizado);
      
      // Adicionar nota ao pedido
      const pedidoComNota = await server.execute('orders.update', {
        siteId,
        orderId: pedidoId,
        updates: {
          note: 'Pedido processado pelo sistema automatizado',
          tags: pedidoAtualizado.tags + ', processado-automaticamente'
        }
      });
      
      console.log('Nota adicionada ao pedido:', pedidoComNota);
    }
    
    return pedidos;
  } catch (error) {
    console.error('Erro ao gerenciar pedidos:', error.message);
    throw error;
  }
}

/**
 * Exemplo 4: Personalizar tema da loja
 * Este exemplo demonstra como aplicar e customizar um tema
 */
async function personalizarTema(siteId) {
  try {
    // Listar temas disponíveis
    const temas = await server.execute('design.getTemplates', {
      category: 'shopify'
    });
    
    console.log(`Encontrados ${temas.length} temas disponíveis`);
    
    // Aplicar o primeiro tema da lista (exemplo)
    if (temas.length > 0) {
      const temaId = temas[0].id;
      
      // Aplicar tema à loja
      const aplicacaoTema = await server.execute('design.applyTemplate', {
        siteId,
        templateId: temaId
      });
      
      console.log('Tema aplicado com sucesso:', aplicacaoTema);
      
      // Personalizar aparência
      const personalizacao = await server.execute('design.customize', {
        siteId,
        customizations: {
          colors: {
            primary: '#FF5722',
            secondary: '#2196F3',
            accent: '#4CAF50',
            background: '#FFFFFF',
            text: '#212121'
          },
          typography: {
            headingFont: 'Montserrat',
            bodyFont: 'Open Sans'
          },
          logo: {
            imageUrl: 'https://cdn.exemplo.com/logo-minha-loja.png',
            width: 200
          },
          layout: {
            headerStyle: 'centered',
            footerColumns: 4,
            productGridColumns: 3
          }
        }
      });
      
      console.log('Tema personalizado:', personalizacao);
      
      // Publicar alterações
      const publicacao = await server.execute('design.publish', {
        siteId
      });
      
      console.log('Alterações publicadas:', publicacao);
      
      return {
        temaAplicado: temaId,
        personalizacao,
        publicacao
      };
    }
  } catch (error) {
    console.error('Erro ao personalizar tema:', error.message);
    throw error;
  }
}

/**
 * Função principal para demonstrar todos os exemplos
 */
async function executarExemplos() {
  try {
    console.log('=== Iniciando exemplos de uso do Shopify Provider ===');
    
    // Criar loja
    const siteId = await criarSiteShopify();
    console.log(`\n=== Loja criada com ID: ${siteId} ===\n`);
    
    // Adicionar produtos
    const produtos = await adicionarProdutos(siteId);
    console.log('\n=== Produtos adicionados com sucesso ===\n');
    
    // Gerenciar pedidos
    const pedidos = await gerenciarPedidos(siteId);
    console.log('\n=== Pedidos gerenciados com sucesso ===\n');
    
    // Personalizar tema
    const tema = await personalizarTema(siteId);
    console.log('\n=== Tema personalizado com sucesso ===\n');
    
    console.log('=== Todos os exemplos foram executados com sucesso ===');
  } catch (error) {
    console.error('Erro ao executar exemplos:', error);
  } finally {
    // Encerrar servidor MCP
    server.close();
  }
}

// Executar os exemplos se este arquivo for executado diretamente
if (require.main === module) {
  executarExemplos();
}

// Exportar funções para uso em outros exemplos
module.exports = {
  criarSiteShopify,
  adicionarProdutos,
  gerenciarPedidos,
  personalizarTema,
  executarExemplos
};
