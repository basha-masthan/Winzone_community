const mongoose = require('mongoose');

const tournamentRegistrationSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  gameId: {
    type: String,
    required: true,
    trim: true
  },
  entryFee: {
    type: Number,
    required: true,
    default: 0
  },
  winningPrize: {
    type: Number,
    required: true,
    default: 0
  },
  perKill: {
    type: Number,
    required: true,
    default: 0
  },
  mode: {
    type: String,
    required: true,
    default: 'Squad'
  },
  startTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  adminNote: {
    type: String,
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['wallet', 'razorpay', 'free'],
    default: 'free'
  },
  transactionId: {
    type: String
  },
  kills: {
    type: Number,
    default: 0,
    min: 0
  },
  moneyEarned: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
tournamentRegistrationSchema.index({ tournament: 1, user: 1 }, { unique: true });
tournamentRegistrationSchema.index({ status: 1 });
tournamentRegistrationSchema.index({ createdAt: -1 });
tournamentRegistrationSchema.index({ user: 1, status: 1 });

// Virtual for checking if registration is active
tournamentRegistrationSchema.virtual('isActive').get(function() {
  return this.status === 'confirmed' && this.paymentStatus === 'completed';
});

// Pre-save middleware to update user's registered tournaments
tournamentRegistrationSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const User = mongoose.model('User');
      await User.findByIdAndUpdate(
        this.user,
        { $addToSet: { registeredTournaments: this.tournament } }
      );
    } catch (error) {
      console.error('Error updating user registered tournaments:', error);
    }
  }
  next();
});

// Pre-remove middleware to remove from user's registered tournaments
tournamentRegistrationSchema.pre('remove', async function(next) {
  try {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(
      this.user,
      { $pull: { registeredTournaments: this.tournament } }
    );
  } catch (error) {
    console.error('Error removing from user registered tournaments:', error);
  }
  next();
});

module.exports = mongoose.model('TournamentRegistration', tournamentRegistrationSchema);
