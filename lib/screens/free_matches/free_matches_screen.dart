import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:winzone_arena/services/api_service.dart';
import 'package:winzone_arena/models/tournament_model.dart';
import 'package:winzone_arena/widgets/tournament_card.dart';
import 'package:winzone_arena/utils/theme.dart';

class FreeMatchesScreen extends StatefulWidget {
  const FreeMatchesScreen({super.key});

  @override
  State<FreeMatchesScreen> createState() => _FreeMatchesScreenState();
}

class _FreeMatchesScreenState extends State<FreeMatchesScreen> {
  String? _selectedGame;
  List<TournamentModel> _freeMatches = [];
  bool _isLoading = false;

  final List<String> _games = [
    'Free Fire',
    'PUBG Mobile',
    'BGMI',
    'Call of Duty Mobile',
    'Chess',
    'Clash Royale',
    'Clash of Clans',
    'Minecraft',
    'Roblox',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    _loadFreeMatches();
  }

  Future<void> _loadFreeMatches() async {
    setState(() => _isLoading = true);
    
    try {
      final apiService = ApiService();
      final freeMatches = await apiService.getTournaments(
        game: _selectedGame,
        type: 'free',
      );
      
      setState(() {
        _freeMatches = freeMatches;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading free matches: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  void _onGameChanged(String? game) {
    setState(() => _selectedGame = game);
    _loadFreeMatches();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Free Matches'),
        backgroundColor: AppTheme.surfaceColor,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () {
              _showInfoDialog();
            },
            tooltip: 'About Free Matches',
          ),
        ],
      ),
      body: Column(
        children: [
          // Game Selection Section
          Container(
            padding: const EdgeInsets.all(16),
            color: AppTheme.surfaceColor,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.sports_esports,
                      color: AppTheme.neonGreen,
                      size: 24,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Select Game',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppTheme.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Practice and improve your skills with free matches!',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 40,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _games.length,
                    itemBuilder: (context, index) {
                      final game = _games[index];
                      final isSelected = _selectedGame == game;
                      
                      return Container(
                        margin: const EdgeInsets.only(right: 12),
                        child: FilterChip(
                          label: Text(game),
                          selected: isSelected,
                          onSelected: (selected) {
                            _onGameChanged(selected ? game : null);
                          },
                          selectedColor: AppTheme.neonGreen,
                          checkmarkColor: AppTheme.textPrimary,
                          labelStyle: TextStyle(
                            color: isSelected ? AppTheme.textPrimary : AppTheme.textSecondary,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          
          // Free Matches List
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(AppTheme.neonGreen),
                    ),
                  )
                : _freeMatches.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _loadFreeMatches,
                        color: AppTheme.neonGreen,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _freeMatches.length,
                          itemBuilder: (context, index) {
                            final tournament = _freeMatches[index];
                            return TournamentCard(
                              tournament: tournament,
                              onTap: (tournament) => _showTournamentDetails(tournament),
                              onRegister: () => _registerForTournament(tournament),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.sports_esports_outlined,
            size: 80,
            color: AppTheme.textSecondary.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'No Free Matches Found',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Try selecting a different game or check back later',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppTheme.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _loadFreeMatches,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.neonGreen,
              foregroundColor: AppTheme.textPrimary,
            ),
            child: const Text('Refresh'),
          ),
        ],
      ),
    );
  }

  void _showMatchDetails(TournamentModel match) {
    // Navigate to match details screen
    // This will be implemented later
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Free Match: ${match.title}'),
        backgroundColor: AppTheme.neonGreen,
      ),
    );
  }

  void _showTournamentDetails(TournamentModel tournament) {
    // Navigate to tournament details screen
    // This will be implemented later
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Tournament: ${tournament.title}'),
        backgroundColor: AppTheme.neonGreen,
      ),
    );
  }

  void _registerForTournament(TournamentModel tournament) {
    // Implement tournament registration logic
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Registering for: ${tournament.title}'),
        backgroundColor: AppTheme.neonGreen,
      ),
    );
  }

  void _showInfoDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(
              Icons.sports_esports,
              color: AppTheme.neonGreen,
            ),
            const SizedBox(width: 8),
            const Text('Free Matches'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'What are Free Matches?',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              '• No entry fees required\n'
              '• Practice and improve your skills\n'
              '• Track your performance\n'
              '• Earn ranking points\n'
              '• Compete with other players',
            ),
            const SizedBox(height: 16),
            Text(
              'Benefits:',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              '• Skill development\n'
              '• Community building\n'
              '• Performance tracking\n'
              '• Tournament preparation',
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Got it!'),
          ),
        ],
      ),
    );
  }
}
