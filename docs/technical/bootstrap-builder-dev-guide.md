# Bootstrap Website Builder - Guia para Desenvolvedores

Este guia técnico destina-se a desenvolvedores que desejam estender, personalizar ou integrar o Bootstrap Website Builder do PHP Universal MCP Server.

## Arquitetura do Sistema

O Bootstrap Website Builder é composto por três componentes principais:

1. **bootstrap-builder.js**: Núcleo do sistema que processa comandos, gerencia sites e componentes
2. **artifact-visualizer.js**: Responsável por gerar visualizações HTML avançadas para o Claude
3. **Templates Handlebars**: Templates para renderização de sites e componentes

```
integrations/claude/
  ├── bootstrap-builder.js   # Processamento de comandos e gerenciamento de sites
  ├── artifact-visualizer.js # Visualização HTML para artifacts
  └── index.js               # Router principal para integração com Claude MCP
  
templates/artifacts/
  ├── website.hbs            # Template para visualização de websites
  └── component.hbs          # Template para visualização de componentes
```

## Fluxo de Execução

1. O usuário envia um comando em linguagem natural via Claude Desktop
2. O comando é recebido pelo router principal (`index.js`)
3. O router identifica que é um comando para o Bootstrap Builder e o encaminha
4. O `bootstrap-builder.js` analisa o comando e executa a ação correspondente
5. O sistema gera uma visualização utilizando o `artifact-visualizer.js`
6. O resultado é enviado de volta ao Claude como artifact HTML

## Componentes Principais

### BootstrapBuilder (bootstrap-builder.js)

A classe principal que gerencia o ciclo de vida dos websites:

```javascript
class BootstrapBuilder {
  constructor() { ... }
  
  async initializeTemplates() { ... }
  async createSite(templateType, options) { ... }
  async addComponent(componentType, targetSelector, options) { ... }
  async updateComponent(componentId, updates) { ... }
  async getComponents() { ... }
  async generatePreview() { ... }
  async publishSite(options) { ... }
  async generateArtifact() { ... }
  async generateComponentArtifact(componentId) { ... }
}
```

#### Métodos Principais

- **createSite(templateType, options)**: Cria um novo site com o template especificado
- **addComponent(componentType, targetSelector, options)**: Adiciona um componente ao site
- **updateComponent(componentId, updates)**: Atualiza um componente existente
- **generateArtifact()**: Gera um artifact HTML para visualização no Claude

### ArtifactVisualizer (artifact-visualizer.js)

Responsável por gerar visualizações HTML avançadas para o Claude:

```javascript
class ArtifactVisualizer {
  constructor() { ... }
  
  async initialize() { ... }
  registerHandlebarsHelpers() { ... }
  async getTemplate(templateName) { ... }
  getDefaultTemplate(templateType) { ... }
  async generateWebsiteVisualization(site, content, components) { ... }
  async generateComponentVisualization(component) { ... }
  extractComponents(html) { ... }
  prepareArtifact(html, title) { ... }
}
```

#### Métodos Principais

- **generateWebsiteVisualization(site, content, components)**: Gera HTML para visualização do site
- **generateComponentVisualization(component)**: Gera HTML para visualização detalhada de um componente
- **prepareArtifact(html, title)**: Prepara o objeto de artifact para o Claude

### Parser de Comandos

Sistema de interpretação de comandos em linguagem natural:

```javascript
function parseNaturalCommand(text) {
  // Normalizar texto
  const normalizedText = text.toLowerCase().trim();
  
  // Regras de parsing para diferentes tipos de comandos
  if (normalizedText.includes('criar site') || ...) { ... }
  if (normalizedText.includes('adicionar') || ...) { ... }
  ...
  
  // Retorna um objeto com a ação e parâmetros
  return {
    action: 'action-type',
    param1: value1,
    param2: value2,
    ...
  };
}
```

## Estendendo o Sistema

### Adicionando Novos Templates

Para adicionar um novo template de site:

1. Crie o arquivo HTML do template em `modules/design/templates/[template-id].html`
2. Adicione o template ao objeto `TEMPLATES` em `bootstrap-builder.js`:

```javascript
const TEMPLATES = {
  'landing': 'bs-landing',
  'blog': 'bs-blog',
  'portfolio': 'bs-portfolio',
  'shop': 'bs-shop',
  'seu-template': 'seu-template-id'  // Novo template
};
```

