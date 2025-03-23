<?php
/**
 * PHP Universal MCP Server
 * 
 * Um servidor MCP (Model Context Protocol) que permite executar código PHP
 * diretamente a partir do Claude Desktop e gerenciar sites de e-commerce
 * em múltiplas plataformas de hospedagem.
 * 
 * @package php-universal-mcp-server
 * @author Lucas Dórea
 * @version 1.0.0
 * @license MIT
 */

// Definição do caminho base
define('BASE_DIR', __DIR__);

// Configuração
error_reporting(E_ALL);
ini_set('display_errors', 1);
set_error_handler('errorHandler');
register_shutdown_function('fatalErrorHandler');

// Carregar componentes necessários
require_once(BASE_DIR . '/lib/functions.php');
require_once(BASE_DIR . '/lib/MCPProtocolHandler.php');
require_once(BASE_DIR . '/lib/PHPExecutor.php');
require_once(BASE_DIR . '/lib/CloudProviderManager.php');
require_once(BASE_DIR . '/lib/EcommerceManager.php');

// Log de inicialização
logInfo("PHP Universal MCP Server iniciando");
logInfo("Versão PHP: " . PHP_VERSION);
logInfo("Sistema Operacional: " . PHP_OS);
logInfo("Diretório base: " . BASE_DIR);

// Verificar extensões necessárias
checkExtensions(['json', 'mbstring', 'curl']);

// Carregar configurações
$config = loadConfig(BASE_DIR . '/config/settings.json');

// Iniciar servidor MCP
$server = new PHPUniversalServer($config);
$server->run();

/**
 * Classe principal do servidor MCP Universal para PHP
 */
class PHPUniversalServer {
    private $config;
    private $functions = [];
    private $phpExecutor;
    private $cloudManager;
    private $ecommerceManager;

    /**
     * Construtor
     * 
     * @param array $config Configurações do servidor
     */
    public function __construct($config) {
        $this->config = $config;
        $this->phpExecutor = new PHPExecutor();
        $this->cloudManager = new CloudProviderManager($config);
        $this->ecommerceManager = new EcommerceManager($config, $this->cloudManager);
        
        $this->registerFunctions();
    }

    /**
     * Inicia o servidor MCP
     */
    public function run() {
        logInfo("Iniciando servidor MCP...");
        
        try {
            // Ler mensagem de inicialização
            $initLine = fgets(STDIN);
            if (!$initLine) {
                throw new Exception("Falha ao ler mensagem de inicialização");
            }

            // Processar inicialização
            $initMessage = json_decode($initLine, true);
            if (!$initMessage || !isset($initMessage['jsonrpc']) || !isset($initMessage['method']) || $initMessage['method'] !== 'initialize') {
                throw new Exception("Mensagem de inicialização inválida: $initLine");
            }

            // Responder com schema de funções
            $this->sendResponse([
                'jsonrpc' => '2.0',
                'id' => $initMessage['id'],
                'result' => [
                    'schema' => [
                        'functions' => $this->functions
                    ]
                ]
            ]);

            logInfo("Inicialização concluída. Pronto para processar solicitações.");

            // Loop principal de processamento de mensagens
            while ($line = fgets(STDIN)) {
                $message = json_decode($line, true);
                if (!$message || !isset($message['jsonrpc']) || !isset($message['method'])) {
                    logError("Formato de mensagem inválido: $line");
                    continue;
                }

                if ($message['method'] === 'shutdown') {
                    logInfo("Desligamento solicitado");
                    $this->sendResponse([
                        'jsonrpc' => '2.0',
                        'id' => $message['id'],
                        'result' => null
                    ]);
                    break;
                }

                if ($message['method'] === 'execute') {
                    $this->handleExecute($message);
                    continue;
                }

                logError("Método desconhecido: {$message['method']}");
                $this->sendError($message['id'], -32601, "Método {$message['method']} não encontrado");
            }
        } catch (Exception $e) {
            logError("Erro fatal: " . $e->getMessage());
            exit(1);
        }

        logInfo("PHP Universal MCP Server encerrando");
    }

