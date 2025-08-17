const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['deposit', 'withdrawal', 'entryFee', 'winning', 'refund', 'bonus']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  description: {
    type: String,
    required: true
  },
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    default: null
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['razorpay', 'manual', 'system']
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  externalTransactionId: {
    type: String,
    default: null
  },
  gatewayResponse: {
    type: Object,
    default: null
  },
  adminNotes: {
    type: String,
    default: null
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },
  failureReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ externalTransactionId: 1 });

// Method to mark as completed
transactionSchema.methods.markCompleted = function(adminUserId = null) {
  this.status = 'completed';
  this.processedBy = adminUserId;
  this.processedAt = new Date();
  return this.save();
};

// Method to mark as failed
transactionSchema.methods.markFailed = function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  this.processedAt = new Date();
  return this.save();
};

// Method to mark as cancelled
transactionSchema.methods.markCancelled = function(reason) {
  this.status = 'cancelled';
  this.failureReason = reason;
  this.processedAt = new Date();
  return this.save();
};

// Static method to get user transactions
transactionSchema.statics.getUserTransactions = function(userId, limit = 50, offset = 0) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .populate('tournament', 'title gameName');
};

// Static method to get transactions by type
transactionSchema.statics.getTransactionsByType = function(type, status = null, limit = 50) {
  const query = { type };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('userId', 'name email')
    .populate('tournament', 'title gameName')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get pending transactions
transactionSchema.statics.getPendingTransactions = function(type = null) {
  const query = { status: 'pending' };
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .populate('userId', 'name email')
    .populate('tournament', 'title gameName')
    .sort({ createdAt: 1 });
};

// Static method to get transaction statistics
transactionSchema.statics.getTransactionStats = function(userId = null, startDate = null, endDate = null) {
  const match = {};
  
  if (userId) {
    match.userId = userId;
  }
  
  if (startDate && endDate) {
    match.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        completedAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0]
          }
        },
        pendingAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
          }
        }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
};

// Static method to generate transaction ID
transactionSchema.statics.generateTransactionId = function() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN_${timestamp}_${random}`.toUpperCase();
};

// Pre-save middleware to generate transaction ID if not provided
transactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = mongoose.model('Transaction').generateTransactionId();
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
