# E-commerce Manager Core

O E-commerce Manager Core é um componente central do PHP Universal MCP Server que fornece uma API unificada para gerenciar produtos, pedidos, clientes, categorias e relatórios em diversas plataformas de e-commerce (WooCommerce, Shopify, etc).

## Funcionalidades Principais

- **API Unificada**: Interface consistente independente da plataforma utilizada
- **Operações CRUD** para produtos, categorias, pedidos e clientes
- **Suporte a Cupons e Descontos**: Gerenciamento completo de promoções
- **Relatórios e Analytics**: Dados de vendas, desempenho de produtos, clientes e estoque
- **Sistema de Cache**: Otimização de desempenho para operações frequentes
- **Validação de Dados**: Garantia de integridade dos dados em todas as operações

## Arquitetura

O E-commerce Manager Core segue uma arquitetura em camadas:

1. **Controladores**: Recebem chamadas da API, validam parâmetros e delegam operações
2. **Serviços**: Implementam a lógica de negócios e interagem com os provedores
3. **Modelos**: Representam as entidades de negócio e contêm validações
4. **Provedores**: Implementam a integração específica com cada plataforma
5. **Utilitários**: Ferramentas de apoio como cache e gerenciamento de logs

## Como Usar

### Inicialização

```javascript
const EcommerceManager = require('./modules/ecommerce');
const ProviderManager = require('./providers');

// Configura o gerenciador de provedores
const providerManager = new ProviderManager({
  // Configurações dos provedores
});

// Inicializa o E-commerce Manager
const ecommerceManager = new EcommerceManager({
  providerManager
});

// Registra métodos no servidor MCP
const mcpServer = /* instância do servidor MCP */;
ecommerceManager.registerApiMethods(mcpServer);
```

### Gerenciamento de Produtos

```javascript
// Listar produtos
const productsResponse = await mcpServer.callMethod('products.list', {
  siteId: 'site123',
  filter: { status: 'published' },
  page: 1,
  perPage: 20
});

// Obter produto específico
const productResponse = await mcpServer.callMethod('products.get', {
  siteId: 'site123',
  productId: 'prod_123'
});

// Criar produto
const createResponse = await mcpServer.callMethod('products.create', {
  siteId: 'site123',
  productData: {
    name: 'Produto Exemplo',
    description: 'Descrição detalhada do produto',
    price: 99.90,
    stockQuantity: 100,
    // outros campos...
  }
});

// Atualizar produto
const updateResponse = await mcpServer.callMethod('products.update', {
  siteId: 'site123',
  productId: 'prod_123',
  updates: {
    price: 89.90,
    stockQuantity: 120
  }
});

// Excluir produto
const deleteResponse = await mcpServer.callMethod('products.delete', {
  siteId: 'site123',
  productId: 'prod_123'
});
```

### Gerenciamento de Pedidos

```javascript
// Listar pedidos
const ordersResponse = await mcpServer.callMethod('orders.list', {
  siteId: 'site123',
  filter: { status: 'processing' },
  page: 1,
  perPage: 20
});

// Obter pedido específico
const orderResponse = await mcpServer.callMethod('orders.get', {
  siteId: 'site123',
  orderId: 'ord_123'
});

// Atualizar pedido
const updateOrderResponse = await mcpServer.callMethod('orders.update', {
  siteId: 'site123',
  orderId: 'ord_123',
  updates: {
    status: 'completed',
    shippingMethod: 'express'
  }
});

// Processar ação em um pedido (completar, cancelar, reembolsar)
const processResponse = await mcpServer.callMethod('orders.process', {
  siteId: 'site123',
  orderId: 'ord_123',
  action: 'complete'
});

// Cancelar pedido
const cancelResponse = await mcpServer.callMethod('orders.process', {
  siteId: 'site123',
  orderId: 'ord_123',
  action: 'cancel',
  actionData: { reason: 'Solicitado pelo cliente' }
});
```

### Gerenciamento de Clientes