    /**
     * Registra todas as funções disponíveis no servidor MCP
     */
    private function registerFunctions() {
        // Funções PHP básicas
        $this->functions[] = [
            'name' => 'php_exec',
            'description' => 'Executa código PHP e retorna o resultado',
            'parameters' => [
                'properties' => [
                    'code' => [
                        'type' => 'string',
                        'description' => 'Código PHP para executar'
                    ]
                ],
                'required' => ['code'],
                'type' => 'object'
            ]
        ];

        $this->functions[] = [
            'name' => 'php_info',
            'description' => 'Retorna informações sobre a instalação do PHP',
            'parameters' => [
                'properties' => [
                    'section' => [
                        'type' => 'string',
                        'description' => 'Seção específica (opcional): general, extensions, configuration'
                    ]
                ],
                'type' => 'object'
            ]
        ];
        
        // Funções de gerenciamento de sites - Hostinger
        $this->functions[] = [
            'name' => 'hostinger_create_site',
            'description' => 'Cria um novo site na plataforma Hostinger',
            'parameters' => [
                'properties' => [
                    'name' => [
                        'type' => 'string',
                        'description' => 'Nome do site'
                    ],
                    'platform' => [
                        'type' => 'string',
                        'description' => 'Plataforma do site (wordpress, woocommerce, custom)'
                    ],
                    'template' => [
                        'type' => 'string',
                        'description' => 'Template a ser usado (opcional)'
                    ]
                ],
                'required' => ['name', 'platform'],
                'type' => 'object'
            ]
        ];

        // Funções WooCommerce
        $this->functions[] = [
            'name' => 'woo_add_product',
            'description' => 'Adiciona um novo produto à loja WooCommerce',
            'parameters' => [
                'properties' => [
                    'site' => [
                        'type' => 'string',
                        'description' => 'ID ou URL do site'
                    ],
                    'name' => [
                        'type' => 'string',
                        'description' => 'Nome do produto'
                    ],
                    'price' => [
                        'type' => 'number',
                        'description' => 'Preço do produto'
                    ],
                    'description' => [
                        'type' => 'string',
                        'description' => 'Descrição do produto'
                    ],
                    'stock' => [
                        'type' => 'number',
                        'description' => 'Quantidade em estoque'
                    ],
                    'categories' => [
                        'type' => 'array',
                        'description' => 'Categorias do produto'
                    ]
                ],
                'required' => ['site', 'name', 'price'],
                'type' => 'object'
            ]
        ];

        // Funções Shopify
        $this->functions[] = [
            'name' => 'shopify_update_theme',
            'description' => 'Atualiza configurações do tema Shopify',
            'parameters' => [
                'properties' => [
                    'shop' => [
                        'type' => 'string',
                        'description' => 'URL da loja Shopify'
                    ],
                    'theme_id' => [
                        'type' => 'string',
                        'description' => 'ID do tema (opcional, usa o tema ativo se não especificado)'
                    ],
                    'settings' => [
                        'type' => 'object',
                        'description' => 'Configurações a serem atualizadas'
                    ]
                ],
                'required' => ['shop', 'settings'],
                'type' => 'object'
            ]
        ];

        // Função Multi-site
        $this->functions[] = [
            'name' => 'list_all_sites',
            'description' => 'Lista todos os sites gerenciados em todas as plataformas',
            'parameters' => [
                'properties' => [
                    'platform' => [
                        'type' => 'string',
                        'description' => 'Filtrar por plataforma (opcional)'
                    ]
                ],
                'type' => 'object'
            ]
        ];
    }

