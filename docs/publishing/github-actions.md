# Executando Testes e Publicando via GitHub Actions

Este documento descreve como executar os testes completos do PHP Universal MCP Server e publicar o pacote no npm usando GitHub Actions.

## Executando a Suite Completa de Testes

Para garantir que o sistema está pronto para publicação, usamos o GitHub Actions para executar todos os testes automaticamente.

### Executando os Testes Manualmente

1. Vá até a aba "Actions" no repositório GitHub
2. Selecione o workflow "Run Complete Test Suite" na barra lateral
3. Clique no botão "Run workflow" à direita
4. Selecione a branch "main" 
5. Clique no botão "Run workflow" verde para iniciar os testes

O workflow executará:
- Testes unitários
- Testes de integração
- Testes do sistema de renderização
- Geração de visualizações para o Claude
- Geração da documentação HTML

### Verificando os Resultados

Após a conclusão do workflow:

1. Clique na execução concluída
2. Vá até o final da página
3. Na seção "Artifacts", você verá:
   - **test-reports**: Relatórios detalhados dos testes em HTML, JSON e CSV
   - **claude-artifacts**: Componentes React para visualização no Claude Desktop
   - **documentation**: Documentação completa em HTML

Baixe e extraia estes arquivos para analisar os resultados em detalhes.

### Critérios para Aprovação

O sistema está pronto para publicação quando:

- Todos os testes passam (indicado por ✅ verde no workflow)
- Nenhuma regressão crítica é detectada nos relatórios
- O desempenho é consistente com versões anteriores

## Publicando o Pacote no NPM

Após confirmar que todos os testes passaram com sucesso, você pode publicar o pacote no npm.

### Preparação para Publicação

Antes de iniciar o processo de publicação:

1. Certifique-se de que todos os testes estão passando
2. Verifique se a documentação está atualizada
3. Confirme se as notas de release em `docs/release-notes/` estão completas

### Processo de Publicação

1. Vá até a aba "Actions" no repositório GitHub
2. Selecione o workflow "NPM Publish" na barra lateral
3. Clique no botão "Run workflow" à direita
4. Preencha os campos:
   - **Version**: Versão a ser publicada (ex: "1.12.0")
   - **Release notes**: Caminho para as notas de release (ex: "1.12.0.md")
5. Clique no botão "Run workflow" verde

O workflow irá:
1. Executar todos os testes novamente
2. Atualizar a versão no package.json
3. Criar uma release no GitHub com as notas de release
4. Publicar o pacote no npm

### Verificando a Publicação

Após a conclusão do workflow:

1. Verifique se a execução foi bem-sucedida (✅ verde)
2. Confirme que a release aparece na aba "Releases" do GitHub
3. Verifique se o pacote está disponível no npm:
   ```
   npm view php-universal-mcp-server
   ```

## Troubleshooting

### Falhas nos Testes

Se os testes falharem:

1. Verifique os logs de erro no workflow
2. Baixe os relatórios de teste para análise detalhada
3. Corrija os problemas identificados
4. Execute o workflow de testes novamente

### Falhas na Publicação

Se a publicação falhar:

1. Verifique se o token NPM está configurado corretamente (segredo `NPM_TOKEN`)
2. Confirme que a versão no package.json é maior que a última publicada
3. Verifique se todos os arquivos necessários estão incluídos na propriedade `files` do package.json
4. Certifique-se de que o usuário tem permissões de publicação no npm

## Segurança

- **NPM_TOKEN**: Nunca exponha o token NPM em logs ou no código
- **Configuração de Secrets**: Configure o token NPM em "Settings > Secrets > Actions"
- **Permissões**: Mantenha as permissões de publicação restritas apenas a colaboradores confiáveis