### Adicionando Novos Componentes

Para adicionar um novo tipo de componente:

1. Crie um módulo gerenciador em `modules/design/components/bootstrap/[component-type]/index.js`
2. Implemente os métodos `create`, `update` e `delete`
3. Adicione o componente ao mapeamento em `bootstrap-builder.js`:

```javascript
const componentManagers = {
  'navbar': navbarManager,
  'carousel': carouselManager,
  // ...
  'seu-componente': seuComponenteManager  // Novo componente
};
```

4. Atualize o parser para reconhecer comandos relacionados ao novo componente:

```javascript
if (normalizedText.includes('seu-componente')) componentType = 'seu-componente';
```

### Personalizando a Visualização

Para personalizar a visualização de sites ou componentes:

1. Edite os templates Handlebars em `templates/artifacts/website.hbs` ou `templates/artifacts/component.hbs`
2. Para criar um novo tipo de visualização, adicione um novo template em `templates/artifacts/[template-name].hbs`
3. Atualize o `artifact-visualizer.js` para usar o novo template:

```javascript
async generateCustomVisualization(data) {
  const template = await this.getTemplate('seu-template');
  return template(data);
}
```

## Integração com Outros Sistemas

### Integração com Provedores de Hospedagem

O Bootstrap Website Builder pode ser integrado com diferentes provedores de hospedagem:

```javascript
async publishSite(options = {}) {
  // ...
  const provider = options.provider || 'default';
  const providerManager = getProviderManager(provider);
  
  // Publicar usando o provedor especificado
  const result = await providerManager.publishSite(this.activeSite.id, options);
  // ...
}
```

### Integração com Processamento de Imagens

Para adicionar suporte a processamento de imagens:

```javascript
async processImages(componentId, images) {
  const imageProcessor = require('../../utils/image-processor');
  const processedImages = await imageProcessor.process(images);
  
  // Atualizar componente com as imagens processadas
  // ...
  
  return processedImages;
}
```

## Boas Práticas de Desenvolvimento

1. **Testes Automatizados**: Crie testes para cada nova funcionalidade
2. **Separação de Responsabilidades**: Mantenha a separação clara entre UI, lógica de negócios e integração
3. **Logs**: Adicione logs detalhados para facilitar o debugging
4. **Tratamento de Erros**: Implemente tratamento robusto de erros com mensagens claras
5. **Validação de Entrada**: Valide todas as entradas do usuário antes do processamento

## Exemplos de Código

### Adicionando Suporte para um Novo Tipo de Componente

```javascript
// modules/design/components/bootstrap/tabs/index.js
module.exports = {
  async create(siteId, targetSelector, options = {}) {
    const defaultOptions = {
      title: 'Novas Tabs',
      tabs: [
        { title: 'Tab 1', content: 'Conteúdo da Tab 1' },
        { title: 'Tab 2', content: 'Conteúdo da Tab 2' }
      ]
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Gerar HTML do componente
    const html = generateTabsHTML(mergedOptions);
    
    // Adicionar ao site
    const component = await componentService.addComponent(siteId, {
      type: 'bs-tabs',
      targetSelector,
      content: html,
      options: mergedOptions
    });
    
    return component;
  },
  
  async update(siteId, componentId, updates) {
    // Obter componente atual
    const component = await componentService.getComponent(siteId, componentId);
    
    // Mesclar atualizações
    const updatedOptions = { ...component.options, ...updates };
    
    // Gerar HTML atualizado
    const html = generateTabsHTML(updatedOptions);
    
    // Atualizar componente
    const updatedComponent = await componentService.updateComponent(siteId, componentId, {
      content: html,
      options: updatedOptions
    });
    
    return updatedComponent;
  }
};

function generateTabsHTML(options) {
  // Gerar HTML para o componente tabs
  let html = `<div class="tabs">`;
  
  // Gerar tabs navigation
  html += `<ul class="nav nav-tabs">`;
  options.tabs.forEach((tab, index) => {
    html += `<li class="nav-item">
      <a class="nav-link ${index === 0 ? 'active' : ''}" 
         data-bs-toggle="tab" 
         href="#tab-${index}">
        ${tab.title}
      </a>
    </li>`;
  });
  html += `</ul>`;
  
  // Gerar conteúdo das tabs
  html += `<div class="tab-content">`;
  options.tabs.forEach((tab, index) => {
    html += `<div class="tab-pane fade ${index === 0 ? 'show active' : ''}" 
               id="tab-${index}">
      <div class="p-3">
        ${tab.content}
      </div>
    </div>`;
  });
  html += `</div>`;
  
  html += `</div>`;
  return html;
}
```

