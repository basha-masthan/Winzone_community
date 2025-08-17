const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 100 // Minimum withdrawal amount
  },
  bankDetails: {
    accountNumber: {
      type: String,
      required: true,
      trim: true
    },
    ifscCode: {
      type: String,
      required: true,
      trim: true
    },
    accountHolderName: {
      type: String,
      required: true,
      trim: true
    },
    bankName: {
      type: String,
      required: true,
      trim: true
    }
  },
  upiId: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected', 'processed'],
    default: 'pending'
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
  rejectionReason: {
    type: String,
    default: null
  },
  paymentReference: {
    type: String,
    default: null
  },
  screenshotProof: {
    type: String,
    default: null
  },
  requestReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
withdrawalRequestSchema.index({ userId: 1, createdAt: -1 });
withdrawalRequestSchema.index({ status: 1, createdAt: -1 });
withdrawalRequestSchema.index({ processedBy: 1 });
withdrawalRequestSchema.index({ amount: 1 });

// Method to approve withdrawal
withdrawalRequestSchema.methods.approve = function(adminUserId, notes = null) {
  this.status = 'approved';
  this.processedBy = adminUserId;
  this.processedAt = new Date();
  if (notes) {
    this.adminNotes = notes;
  }
  return this.save();
};

// Method to reject withdrawal
withdrawalRequestSchema.methods.reject = function(adminUserId, reason, notes = null) {
  this.status = 'rejected';
  this.processedBy = adminUserId;
  this.processedAt = new Date();
  this.rejectionReason = reason;
  if (notes) {
    this.adminNotes = notes;
  }
  return this.save();
};

// Method to mark as processed
withdrawalRequestSchema.methods.markProcessed = function(adminUserId, paymentReference, notes = null) {
  this.status = 'processed';
  this.processedBy = adminUserId;
  this.processedAt = new Date();
  this.paymentReference = paymentReference;
  if (notes) {
    this.adminNotes = notes;
  }
  return this.save();
};

// Static method to get user withdrawal requests
withdrawalRequestSchema.statics.getUserWithdrawals = function(userId, limit = 20) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('processedBy', 'name');
};

// Static method to get withdrawal requests by status
withdrawalRequestSchema.statics.getWithdrawalsByStatus = function(status, limit = 50) {
  return this.find({ status })
    .populate('userId', 'name email profilePicture')
    .populate('processedBy', 'name')
    .sort({ createdAt: 1 })
    .limit(limit);
};

// Static method to get pending withdrawal requests
withdrawalRequestSchema.statics.getPendingWithdrawals = function(limit = 50) {
  return this.find({ status: 'pending' })
    .populate('userId', 'name email profilePicture balance')
    .sort({ createdAt: 1 })
    .limit(limit);
};

// Static method to get withdrawal statistics
withdrawalRequestSchema.statics.getWithdrawalStats = function(startDate = null, endDate = null) {
  const match = {};
  
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
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
};

// Static method to get total withdrawal amount by user
withdrawalRequestSchema.statics.getTotalWithdrawalByUser = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Pre-save middleware to validate amount
withdrawalRequestSchema.pre('save', function(next) {
  if (this.amount < 100) {
    return next(new Error('Minimum withdrawal amount is ₹100'));
  }
  next();
});

// Pre-save middleware to validate bank details or UPI
withdrawalRequestSchema.pre('save', function(next) {
  if (!this.bankDetails.accountNumber && !this.upiId) {
    return next(new Error('Either bank details or UPI ID is required'));
  }
  next();
});

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
