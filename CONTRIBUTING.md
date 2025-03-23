# Contribuindo para o PHP Universal MCP Server

Obrigado pelo interesse em contribuir para o PHP Universal MCP Server! Este documento fornece diretrizes e informações para ajudar você a contribuir com o projeto de forma eficaz.

## Índice

- [Código de Conduta](#código-de-conduta)
- [Como Começar](#como-começar)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Fluxo de Desenvolvimento](#fluxo-de-desenvolvimento)
- [Estilo de Código](#estilo-de-código)
- [Testes](#testes)
- [Documentação](#documentação)
- [Processo de Submissão](#processo-de-submissão)
- [Comunicação](#comunicação)

## Código de Conduta

Este projeto adota um Código de Conduta que todos os colaboradores devem seguir. Solicitamos que todos participem de maneira respeitosa e profissional.

## Como Começar

### Preparando seu Ambiente

1. Fork o repositório no GitHub
2. Clone seu fork localmente
   ```bash
   git clone https://github.com/seu-usuario/php-universal-mcp-server.git
   cd php-universal-mcp-server
   ```
3. Adicione o repositório upstream
   ```bash
   git remote add upstream https://github.com/Lucasdoreac/php-universal-mcp-server.git
   ```
4. Instale as dependências
   ```bash
   npm install
   ```

### Executando o Projeto

```bash
# Executar em modo de desenvolvimento
npm run dev

# Executar testes
npm test

# Verificar estilo de código
npm run lint
```

## Estrutura do Projeto

A estrutura principal do projeto é a seguinte:

```
php-universal-mcp-server/
├── core/                    # Núcleo do sistema
│   ├── mcp-protocol/        # Implementação do protocolo MCP
│   └── php-runtime/         # Motor de execução PHP
├── modules/                 # Módulos funcionais
│   ├── ecommerce/           # Gerenciamento de e-commerce
│   ├── design/              # Sistema de design e templates
│   ├── hosting/             # Gerenciamento de hospedagem
│   └── security/            # Autenticação e segurança
├── providers/               # Adaptadores de provedores
│   ├── hostinger/           # Integração com Hostinger
│   ├── woocommerce/         # Integração com WooCommerce
│   └── shopify/             # Integração com Shopify
├── integrations/            # Integrações externas
│   └── claude/              # Integração com Claude Desktop
├── utils/                   # Utilitários e ferramentas
├── config/                  # Configurações
├── docs/                    # Documentação
└── tests/                   # Testes automatizados
```

## Fluxo de Desenvolvimento

1. Verifique as issues existentes ou crie uma nova descrevendo a feature/bug
2. Faça um fork do repositório e crie um branch para sua feature
   ```bash
   git checkout -b feature/sua-feature
   ```
3. Desenvolva sua feature e adicione testes apropriados
4. Certifique-se de que todos os testes passam
   ```bash
   npm test
   ```
5. Certifique-se de que seu código segue o estilo de código do projeto
   ```bash
   npm run lint
   ```
6. Commit suas mudanças seguindo as convenções de commit
   ```bash
   git commit -m "feat: adiciona nova funcionalidade"
   ```
7. Push para seu fork
   ```bash
   git push origin feature/sua-feature
   ```
8. Abra um Pull Request para o branch principal do repositório

## Estilo de Código

Seguimos um estilo consistente de código para garantir legibilidade e manutenibilidade:

- **JavaScript**: Usamos ESLint com a configuração Airbnb
- **Convenções de Nomeação**:
  - CamelCase para variáveis e funções
  - PascalCase para classes
  - UPPER_CASE para constantes
- **Commits**: Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/)

## Testes

Todos os novos recursos e correções de bugs devem incluir testes apropriados:

- **Testes Unitários**: Para testar funções e classes individualmente
- **Testes de Integração**: Para testar interações entre componentes
- **Cobertura de Código**: Mantemos uma alta cobertura de código para garantir qualidade

```bash
# Executar todos os testes
npm test

# Executar testes específicos
npm test -- --grep "nome do teste"

# Verificar cobertura de código
npm run coverage
```

## Documentação

Boa documentação é essencial para o projeto:

- **JSDoc**: Todas as funções e classes devem ter comentários JSDoc
- **README**: Cada diretório principal deve ter um arquivo README explicativo
- **Exemplos**: Adicione exemplos práticos quando possível
- **Markdown**: Use Markdown para documentação de arquivos

## Processo de Submissão

1. Certifique-se de que seu código passa em todos os testes
2. Atualize a documentação conforme necessário
3. Submeta um Pull Request claro e descritivo
4. Responda a quaisquer comentários ou solicitações de mudança
5. Após aprovação, seu código será mesclado

## Comunicação

- **Issues**: Use para reportar bugs, solicitar features ou discutir implementações
- **Pull Requests**: Use para submeter código e receber feedback
- **Discussões**: Use para perguntas gerais e ideias

## Agradecimentos

Agradecemos a todos os contribuidores que ajudam a melhorar este projeto! Seu tempo e esforço são valiosos para nós.