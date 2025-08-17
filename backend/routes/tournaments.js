const express = require('express');
const router = express.Router();
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const TournamentRegistration = require('../models/TournamentRegistration');
const Transaction = require('../models/Transaction');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Disable caching for all tournament routes
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Get all active tournaments
router.get('/', async (req, res) => {
  try {
    const { game, type, status, search, limit = 20 } = req.query;
    
    let tournaments;
    if (search) {
      tournaments = await Tournament.searchTournaments(search);
    } else if (game) {
      tournaments = await Tournament.getTournamentsByGame(game, status);
    } else {
      tournaments = await Tournament.getActiveTournaments();
    }

    // Filter by type if specified
    if (type && tournaments) {
      tournaments = tournaments.filter(t => t.type === type);
    }

    // Apply limit
    if (limit && tournaments) {
      tournaments = tournaments.slice(0, parseInt(limit));
    }

    console.log(`Found ${tournaments ? tournaments.length : 0} tournaments for game: ${game || 'all'}`);

    res.json({
      success: true,
      data: { tournaments: tournaments || [] }
    });

  } catch (error) {
    console.error('Get tournaments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tournaments',
      error: error.message
    });
  }
});

// Get tournament by ID
router.get('/:tournamentId', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.tournamentId)
      .populate('game', 'name image')
      .populate('registeredUsers', 'name email profilePicture');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      data: { tournament }
    });

  } catch (error) {
    console.error('Get tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tournament',
      error: error.message
    });
  }
});

// Search tournaments
router.get('/search/query', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const tournaments = await Tournament.searchTournaments(q);
    
    res.json({
      success: true,
      data: { tournaments }
    });

  } catch (error) {
    console.error('Search tournaments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching tournaments',
      error: error.message
    });
  }
});

