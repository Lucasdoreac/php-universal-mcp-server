# Site Design System - Documentação Detalhada

O Site Design System é um componente vital do PHP Universal MCP Server, responsável por gerenciar templates, temas e a aparência visual dos sites e lojas de e-commerce.

## Arquitetura e Design

O Site Design System segue uma arquitetura modular baseada em serviços, permitindo flexibilidade e extensão fácil para suportar diferentes provedores e requisitos.

### Diagrama de Componentes

```
+------------------------+       +------------------------+
|      DesignSystem      | <---- |       Controllers      |
+------------------------+       +------------------------+
             ^                              ^
             |                              |
+------------v-------------+    +-----------v------------+
|                          |    |                       |
|         Services         | <--|        Models         |
|                          |    |                       |
+--------------------------+    +-----------------------+
  * TemplateRenderer            * Theme
  * ComponentManager            * Template
  * ThemeManager
  * PreviewService
  * TemplateManager
```

### Design Patterns Utilizados

- **Factory Method**: Para criação de temas e templates
- **Adapter**: Para integração com diferentes provedores
- **Composite**: Para composição de componentes em templates
- **Observer**: Para notificação de alterações em temas

## Componentes Principais

### 1. TemplateRenderer

O `TemplateRenderer` é responsável por renderizar templates HTML e componentes utilizando o Handlebars como engine principal.

**Funcionalidades:**

- Renderização de templates com suporte a componentes
- Substituição de variáveis de tema
- Geração de CSS baseado em tokens de design
- Cache de templates para performance

**Métodos Principais:**

- `renderTemplate(templateId, data, options)`: Renderiza um template completo
- `renderComponent(componentId, category, data)`: Renderiza um componente individual
- `loadTemplate(templateId, category)`: Carrega um template do disco
- `loadComponent(componentId, category)`: Carrega um componente do disco
- `generateThemeCSS(theme)`: Gera CSS a partir de variáveis de tema

### 2. ComponentManager

O `ComponentManager` gerencia a biblioteca de componentes reutilizáveis, suas configurações e personalizações.

**Funcionalidades:**

- Listagem e filtragem de componentes
- Carregamento de configurações, estilos e scripts
- Renderização de componentes com opções
- Criação de pacotes de componentes otimizados

**Métodos Principais:**

- `getComponentsByCategory(category)`: Lista componentes por categoria
- `getAllComponents()`: Obtém todos os componentes disponíveis
- `renderComponent(componentId, category, data, options)`: Renderiza um componente
- `createComponentBundle(siteId, components, theme)`: Cria um pacote de CSS/JS

### 3. ThemeManager

O `ThemeManager` é responsável pelo gerenciamento de temas, personalizações e versionamento.

**Funcionalidades:**

- Criação e personalização de temas
- Versionamento e histórico de alterações
- Aplicação de temas de templates
- Reversão para versões anteriores

**Métodos Principais:**

- `getSiteTheme(siteId)`: Obtém o tema atual de um site
- `customizeSiteTheme(siteId, customizations)`: Personaliza o tema de um site
- `applyTemplateTheme(siteId, templateTheme, templateId)`: Aplica um tema de template
- `getThemeHistory(themeId)`: Obtém o histórico de versões
- `revertThemeToVersion(themeId, version)`: Reverte para uma versão anterior

### 4. PreviewService

O `PreviewService` gerencia a criação e visualização de previews de alterações de design.

**Funcionalidades:**

- Criação de previews temporários
- Renderização de HTML para visualização
- Aplicação de previews como tema atual
- Limpeza automática de previews expirados

**Métodos Principais:**

- `createPreview(siteId, changes, options)`: Cria um novo preview
- `getPreview(previewId)`: Obtém dados de um preview
- `renderPreview(previewId, mockData)`: Renderiza um preview para visualização
- `applyPreview(previewId)`: Aplica um preview como tema atual
- `listPreviews(siteId)`: Lista previews ativos para um site

### 5. TemplateManager

O `TemplateManager` gerencia a biblioteca de templates disponíveis para aplicação em sites.

**Funcionalidades:**

- Listagem e filtragem de templates
- Carregamento de configurações e metadados
- Busca avançada por categorias e tags

**Métodos Principais:**

- `listTemplates(options)`: Lista templates disponíveis
- `getTemplateById(templateId)`: Obtém detalhes de um template
- `searchTemplates(query)`: Busca templates por critérios

## Modelos de Dados

