const jwt = require('jsonwebtoken');

/**
 * Middleware para validar o token JWT
 * Verifica se o usuário está autenticado
 */
const authenticate = (req, res, next) => {
  try {
    // Obter token do header Authorization
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }
    
    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Adicionar dados do usuário à requisição
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

/**
 * Middleware para validar campos obrigatórios
 * @param {Array} fields - Array com nomes dos campos obrigatórios
 */
const validateRequiredFields = (fields) => {
  return (req, res, next) => {
    const missingFields = fields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios faltando',
        missingFields
      });
    }
    
    next();
  };
};

/**
 * Middleware para validar formato de email
 */
const validateEmail = (req, res, next) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (req.body.email && !emailRegex.test(req.body.email)) {
    return res.status(400).json({
      success: false,
      message: 'Formato de email inválido'
    });
  }
  
  next();
};

/**
 * Middleware para validar senha forte
 * Mínimo 6 caracteres
 */
const validatePassword = (req, res, next) => {
  if (req.body.password && req.body.password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Senha deve ter no mínimo 6 caracteres'
    });
  }
  
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado: apenas administradores podem executar esta ação'
    });
  }

  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  validateRequiredFields,
  validateEmail,
  validatePassword
};
