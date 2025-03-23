# Contribuindo para o PHP Universal MCP Server

Obrigado pelo seu interesse em contribuir para o PHP Universal MCP Server! Este documento fornece diretrizes e fluxos de trabalho para contribuir efetivamente para o projeto.

## Fluxo de Trabalho de Desenvolvimento

Seguimos um fluxo de trabalho baseado em componentes e desenvolvimento na branch principal:

1. **Branch `main`**: Contém o código estável e funcional do projeto.
2. **Desenvolvimento direto**: Para componentes principais, o desenvolvimento é feito diretamente na branch `main`.
3. **Branches de feature**: Para funcionalidades experimentais ou que possam quebrar a estabilidade, recomendamos criar branches de feature.

### Fluxo para Novos Componentes Principais

Para os próximos componentes principais (Site Design System, Hosting Manager, Claude Integration), o desenvolvimento será feito diretamente na branch `main`, mantendo o repositório simples e organizado.

## Padrão de Commits

Utilizamos o padrão Conventional Commits para facilitar a geração automática de changelogs e versionamento semântico:

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Alterações na documentação
- `style:` - Formatação, ponto e vírgula faltando, etc; sem alteração de código
- `refactor:` - Refatoração de código
- `test:` - Adicionando ou corrigindo testes
- `chore:` - Alterações no processo de build, ferramentas, etc.

Exemplo:
```
feat(ecommerce): adiciona suporte a operações CRUD para produtos
```

## Pull Requests

Para contribuições externas:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
3. Commit suas alterações (`git commit -am 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

## Estrutura do Projeto

O projeto segue uma arquitetura modular:

```
php-universal-mcp-server/
├── core/                    # Núcleo do sistema
│   ├── mcp-protocol/        # Implementação do protocolo MCP
│   └── php-runtime/         # Motor de execução PHP
├── modules/                 # Módulos funcionais
│   ├── ecommerce/           # Gerenciamento de e-commerce
│   ├── design/              # Sistema de design e templates (em desenvolvimento)
│   └── hosting/             # Gerenciamento de hospedagem (em desenvolvimento)
├── providers/               # Adaptadores de provedores
├── integrations/            # Integrações externas
│   └── claude/              # Integração com Claude Desktop (em desenvolvimento)
├── utils/                   # Utilitários e ferramentas
├── config/                  # Configurações
├── docs/                    # Documentação
└── examples/                # Exemplos de uso
```

## Testes

Incentivamos a escrita de testes para novos componentes e funcionalidades:

- Testes unitários devem ser colocados no diretório `tests/` dentro de cada componente
- Execute `npm test` para executar todos os testes

## Documentação

A documentação é uma parte crucial deste projeto:

- Atualize o README.md quando adicionar ou modificar funcionalidades
- Adicione ou atualize a documentação no diretório `docs/`
- Inclua exemplos no diretório `examples/`
- Documente novas APIs e métodos com JSDoc

## Segurança

Se você descobrir algum problema de segurança, por favor não abra uma issue pública. Envie um email para o mantenedor principal do projeto.

## Próximos Componentes

- **Site Design System** - Responsável por gerenciar temas e aparência dos sites
- **Hosting Manager** - Gerenciamento de recursos de hospedagem (domínios, DNS, SSL) 
- **Claude Desktop Integration** - Interface otimizada para interação via chat