    /**
     * Processa uma requisição de execução
     * 
     * @param array $message Mensagem recebida
     */
    private function handleExecute($message) {
        if (!isset($message['params']) || !isset($message['params']['name']) || !isset($message['params']['arguments'])) {
            $this->sendError($message['id'], -32602, "Parâmetros inválidos");
            return;
        }

        $functionName = $message['params']['name'];
        $arguments = $message['params']['arguments'];

        try {
            switch ($functionName) {
                case 'php_exec':
                    $this->handlePhpExec($message['id'], $arguments);
                    break;
                
                case 'php_info':
                    $this->handlePhpInfo($message['id'], $arguments);
                    break;
                
                case 'hostinger_create_site':
                    $this->handleHostingerCreateSite($message['id'], $arguments);
                    break;
                
                case 'woo_add_product':
                    $this->handleWooAddProduct($message['id'], $arguments);
                    break;
                
                case 'shopify_update_theme':
                    $this->handleShopifyUpdateTheme($message['id'], $arguments);
                    break;
                
                case 'list_all_sites':
                    $this->handleListAllSites($message['id'], $arguments);
                    break;
                
                default:
                    $this->sendError($message['id'], -32601, "Função $functionName não encontrada");
                    break;
            }
        } catch (Exception $e) {
            $this->sendError($message['id'], 0, "Erro: " . $e->getMessage());
        }
    }

    /**
     * Processa uma requisição para executar código PHP
     * 
     * @param mixed $id ID da mensagem
     * @param array $arguments Argumentos da função
     */
    private function handlePhpExec($id, $arguments) {
        if (!isset($arguments['code'])) {
            $this->sendError($id, -32602, "Parâmetro 'code' ausente");
            return;
        }

        $result = $this->phpExecutor->execute($arguments['code']);
        
        $this->sendResponse([
            'jsonrpc' => '2.0',
            'id' => $id,
            'result' => $result
        ]);
    }

    /**
     * Processa uma requisição para obter informações do PHP
     * 
     * @param mixed $id ID da mensagem
     * @param array $arguments Argumentos da função
     */
    private function handlePhpInfo($id, $arguments) {
        $section = isset($arguments['section']) ? $arguments['section'] : 'general';
        
        $info = $this->phpExecutor->getInfo($section);
        
        $this->sendResponse([
            'jsonrpc' => '2.0',
            'id' => $id,
            'result' => $info
        ]);
    }

    /**
     * Processa uma requisição para criar um site no Hostinger
     * 
     * @param mixed $id ID da mensagem
     * @param array $arguments Argumentos da função
     */
    private function handleHostingerCreateSite($id, $arguments) {
        if (!isset($arguments['name']) || !isset($arguments['platform'])) {
            $this->sendError($id, -32602, "Parâmetros 'name' e 'platform' são obrigatórios");
            return;
        }
        
        $template = isset($arguments['template']) ? $arguments['template'] : null;
        
        $result = $this->ecommerceManager->createHostingerSite(
            $arguments['name'],
            $arguments['platform'],
            $template
        );
        
        $this->sendResponse([
            'jsonrpc' => '2.0',
            'id' => $id,
            'result' => $result
        ]);
    }

    /**
     * Processa uma requisição para adicionar um produto no WooCommerce
     * 
     * @param mixed $id ID da mensagem
     * @param array $arguments Argumentos da função
     */
    private function handleWooAddProduct($id, $arguments) {
        if (!isset($arguments['site']) || !isset($arguments['name']) || !isset($arguments['price'])) {
            $this->sendError($id, -32602, "Parâmetros 'site', 'name' e 'price' são obrigatórios");
            return;
        }
        
        $result = $this->ecommerceManager->addWooCommerceProduct(
            $arguments['site'],
            $arguments['name'],
            $arguments['price'],
            $arguments['description'] ?? '',
            $arguments['stock'] ?? null,
            $arguments['categories'] ?? []
        );
        
        $this->sendResponse([
            'jsonrpc' => '2.0',
            'id' => $id,
            'result' => $result
        ]);
    }

