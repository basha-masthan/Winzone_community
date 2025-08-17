const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalTournaments: {
    type: Number,
    default: 0
  },
  totalPlayers: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
gameSchema.index({ name: 1 });
gameSchema.index({ isActive: 1 });

// Method to increment tournament count
gameSchema.methods.incrementTournamentCount = function() {
  this.totalTournaments += 1;
  return this.save();
};

// Method to decrement tournament count
gameSchema.methods.decrementTournamentCount = function() {
  if (this.totalTournaments > 0) {
    this.totalTournaments -= 1;
  }
  return this.save();
};

// Method to increment player count
gameSchema.methods.incrementPlayerCount = function() {
  this.totalPlayers += 1;
  return this.save();
};

// Method to decrement player count
gameSchema.methods.decrementPlayerCount = function() {
  if (this.totalPlayers > 0) {
    this.totalPlayers -= 1;
  }
  return this.save();
};

// Static method to get active games
gameSchema.statics.getActiveGames = function() {
  return this.find({ isActive: true })
    .sort({ name: 1 })
    .select('name image description totalTournaments totalPlayers');
};

// Static method to search games
gameSchema.statics.searchGames = function(query) {
  return this.find({
    $and: [
      { isActive: true },
      { name: { $regex: query, $options: 'i' } }
    ]
  })
    .sort({ name: 1 })
    .select('name image description totalTournaments totalPlayers');
};

module.exports = mongoose.model('Game', gameSchema);
