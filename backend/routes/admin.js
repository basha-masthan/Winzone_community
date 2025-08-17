const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Game = require('../models/Game');
const Tournament = require('../models/Tournament');
const TournamentRegistration = require('../models/TournamentRegistration');
const Post = require('../models/Post');
const Transaction = require('../models/Transaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const { authenticateToken, requireAdmin, validateBody, sanitizeInput } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken, requireAdmin, sanitizeInput);

// ==================== DASHBOARD STATISTICS ====================

// Get simple dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    
    // Tournament statistics
    const totalTournaments = await Tournament.countDocuments();
    
    // Registration statistics
    const totalRegistrations = await TournamentRegistration.countDocuments();
    
    // Financial statistics
    const totalRevenue = await Transaction.aggregate([
      { $match: { type: 'credit', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers,
        totalTournaments: totalTournaments,
        totalRegistrations: totalRegistrations,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

// Get dashboard overview statistics
router.get('/dashboard-stats', async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // User statistics
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: lastMonth } });
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: lastWeek } });
    const activeUsers = await User.countDocuments({ lastActive: { $gte: lastWeek } });

    // Tournament statistics
    const totalTournaments = await Tournament.countDocuments();
    const upcomingTournaments = await Tournament.countDocuments({ status: 'upcoming' });
    const ongoingTournaments = await Tournament.countDocuments({ status: 'ongoing' });
    const completedTournaments = await Tournament.countDocuments({ status: 'completed' });

    // Financial statistics
    const totalDeposits = await Transaction.aggregate([
      { $match: { type: 'deposit', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalWithdrawals = await Transaction.aggregate([
      { $match: { type: 'withdrawal', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Pending requests
    const pendingWithdrawals = await WithdrawalRequest.countDocuments({ status: 'pending' });
    const pendingPosts = await Post.countDocuments({ isApproved: false });

    // Recent activities
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');

    const recentTournaments = await Tournament.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title gameName status createdAt');

    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name')
      .select('type amount status createdAt');

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
          newThisWeek: newUsersThisWeek,
          active: activeUsers
        },
        tournaments: {
          total: totalTournaments,
          upcoming: upcomingTournaments,
          ongoing: ongoingTournaments,
          completed: completedTournaments
        },
        financial: {
          totalDeposits: totalDeposits[0]?.total || 0,
          totalWithdrawals: totalWithdrawals[0]?.total || 0
        },
        pending: {
          withdrawals: pendingWithdrawals,
          posts: pendingPosts
        },
        recent: {
          users: recentUsers,
          tournaments: recentTournaments,
          transactions: recentTransactions
        }
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
});

// ==================== USER MANAGEMENT ====================

// Get all users with pagination and filters
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, role, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { uid: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;
    else if (status === 'banned') query.isBanned = true;
    
    // Role filter
    if (role) query.role = role;
    
    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Get user by ID
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('registeredTournaments', 'title gameName status');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user statistics
    const userStats = await TournamentRegistration.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalMatches: { $sum: 1 },
          totalWins: { $sum: { $cond: [{ $eq: ['$isWinner', true] }, 1, 0] } },
          totalKills: { $sum: '$kills' },
          totalPrize: { $sum: '$prizeEarned' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        user,
        stats: userStats[0] || {
          totalMatches: 0,
          totalWins: 0,
          totalKills: 0,
          totalPrize: 0
        }
      }
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

// Update user
router.put('/users/:userId', validateBody(['name', 'email']), async (req, res) => {
  try {
    const { name, email, phoneNumber, role, isActive, isBanned, banReason, balance } = req.body;
    
    console.log('Received update data:', req.body);
    console.log('Balance value:', balance, 'Type:', typeof balance);
    
    // Get current user data for comparison
    const currentUser = await User.findById(req.params.userId);
    console.log('Current user balance:', currentUser?.balance);
    
    const updateData = { name, email: email.toLowerCase() };
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isBanned !== undefined) updateData.isBanned = isBanned;
    if (banReason !== undefined) updateData.banReason = banReason;
    if (balance !== undefined) updateData.balance = parseFloat(balance);
    
    console.log('Final update data:', updateData);

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
    
    console.log('Updated user data:', user.toObject());
    console.log('User balance after update:', user.balance);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Clean up related data
    await TournamentRegistration.deleteMany({ user: req.params.userId });
    await Post.deleteMany({ userId: req.params.userId });
    await Transaction.deleteMany({ userId: req.params.userId });
    await WithdrawalRequest.deleteMany({ userId: req.params.userId });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// ==================== GAME MANAGEMENT ====================

// Get all games
router.get('/games', async (req, res) => {
  try {
    const games = await Game.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

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

// Create new game
router.post('/games', validateBody(['name', 'image']), async (req, res) => {
  try {
    const { name, image, description } = req.body;
    
    // Check if game already exists
    const existingGame = await Game.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingGame) {
      return res.status(400).json({
        success: false,
        message: 'Game with this name already exists'
      });
    }

    const game = new Game({
      name,
      image,
      description,
      createdBy: req.user.userId
    });

    await game.save();

    res.status(201).json({
      success: true,
      message: 'Game created successfully',
      data: { game }
    });

  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating game',
      error: error.message
    });
  }
});

// Update game
router.put('/games/:gameId', validateBody(['name', 'image']), async (req, res) => {
  try {
    const { name, image, description, isActive } = req.body;
    
    const updateData = { name, image };
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const game = await Game.findByIdAndUpdate(
      req.params.gameId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.json({
      success: true,
      message: 'Game updated successfully',
      data: { game }
    });

  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating game',
      error: error.message
    });
  }
});

// Delete game
router.delete('/games/:gameId', async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Update tournaments to remove game reference
    await Tournament.updateMany(
      { game: req.params.gameId },
      { $unset: { game: 1 } }
    );

    res.json({
      success: true,
      message: 'Game deleted successfully'
    });

  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting game',
      error: error.message
    });
  }
});

// ==================== TOURNAMENT MANAGEMENT ====================

// Get all tournaments with filters
router.get('/tournaments', async (req, res) => {
  try {
    const { page = 1, limit = 20, game, status, type, search } = req.query;
    
    const query = {};
    
    if (game) query.gameName = { $regex: game, $options: 'i' };
    if (status) query.status = status;
    if (type) query.type = type;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tournamentId: { $regex: search, $options: 'i' } },
        { t_id: { $regex: search, $options: 'i' } }
      ];
    }
    
    const tournaments = await Tournament.find(query)
      .populate('game', 'name image')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Tournament.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        tournaments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
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

// Create new tournament
router.post('/tournaments', validateBody([
  'title', 'game', 'gameName', 'image', 'map', 'mode', 'type', 
  'entryFee', 'perKill', 'winningPrize', 'totalSlots', 'dateTime', 
  't_id', 't_password'
]), async (req, res) => {
  try {
    const {
      title, game, gameName, image, map, mode, type, entryFee, perKill,
      winningPrize, totalSlots, dateTime, t_id, t_password, description, rules
    } = req.body;

    // Generate unique tournament ID
    const tournamentId = `T_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const tournament = new Tournament({
      tournamentId,
      title,
      game,
      gameName,
      image,
      map,
      mode,
      type,
      entryFee: parseFloat(entryFee),
      perKill: parseFloat(perKill),
      winningPrize: parseFloat(winningPrize),
      totalSlots: parseInt(totalSlots),
      dateTime: new Date(dateTime),
      t_id,
      t_password,
      description,
      rules: rules || [],
      createdBy: req.user.userId
    });

    await tournament.save();

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      data: { tournament }
    });

  } catch (error) {
    console.error('Create tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating tournament',
      error: error.message
    });
  }
});

// Update tournament
router.put('/tournaments/:tournamentId', async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Convert numeric fields
    if (updateData.entryFee) updateData.entryFee = parseFloat(updateData.entryFee);
    if (updateData.perKill) updateData.perKill = parseFloat(updateData.perKill);
    if (updateData.winningPrize) updateData.winningPrize = parseFloat(updateData.winningPrize);
    if (updateData.totalSlots) updateData.totalSlots = parseInt(updateData.totalSlots);
    if (updateData.dateTime) updateData.dateTime = new Date(updateData.dateTime);

    const tournament = await Tournament.findByIdAndUpdate(
      req.params.tournamentId,
      updateData,
      { new: true, runValidators: true }
    ).populate('game', 'name image');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      message: 'Tournament updated successfully',
      data: { tournament }
    });

  } catch (error) {
    console.error('Update tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tournament',
      error: error.message
    });
  }
});

// Delete tournament
router.delete('/tournaments/:tournamentId', async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndDelete(req.params.tournamentId);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Clean up related data
    await TournamentRegistration.deleteMany({ tournament: req.params.tournamentId });
    await Transaction.deleteMany({ tournamentId: req.params.tournamentId });

    res.json({
      success: true,
      message: 'Tournament deleted successfully'
    });

  } catch (error) {
    console.error('Delete tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting tournament',
      error: error.message
    });
  }
});

// ==================== TOURNAMENT REGISTRATIONS ====================

// Get tournament registrations
router.get('/tournaments/:tournamentId/registrations', async (req, res) => {
  try {
    const registrations = await TournamentRegistration.find({
      tournament: req.params.tournamentId
    })
      .populate('user', 'name email profilePicture')
      .populate('tournament', 'title gameName')
      .sort({ registeredAt: 1 });

    res.json({
      success: true,
      data: { registrations }
    });

  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registrations',
      error: error.message
    });
  }
});

// Update tournament results (individual)
router.put('/tournaments/:tournamentId/results/:userId', async (req, res) => {
  try {
    const { kills, position, screenshotProof } = req.body;
    
    const registration = await TournamentRegistration.findOne({
      tournament: req.params.tournamentId,
      user: req.params.userId
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    await registration.updateResults(kills, position, screenshotProof);

    // Update user stats
    const user = await User.findById(req.params.userId);
    if (user) {
      await user.updateMatchResults(kills, position <= 3);
    }

    res.json({
      success: true,
      message: 'Results updated successfully',
      data: { registration }
    });

  } catch (error) {
    console.error('Update results error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating results',
      error: error.message
    });
  }
});

// Bulk update tournament results via CSV
router.post('/tournaments/:tournamentId/bulk-results', multer().single('csv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    const results = [];
    const filePath = req.file.path;

    // Parse CSV file
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', async () => {
        try {
          let updatedCount = 0;
          let errors = [];

          for (const row of results) {
            try {
              const { email, kills, position, screenshotProof } = row;
              
              // Find user by email
              const user = await User.findOne({ email: email.toLowerCase() });
              if (!user) {
                errors.push(`User not found: ${email}`);
                continue;
              }

              // Find registration
              const registration = await TournamentRegistration.findOne({
                tournament: req.params.tournamentId,
                user: user._id
              });

              if (!registration) {
                errors.push(`Registration not found for: ${email}`);
                continue;
              }

              // Update results
              await registration.updateResults(
                parseInt(kills) || 0,
                parseInt(position) || 0,
                screenshotProof
              );

              // Update user stats
              await user.updateMatchResults(
                parseInt(kills) || 0,
                parseInt(position) <= 3
              );

              updatedCount++;
            } catch (error) {
              errors.push(`Error processing ${row.email}: ${error.message}`);
            }
          }

          // Clean up file
          fs.unlinkSync(filePath);

          res.json({
            success: true,
            message: `Bulk update completed. ${updatedCount} results updated.`,
            data: {
              updatedCount,
              errors: errors.length > 0 ? errors : null
            }
          });

        } catch (error) {
          // Clean up file
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          
          throw error;
        }
      });

  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing bulk update',
      error: error.message
    });
  }
});

// ==================== WITHDRAWAL REQUESTS ====================

// Get all withdrawal requests
router.get('/withdrawals', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    const withdrawals = await WithdrawalRequest.find(query)
      .populate('userId', 'name email profilePicture balance')
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await WithdrawalRequest.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        withdrawals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching withdrawal requests',
      error: error.message
    });
  }
});

// Approve withdrawal request
router.put('/withdrawals/:withdrawalId/approve', async (req, res) => {
  try {
    const { notes } = req.body;
    
    const withdrawal = await WithdrawalRequest.findById(req.params.withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal request is not pending'
      });
    }

    await withdrawal.approve(req.user.userId, notes);

    res.json({
      success: true,
      message: 'Withdrawal request approved',
      data: { withdrawal }
    });

  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving withdrawal',
      error: error.message
    });
  }
});

// Reject withdrawal request
router.put('/withdrawals/:withdrawalId/reject', validateBody(['reason']), async (req, res) => {
  try {
    const { reason, notes } = req.body;
    
    const withdrawal = await WithdrawalRequest.findById(req.params.withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal request is not pending'
      });
    }

    await withdrawal.reject(req.user.userId, reason, notes);

    res.json({
      success: true,
      message: 'Withdrawal request rejected',
      data: { withdrawal }
    });

  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting withdrawal',
      error: error.message
    });
  }
});

// Mark withdrawal as processed
router.put('/withdrawals/:withdrawalId/process', validateBody(['paymentReference']), async (req, res) => {
  try {
    const { paymentReference, notes } = req.body;
    
    const withdrawal = await WithdrawalRequest.findById(req.params.withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawal.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal request must be approved first'
      });
    }

    await withdrawal.markProcessed(req.user.userId, paymentReference, notes);

    // Create transaction record
    const transaction = new Transaction({
      userId: withdrawal.userId,
      userName: withdrawal.userName,
      type: 'withdrawal',
      amount: withdrawal.amount,
      status: 'completed',
      description: `Withdrawal processed - ${paymentReference}`,
      paymentMethod: 'manual',
      transactionId: Transaction.generateTransactionId(),
      externalTransactionId: paymentReference,
      processedBy: req.user.userId,
      processedAt: new Date()
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Withdrawal marked as processed',
      data: { withdrawal, transaction }
    });

  } catch (error) {
    console.error('Process withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing withdrawal',
      error: error.message
    });
  }
});

// ==================== CONTENT MODERATION ====================

// Get pending posts for approval
router.get('/posts/pending', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const posts = await Post.find({ isApproved: false })
      .populate('userId', 'name email profilePicture')
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Post.countDocuments({ isApproved: false });
    
    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get pending posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending posts',
      error: error.message
    });
  }
});

// Approve post
router.put('/posts/:postId/approve', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { isApproved: true },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      message: 'Post approved successfully',
      data: { post }
    });

  } catch (error) {
    console.error('Approve post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving post',
      error: error.message
    });
  }
});

// Reject post
router.put('/posts/:postId/reject', validateBody(['reason']), async (req, res) => {
  try {
    const { reason } = req.body;
    
    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { 
        isApproved: false,
        isReported: true,
        reportReasons: [{
          reason,
          reportedBy: req.user.userId
        }]
      },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      message: 'Post rejected successfully',
      data: { post }
    });

  } catch (error) {
    console.error('Reject post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting post',
      error: error.message
    });
  }
});

// Delete post
router.delete('/posts/:postId', async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: error.message
    });
  }
});

// ==================== ADMIN CRUD OPERATIONS ====================

// Create new user (admin)
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role, balance, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      balance: balance || 0,
      phoneNumber
    });

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: userResponse }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// Update user (admin)
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Don't allow updating password through this route
    delete updates.password;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
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
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// Delete user (admin)
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// Create new tournament (admin)
router.post('/tournaments', async (req, res) => {
  try {
    const {
      title,
      game,
      type,
      entryFee,
      totalSlots,
      dateTime,
      description,
      rules
    } = req.body;

    // Get game details
    const gameDoc = await Game.findById(game);
    if (!gameDoc) {
      return res.status(400).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Generate unique tournament ID
    const tournamentId = `T${Date.now()}`;
    const t_id = `TID${Date.now()}`;
    const t_password = Math.random().toString(36).substring(2, 8).toUpperCase();

    const tournament = new Tournament({
      tournamentId,
      title,
      game,
      gameName: gameDoc.name,
      image: gameDoc.image,
      map: 'Default',
      mode: 'Squad',
      type,
      entryFee: type === 'free' ? 0 : entryFee,
      perKill: 0,
      winningPrize: entryFee * totalSlots * 0.8, // 80% of total entry fees
      totalSlots,
      registeredSlots: 0,
      dateTime: new Date(dateTime),
      t_id,
      t_password,
      status: 'upcoming',
      description,
      rules: rules || [],
      createdBy: req.user.userId,
      isActive: true
    });

    await tournament.save();

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      data: { tournament }
    });
  } catch (error) {
    console.error('Create tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating tournament',
      error: error.message
    });
  }
});

// Update tournament (admin)
router.put('/tournaments/:tournamentId', async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const updates = req.body;

    const tournament = await Tournament.findByIdAndUpdate(
      tournamentId,
      updates,
      { new: true, runValidators: true }
    );

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      message: 'Tournament updated successfully',
      data: { tournament }
    });
  } catch (error) {
    console.error('Update tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tournament',
      error: error.message
    });
  }
});

// Delete tournament (admin)
router.delete('/tournaments/:tournamentId', async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await Tournament.findByIdAndDelete(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      message: 'Tournament deleted successfully'
    });
  } catch (error) {
    console.error('Delete tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting tournament',
      error: error.message
    });
  }
});

// Get all transactions (admin)
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: { transactions }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
});

// Update transaction (admin)
router.put('/transactions/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const updates = req.body;

    const transaction = await Transaction.findByIdAndUpdate(
      transactionId,
      updates,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating transaction',
      error: error.message
    });
  }
});

// Delete transaction (admin)
router.delete('/transactions/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findByIdAndDelete(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting transaction',
      error: error.message
    });
  }
});

// Create new game (admin)
router.post('/games', async (req, res) => {
  try {
    const { name, image, description } = req.body;

    // Check if game already exists
    const existingGame = await Game.findOne({ name });
    if (existingGame) {
      return res.status(400).json({
        success: false,
        message: 'Game with this name already exists'
      });
    }

    const game = new Game({
      name,
      image,
      description,
      createdBy: req.user.userId
    });

    await game.save();

    res.status(201).json({
      success: true,
      message: 'Game created successfully',
      data: { game }
    });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating game',
      error: error.message
    });
  }
});

// Update game (admin)
router.put('/games/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const updates = req.body;

    const game = await Game.findByIdAndUpdate(
      gameId,
      updates,
      { new: true, runValidators: true }
    );

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.json({
      success: true,
      message: 'Game updated successfully',
      data: { game }
    });
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating game',
      error: error.message
    });
  }
});

// Delete game (admin)
router.delete('/games/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;

    // Check if game has tournaments
    const tournamentCount = await Tournament.countDocuments({ game: gameId });
    if (tournamentCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete game with existing tournaments'
      });
    }

    const game = await Game.findByIdAndDelete(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.json({
      success: true,
      message: 'Game deleted successfully'
    });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting game',
      error: error.message
    });
  }
});

// Delete post (admin)
router.delete('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findByIdAndDelete(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: error.message
    });
  }
});

// Get all tournament registrations
router.get('/registrations', async (req, res) => {
  try {
    const registrations = await TournamentRegistration.find()
      .populate('tournament', 'title gameName')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    const formattedRegistrations = registrations.map(reg => ({
      _id: reg._id,
      userName: reg.userName,
      tournamentTitle: reg.tournament?.title || 'Unknown Tournament',
      gameId: reg.gameId,
      entryFee: reg.entryFee,
      kills: reg.kills || 0,
      moneyEarned: reg.moneyEarned || 0,
      status: reg.status,
      paymentStatus: reg.paymentStatus,
      createdAt: reg.createdAt
    }));

    res.json({
      success: true,
      data: {
        registrations: formattedRegistrations
      }
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registrations'
    });
  }
});

// Update registration status
router.put('/registrations/:registrationId/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const registration = await TournamentRegistration.findByIdAndUpdate(
      req.params.registrationId,
      { status },
      { new: true, runValidators: true }
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.json({
      success: true,
      message: 'Registration status updated successfully',
      data: { registration }
    });

  } catch (error) {
    console.error('Update registration status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating registration status',
      error: error.message
    });
  }
});

// Update registration kills and money earned
router.put('/registrations/:registrationId', async (req, res) => {
  try {
    const { kills, moneyEarned } = req.body;
    
    const registration = await TournamentRegistration.findByIdAndUpdate(
      req.params.registrationId,
      { kills, moneyEarned },
      { new: true, runValidators: true }
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.json({
      success: true,
      message: 'Registration updated successfully',
      data: { registration }
    });

  } catch (error) {
    console.error('Update registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating registration',
      error: error.message
    });
  }
});

module.exports = router;
