/**
 * Componente de visualização de gerenciamento de pedidos para Claude Desktop
 * 
 * Renderiza uma interface interativa para gerenciar pedidos WooCommerce
 * via artifacts do Claude.
 * 
 * Parte do PHP Universal MCP Server v1.8.0
 */

class OrdersManagementView {
    /**
     * Inicializa a visualização de gerenciamento de pedidos
     * 
     * @param {Object} options - Opções de configuração
     */
    constructor(options = {}) {
        this.options = Object.assign({
            debug: false,
            theme: 'light',
            pageSize: 10
        }, options);
    }

    /**
     * Renderiza o componente para Claude artifacts
     * 
     * @param {Array} orders - Lista de pedidos para exibir
     * @param {Object} metadata - Metadados adicionais (contagens, filtros, etc)
     * @returns {Object} - Objeto formatado para o artifact do Claude
     */
    render(orders, metadata = {}) {
        try {
            // Verifica se há dados para exibir
            if (!orders || !Array.isArray(orders)) {
                return this._createErrorView('Nenhum dado de pedido disponível');
            }

            // Formata dados para visualização
            const formattedOrders = orders.map(this._formatOrderData);
            
            // Prepara metadados para a visualização
            const viewMetadata = Object.assign({
                totalOrders: formattedOrders.length,
                currentPage: 1,
                totalPages: Math.ceil(formattedOrders.length / this.options.pageSize),
                filters: {},
                stats: {
                    totalRevenue: this._calculateTotalRevenue(orders),
                    statusCounts: this._countOrdersByStatus(orders)
                }
            }, metadata);

            // Cria objeto para o artifact
            const artifactData = {
                type: 'application/vnd.ant.react',
                content: this._generateReactComponent(formattedOrders, viewMetadata),
                metadata: {
                    title: 'Gerenciamento de Pedidos WooCommerce',
                    description: 'Interface para gerenciamento de pedidos via Claude Desktop',
                    version: '1.0.0'
                }
            };

            return artifactData;
        } catch (error) {
            console.error(`Erro ao renderizar visualização de pedidos: ${error.message}`);
            return this._createErrorView(`Erro ao processar visualização: ${error.message}`);
        }
    }

    /**
     * Formata dados do pedido para visualização
     * 
     * @param {Object} order - Dados do pedido
     * @returns {Object} - Dados formatados
     * @private
     */
    _formatOrderData(order) {
        // Extrai informações relevantes do pedido
        return {
            id: order.id,
            number: order.number || `#${order.id}`,
            date: order.date_created || order.date_created_gmt || 'N/A',
            status: order.status || 'unknown',
            customerName: order.billing ? 
                `${order.billing.first_name || ''} ${order.billing.last_name || ''}`.trim() || 'Cliente' 
                : 'Cliente',
            total: order.total || '0.00',
            items: (order.line_items || []).map(item => ({
                id: item.id,
                name: item.name || 'Produto',
                quantity: item.quantity || 1,
                price: item.price || '0.00',
                total: item.total || '0.00'
            })),
            paymentMethod: order.payment_method_title || order.payment_method || 'N/A',
            shippingMethod: 
                (order.shipping_lines && order.shipping_lines.length > 0) ? 
                order.shipping_lines[0].method_title : 'N/A',
            // Mais detalhes conforme necessário
            raw: order // Mantém dados originais para processamento avançado
        };
    }