### Theme

O modelo `Theme` representa a configuração visual completa de um site.

**Propriedades Principais:**

- `id`: Identificador único do tema
- `name`: Nome amigável do tema
- `description`: Descrição do tema
- `colors`: Paleta de cores (primary, secondary, accent, background, text...)
- `typography`: Configurações de tipografia (fontes, tamanhos, pesos...)
- `spacing`: Sistema de espaçamento (base, xs, sm, md, lg, xl...)
- `layout`: Configurações de layout (containerWidth, gridColumns...)
- `borders`: Configurações de bordas (radius, width...)
- `shadows`: Configurações de sombras (sm, md, lg...)
- `components`: Estilos específicos para componentes
- `metadata`: Metadados adicionais (siteId, templateId, version...)

**Métodos Principais:**

- `customize(customizations)`: Aplica personalizações ao tema
- `toJSON()`: Serializa o tema para JSON
- `toCSSVariables()`: Converte o tema em variáveis CSS

### Template

O modelo `Template` representa um design completo para um site ou loja.

**Propriedades Principais:**

- `id`: Identificador único do template
- `name`: Nome amigável do template
- `description`: Descrição do template
- `category`: Categoria (ecommerce, blog, landing...)
- `thumbnail`: Imagem de preview
- `theme`: Configurações de tema associadas
- `pages`: Lista de páginas incluídas
- `components`: Lista de componentes utilizados
- `customizations`: Opções de personalização disponíveis
- `metadata`: Metadados adicionais (author, version, supportedProviders...)

## Sistema de Componentes

### Estrutura de Componentes

Cada componente segue uma estrutura padronizada:

```
component-name/
├── index.html       # Markup HTML do componente
├── style.css       # Estilos específicos do componente
├── script.js       # JavaScript opcional do componente
└── config.json      # Configurações e personalizações
```

### Sistema de Personalização

Os componentes podem ser personalizados através de opções definidas em `config.json`:

```json
{
  "options": [
    {
      "type": "color",
      "id": "backgroundColor",
      "name": "Cor de Fundo",
      "default": "#ffffff"
    },
    {
      "type": "select",
      "id": "layout",
      "name": "Layout",
      "default": "centered",
      "options": [
        { "value": "centered", "label": "Centralizado" },
        { "value": "left", "label": "Alinhado à Esquerda" },
        { "value": "right", "label": "Alinhado à Direita" }
      ]
    },
    {
      "type": "toggle",
      "id": "showImage",
      "name": "Exibir Imagem",
      "default": true
    },
    {
      "type": "number",
      "id": "columns",
      "name": "Número de Colunas",
      "default": 4,
      "min": 1,
      "max": 6
    }
  ]
}
```

## Tipos de Templates

### Templates de E-commerce

Templates otimizados para lojas virtuais, com foco em exibição e venda de produtos.

**Características:**

- Carrossel de produtos em destaque
- Categorias com navegação intuitiva
- Componentes de carrinho e checkout
- Filtros avançados de produtos
- Áreas para promoções e ofertas

### Templates de Blog

Templates para publicação de conteúdo, artigos e notícias.

**Características:**

- Tipografia otimizada para leitura
- Destaques para conteúdo recente
- Sistema de comentários e interações
- Widgets de navegação por categorias e tags
- Áreas para newsletter e inscrição

### Templates de Landing Page

Templates para páginas de conversão e apresentação de produtos ou serviços.

**Características:**

- Call-to-action destacados
- Seções para benefícios e recursos
- Testemunhos e estudos de caso
- Formulários de captura de leads
- Contador regressivo para lançamentos

## Integração com Provedores

O Site Design System foi projetado para funcionar com diferentes provedores através do ProviderManager:

### Interface de Provedores

Cada provedor deve implementar métodos específicos para design:

```javascript
class Provider {
  // Métodos de design requeridos
  async updateSiteTheme(siteId, theme) { /* ... */ }
  async publishSiteTheme(siteId, theme) { /* ... */ }
  async getSiteTheme(siteId) { /* ... */ }
  async previewSiteTheme(siteId, theme) { /* ... */ }
}
```

### Adaptadores para Provedores Específicos

#### WooCommerce Provider

```javascript
class WooCommerceProvider extends Provider {
  async updateSiteTheme(siteId, theme) {
    // Converte o tema para formato compatível com WooCommerce
    // Atualiza via API REST do WordPress
  }
}
```

#### Shopify Provider

