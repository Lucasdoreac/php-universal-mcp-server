<?php
/**
 * Template de E-commerce básico para o PHP Universal MCP Server
 */
$siteName = isset($_ENV['SITE_NAME']) ? $_ENV['SITE_NAME'] : 'Minha Loja Online';
$products = [
    ['id' => 1, 'name' => 'Produto 1', 'price' => 99.90, 'image' => 'product1.jpg'],
    ['id' => 2, 'name' => 'Produto 2', 'price' => 149.90, 'image' => 'product2.jpg'],
    ['id' => 3, 'name' => 'Produto 3', 'price' => 79.90, 'image' => 'product3.jpg'],
    ['id' => 4, 'name' => 'Produto 4', 'price' => 199.90, 'image' => 'product4.jpg'],
];
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $siteName; ?></title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>
        <div class="container">
            <h1><?php echo $siteName; ?></h1>
            <nav>
                <ul>
                    <li><a href="index.php">Home</a></li>
                    <li><a href="products.php">Produtos</a></li>
                    <li><a href="cart.php">Carrinho</a></li>
                    <li><a href="contact.php">Contato</a></li>
                </ul>
            </nav>
        </div>
    </header>
    
    <main>
        <div class="container">
            <section class="hero">
                <h2>Bem-vindo à <?php echo $siteName; ?></h2>
                <p>Os melhores produtos pelos melhores preços!</p>
            </section>
            
            <section class="featured-products">
                <h2>Produtos em Destaque</h2>
                <div class="products-grid">
                    <?php foreach ($products as $product): ?>
                    <div class="product-card">
                        <div class="product-image">
                            <img src="images/<?php echo $product['image']; ?>" alt="<?php echo $product['name']; ?>">
                        </div>
                        <div class="product-info">
                            <h3><?php echo $product['name']; ?></h3>
                            <p class="price">R$ <?php echo number_format($product['price'], 2, ',', '.'); ?></p>
                            <a href="product.php?id=<?php echo $product['id']; ?>" class="btn">Ver Detalhes</a>
                            <button class="btn add-to-cart" data-id="<?php echo $product['id']; ?>">Adicionar ao Carrinho</button>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </section>
        </div>
    </main>
    
    <footer>
        <div class="container">
            <p>&copy; <?php echo date('Y'); ?> <?php echo $siteName; ?>. Todos os direitos reservados.</p>
        </div>
    </footer>
    
    <script src="js/main.js"></script>
</body>
</html>