    /**
     * Gera componente React para visualização via artifacts
     * 
     * @param {Array} orders - Pedidos formatados
     * @param {Object} metadata - Metadados da visualização
     * @returns {string} - Código do componente React
     * @private
     */
    _generateReactComponent(orders, metadata) {
        return `
import React, { useState, useEffect } from 'react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

// Definição dos dados iniciais
const initialOrders = ${JSON.stringify(orders)};
const viewMetadata = ${JSON.stringify(metadata)};

// Componente para gerenciamento de pedidos
const OrdersManagementView = () => {
    // Estados
    const [orders, setOrders] = useState(initialOrders);
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortField, setSortField] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const pageSize = ${this.options.pageSize};
    
    // Preparação dos dados para o gráfico de receita
    const revenueData = Array.isArray(initialOrders) ? initialOrders
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(order => ({
            date: new Date(order.date).toLocaleDateString(),
            revenue: parseFloat(order.total)
        })) : [];

    // Preparação dos dados para o gráfico de status
    const statusData = viewMetadata.stats.statusCounts ? 
        Object.entries(viewMetadata.stats.statusCounts).map(([status, count]) => ({
            status,
            count
        })) : [];

    // Filtragem, ordenação e paginação
    const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
        // Aplica filtro de status se especificado
        if (statusFilter !== 'all' && order.status !== statusFilter) {
            return false;
        }
        
        // Aplica filtro de pesquisa
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            return (
                order.number.toLowerCase().includes(term) ||
                order.customerName.toLowerCase().includes(term) ||
                order.status.toLowerCase().includes(term)
            );
        }
        
        return true;
    }) : [];

    // Ordenação dos pedidos
    const sortedOrders = [...filteredOrders].sort((a, b) => {
        if (sortField === 'date') {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        } else if (sortField === 'total') {
            return sortDirection === 'asc' 
                ? parseFloat(a.total) - parseFloat(b.total)
                : parseFloat(b.total) - parseFloat(a.total);
        } else {
            // Ordenação padrão para campos de texto
            if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
            if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        }
    });

    // Cálculos de paginação
    const totalPages = Math.ceil(sortedOrders.length / pageSize);
    const paginatedOrders = sortedOrders.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Formatação de moeda
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Formatação de data
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Handler para alternar ordenação
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Função para alternar seleção de pedido
    const toggleOrderSelection = (order) => {
        setSelectedOrder(selectedOrder && selectedOrder.id === order.id ? null : order);
    };

    // Navegação de página
    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Classe CSS para linhas de pedidos com base no status
    const getStatusClass = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100';
            case 'processing':
                return 'bg-blue-100';
            case 'on-hold':
                return 'bg-yellow-100';
            case 'cancelled':
                return 'bg-red-100';
            case 'refunded':
                return 'bg-purple-100';
            case 'failed':
                return 'bg-gray-200';
            case 'pending':
                return 'bg-orange-100';
            default:
                return '';
        }
    };

    return (
        <div className="flex flex-col font-sans bg-gray-50 text-gray-900 p-4 rounded-lg shadow">
            <h1 className="text-xl font-bold mb-4">Gerenciamento de Pedidos WooCommerce</h1>
            
            {/* Resumo e Métricas */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
                    <h3 className="font-medium text-gray-500">Total de Pedidos</h3>
                    <p className="text-2xl font-bold">{filteredOrders.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
                    <h3 className="font-medium text-gray-500">Receita Total</h3>
                    <p className="text-2xl font-bold">{formatCurrency(viewMetadata.stats.totalRevenue)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
                    <h3 className="font-medium text-gray-500">Valor Médio</h3>
                    <p className="text-2xl font-bold">
                        {formatCurrency(filteredOrders.length > 0 
                            ? viewMetadata.stats.totalRevenue / filteredOrders.length 
                            : 0)}
                    </p>
                </div>
            </div>
            
            {/* Gráficos */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-medium text-gray-700 mb-2">Receita por Data</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    name="Receita" 
                                    stroke="#3b82f6" 
                                    activeDot={{ r: 8 }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-medium text-gray-700 mb-2">Pedidos por Status</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="status" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" name="Pedidos" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            
            {/* Controles de filtro e busca */}
            <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-lg shadow mb-4">
                <div className="flex space-x-2 mb-2 md:mb-0">
                    <select 
                        className="border rounded p-2"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="all">Todos os Status</option>
                        <option value="pending">Pendente</option>
                        <option value="processing">Processando</option>
                        <option value="on-hold">Em Espera</option>
                        <option value="completed">Concluído</option>
                        <option value="cancelled">Cancelado</option>
                        <option value="refunded">Reembolsado</option>
                        <option value="failed">Falhou</option>
                    </select>
                </div>
                
                <div className="flex space-x-2">
                    <input
                        type="text"
                        placeholder="Buscar pedidos..."
                        className="border rounded p-2 w-64"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>
            
            {/* Tabela de pedidos */}
            <div className="bg-white rounded-lg shadow overflow-auto mb-4">
                <table className="min-w-full">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th 
                                className="text-left p-3 cursor-pointer hover:bg-gray-200"
                                onClick={() => handleSort('number')}
                            >
                                Pedido {sortField === 'number' && (
                                    sortDirection === 'asc' ? '↑' : '↓'
                                )}
                            </th>
                            <th 
                                className="text-left p-3 cursor-pointer hover:bg-gray-200"
                                onClick={() => handleSort('date')}
                            >
                                Data {sortField === 'date' && (
                                    sortDirection === 'asc' ? '↑' : '↓'
                                )}
                            </th>
                            <th 
                                className="text-left p-3 cursor-pointer hover:bg-gray-200"
                                onClick={() => handleSort('customerName')}
                            >
                                Cliente {sortField === 'customerName' && (
                                    sortDirection === 'asc' ? '↑' : '↓'
                                )}
                            </th>
                            <th 
                                className="text-left p-3 cursor-pointer hover:bg-gray-200"
                                onClick={() => handleSort('status')}
                            >
                                Status {sortField === 'status' && (
                                    sortDirection === 'asc' ? '↑' : '↓'
                                )}
                            </th>
                            <th 
                                className="text-right p-3 cursor-pointer hover:bg-gray-200"
                                onClick={() => handleSort('total')}
                            >
                                Total {sortField === 'total' && (
                                    sortDirection === 'asc' ? '↑' : '↓'
                                )}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedOrders.map(order => (
                            <React.Fragment key={order.id}>
                                <tr 
                                    className={\`border-b hover:bg-gray-50 cursor-pointer \${
                                        selectedOrder && selectedOrder.id === order.id 
                                        ? 'bg-blue-50' 
                                        : getStatusClass(order.status)
                                    }\`}
                                    onClick={() => toggleOrderSelection(order)}
                                >
                                    <td className="p-3 font-medium">{order.number}</td>
                                    <td className="p-3">{formatDate(order.date)}</td>
                                    <td className="p-3">{order.customerName}</td>
                                    <td className="p-3">
                                        <span className={\`inline-block px-2 py-1 rounded-full text-xs font-semibold 
                                            \${
                                                order.status === 'completed' ? 'bg-green-200 text-green-800' :
                                                order.status === 'processing' ? 'bg-blue-200 text-blue-800' :
                                                order.status === 'on-hold' ? 'bg-yellow-200 text-yellow-800' :
                                                order.status === 'cancelled' ? 'bg-red-200 text-red-800' :
                                                order.status === 'refunded' ? 'bg-purple-200 text-purple-800' :
                                                order.status === 'failed' ? 'bg-gray-200 text-gray-800' :
                                                order.status === 'pending' ? 'bg-orange-200 text-orange-800' :
                                                'bg-gray-100 text-gray-800'
                                            }\`}
                                        >
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right font-medium">
                                        {formatCurrency(order.total)}
                                    </td>
                                </tr>
                                
                                {/* Detalhes do pedido expandidos */}
                                {selectedOrder && selectedOrder.id === order.id && (
                                    <tr>
                                        <td colSpan="5" className="p-0">
                                            <div className="p-4 bg-white border-b">
                                                <div className="grid grid-cols-3 gap-4 mb-4">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-700 mb-1">Informações do Pedido</h4>
                                                        <p>ID: {order.id}</p>
                                                        <p>Data: {formatDate(order.date)}</p>
                                                        <p>Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
                                                        <p>Método de Pagamento: {order.paymentMethod}</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-700 mb-1">Cliente</h4>
                                                        <p>{order.customerName}</p>
                                                        {order.raw.billing && (
                                                            <>
                                                                <p>{order.raw.billing.email || 'N/A'}</p>
                                                                <p>{order.raw.billing.phone || 'N/A'}</p>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-700 mb-1">Envio</h4>
                                                        <p>Método: {order.shippingMethod}</p>
                                                        {order.raw.shipping && (
                                                            <p>
                                                                {order.raw.shipping.address_1 || 'N/A'}, 
                                                                {order.raw.shipping.city || ''} 
                                                                {order.raw.shipping.postcode ? `- ${order.raw.shipping.postcode}` : ''}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Itens do pedido */}
                                                <h4 className="font-semibold text-gray-700 mb-2">Itens do Pedido</h4>
                                                <div className="overflow-auto">
                                                    <table className="min-w-full border">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="text-left p-2 border">Produto</th>
                                                                <th className="text-center p-2 border">Quantidade</th>
                                                                <th className="text-right p-2 border">Preço</th>
                                                                <th className="text-right p-2 border">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {order.items.map(item => (
                                                                <tr key={item.id} className="border-b">
                                                                    <td className="p-2 border">{item.name}</td>
                                                                    <td className="p-2 border text-center">{item.quantity}</td>
                                                                    <td className="p-2 border text-right">{formatCurrency(item.price)}</td>
                                                                    <td className="p-2 border text-right">{formatCurrency(item.total)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot className="bg-gray-50">
                                                            <tr>
                                                                <td colSpan="3" className="p-2 border text-right font-semibold">Subtotal:</td>
                                                                <td className="p-2 border text-right">{formatCurrency(order.raw.subtotal || 0)}</td>
                                                            </tr>
                                                            {order.raw.shipping_total && parseFloat(order.raw.shipping_total) > 0 && (
                                                                <tr>
                                                                    <td colSpan="3" className="p-2 border text-right font-semibold">Frete:</td>
                                                                    <td className="p-2 border text-right">{formatCurrency(order.raw.shipping_total)}</td>
                                                                </tr>
                                                            )}
                                                            {order.raw.total_tax && parseFloat(order.raw.total_tax) > 0 && (
                                                                <tr>
                                                                    <td colSpan="3" className="p-2 border text-right font-semibold">Impostos:</td>
                                                                    <td className="p-2 border text-right">{formatCurrency(order.raw.total_tax)}</td>
                                                                </tr>
                                                            )}
                                                            {order.raw.discount_total && parseFloat(order.raw.discount_total) > 0 && (
                                                                <tr>
                                                                    <td colSpan="3" className="p-2 border text-right font-semibold">Desconto:</td>
                                                                    <td className="p-2 border text-right">-{formatCurrency(order.raw.discount_total)}</td>
                                                                </tr>
                                                            )}
                                                            <tr className="bg-gray-100">
                                                                <td colSpan="3" className="p-2 border text-right font-bold">Total:</td>
                                                                <td className="p-2 border text-right font-bold">{formatCurrency(order.total)}</td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        
                        {paginatedOrders.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-4 text-center text-gray-500">
                                    Nenhum pedido encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Controles de paginação */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
                <div>
                    Exibindo {filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, filteredOrders.length)} de {filteredOrders.length} pedidos
                </div>
                <div className="flex space-x-2">
                    <button 
                        className="px-3 py-1 border rounded bg-gray-100 disabled:opacity-50"
                        onClick={prevPage}
                        disabled={currentPage === 1}
                    >
                        Anterior
                    </button>
                    <span className="px-3 py-1 border rounded bg-gray-50">
                        {currentPage} de {totalPages || 1}
                    </span>
                    <button 
                        className="px-3 py-1 border rounded bg-gray-100 disabled:opacity-50"
                        onClick={nextPage}
                        disabled={currentPage >= totalPages}
                    >
                        Próximo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrdersManagementView;
`;
    }

