# WooCommerce Provider

Este módulo implementa a integração com a API WooCommerce para gerenciamento de lojas, produtos, categorias, pedidos e configurações.

## Funcionalidades

- Autenticação OAuth 1.0a com a API WooCommerce
- Gerenciamento completo de produtos e variações
- Gerenciamento de categorias de produtos
- Gerenciamento de pedidos e status
- Gerenciamento de clientes
- Configurações da loja
- Integração com o WordPress quando necessário

## Uso Básico

```javascript
const WooCommerceProvider = require('./providers/woocommerce');

const woocommerce = new WooCommerceProvider({
  url: 'https://seusite.com',
  consumerKey: 'sua_consumer_key',
  consumerSecret: 'seu_consumer_secret'
});

// Inicializa o provedor
await woocommerce.initialize();

// Lista produtos
const products = await woocommerce.listProducts();
console.log(products);
```

## Módulos

### auth.js
Implementa autenticação OAuth 1.0a para a API WooCommerce, incluindo suporte para sites HTTP e HTTPS.

### api.js
Implementa chamadas à API REST do WooCommerce, com tratamento de erros e suporte para operações em lote.

### product.js
Gerenciamento de produtos, incluindo variações, atributos e revisões.

### category.js
Gerenciamento de categorias de produtos, com suporte para estrutura hierárquica.

### order.js
Gerenciamento de pedidos, notas, status e reembolsos.

### customer.js
Gerenciamento de clientes, incluindo busca por email e download de produtos digitais.

### settings.js
Gerenciamento de configurações da loja, incluindo grupos específicos como gerais, produtos, frete, etc.

## Autenticação

O WooCommerce Provider suporta autenticação OAuth 1.0a, que é o método de autenticação oficial da API WooCommerce. Existem duas abordagens principais:

1. **Sites HTTPS**: Para sites com HTTPS, as credenciais podem ser enviadas como parâmetros de consulta na URL.
2. **Sites HTTP**: Para sites com HTTP, é necessário assinar as requisições usando OAuth 1.0a.

Adicionalmente, para acessar algumas funcionalidades do WordPress, o provedor também suporta autenticação JWT quando fornecidas credenciais de administrador do WordPress.

## Eventos

O WooCommerce Provider emite diversos eventos que podem ser monitorados:

- `initialized` - Quando o provedor é inicializado com sucesso
- `error` - Quando ocorre um erro em qualquer operação
- `product-created` - Quando um produto é criado
- `product-updated` - Quando um produto é atualizado
- `product-deleted` - Quando um produto é removido
- `category-created` - Quando uma categoria é criada
- `category-updated` - Quando uma categoria é atualizada
- `category-deleted` - Quando uma categoria é removida
- `order-updated` - Quando um pedido é atualizado
- `order-status-updated` - Quando o status de um pedido é atualizado
- `customer-created` - Quando um cliente é criado
- `setting-updated` - Quando uma configuração é atualizada
- `webhook-created` - Quando um webhook é criado

## Tratamento de Erros

O WooCommerce Provider trata erros de maneira consistente. Todas as operações que falham emitem um evento `error` com detalhes sobre o problema e também lançam uma exceção que pode ser capturada para tratamento apropriado.

```javascript
try {
  await woocommerce.createProduct(productData);
} catch (error) {
  console.error('Erro ao criar produto:', error.message, error.code);
}

// Ou usando eventos
woocommerce.on('error', (error) => {
  console.error('Erro no provedor WooCommerce:', error.message, error.code);
});
```

## Limitações

- O WooCommerce Provider depende da API oficial do WooCommerce, e está sujeito às suas limitações e restrições.
- Algumas operações podem requerer permissões específicas em sua instalação do WooCommerce.
- Operações em lote são limitadas a 100 operações por requisição.
- A API pode ter limites de taxa de requisições que podem afetar o desempenho em cenários de uso intensivo.

## Webhooks

O WooCommerce Provider inclui suporte para listagem e criação de webhooks, que permitem receber notificações sobre eventos na loja WooCommerce (como pedidos novos, alterações de produtos, etc.).

```javascript
// Listar webhooks existentes
const webhooks = await woocommerce.getWebhooks();

// Criar um novo webhook
const newWebhook = await woocommerce.createWebhook({
  name: 'Novo Pedido',
  topic: 'order.created',
  delivery_url: 'https://seusite.com/webhooks/novo-pedido'
});
```

## Exemplos

### Gerenciamento de Produtos

```javascript
// Listar produtos
const products = await woocommerce.listProducts();

// Obter detalhes de um produto
const product = await woocommerce.getProduct(123);

// Criar um novo produto
const newProduct = await woocommerce.createProduct({
  name: 'Produto Teste',
  type: 'simple',
  regular_price: '9.99',
  description: 'Descrição detalhada do produto',
  short_description: 'Descrição curta',
  categories: [
    { id: 9 },
    { id: 14 }
  ],
  images: [
    { src: 'http://example.com/image.jpg' }
  ]
});

// Atualizar um produto existente
const updatedProduct = await woocommerce.updateProduct(123, {
  stock_quantity: 10,
  regular_price: '19.99'
});

// Remover um produto
const result = await woocommerce.deleteProduct(123);
```

### Gerenciamento de Pedidos

```javascript
// Listar pedidos recentes
const orders = await woocommerce.listOrders({ status: 'processing' });

// Obter detalhes de um pedido
const order = await woocommerce.getOrder(45);

// Atualizar status de um pedido
const updatedOrder = await woocommerce.updateOrderStatus(45, 'completed');

// Adicionar nota a um pedido
const note = await woocommerce.orderManager.addNote(45, {
  note: 'Pedido enviado via transportadora X',
  customer_note: true
});
```

### Gerenciamento de Clientes

```javascript
// Listar clientes
const customers = await woocommerce.listCustomers();

// Buscar cliente por email
const customer = await woocommerce.customerManager.findByEmail('cliente@exemplo.com');

// Criar um novo cliente
const newCustomer = await woocommerce.createCustomer({
  email: 'novo@exemplo.com',
  first_name: 'Nome',
  last_name: 'Sobrenome',
  username: 'novousuario',
  password: 'senha123'
});
```

### Gerenciamento de Configurações

```javascript
// Obter configurações gerais
const generalSettings = await woocommerce.getSettings('general');

// Atualizar moeda da loja
const updatedCurrency = await woocommerce.settingsManager.updateCurrency('BRL');

// Obter configurações de frete
const shippingSettings = await woocommerce.settingsManager.getShippingSettings();
````