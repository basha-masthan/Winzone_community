const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  tournamentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  gameName: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  map: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    required: true,
    enum: ['Solo', 'Duo', 'Squad', 'Custom']
  },
  type: {
    type: String,
    required: true,
    enum: ['paid', 'free'],
    default: 'free'
  },
  entryFee: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  perKill: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  winningPrize: {
    type: Number,
    required: true,
    min: 0
  },
  totalSlots: {
    type: Number,
    required: true,
    min: 1
  },
  registeredSlots: {
    type: Number,
    default: 0,
    min: 0
  },
  dateTime: {
    type: Date,
    required: true
  },
  t_id: {
    type: String,
    required: true,
    unique: true
  },
  t_password: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  description: {
    type: String,
    default: ''
  },
  rules: [{
    type: String,
    trim: true
  }],
  registeredUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  results: {
    type: Map,
    of: {
      kills: { type: Number, default: 0 },
      position: { type: Number, default: 0 },
      prize: { type: Number, default: 0 },
      isWinner: { type: Boolean, default: false }
    },
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for slots left
tournamentSchema.virtual('slotsLeft').get(function() {
  return this.totalSlots - this.registeredSlots;
});

// Virtual for is full
tournamentSchema.virtual('isFull').get(function() {
  return this.registeredSlots >= this.totalSlots;
});

// Virtual for can register
tournamentSchema.virtual('canRegister').get(function() {
  return this.status === 'upcoming' && !this.isFull && this.isActive;
});

// Indexes for better query performance
tournamentSchema.index({ status: 1, dateTime: 1 });
tournamentSchema.index({ game: 1, status: 1 });
tournamentSchema.index({ type: 1, status: 1 });
tournamentSchema.index({ tournamentId: 1 });
tournamentSchema.index({ t_id: 1 });

// Method to register user
tournamentSchema.methods.registerUser = function(userId) {
  if (this.isFull) {
    throw new Error('Tournament is full');
  }
  if (this.status !== 'upcoming') {
    throw new Error('Tournament registration is closed');
  }
  if (this.registeredUsers.includes(userId)) {
    throw new Error('User already registered');
  }
  
  this.registeredUsers.push(userId);
  this.registeredSlots += 1;
  return this.save();
};

// Method to unregister user
tournamentSchema.methods.unregisterUser = function(userId) {
  const userIndex = this.registeredUsers.indexOf(userId);
  if (userIndex === -1) {
    throw new Error('User not registered for this tournament');
  }
  
  this.registeredUsers.splice(userIndex, 1);
  this.registeredSlots -= 1;
  return this.save();
};

// Method to update results
tournamentSchema.methods.updateResults = function(userId, kills, position, prize, isWinner) {
  this.results.set(userId, {
    kills: kills || 0,
    position: position || 0,
    prize: prize || 0,
    isWinner: isWinner || false
  });
  return this.save();
};

// Method to calculate winners
tournamentSchema.methods.calculateWinners = function() {
  const results = Array.from(this.results.entries());
  const sortedResults = results.sort((a, b) => {
    // Sort by kills first, then by position
    if (b[1].kills !== a[1].kills) {
      return b[1].kills - a[1].kills;
    }
    return a[1].position - b[1].position;
  });
  
  // Mark top 3 as winners
  sortedResults.forEach((result, index) => {
    if (index < 3) {
      result[1].isWinner = true;
      this.results.set(result[0], result[1]);
    }
  });
  
  return this.save();
};

// Static method to get active tournaments
tournamentSchema.statics.getActiveTournaments = function() {
  return this.find({ 
    status: { $in: ['upcoming', 'ongoing'] }, 
    isActive: true 
  })
    .populate('game', 'name image')
    .sort({ dateTime: 1 });
};

// Static method to get tournaments by game
tournamentSchema.statics.getTournamentsByGame = function(gameName, status = null) {
  const query = { 
    gameName: gameName, 
    isActive: true 
  };
  
  if (status) {
    query.status = status;
  } else {
    query.status = { $in: ['upcoming', 'ongoing'] };
  }
  
  return this.find(query)
    .populate('game', 'name image')
    .sort({ dateTime: 1 });
};

// Static method to search tournaments
tournamentSchema.statics.searchTournaments = function(query) {
  return this.find({
    $and: [
      { isActive: true, status: { $in: ['upcoming', 'ongoing'] } },
      {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { gameName: { $regex: query, $options: 'i' } },
          { map: { $regex: query, $options: 'i' } }
        ]
      }
    ]
  })
    .populate('game', 'name image')
    .sort({ dateTime: 1 });
};

// Pre-save middleware to update game tournament count
tournamentSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Game = mongoose.model('Game');
      await Game.findByIdAndUpdate(this.game, { $inc: { totalTournaments: 1 } });
    } catch (error) {
      console.error('Error updating game tournament count:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Tournament', tournamentSchema);
