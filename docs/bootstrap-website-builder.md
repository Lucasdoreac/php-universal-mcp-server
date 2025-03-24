# Bootstrap Website Builder - Guia do Usuário

## Introdução

O Bootstrap Website Builder é um componente do PHP Universal MCP Server que permite criar websites completos utilizando comandos em linguagem natural através do Claude Desktop. Com este módulo, você pode criar, editar e publicar sites profissionais com componentes Bootstrap, sem necessidade de conhecimentos técnicos avançados.

## Índice

1. [Primeiros Passos](#primeiros-passos)
2. [Criando um Novo Site](#criando-um-novo-site)
3. [Adicionando Componentes](#adicionando-componentes)
4. [Visualizando Componentes](#visualizando-componentes)
5. [Editando Componentes](#editando-componentes)
6. [Visualizando o Site](#visualizando-o-site)
7. [Publicando o Site](#publicando-o-site)
8. [Referência de Comandos](#referência-de-comandos)
9. [Solução de Problemas](#solução-de-problemas)

## Primeiros Passos

Antes de começar a usar o Bootstrap Website Builder, certifique-se de que:

1. O PHP Universal MCP Server está instalado e em execução
2. Você tem acesso ao Claude Desktop
3. O servidor MCP está configurado corretamente no Claude Desktop

Para iniciar, abra o Claude Desktop e digite um dos comandos para criar um site.

## Criando um Novo Site

Para criar um novo site, use comandos como:

```
Criar site landing page chamado "Minha Empresa"
```

```
Novo site blog com título "Meu Blog Pessoal"
```

```
Criar site portfolio chamado "Portfólio de Design" com cor primária #3498db
```

```
Novo site loja com título "Loja de Artesanato"
```

### Templates Disponíveis

O Bootstrap Website Builder oferece quatro templates principais:

- **Landing Page** (`landing`): Ideal para sites institucionais e páginas de destino
- **Blog** (`blog`): Estrutura completa para blogs e sites de conteúdo
- **Portfolio** (`portfolio`): Design para exibir trabalhos e projetos
- **Loja** (`shop`): Template para e-commerce com catálogo de produtos

### Opções de Personalização

Ao criar um site, você pode especificar opções adicionais:

- **Título**: Nome do site (ex: `chamado "Meu Site"`)
- **Cor Primária**: Cor principal do tema (ex: `cor primária #007bff`)
- **Descrição**: Breve descrição do site

## Adicionando Componentes

Após criar um site, você pode adicionar componentes Bootstrap usando comandos como:

```
Adicionar menu no topo
```

```
Inserir carrossel com 3 slides
```

```
Adicionar acordeão na seção principal
```

```
Inserir galeria de imagens
```

```
Adicionar formulário de contato
```

```
Inserir rodapé com links sociais
```

### Componentes Disponíveis

O sistema suporta os seguintes componentes Bootstrap:

- **Navbar** (`navbar`, `menu`): Menu de navegação
- **Carousel** (`carrossel`, `carousel`): Slideshow de imagens
- **Accordion** (`acordeão`, `accordion`): Painéis expansíveis
- **Modal** (`modal`, `janela`): Janelas pop-up
- **Gallery** (`galeria`, `gallery`): Galerias de imagens
- **Form** (`formulário`, `form`): Formulários interativos
- **Footer** (`rodapé`, `footer`): Rodapés do site
- **Product** (`produto`, `product`): Elementos de produto para lojas

### Opções de Localização

Você pode especificar onde o componente será adicionado:

- **No topo**: Adiciona no cabeçalho do site
- **Na seção principal**: Adiciona no corpo principal
- **No rodapé**: Adiciona no footer do site

## Visualizando Componentes

Para visualizar detalhes de um componente específico, use:

```
Visualizar componente [ID]
```

```
Ver componente comp-1234
```

Isso exibirá uma visualização detalhada do componente com:
- Preview visual
- Propriedades configuráveis
- Código HTML
- Opções de edição

## Editando Componentes

Para editar um componente existente, use:

```
Atualizar componente comp-1234 cor: #ff0000
```

```
Editar componente comp-1234 texto: "Novo texto do botão"
```

```
Atualizar componente comp-1234 título: "Novo título do carrossel"
```

## Visualizando o Site

Para gerar uma prévia atualizada do site, use:

```
Visualizar site
```

```
Mostrar prévia do site
```

```
Preview
```

A visualização incluirá:
- Exibição do site completo
- Lista de componentes adicionados
- Opções para visualizar em diferentes dispositivos (desktop, tablet, mobile)
- Opção para destacar os componentes

## Publicando o Site

Quando o site estiver pronto, você pode publicá-lo com:

```
Publicar site
```

```
Publicar site em meudominio.com
```

```
Deploy do site
```

## Referência de Comandos

### Comandos de Site

| Comando | Descrição | Exemplo |
|---------|-----------|---------|
| `criar site [tipo]` | Cria um novo site | `criar site blog` |
| `novo site [tipo]` | Cria um novo site | `novo site landing` |
| `visualizar site` | Mostra preview do site | `visualizar site` |
| `publicar site` | Publica o site | `publicar site` |

### Comandos de Componentes

| Comando | Descrição | Exemplo |
|---------|-----------|---------|
| `adicionar [componente]` | Adiciona um componente | `adicionar menu` |
| `inserir [componente]` | Adiciona um componente | `inserir carrossel` |
| `visualizar componente [id]` | Mostra detalhes do componente | `visualizar componente comp-1234` |
| `atualizar componente [id]` | Edita um componente | `atualizar componente comp-1234 cor: #ff0000` |
| `editar componente [id]` | Edita um componente | `editar componente comp-1234 texto: "Novo texto"` |

## Solução de Problemas

### Componente não aparece no local correto

Se um componente não aparecer onde desejado, tente especificar o local com mais precisão:

```
Adicionar menu no cabeçalho
```

```
Inserir carrossel na div #main-content
```

### Erros ao atualizar componentes

Certifique-se de usar o ID correto do componente e especificar as propriedades corretamente:

```
Atualizar componente comp-1234 título: "Novo Título"
```

### O site não é publicado

Verifique se as configurações de hospedagem estão corretas e se o domínio está configurado:

```
Configurar domínio example.com para o site
```

```
Verificar configurações de hospedagem
```

## Conclusão

O Bootstrap Website Builder oferece uma maneira intuitiva e conversacional de criar websites profissionais diretamente pelo Claude Desktop. Combinando componentes Bootstrap com comandos em linguagem natural, você pode criar e gerenciar sites completos sem precisar escrever código.

Para mais informações, consulte a documentação completa do PHP Universal MCP Server ou entre em contato com o suporte.