```javascript
// Listar clientes
const customersResponse = await mcpServer.callMethod('customers.list', {
  siteId: 'site123',
  filter: { },
  page: 1,
  perPage: 20
});

// Obter cliente específico
const customerResponse = await mcpServer.callMethod('customers.get', {
  siteId: 'site123',
  customerId: 'cust_123'
});

// Criar cliente
const createCustomerResponse = await mcpServer.callMethod('customers.create', {
  siteId: 'site123',
  customerData: {
    firstName: 'João',
    lastName: 'Silva',
    email: 'joao.silva@exemplo.com',
    phone: '(11) 98765-4321'
  }
});

// Adicionar endereço
const addAddressResponse = await mcpServer.callMethod('customers.addAddress', {
  siteId: 'site123',
  customerId: 'cust_123',
  address: {
    address1: 'Rua Exemplo, 123',
    city: 'São Paulo',
    state: 'SP',
    postcode: '01234-567',
    country: 'BR'
  },
  options: {
    makeDefaultShipping: true
  }
});

// Obter pedidos de um cliente
const customerOrdersResponse = await mcpServer.callMethod('customers.getOrders', {
  siteId: 'site123',
  customerId: 'cust_123',
  filter: { status: 'completed' }
});
```

### Gerenciamento de Cupons

```javascript
// Criar cupom de desconto
const createDiscountResponse = await mcpServer.callMethod('discounts.create', {
  siteId: 'site123',
  discountData: {
    code: 'WELCOME20',
    description: 'Desconto de 20% para novos clientes',
    type: 'percentage',
    amount: 20,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
    minimumAmount: 50
  }
});

// Validar cupom para um carrinho
const validateDiscountResponse = await mcpServer.callMethod('discounts.validate', {
  siteId: 'site123',
  code: 'WELCOME20',
  cart: {
    items: [
      { productId: 'prod_123', quantity: 2, price: 49.90 }
    ],
    total: 99.80
  }
});
```

### Relatórios

```javascript
// Relatório de vendas
const salesReportResponse = await mcpServer.callMethod('reports.sales', {
  siteId: 'site123',
  dateRange: {
    startDate: '2023-01-01',
    endDate: '2023-01-31'
  },
  options: {
    groupBy: 'day'
  }
});

// Relatório de desempenho de produtos
const productReportResponse = await mcpServer.callMethod('reports.products', {
  siteId: 'site123',
  dateRange: {
    startDate: '2023-01-01',
    endDate: '2023-01-31'
  }
});

// Dados do painel
const dashboardResponse = await mcpServer.callMethod('reports.dashboard', {
  siteId: 'site123',
  dateRange: {
    startDate: '2023-01-01',
    endDate: '2023-01-31'
  }
});
```

## Modelos de Dados

O E-commerce Manager Core define os seguintes modelos de dados:

### Product

- `id`: Identificador único do produto
- `name`: Nome do produto
- `description`: Descrição detalhada
- `shortDescription`: Descrição curta
- `price`: Preço regular
- `salePrice`: Preço promocional (opcional)
- `sku`: Código SKU
- `stockQuantity`: Quantidade em estoque
- `manageStock`: Se o estoque deve ser gerenciado
- `categories`: Lista de categorias
- `tags`: Lista de tags
- `images`: Lista de imagens
- `attributes`: Lista de atributos
- `variations`: Lista de variações
- `status`: Status (published, draft, etc)
- `metadata`: Metadados específicos da plataforma

### Order

- `id`: Identificador único do pedido
- `number`: Número do pedido para exibição
- `customer`: Informações do cliente
- `billing`: Endereço de cobrança
- `shipping`: Endereço de entrega
- `items`: Itens do pedido
- `itemsTotal`: Total dos itens (subtotal)
- `discountTotal`: Total de descontos
- `shippingTotal`: Total de frete
- `taxTotal`: Total de impostos
- `total`: Total geral do pedido
- `currency`: Moeda utilizada
- `status`: Status atual do pedido
- `paymentMethod`: Método de pagamento
- `paymentStatus`: Status do pagamento
- `shippingMethod`: Método de envio
- `notes`: Notas e comentários do pedido
- `coupons`: Cupons aplicados

