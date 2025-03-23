# Shopify Provider

Este módulo implementa a integração com a API Shopify para gerenciamento de lojas, produtos, coleções, pedidos, clientes, temas e configurações.

## Funcionalidades

- Autenticação OAuth 2.0 com a API Shopify
- Suporte para APIs REST e GraphQL
- Gerenciamento completo de produtos e variantes
- Gerenciamento de coleções (personalizadas e inteligentes)
- Gerenciamento de pedidos e status
- Gerenciamento de clientes
- Gerenciamento de temas e assets
- Configurações da loja

## Uso Básico

```javascript
const ShopifyProvider = require('./providers/shopify');

const shopify = new ShopifyProvider({
  shopName: 'sua-loja',
  apiKey: 'sua_api_key',
  apiSecret: 'seu_api_secret',
  accessToken: 'seu_access_token' // Opcional se usar fluxo OAuth
});

// Inicializa o provedor
await shopify.initialize();

// Lista produtos
const products = await shopify.listProducts();
console.log(products);
```

## Módulos

### auth.js
Implementa autenticação OAuth 2.0 para a API Shopify, incluindo geração de URL de autorização, validação de callback e troca de código por token de acesso.

### api.js
Implementa chamadas às APIs REST e GraphQL do Shopify, com tratamento de erros, suporte para paginação e gerenciamento de limites de taxa.

### product.js
Gerenciamento de produtos, incluindo variantes, imagens, metafields e controle de estoque.

### collection.js
Gerenciamento de coleções de produtos, tanto personalizadas quanto inteligentes, com suporte para associação de produtos.

### order.js
Gerenciamento de pedidos, notas, status, cancelamentos, transações e fulfillments.

### customer.js
Gerenciamento de clientes, incluindo busca, endereços e estatísticas.

### theme.js
Gerenciamento de temas da loja, incluindo assets, publicação e visualização prévia.

### settings.js
Gerenciamento de configurações da loja, incluindo políticas, envio, pagamento e webhooks.

## Autenticação

O Shopify Provider suporta autenticação OAuth 2.0, que é o método de autenticação oficial da API Shopify. Existem duas abordagens principais:

1. **Token de Acesso (App Privado)**: Forneça o access_token diretamente nas configurações.
2. **OAuth 2.0 (App Público)**: Use o fluxo completo de autorização OAuth.

Para o fluxo OAuth 2.0:

```javascript
// 1. Gere o URL de autorização
const authUrl = shopify.auth.getAuthorizationUrl(
  'https://seu-site.com/callback',
  ['read_products', 'write_products']
);

// 2. Redirecione o usuário para o authUrl

// 3. No callback, valide a requisição
const isValid = shopify.auth.validateCallback(req.query);

// 4. Troque o código por um token de acesso
const tokenData = await shopify.auth.getAccessToken(
  req.query.code,
  'https://seu-site.com/callback'
);
```

## Suporte para GraphQL

A API Shopify tem uma poderosa interface GraphQL que oferece consultas mais flexíveis e eficientes. O Shopify Provider suporta ambas as APIs REST e GraphQL.

```javascript
// Usar GraphQL para obter produtos
const products = await shopify.listProducts({ useGraphQL: true });

// Executar consulta GraphQL personalizada
const result = await shopify.api.graphql(`
  {
    products(first: 5) {
      edges {
        node {
          id
          title
        }
      }
    }
  }
`);
```

## Eventos

O Shopify Provider emite diversos eventos que podem ser monitorados:

- `initialized` - Quando o provedor é inicializado com sucesso
- `error` - Quando ocorre um erro em qualquer operação
- `product-created` - Quando um produto é criado
- `product-updated` - Quando um produto é atualizado
- `product-deleted` - Quando um produto é removido
- `collection-created` - Quando uma coleção é criada
- `collection-updated` - Quando uma coleção é atualizada
- `collection-deleted` - Quando uma coleção é removida
- `order-updated` - Quando um pedido é atualizado
- `order-closed` - Quando um pedido é fechado
- `order-canceled` - Quando um pedido é cancelado
- `customer-created` - Quando um cliente é criado
- `customer-updated` - Quando um cliente é atualizado
- `customer-deleted` - Quando um cliente é removido
- `theme-set-main` - Quando um tema é definido como principal
- `webhook-created` - Quando um webhook é criado

