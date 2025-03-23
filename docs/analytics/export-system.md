# Sistema de Exportação de Relatórios

O Sistema de Exportação de Relatórios do PHP Universal MCP Server permite que usuários extraiam dados analíticos em múltiplos formatos para uso em ferramentas externas, apresentações ou arquivamento. Esta funcionalidade, introduzida na versão 1.7.2, amplia significativamente as capacidades de análise de dados da plataforma.

## Visão Geral

O sistema suporta a exportação de qualquer relatório ou conjunto de dados em formatos padronizados da indústria, permitindo:

- Análise avançada em ferramentas como Excel, Google Sheets ou Tableau
- Compartilhamento de relatórios com equipes que não têm acesso ao sistema
- Integração com outros sistemas empresariais via importação de arquivos
- Arquivamento de dados históricos em formatos portáteis e duradouros

## Formatos Suportados

### CSV (Comma-Separated Values)

Ideal para dados tabulares que precisam ser importados em planilhas ou bancos de dados:

- Compatível com virtualmente qualquer ferramenta de planilha ou análise de dados
- Suporte a delimitadores configuráveis (vírgula, ponto-e-vírgula, tab)
- Opções de formatação para datas, números e moedas
- Escape automático de caracteres especiais

### PDF (Portable Document Format)

Perfeito para relatórios formais e apresentações:

- Layout profissional com formatação consistente
- Suporte a cabeçalhos, rodapés e numeração de páginas
- Inclusão de gráficos, tabelas e elementos visuais
- Proteção opcional com senha e permissões

### JSON (JavaScript Object Notation)

Ideal para integração com outros sistemas e processamento programático:

- Preservação completa da estrutura de dados
- Facilmente processável por qualquer linguagem de programação
- Suporte a dados hierárquicos e aninhados
- Compactação opcional para arquivos menores

## Comandos do Sistema

### Comandos via Claude Desktop

```
# Exportar relatório de vendas em CSV
exportar relatório vendas site-123 csv últimos-30-dias

# Exportar relatório de produtos em PDF
exportar relatório produtos site-123 pdf categoria-roupas

# Exportar relatório de clientes em JSON
exportar relatório clientes site-123 json todos
```

### API de Exportação

```javascript
const { exportManager } = server.modules;

// Exportar relatório de vendas
const salesReport = await exportManager.exportReport({
  siteId: 'site-123',
  reportType: 'sales',
  format: 'csv',
  dateRange: {
    start: '2025-02-23',
    end: '2025-03-23'
  },
  options: {
    delimiter: ',',
    includeHeaders: true,
    dateFormat: 'YYYY-MM-DD'
  }
});

// Exportar relatório de produtos
const productReport = await exportManager.exportReport({
  siteId: 'site-123',
  reportType: 'products',
  format: 'pdf',
  filter: {
    category: 'electronics',
    inStock: true
  },
  options: {
    title: 'Relatório de Produtos - Eletrônicos',
    pageSize: 'A4',
    orientation: 'landscape',
    includeCharts: true
  }
});

// Exportar dados personalizados
const customReport = await exportManager.exportData({
  data: customData,
  format: 'json',
  options: {
    pretty: true,
    compressed: false
  }
});
```

## Personalização de Relatórios

### Configuração Global

A configuração global do sistema de exportação pode ser definida em `config/export.js`:

```javascript
module.exports = {
  defaults: {
    csv: {
      delimiter: ',',
      includeHeaders: true,
      dateFormat: 'YYYY-MM-DD',
      numberFormat: {
        decimalSeparator: '.',
        thousandsSeparator: ','
      }
    },
    pdf: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      },
      header: {
        enabled: true,
        height: '1cm',
        contents: 'PHP Universal MCP Server - {reportTitle}'
      },
      footer: {
        enabled: true,
        height: '1cm',
        contents: 'Página {currentPage} de {totalPages} - Gerado em {generationDate}'
      }
    },
    json: {
      pretty: false,
      compressed: true
    }
  },
  reports: {
    sales: {
      title: 'Relatório de Vendas',
      columns: [
        { key: 'date', label: 'Data', format: 'date' },
        { key: 'orderId', label: 'Pedido' },
        { key: 'customer', label: 'Cliente' },
        { key: 'total', label: 'Total', format: 'currency' },
        { key: 'status', label: 'Status' }
      ]
    },
    // Outros relatórios pré-configurados
  }
};
```

### Templates Personalizados

Para PDF, o sistema suporta templates personalizados usando Handlebars:

