const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { authenticateToken, requireOwnershipOrAdmin, validateBody } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get user transactions
router.get('/user/:userId', requireOwnershipOrAdmin('userId'), async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.params.userId;

    const transactions = await Transaction.getUserTransactions(userId, parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      data: { transactions }
    });

  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
});

// Get transactions by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { status, limit = 50 } = req.query;

    const transactions = await Transaction.getTransactionsByType(type, status, parseInt(limit));
    
    res.json({
      success: true,
      data: { transactions }
    });

  } catch (error) {
    console.error('Get transactions by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
});

// Get pending transactions
router.get('/pending', async (req, res) => {
  try {
    const { type, limit = 50 } = req.query;

    const transactions = await Transaction.getPendingTransactions(type);
    
    res.json({
      success: true,
      data: { transactions }
    });

  } catch (error) {
    console.error('Get pending transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending transactions',
      error: error.message
    });
  }
});

// Create transaction
router.post('/', validateBody(['type', 'amount', 'description']), async (req, res) => {
  try {
    const {
      type, amount, description, tournamentId, paymentMethod,
      externalTransactionId, gatewayResponse
    } = req.body;
    const userId = req.user.userId;

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const transaction = new Transaction({
      userId,
      userName: user.name,
      type,
      amount: parseFloat(amount),
      description,
      tournamentId,
      paymentMethod: paymentMethod || 'system',
      transactionId: Transaction.generateTransactionId(),
      externalTransactionId,
      gatewayResponse
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction }
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating transaction',
      error: error.message
    });
  }
});

// Update transaction status
router.patch('/:transactionId/status', validateBody(['status']), async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const transactionId = req.params.transactionId;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update status based on new status
    switch (status) {
      case 'completed':
        await transaction.markCompleted(req.user.userId);
        break;
      case 'failed':
        await transaction.markFailed(adminNotes || 'Transaction failed');
        break;
      case 'cancelled':
        await transaction.markCancelled(adminNotes || 'Transaction cancelled');
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
    }

    res.json({
      success: true,
      message: 'Transaction status updated successfully',
      data: { transaction }
    });

  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating transaction status',
      error: error.message
    });
  }
});

// Get transaction statistics
router.get('/stats/user/:userId', requireOwnershipOrAdmin('userId'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.params.userId;

    const stats = await Transaction.getTransactionStats(userId, startDate, endDate);
    
    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction statistics',
      error: error.message
    });
  }
});

// Get transaction by ID
router.get('/:transactionId', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId)
      .populate('userId', 'name email')
      .populate('tournament', 'title gameName');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: { transaction }
    });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction',
      error: error.message
    });
  }
});

// Delete transaction (admin only)
router.delete('/:transactionId', async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const transaction = await Transaction.findByIdAndDelete(req.params.transactionId);
    
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

module.exports = router;