## Tratamento de Erros

O Shopify Provider trata erros de maneira consistente. Todas as operações que falham emitem um evento `error` com detalhes sobre o problema e também lançam uma exceção que pode ser capturada para tratamento apropriado.

```javascript
try {
  await shopify.createProduct(productData);
} catch (error) {
  console.error('Erro ao criar produto:', error.message, error.code);
}

// Ou usando eventos
shopify.on('error', (error) => {
  console.error('Erro no provedor Shopify:', error.message, error.code);
});
```

## Limitações

- O Shopify Provider depende da API oficial do Shopify, e está sujeito às suas limitações e restrições.
- A API Shopify tem limites de taxa de requisições que podem afetar o desempenho.
- Algumas operações podem requerer permissões específicas em sua loja Shopify.
- Determinadas funcionalidades são limitadas para apps privados.

## Webhooks

O Shopify Provider inclui suporte para listagem e criação de webhooks, que permitem receber notificações sobre eventos na loja Shopify (como pedidos novos, alterações de produtos, etc.).

```javascript
// Listar webhooks existentes
const webhooks = await shopify.getWebhooks();

// Criar um novo webhook
const newWebhook = await shopify.createWebhook({
  topic: 'orders/create',
  address: 'https://seusite.com/webhooks/novo-pedido',
  format: 'json'
});
```

## Exemplos

### Gerenciamento de Produtos

```javascript
// Listar produtos
const products = await shopify.listProducts();

// Obter detalhes de um produto
const product = await shopify.getProduct(123456789);

// Criar um novo produto
const newProduct = await shopify.createProduct({
  title: 'Produto de Teste',
  body_html: '<p>Descrição detalhada do produto</p>',
  vendor: 'Marca do Produto',
  product_type: 'Tipo',
  tags: 'tag1, tag2',
  variants: [
    {
      price: '29.99',
      sku: 'SKU-001',
      inventory_quantity: 10
    }
  ],
  images: [
    {
      src: 'https://example.com/imagem.jpg'
    }
  ]
});

// Atualizar um produto existente
const updatedProduct = await shopify.updateProduct(123456789, {
  title: 'Título Atualizado',
  variants: [
    {
      id: 12345,
      price: '39.99'
    }
  ]
});

// Remover um produto
const result = await shopify.deleteProduct(123456789);
```

### Gerenciamento de Coleções

```javascript
// Listar coleções personalizadas
const collections = await shopify.listCustomCollections();

// Listar coleções inteligentes
const smartCollections = await shopify.listSmartCollections();

// Criar uma coleção personalizada
const newCollection = await shopify.createCustomCollection({
  title: 'Nova Coleção',
  body_html: '<p>Descrição da coleção</p>',
  image: {
    src: 'https://example.com/imagem.jpg'
  },
  published: true
});

// Adicionar um produto a uma coleção
await shopify.collectionManager.addProduct(newCollection.id, productId);
```

### Gerenciamento de Pedidos

```javascript
// Listar pedidos recentes
const orders = await shopify.listOrders({ status: 'any', limit: 10 });

// Obter detalhes de um pedido
const order = await shopify.getOrder(123456789);

// Atualizar status de um pedido
const updatedOrder = await shopify.updateOrderStatus(123456789, 'fulfilled');

// Cancelar um pedido
const cancelledOrder = await shopify.cancelOrder(123456789, {
  reason: 'customer',
  email: true,
  restock: true
});
```

### Gerenciamento de Temas

```javascript
// Listar temas
const themes = await shopify.themeManager.list();

// Obter o tema principal
const mainTheme = await shopify.getMainTheme();

// Criar um tema de desenvolvimento
const draftTheme = await shopify.themeManager.createDraft(mainTheme.id, 'Versão de Desenvolvimento');

// Modificar um asset (arquivo) do tema
await shopify.themeManager.createOrUpdateAsset(draftTheme.id, {
  key: 'templates/index.liquid',
  value: '<h1>{{ shop.name }}</h1>'
});

// Definir um tema como principal
await shopify.setMainTheme(draftTheme.id);
```