### Estendendo o Parser de Comandos para Suportar Novos Comandos

```javascript
// Extensão do parser de comandos em bootstrap-builder.js
function parseNaturalCommand(text) {
  // Código existente...
  
  // Adicionar suporte para comandos de exportação
  if (normalizedText.includes('exportar') || normalizedText.includes('download')) {
    // Detectar formato de exportação
    let format = 'html';
    if (normalizedText.includes('pdf')) format = 'pdf';
    if (normalizedText.includes('zip')) format = 'zip';
    
    return {
      action: 'export',
      format: format
    };
  }
  
  // Adicionar suporte para comandos de tema
  if (normalizedText.includes('alterar tema') || normalizedText.includes('mudar tema')) {
    // Detectar nome do tema
    let theme = 'default';
    const themeMatch = normalizedText.match(/tema[:\s]+([a-zA-Z0-9-]+)/i);
    if (themeMatch) theme = themeMatch[1];
    
    return {
      action: 'change-theme',
      theme: theme
    };
  }
  
  // Código existente...
}

// Adicionar os novos handlers no processCommand
async function processCommand(command, session) {
  // Código existente...
  
  switch (parsedCommand.action) {
    // Código existente...
    
    case 'export':
      const exportUrl = await builder.exportSite(parsedCommand.format);
      
      return new MCPResponse({
        message: `Site exportado com sucesso! Você pode baixá-lo em: ${exportUrl}`,
        artifacts: [await builder.generateArtifact()]
      });
      
    case 'change-theme':
      await builder.changeTheme(parsedCommand.theme);
      
      return new MCPResponse({
        message: `Tema alterado para "${parsedCommand.theme}" com sucesso!`,
        artifacts: [await builder.generateArtifact()]
      });
      
    // Código existente...
  }
}
```

## Considerações de Desempenho

1. **Cache de Templates**: Os templates são armazenados em cache para melhorar o desempenho
2. **Renderização Eficiente**: O sistema minimiza as operações DOM durante a geração de HTML
3. **Processamento Assíncrono**: Operações pesadas são executadas de forma assíncrona
4. **Tamanho dos Artifacts**: Otimize o tamanho dos artifacts para evitar problemas de desempenho no Claude

## Solução de Problemas Comuns

### O preview do site não é atualizado após adicionar um componente

Verifique se o componente está sendo adicionado corretamente ao DOM:

```javascript
console.log('Adicionando componente ao seletor:', targetSelector);
console.log('HTML do componente:', html);
```

### Os comandos naturais não são reconhecidos corretamente

Melhore as regras de matching no parser:

```javascript
// Adicionar mais variações para capturar mais formas naturais
if (normalizedText.includes('criar site') || 
    normalizedText.includes('novo site') || 
    normalizedText.includes('fazer um site') || 
    normalizedText.includes('construir site')) {
  // ...
}
```

### Os componentes não são exibidos corretamente no artifact

Verifique se o HTML está sendo gerado corretamente e se todos os recursos necessários estão sendo incluídos:

```javascript
// Adicionar recursos externos necessários ao template
const template = `
  <!DOCTYPE html>
  <html>
    <head>
      <!-- Incluir Bootstrap e outros recursos -->
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
      <!-- Recursos personalizados -->
      <style>${customStyles}</style>
    </head>
    <body>
      ${content}
    </body>
  </html>
`;
```

## Próximos Passos no Desenvolvimento

- **Melhoria do Parser NLP**: Implementar NLP mais robusto para interpretação de comandos
- **Drag & Drop Visual**: Adicionar interface de drag & drop para edição visual
- **Exportação Avançada**: Adicionar opções de exportação para diferentes formatos
- **Gerenciamento de Temas**: Sistema avançado para troca de temas
- **Integração com IA**: Recursos de geração de conteúdo usando IA

---

Para mais informações, consulte a documentação completa da API ou entre em contato com a equipe de desenvolvimento.