    /**
     * Processa uma requisição para atualizar um tema no Shopify
     * 
     * @param mixed $id ID da mensagem
     * @param array $arguments Argumentos da função
     */
    private function handleShopifyUpdateTheme($id, $arguments) {
        if (!isset($arguments['shop']) || !isset($arguments['settings'])) {
            $this->sendError($id, -32602, "Parâmetros 'shop' e 'settings' são obrigatórios");
            return;
        }
        
        $themeId = $arguments['theme_id'] ?? null;
        
        $result = $this->ecommerceManager->updateShopifyTheme(
            $arguments['shop'],
            $arguments['settings'],
            $themeId
        );
        
        $this->sendResponse([
            'jsonrpc' => '2.0',
            'id' => $id,
            'result' => $result
        ]);
    }

    /**
     * Processa uma requisição para listar todos os sites
     * 
     * @param mixed $id ID da mensagem
     * @param array $arguments Argumentos da função
     */
    private function handleListAllSites($id, $arguments) {
        $platform = $arguments['platform'] ?? null;
        
        $sites = $this->ecommerceManager->listAllSites($platform);
        
        $this->sendResponse([
            'jsonrpc' => '2.0',
            'id' => $id,
            'result' => $sites
        ]);
    }

    /**
     * Envia uma resposta ao cliente
     * 
     * @param array $response Resposta a ser enviada
     */
    private function sendResponse($response) {
        echo json_encode($response) . "\n";
        flush();
    }

    /**
     * Envia uma mensagem de erro ao cliente
     * 
     * @param mixed $id ID da mensagem
     * @param int $code Código do erro
     * @param string $message Mensagem de erro
     */
    private function sendError($id, $code, $message) {
        $this->sendResponse([
            'jsonrpc' => '2.0',
            'id' => $id,
            'error' => [
                'code' => $code,
                'message' => $message
            ]
        ]);
    }
}

/**
 * Registra mensagem de informação no log
 * 
 * @param string $message Mensagem a ser registrada
 */
function logInfo($message) {
    file_put_contents('php://stderr', '[INFO] ' . date('Y-m-d H:i:s') . ' - ' . $message . PHP_EOL);
}

/**
 * Registra mensagem de erro no log
 * 
 * @param string $message Mensagem a ser registrada
 */
function logError($message) {
    file_put_contents('php://stderr', '[ERROR] ' . date('Y-m-d H:i:s') . ' - ' . $message . PHP_EOL);
}

/**
 * Manipulador de erros
 * 
 * @param int $errno Nível do erro
 * @param string $errstr Mensagem de erro
 * @param string $errfile Arquivo onde ocorreu o erro
 * @param int $errline Linha onde ocorreu o erro
 * @return bool
 */
function errorHandler($errno, $errstr, $errfile, $errline) {
    logError("PHP Error [$errno]: $errstr in $errfile on line $errline");
    return true;
}

/**
 * Manipulador de erros fatais
 */
function fatalErrorHandler() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        logError("PHP Fatal Error: {$error['message']} in {$error['file']} on line {$error['line']}");
    }
}

/**
 * Verifica se as extensões necessárias estão instaladas
 * 
 * @param array $extensions Lista de extensões necessárias
 */
function checkExtensions($extensions) {
    $missing = [];
    
    foreach ($extensions as $ext) {
        if (!extension_loaded($ext)) {
            $missing[] = $ext;
        }
    }
    
    if (count($missing) > 0) {
        logError("Extensões necessárias não encontradas: " . implode(', ', $missing));
        exit(1);
    }
    
    logInfo("Todas as extensões necessárias estão instaladas");
}

/**
 * Carrega o arquivo de configuração
 * 
 * @param string $path Caminho para o arquivo de configuração
 * @return array Configurações carregadas
 */
function loadConfig($path) {
    if (file_exists($path)) {
        $config = json_decode(file_get_contents($path), true);
        
        if ($config === null) {
            logError("Erro ao analisar arquivo de configuração");
            return [];
        }
        
        logInfo("Configurações carregadas com sucesso");
        return $config;
    }
    
    logInfo("Arquivo de configuração não encontrado. Usando configurações padrão");
    return [];
}
