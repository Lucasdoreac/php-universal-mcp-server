# E-commerce Manager Core

O E-commerce Manager Core é um módulo do PHP Universal MCP Server que fornece uma API unificada para gerenciar produtos, pedidos e clientes em diferentes plataformas de e-commerce.

## Funcionalidades

- Gerenciamento de produtos (CRUD)
- Gerenciamento de categorias
- Processamento de pedidos
- Gerenciamento de clientes
- Relatórios e analytics
- Suporte a cupons e descontos

## Estrutura

- `models/`: Modelos de dados para produtos, categorias, pedidos, etc.
- `controllers/`: Controladores para operações de negócio
- `services/`: Serviços para integração com plataformas
- `repositories/`: Camada de acesso a dados

## Uso

```php
// Exemplo de uso
$productManager = new \Modules\Ecommerce\Controllers\ProductController();
$products = $productManager->listProducts($siteId, ['limit' => 10, 'page' => 1]);
```
