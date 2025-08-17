const express = require('express');
const Game = require('../models/Game');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all active games
router.get('/', async (req, res) => {
  try {
    const games = await Game.getActiveGames();
    
    res.json({
      success: true,
      data: { games }
    });

  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching games',
      error: error.message
    });
  }
});

// Get game by ID
router.get('/:gameId', async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.json({
      success: true,
      data: { game }
    });

  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching game',
      error: error.message
    });
  }
});

// Search games
router.get('/search/query', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const games = await Game.searchGames(q);
    
    res.json({
      success: true,
      data: { games }
    });

  } catch (error) {
    console.error('Search games error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching games',
      error: error.message
    });
  }
});

module.exports = router;
