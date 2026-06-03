const Service = require('../models/Service');
const { handleError } = require('../utils/errorHandler');

class ServiceController {
  /**
   * Criar novo serviço
   */
  static async create(req, res) {
    try {
      const { name, description, price, duration } = req.body;

      if (!name || !price || !duration) {
        return res.status(400).json({
          success: false,
          message: 'Nome, preço e duração são obrigatórios'
        });
      }

      const service = await Service.create({ name, description, price, duration });

      res.status(201).json({
        success: true,
        data: service
      });
    } catch (error) {
      handleError(res, error, 'Erro ao criar serviço:', 'ServiceController');
    }
  }

  /**
   * Listar todos os serviços
   */
  static async findAll(req, res) {
    try {
      const services = await Service.findAll();

      res.json({
        success: true,
        data: services
      });
    } catch (error) {
      handleError(res, error, 'Erro ao listar serviços:', 'ServiceController');
    }
  }

  /**
   * Buscar serviço por ID
   */
  static async findById(req, res) {
    try {
      const { id } = req.params;
      const service = await Service.findById(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Serviço não encontrado'
        });
      }

      res.json({
        success: true,
        data: service
      });
    } catch (error) {
      handleError(res, error, 'Erro ao buscar serviço:', 'ServiceController');
    }
  }

  /**
   * Atualizar serviço
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, price, duration } = req.body;

      const service = await Service.update(id, { name, description, price, duration });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Serviço não encontrado'
        });
      }

      res.json({
        success: true,
        data: service
      });
    } catch (error) {
      handleError(res, error, 'Erro ao atualizar serviço:', 'ServiceController');
    }
  }

  /**
   * Deletar serviço
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Service.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Serviço não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Serviço deletado com sucesso'
      });
    } catch (error) {
      handleError(res, error, 'Erro ao deletar serviço:', 'ServiceController');
    }
  }
}

module.exports = ServiceController;