```javascript
class ShopifyProvider extends Provider {
  async updateSiteTheme(siteId, theme) {
    // Converte o tema para formato compatível com Shopify
    // Atualiza via API GraphQL do Shopify
  }
}
```

#### Hostinger Provider

```javascript
class HostingerProvider extends Provider {
  async updateSiteTheme(siteId, theme) {
    // Converte o tema para formato compatível com Hostinger
    // Atualiza via API do Hostinger
  }
}
```

## Sistema de Cache

O Site Design System utiliza um sistema de cache para otimizar o desempenho:

```javascript
interface Cache {
  async get(key: string): Promise<any>;
  async set(key: string, value: any, ttl?: number): Promise<void>;
  async has(key: string): Promise<boolean>;
  async del(key: string): Promise<void>;
}
```

Implementações possíveis:

- **MemoryCache**: Cache em memória para ambientes de desenvolvimento
- **RedisCache**: Cache distribuído para ambientes de produção
- **FileCache**: Cache baseado em arquivos para ambientes simples

## Performance e Otimização

### Geração de Assets Otimizados

O Site Design System gera assets otimizados para produção:

- **CSS Minificado**: Remoção de espaços e comentários
- **JavaScript Compactado**: Minificação e otimização
- **CSS Variables**: Uso de variáveis CSS para temas dinâmicos
- **Code Splitting**: Divisão de código por componentes
- **Lazy Loading**: Carregamento sob demanda de recursos

### Estratégias de Cache

- **Template Caching**: Cache de templates renderizados
- **Component Caching**: Cache de componentes individuais
- **Theme Caching**: Cache de configurações de tema
- **CSS Generation**: Cache de CSS gerado a partir de temas
- **Bundle Caching**: Cache de pacotes de assets

## Plano de Implementação

### 1. Fase de Configuração ✓

- Definir estrutura de diretórios e arquivos
- Implementar classes base e interfaces
- Configurar sistema de build e testes

### 2. Fase de Desenvolvimento do Núcleo ✓

- Implementar TemplateRenderer
- Implementar ComponentManager
- Implementar ThemeManager
- Implementar PreviewService
- Implementar DesignService

### 3. Fase de Criação de Conteúdo (Em Andamento)

- Criar templates de e-commerce (modern-shop, boutique, tech-store)
- Criar templates de blog (classic-blog, magazine, minimal)
- Criar templates de landing page (conversion, product-launch, service)
- Criar componentes reutilizáveis (header, footer, product-card, etc.)

### 4. Fase de Integração (Próxima Etapa)

- Implementar adaptadores para WooCommerce
- Implementar adaptadores para Shopify
- Implementar adaptadores para Hostinger
- Integrar com E-commerce Manager

### 5. Fase de Otimização (Futura)

- Implementar sistema de cache distribuído
- Otimizar geração de assets
- Implementar compilação just-in-time de temas
- Adicionar suporte a minificação avançada

## API Pública

A API pública do Site Design System é exposta através da classe `DesignSystem`:

```javascript
// Inicialização
designSystem = new DesignSystem(options);

// Métodos de Templates
designSystem.getTemplates(options);
designSystem.getTemplateById(templateId);

// Métodos de Componentes
designSystem.getComponents(options);
designSystem.getComponent(componentId, category);

// Métodos de Temas
designSystem.getCurrentTheme(siteId);
designSystem.customizeTheme(siteId, customizations);

// Métodos de Aplicação
designSystem.applyTemplate(siteId, templateId);
designSystem.generatePreview(siteId, changes);
designSystem.publishChanges(siteId);
designSystem.createAssetBundle(siteId);
```

## Integração com Claude Desktop

O Site Design System oferece comandos para interação via Claude Desktop:

```
# Comandos de Template
listar templates [categoria]
visualizar template <template-id>
aplicar template <site-id> <template-id>

# Comandos de Personalização
personalizar <site-id> <campos...>
alterar cor <site-id> <campo> <valor>
alterar fonte <site-id> <campo> <valor>

# Comandos de Preview
preview <site-id> <campos...>
visualizar preview <preview-id>
aplicar preview <preview-id>

# Comandos de Publicação
publicar alterações <site-id>
```

## Conclusão

O Site Design System fornece uma solução completa para gerenciamento de templates, temas e personalizações visuais para sites e lojas de e-commerce. Sua arquitetura modular e flexível permite a extensão para diferentes provedores e requisitos futuros.