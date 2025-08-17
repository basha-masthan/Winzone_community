const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireOwnershipOrAdmin, validateBody } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});

// Get user by ID
router.get('/:userId', requireOwnershipOrAdmin('userId'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// Get user tournament registrations
router.get('/:userId/registrations', requireOwnershipOrAdmin('userId'), async (req, res) => {
  try {
    const TournamentRegistration = require('../models/TournamentRegistration');
    const registrations = await TournamentRegistration.find({ user: req.params.userId })
      .populate('tournament', 'title gameName map mode entryFee winningPrize perKill startTime')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { registrations }
    });

  } catch (error) {
    console.error('Get user registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user registrations',
      error: error.message
    });
  }
});

// Update user profile
router.put('/:userId', requireOwnershipOrAdmin('userId'), validateBody(['name']), async (req, res) => {
  try {
    const { name, phoneNumber, profilePicture, gameIds } = req.body;
    
    const updateData = { name };
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (gameIds !== undefined) updateData.gameIds = gameIds;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// Update user balance
router.patch('/:userId/balance', requireOwnershipOrAdmin('userId'), validateBody(['balance']), async (req, res) => {
  try {
    const { balance } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { balance: parseFloat(balance) },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Balance updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating balance',
      error: error.message
    });
  }
});

// Get leaderboard
router.get('/leaderboard/global', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const leaderboard = await User.getLeaderboard(parseInt(limit));
    
    res.json({
      success: true,
      data: { leaderboard }
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: error.message
    });
  }
});

// Search users
router.get('/search/query', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const users = await User.searchUsers(q, parseInt(limit));
    
    res.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users',
      error: error.message
    });
  }
});

module.exports = router;
