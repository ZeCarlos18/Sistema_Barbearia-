const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Buscar todos os barbeiros
router.get('/barbers', async (req, res) => {
  try {
    const barbers = await User.findByRole('barber');
    
    res.json({
      success: true,
      data: barbers
    });
  } catch (error) {
    console.error('Erro ao buscar barbeiros:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar barbeiros',
      error: error.message
    });
  }
});

// Buscar usuário por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuário',
      error: error.message
    });
  }
});

module.exports = router;