// Tournament registration
router.post('/:tournamentId/register', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { gameId } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!gameId || gameId.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Game ID is required and must be at least 3 characters long'
      });
    }

    // Check if tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if tournament is still open for registration
    if (tournament.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'Tournament is not open for registration'
      });
    }

    // Check if tournament is full
    if (tournament.registeredSlots >= tournament.totalSlots) {
      return res.status(400).json({
        success: false,
        message: 'Tournament is full'
      });
    }

    // Check if user is already registered
    const existingRegistration = await TournamentRegistration.findOne({
      tournament: tournamentId,
      user: userId
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this tournament'
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if it's a paid tournament and user has sufficient balance
    if (tournament.type === 'paid' && tournament.entryFee > 0) {
      if (user.balance < tournament.entryFee) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. Required: ₹${tournament.entryFee}, Available: ₹${user.balance}`
        });
      }

      // Deduct entry fee from balance
      user.balance -= tournament.entryFee;
      await user.save();

      // Create transaction record
      const transaction = new Transaction({
        userId: userId,
        type: 'debit',
        amount: tournament.entryFee,
        description: `Entry fee for tournament: ${tournament.title}`,
        category: 'tournament_entry',
        status: 'completed'
      });
      await transaction.save();
    }

    // Calculate per kill bonus
    const perKill = tournament.entryFee > 0 ? tournament.entryFee * 0.1 : 0;

    // Create tournament registration
    const registration = new TournamentRegistration({
      tournament: tournamentId,
      user: userId,
      userName: user.name,
      gameId: gameId.trim(),
      entryFee: tournament.entryFee,
      winningPrize: tournament.winningPrize,
      perKill: perKill,
      mode: 'Squad', // Default mode
      startTime: tournament.dateTime,
      status: 'pending',
      paymentStatus: tournament.type === 'free' ? 'completed' : 'completed',
      paymentMethod: tournament.type === 'free' ? 'free' : 'wallet'
    });

    await registration.save();

    // Update tournament registered slots
    tournament.registeredSlots += 1;
    await tournament.save();

    // Update user's registered tournaments array
    if (!user.registeredTournaments.includes(tournamentId)) {
      user.registeredTournaments.push(tournamentId);
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Successfully registered for tournament!',
      data: {
        registration: {
          id: registration._id,
          tournamentId: tournamentId,
          gameId: gameId,
          status: registration.status,
          entryFee: tournament.entryFee,
          startTime: tournament.dateTime
        }
      }
    });

  } catch (error) {
    console.error('Tournament registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Unregister from tournament
router.delete('/:tournamentId/register', async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId;
    const userId = req.user.userId;

    // Check if tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if user is registered
    const registration = await TournamentRegistration.findOne({
      tournament: tournamentId,
      user: userId
    });

    if (!registration) {
      return res.status(400).json({
        success: false,
        message: 'Not registered for this tournament'
      });
    }

    // Check if tournament has started
    if (tournament.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'Cannot unregister from ongoing or completed tournament'
      });
    }

    // Remove registration
    await TournamentRegistration.findByIdAndDelete(registration._id);

    // Unregister user from tournament
    await tournament.unregisterUser(userId);

    // Update user's registered tournaments
    await User.findByIdAndUpdate(userId, {
      $pull: { registeredTournaments: tournamentId }
    });

    // If it was a free tournament, update user stats
    if (tournament.type === 'free') {
      await User.findByIdAndUpdate(userId, {
        $inc: { matchesPlayed: -1 }
      });
    }

    res.json({
      success: true,
      message: 'Successfully unregistered from tournament'
    });

  } catch (error) {
    console.error('Tournament unregistration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unregistering from tournament',
      error: error.message
    });
  }
});

// Get tournament registrations for user
router.get('/:tournamentId/registrations/user', async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId;
    const userId = req.user.userId;

    const registration = await TournamentRegistration.findOne({
      tournament: tournamentId,
      user: userId
    }).populate('tournament', 'title gameName image dateTime status');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Not registered for this tournament'
      });
    }

    res.json({
      success: true,
      data: { registration }
    });

  } catch (error) {
    console.error('Get user registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registration',
      error: error.message
    });
  }
});

// Get tournament leaderboard
router.get('/:tournamentId/leaderboard', async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId;

    const leaderboard = await TournamentRegistration.getTournamentLeaderboard(tournamentId);
    
    res.json({
      success: true,
      data: { leaderboard }
    });

  } catch (error) {
    console.error('Get tournament leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tournament leaderboard',
      error: error.message
    });
  }
});

// Get user's tournament history
router.get('/user/history', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const registrations = await TournamentRegistration.getUserRegistrations(userId, status);
    
    res.json({
      success: true,
      data: { registrations }
    });

  } catch (error) {
    console.error('Get user tournament history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tournament history',
      error: error.message
    });
  }
});

// Update tournament results (for users to submit their results)
router.put('/:tournamentId/results', async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId;
    const userId = req.user.userId;
    const { kills, position, screenshotProof } = req.body;

    // Check if tournament exists and is ongoing
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (tournament.status !== 'ongoing') {
      return res.status(400).json({
        success: false,
        message: 'Tournament is not ongoing'
      });
    }

    // Check if user is registered
    const registration = await TournamentRegistration.findOne({
      tournament: tournamentId,
      user: userId
    });

    if (!registration) {
      return res.status(400).json({
        success: false,
        message: 'Not registered for this tournament'
      });
    }

    // Update results
    await registration.updateResults(kills, position, screenshotProof);

    // Update tournament results
    await tournament.updateResults(userId, kills, position, registration.prizeEarned, position <= 3);

    // Update user stats
    const user = await User.findById(userId);
    if (user) {
      await user.updateMatchResults(kills, position <= 3);
    }

    res.json({
      success: true,
      message: 'Results submitted successfully',
      data: { registration }
    });

  } catch (error) {
    console.error('Submit results error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting results',
      error: error.message
    });
  }
});

module.exports = router;
