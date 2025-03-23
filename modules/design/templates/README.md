# Templates do Site Design System

Esta pasta contém os templates disponíveis para o Site Design System. Os templates são organizados por categoria e podem ser aplicados aos sites gerenciados pelo PHP Universal MCP Server.

## Categorias

- **ecommerce**: Templates específicos para lojas virtuais
- **blog**: Templates para blogs e sites de conteúdo
- **landing**: Templates para landing pages e sites de uma página

## Estrutura

Cada template segue uma estrutura consistente:

```
template-id/
├── config.json       # Configurações do template
├── preview.png      # Imagem de preview
├── index.html       # Página principal
├── theme.json       # Configurações de tema
├── assets/          # Recursos estáticos
└── components/      # Componentes específicos do template
```

## Como Usar

Os templates podem ser utilizados através da API do Design System:

```javascript
// Listar templates disponíveis
const templates = await designSystem.getTemplates({ category: 'ecommerce' });

// Aplicar um template
await designSystem.applyTemplate('site-id', 'template-id');
```