    /**
     * Cria uma visualização de erro
     * 
     * @param {string} message - Mensagem de erro
     * @returns {Object} - Objeto formatado para o artifact do Claude
     * @private
     */
    _createErrorView(message) {
        return {
            type: 'application/vnd.ant.react',
            content: `
import React from 'react';

const ErrorView = () => {
    return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <h2 className="text-lg font-semibold mb-2">Erro ao carregar visualização</h2>
            <p>${message}</p>
        </div>
    );
};

export default ErrorView;
            `,
            metadata: {
                title: 'Erro - Visualização de Pedidos',
                description: 'Ocorreu um erro ao renderizar a visualização',
                version: '1.0.0'
            }
        };
    }

    /**
     * Calcula receita total dos pedidos
     * 
     * @param {Array} orders - Lista de pedidos
     * @returns {number} - Receita total
     * @private
     */
    _calculateTotalRevenue(orders) {
        if (!Array.isArray(orders)) return 0;
        
        return orders.reduce((total, order) => {
            const orderTotal = order.total || 0;
            return total + parseFloat(orderTotal);
        }, 0);
    }

    /**
     * Conta pedidos por status
     * 
     * @param {Array} orders - Lista de pedidos
     * @returns {Object} - Contagem por status
     * @private
     */
    _countOrdersByStatus(orders) {
        if (!Array.isArray(orders)) return {};
        
        const statusCounts = {};
        
        orders.forEach(order => {
            const status = order.status || 'unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        return statusCounts;
    }
}

module.exports = OrdersManagementView;
