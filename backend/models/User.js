const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  moneyWon: {
    type: Number,
    default: 0,
    min: 0
  },
  depositedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  gameIds: {
    type: Map,
    of: String,
    default: {}
  },
  registeredTournaments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  }],
  matchesPlayed: {
    type: Number,
    default: 0,
    min: 0
  },
  wins: {
    type: Number,
    default: 0,
    min: 0
  },
  totalKills: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for ranking score
userSchema.virtual('rankingScore').get(function() {
  return (this.wins * 10) + this.totalKills + (this.matchesPlayed * 2);
});

// Virtual for win rate
userSchema.virtual('winRate').get(function() {
  return this.matchesPlayed > 0 ? ((this.wins / this.matchesPlayed) * 100).toFixed(1) : 0;
});

// Index for better query performance
userSchema.index({ rankingScore: -1 });
userSchema.index({ email: 1 });
userSchema.index({ isActive: 1, isBanned: 1 });

// Method to update last active
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Method to add balance
userSchema.methods.addBalance = function(amount) {
  this.balance += amount;
  this.depositedAmount += amount;
  return this.save();
};

// Method to deduct balance
userSchema.methods.deductBalance = function(amount) {
  if (this.balance >= amount) {
    this.balance -= amount;
    return this.save();
  }
  throw new Error('Insufficient balance');
};

// Method to add tournament registration
userSchema.methods.registerForTournament = function(tournamentId) {
  if (!this.registeredTournaments.includes(tournamentId)) {
    this.registeredTournaments.push(tournamentId);
    this.matchesPlayed += 1;
    return this.save();
  }
  throw new Error('Already registered for this tournament');
};

// Method to update match results
userSchema.methods.updateMatchResults = function(kills, isWinner) {
  this.totalKills += kills;
  if (isWinner) {
    this.wins += 1;
  }
  return this.save();
};

// Static method to get leaderboard
userSchema.statics.getLeaderboard = function(limit = 50) {
  return this.find({ isActive: true, isBanned: false })
    .sort({ rankingScore: -1 })
    .limit(limit)
    .select('name profilePicture wins totalKills matchesPlayed rankingScore');
};

// Static method to search users
userSchema.statics.searchUsers = function(query, limit = 20) {
  return this.find({
    $and: [
      { isActive: true, isBanned: false },
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      }
    ]
  })
    .limit(limit)
    .select('name email profilePicture balance matchesPlayed wins totalKills');
};

module.exports = mongoose.model('User', userSchema);