### Customer

- `id`: Identificador único do cliente
- `email`: Email do cliente
- `firstName`: Nome do cliente
- `lastName`: Sobrenome do cliente
- `phone`: Telefone do cliente
- `addresses`: Endereços do cliente
- `defaultBillingAddress`: Endereço de cobrança padrão
- `defaultShippingAddress`: Endereço de entrega padrão
- `notes`: Notas sobre o cliente
- `metadata`: Metadados específicos da plataforma

### Category

- `id`: Identificador único da categoria
- `name`: Nome da categoria
- `description`: Descrição da categoria
- `slug`: Slug para URL
- `parentId`: ID da categoria pai (se for subcategoria)
- `order`: Ordem de exibição
- `image`: Imagem da categoria

### Discount

- `id`: Identificador único do desconto
- `code`: Código do cupom
- `description`: Descrição do cupom
- `type`: Tipo de desconto (percentage, fixed_cart, fixed_product)
- `amount`: Valor do desconto
- `status`: Status do cupom (active, inactive, expired)
- `startDate`: Data de início da validade
- `endDate`: Data de término da validade
- `usageLimit`: Limite de uso total
- `usageCount`: Contagem atual de uso
- `usageLimitPerUser`: Limite de uso por usuário
- `productIds`: IDs de produtos aplicáveis
- `excludedProductIds`: IDs de produtos excluídos
- `categoryIds`: IDs de categorias aplicáveis
- `excludedCategoryIds`: IDs de categorias excluídas
- `minimumAmount`: Valor mínimo de pedido
- `maximumAmount`: Valor máximo de pedido

## Integração com Provedores

O E-commerce Manager Core suporta múltiplas plataformas de e-commerce através de uma camada de provedores. Cada provedor implementa uma interface comum para operações específicas da plataforma.

### Provedores Suportados

- **WooCommerce**: Integração com WordPress/WooCommerce
- **Shopify**: Integração com a API Shopify
- **Hostinger**: Integração com a solução de e-commerce da Hostinger

### Implementando um Novo Provedor

Para adicionar suporte a uma nova plataforma, crie uma classe que implementa a interface de provedor e registre-a no ProviderManager.

```javascript
class MyCustomProvider {
  // Implementar métodos obrigatórios:
  // - getProducts, getProductById, createProduct, updateProduct, deleteProduct
  // - getOrders, getOrderById, updateOrder, completeOrder, cancelOrder
  // - getCustomers, getCustomerById, createCustomer, updateCustomer
  // - etc...
}

// Registrar o provedor
providerManager.registerProvider('mycustom', MyCustomProvider);
```

## Cache e Otimização

O E-commerce Manager Core inclui um sistema de cache para otimizar operações frequentes. O sistema utiliza uma implementação em memória por padrão, mas pode ser estendido para utilizar Redis ou outro mecanismo.

```javascript
// Limpar o cache para um site específico
ecommerceManager.clearCache(`*:site123:*`);

// Limpar todo o cache
ecommerceManager.clearCache();
```

## Segurança

O E-commerce Manager Core implementa várias medidas de segurança:

- Validação rigorosa de todos os dados de entrada
- Sanitização de dados sensíveis em logs
- Tratamento controlado de erros
- Acesso limitado a recursos por permissões

## Suporte e Contribuição

Para relatar problemas, solicitar melhorias ou contribuir com código, utilize o repositório GitHub do projeto:

[https://github.com/Lucasdoreac/php-universal-mcp-server](https://github.com/Lucasdoreac/php-universal-mcp-server)

## Licença

Este componente é parte do PHP Universal MCP Server e está disponível sob os termos da licença MIT. Consulte o arquivo LICENSE para mais detalhes.