const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');
const Game = require('../models/Game');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// MongoDB connection - using the same connection string as the main server
const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://basha:king@freefire.lrfkfsu.mongodb.net/Flutter-winzone?retryWrites=true&w=majority&appName=FreeFire';

async function addSampleTournaments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a default admin user if it doesn't exist
    let adminUser = await User.findOne({ email: 'admin@winzone.com' });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = new User({
        name: 'Admin User',
        email: 'admin@winzone.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      await adminUser.save();
      console.log('Created admin user');
    }

    // First, let's create some sample games if they don't exist
    const games = [
      { name: 'Free Fire', image: 'https://example.com/freefire.jpg' },
      { name: 'PUBG Mobile', image: 'https://example.com/pubg.jpg' },
      { name: 'Call of Duty Mobile', image: 'https://example.com/codm.jpg' },
      { name: 'BGMI', image: 'https://example.com/bgmi.jpg' }
    ];

    const gameIds = {};
    for (const gameData of games) {
      let game = await Game.findOne({ name: gameData.name });
      if (!game) {
        game = new Game({
          ...gameData,
          createdBy: adminUser._id
        });
        await game.save();
        console.log(`Created game: ${gameData.name}`);
      }
      gameIds[gameData.name] = game._id;
    }

    // Sample tournaments
    const sampleTournaments = [
      {
        tournamentId: 'FF001',
        title: 'Free Fire Pro League',
        game: gameIds['Free Fire'],
        gameName: 'Free Fire',
        image: 'https://example.com/ff-tournament.jpg',
        map: 'Bermuda',
        mode: 'Squad',
        type: 'paid',
        entryFee: 100,
        perKill: 10,
        winningPrize: 5000,
        totalSlots: 100,
        registeredSlots: 25,
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        t_id: 'FF001',
        t_password: 'ff123',
        status: 'upcoming',
        description: 'Join the ultimate Free Fire tournament!',
        rules: [
          'No teaming allowed',
          'Fair play only',
          'Must have valid game ID'
        ],
        isActive: true
      },
      {
        tournamentId: 'FF002',
        title: 'Free Fire Weekend Battle',
        game: gameIds['Free Fire'],
        gameName: 'Free Fire',
        image: 'https://example.com/ff-weekend.jpg',
        map: 'Purgatory',
        mode: 'Duo',
        type: 'free',
        entryFee: 0,
        perKill: 5,
        winningPrize: 1000,
        totalSlots: 50,
        registeredSlots: 15,
        dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        t_id: 'FF002',
        t_password: 'ff456',
        status: 'upcoming',
        description: 'Free weekend tournament for all players!',
        rules: [
          'Open to all players',
          'No entry fee',
          'Fair play required'
        ],
        isActive: true
      },
      {
        tournamentId: 'PUBG001',
        title: 'PUBG Mobile Championship',
        game: gameIds['PUBG Mobile'],
        gameName: 'PUBG Mobile',
        image: 'https://example.com/pubg-tournament.jpg',
        map: 'Erangel',
        mode: 'Squad',
        type: 'paid',
        entryFee: 200,
        perKill: 15,
        winningPrize: 8000,
        totalSlots: 80,
        registeredSlots: 30,
        dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        t_id: 'PUBG001',
        t_password: 'pubg123',
        status: 'upcoming',
        description: 'The biggest PUBG Mobile tournament!',
        rules: [
          'Professional rules apply',
          'No cheating',
          'Must be level 40+'
        ],
        isActive: true
      }
    ];

    // Clear existing tournaments
    await Tournament.deleteMany({});
    console.log('Cleared existing tournaments');

    // Add new tournaments
    for (const tournamentData of sampleTournaments) {
      const tournament = new Tournament({
        ...tournamentData,
        createdBy: adminUser._id
      });
      await tournament.save();
      console.log(`Created tournament: ${tournamentData.title}`);
    }

    console.log('Sample tournaments added successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error adding sample tournaments:', error);
    process.exit(1);
  }
}

addSampleTournaments();
