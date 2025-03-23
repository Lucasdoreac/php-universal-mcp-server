# Editor Visual de Templates

O Editor Visual de Templates é um dos recursos mais avançados do PHP Universal MCP Server. Ele permite que usuários criem e personalizem designs diretamente através do Claude Desktop, sem a necessidade de conhecimento técnico em HTML, CSS ou JavaScript.

## Visão Geral

O Editor Visual de Templates transforma o Claude Desktop em uma poderosa ferramenta de design, permitindo visualizar e editar em tempo real os templates de sites e e-commerces. Utilizando a capacidade de artifacts do Claude, o editor oferece uma interface interativa completa sem a necessidade de sair do ambiente de chat.

## Recursos Principais

### 1. Interface Drag & Drop

- **Componentes Reutilizáveis**: Arraste e solte componentes pré-definidos
- **Organização Intuitiva**: Estruture seu layout facilmente com grids e contêineres
- **Posicionamento Preciso**: Ajuste fino da posição de elementos com auxiliares visuais

### 2. Personalização em Tempo Real

- **Edição Instantânea**: Veja as mudanças imediatamente ao editar
- **Personalize Cores**: Paleta completa com suporte a temas
- **Ajuste Tipografia**: Controle de fontes, tamanhos e estilos
- **Modifique Espaçamentos**: Controle preciso de margens e paddings

### 3. Responsividade

- **Visualização Multi-dispositivo**: Alterne entre modos desktop, tablet e mobile
- **Ajustes Específicos por Dispositivo**: Personalize a aparência para cada tamanho de tela
- **Breakpoints Configuráveis**: Defina quando o layout deve se adaptar
- **Testes em Tempo Real**: Verifique a aparência em diferentes resoluções

### 4. Temas e Estilos

- **Temas Pré-definidos**: Escolha entre diversos estilos profissionais
- **Personalização de Temas**: Modifique temas existentes para criar seu estilo
- **Variáveis CSS**: Controle centralizado para cores, tipografia e espaçamentos
- **Exportação de Estilos**: Compartilhe e reutilize temas personalizados

### 5. Integração com Provedores

- **Sincronização com Hostinger**: Publique diretamente para seu site
- **Sincronização com Shopify**: Atualize o tema da sua loja
- **Sincronização com WooCommerce**: Personalize sua loja WordPress
- **Reversão e Backup**: Volte para versões anteriores quando necessário

## Como Utilizar

### Iniciar o Editor

```
editar template <site-id>
```

Este comando abrirá o editor visual no Claude Desktop como um artifact interativo.

### Comandos Principais

```
# Selecionar componente
selecionar componente <component-id>

# Adicionar novo componente
adicionar componente <tipo> <posição>

# Modificar propriedade
modificar <component-id> <propriedade> <valor>

# Salvar alterações
salvar template

# Publicar alterações
publicar template
```

## Componentes Disponíveis

O Editor Visual inclui uma variedade de componentes prontos para uso:

### Estruturais
- **Container**: Elemento básico de organização
- **Row**: Linha para sistema de grid
- **Column**: Coluna para sistema de grid
- **Card**: Contêiner com estilo elevado
- **Tabs**: Sistema de abas para conteúdo
- **Accordion**: Painéis expansíveis

### Conteúdo
- **Text**: Texto editável com formatação
- **Image**: Imagem com opções de responsividade
- **Video**: Incorporação de vídeos responsivos
- **Icon**: Ícones vetoriais escaláveis
- **Button**: Botões personalizáveis
- **List**: Listas ordenadas e não-ordenadas

### E-commerce
- **Product Card**: Exibição de produtos
- **Product Grid**: Grade de produtos
- **Cart**: Carrinho de compras
- **Checkout Form**: Formulário de checkout
- **Review**: Avaliações de produtos
- **Price**: Exibição de preços com formatação

### Formulários
- **Input**: Campo de texto
- **Select**: Menu dropdown
- **Checkbox**: Caixas de seleção
- **Radio**: Botões de opção
- **Textarea**: Área de texto multi-linha
- **Form**: Contêiner de formulário

## Exemplo de Uso

```
# Iniciar o editor
editar template site-123

# Adicionar uma seção de destaque
adicionar componente hero-section topo

# Modificar o título
modificar hero-section título "Bem-vindo à Minha Loja Online"

# Adicionar um botão
adicionar componente button hero-section

# Configurar o botão
modificar button-1 texto "Comprar Agora"
modificar button-1 cor "#FF5722"
modificar button-1 tamanho "grande"
modificar button-1 link "/produtos"

# Salvar alterações
salvar template

# Testar em dispositivo móvel
visualizar mobile

# Ajustar para mobile
modificar hero-section padding-mobile "15px"
modificar button-1 largura-mobile "100%"

# Publicar alterações
publicar template
```

## Compatibilidade com Frameworks

O Editor Visual é compatível com os principais frameworks CSS:

- **Bootstrap 5**: Todos os componentes e grid system
- **Tailwind CSS**: Utilitários e componentes
- **Material Design**: Componentes e sistema de design
- **Temas Personalizados**: Crie e use seus próprios temas

## Integração com Claude Artifacts

Uma das características mais poderosas do Editor Visual é sua profunda integração com os artifacts do Claude, permitindo:

- **Visualização Interativa**: Veja suas mudanças em tempo real
- **Edição Direta**: Modifique o código diretamente quando necessário
- **Desenvolvimento Híbrido**: Alterne entre visual e código conforme sua preferência
- **Colaboração**: Compartilhe versões e receba feedback sem sair do Claude

## Conclusão

O Editor Visual de Templates é uma revolução na forma como usuários interagem com o design de seus sites e e-commerces, trazendo a poder de frameworks modernos como Bootstrap para uma interface natural e conversacional no Claude Desktop.

Com a capacidade de ver as mudanças em tempo real e a flexibilidade para personalizar cada aspecto do design, o editor elimina a barreira técnica tradicionalmente associada ao desenvolvimento web, permitindo que qualquer pessoa crie sites profissionais com facilidade.

---

*Última atualização: 23 de março de 2025*