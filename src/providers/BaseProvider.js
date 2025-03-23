/**
 * Classe base para todos os provedores de hosting
 * Define a interface que todos os providers devem implementar
 */
class BaseProvider {
  /**
   * Construtor do provider base
   * @param {Object} config - Configuração do provider
   */
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Retorna o nome do provider
   * @returns {string} Nome do provider
   */
  getName() {
    throw new Error('Method getName() must be implemented');
  }

  /**
   * Executa um comando no provider
   * @param {Object} payload - Payload do comando
   * @returns {Object} Resultado da execução
   */
  execute(payload) {
    throw new Error('Method execute() must be implemented');
  }

  /**
   * Cria um stream para execução contínua
   * @param {Object} payload - Payload do comando
   * @returns {Object} Objeto de stream
   */
  createStream(payload) {
    throw new Error('Method createStream() must be implemented');
  }

  /**
   * Fecha um stream ativo
   * @param {Object} stream - Stream a ser fechado
   */
  closeStream(stream) {
    throw new Error('Method closeStream() must be implemented');
  }

  /**
   * Cancela a execução de um comando
   * @param {string} sessionId - ID da sessão
   */
  cancel(sessionId) {
    throw new Error('Method cancel() must be implemented');
  }

  /**
   * Verifica se o provider está disponível no ambiente atual
   * @returns {boolean} Verdadeiro se o provider estiver disponível
   */
  isAvailable() {
    return false;
  }

  /**
   * Verifica o status do provider
   * @returns {Object} Status do provider
   */
  checkStatus() {
    return {
      available: this.isAvailable(),
      name: this.getName(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = BaseProvider;