```handlebars
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{title}}</title>
  <style>
    body { font-family: 'Helvetica', sans-serif; }
    .header { text-align: center; padding: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; }
    th { background-color: #f2f2f2; }
    .footer { text-align: center; padding: 20px; font-size: 0.8em; }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{title}}</h1>
    <p>Período: {{dateRange.start}} a {{dateRange.end}}</p>
  </div>
  
  <table>
    <thead>
      <tr>
        {{#each columns}}
          <th>{{this.label}}</th>
        {{/each}}
      </tr>
    </thead>
    <tbody>
      {{#each data}}
        <tr>
          {{#each ../columns}}
            <td>{{lookup ../this this.key}}</td>
          {{/each}}
        </tr>
      {{/each}}
    </tbody>
  </table>
  
  <div class="footer">
    Gerado em {{generationDate}} | Página {{currentPage}} de {{totalPages}}
  </div>
</body>
</html>
```

## Recursos Avançados

### Agendamento de Exportações

O sistema permite agendar exportações automáticas:

```javascript
const { exportManager } = server.modules;

// Agendar exportação semanal
await exportManager.scheduleExport({
  siteId: 'site-123',
  reportType: 'sales',
  format: 'csv',
  schedule: {
    frequency: 'weekly',
    dayOfWeek: 1, // Segunda-feira
    time: '08:00'
  },
  delivery: {
    method: 'email',
    recipients: ['admin@example.com'],
    subject: 'Relatório Semanal de Vendas'
  }
});
```

### Filtros Avançados

Os relatórios podem ser filtrados de forma avançada:

```javascript
const { exportManager } = server.modules;

// Exportar com filtros complexos
const filteredReport = await exportManager.exportReport({
  siteId: 'site-123',
  reportType: 'sales',
  format: 'pdf',
  filter: {
    dateRange: {
      start: '2025-02-23',
      end: '2025-03-23'
    },
    conditions: [
      { field: 'total', operator: 'gte', value: 100 },
      { field: 'paymentMethod', operator: 'in', value: ['credit_card', 'paypal'] },
      { 
        or: [
          { field: 'status', operator: 'eq', value: 'completed' },
          { field: 'status', operator: 'eq', value: 'processing' }
        ]
      }
    ],
    sort: [
      { field: 'date', direction: 'desc' },
      { field: 'total', direction: 'desc' }
    ],
    limit: 100,
    offset: 0
  }
});
```

### Transformação de Dados

Para personalização avançada, transformadores de dados podem ser aplicados:

```javascript
const { exportManager } = server.modules;

// Aplicar transformação personalizada
const transformedReport = await exportManager.exportReport({
  siteId: 'site-123',
  reportType: 'sales',
  format: 'csv',
  transformers: [
    // Adicionar coluna calculada
    (data) => data.map(row => ({
      ...row,
      profit: row.total - row.cost
    })),
    
    // Agrupar por mês
    (data) => {
      const grouped = {};
      data.forEach(row => {
        const month = row.date.substring(0, 7); // YYYY-MM
        if (!grouped[month]) {
          grouped[month] = {
            month,
            count: 0,
            total: 0,
            profit: 0
          };
        }
        grouped[month].count++;
        grouped[month].total += row.total;
        grouped[month].profit += row.profit;
      });
      return Object.values(grouped);
    }
  ]
});
```

## Integração com Claude Artifacts

O sistema de exportação se integra perfeitamente com o Claude Desktop:

- **Visualização Prévia**: Veja uma amostra do relatório antes de exportar
- **Download Direto**: Baixe o arquivo exportado diretamente no chat
- **Compartilhamento**: Compartilhe o relatório com outros usuários via Claude
- **Análise Interativa**: Visualize os dados em uma tabela interativa antes da exportação

## Performance e Otimização

Para grandes conjuntos de dados, o sistema utiliza estratégias de otimização:

- **Streaming de Dados**: Processamento sob demanda para reduzir uso de memória
- **Processamento Paralelo**: Uso de múltiplos threads para exportações complexas
- **Compressão Automática**: Redução do tamanho dos arquivos para transferência mais rápida
- **Exportação Assíncrona**: Operações de longa duração são processadas em background

## Conclusão

O Sistema de Exportação de Relatórios amplia significativamente as capacidades analíticas do PHP Universal MCP Server, permitindo que usuários extraiam valor de seus dados de forma flexível e personalizada. Com suporte a múltiplos formatos, opções avançadas de personalização e integração perfeita com o Claude Desktop, este sistema torna a análise de dados acessível e poderosa.

---

*Última atualização: 23 de março de 2025*