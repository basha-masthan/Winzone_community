import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:winzone_arena/services/api_service.dart';
import 'package:winzone_arena/models/tournament_model.dart';
import 'package:winzone_arena/widgets/tournament_card.dart';
import 'package:winzone_arena/utils/theme.dart';
import 'package:winzone_arena/screens/tournaments/tournament_details_screen.dart';

class TournamentsScreen extends StatefulWidget {
  const TournamentsScreen({super.key});

  @override
  State<TournamentsScreen> createState() => _TournamentsScreenState();
}

class _TournamentsScreenState extends State<TournamentsScreen> {
  String? _selectedGame;
  String? _selectedType;
  List<TournamentModel> _tournaments = [];
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
    _loadTournaments();
  }

  Future<void> _loadTournaments() async {
    setState(() => _isLoading = true);
    
    try {
      final apiService = ApiService();
      print('Loading tournaments with game: $_selectedGame, type: $_selectedType');
      
      final tournaments = await apiService.getTournaments(
        game: _selectedGame,
        type: _selectedType,
      );
      
      print('Received ${tournaments.length} tournaments from API');
      print('Tournaments: ${tournaments.map((t) => t.title).toList()}');
      
      // Additional debugging
      if (tournaments.isNotEmpty) {
        print('First tournament details:');
        print('  ID: ${tournaments.first.id}');
        print('  Title: ${tournaments.first.title}');
        print('  Game: ${tournaments.first.game}');
        print('  Type: ${tournaments.first.type}');
        print('  Entry Fee: ${tournaments.first.entryFee}');
        print('  Prize Pool: ${tournaments.first.prizePool}');
      }
      
      setState(() {
        _tournaments = tournaments;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading tournaments: $e');
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading tournaments: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  void _onGameChanged(String? game) {
    setState(() => _selectedGame = game);
    _loadTournaments();
  }

  void _onTypeChanged(String? type) {
    setState(() => _selectedType = type);
    _loadTournaments();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Tournaments'),
        backgroundColor: AppTheme.surfaceColor,
        elevation: 0,
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
                Text(
                  'Select Game',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppTheme.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 12),
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
                          selectedColor: AppTheme.primaryColor,
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
                
                const SizedBox(height: 16),
                
                // Tournament Type Filter
                Row(
                  children: [
                    Text(
                      'Type: ',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppTheme.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 12),
                    FilterChip(
                      label: const Text('All'),
                      selected: _selectedType == null,
                      onSelected: (selected) => _onTypeChanged(null),
                      selectedColor: AppTheme.primaryColor,
                      checkmarkColor: AppTheme.textPrimary,
                    ),
                    const SizedBox(width: 8),
                    FilterChip(
                      label: const Text('Paid'),
                      selected: _selectedType == 'paid',
                      onSelected: (selected) => _onTypeChanged('paid'),
                      selectedColor: AppTheme.primaryColor,
                      checkmarkColor: AppTheme.textPrimary,
                    ),
                    const SizedBox(width: 8),
                    FilterChip(
                      label: const Text('Free'),
                      selected: _selectedType == 'free',
                      onSelected: (selected) => _onTypeChanged('free'),
                      selectedColor: AppTheme.primaryColor,
                      checkmarkColor: AppTheme.textPrimary,
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // Tournaments List
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
                    ),
                  )
                : _tournaments.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _loadTournaments,
                        color: AppTheme.primaryColor,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _tournaments.length,
                          itemBuilder: (context, index) {
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 16),
                              child: TournamentCard(
                                tournament: _tournaments[index],
                                onTap: (tournament) => _showTournamentDetails(tournament),
                              ),
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
            Icons.emoji_events_outlined,
            size: 80,
            color: AppTheme.textSecondary.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'No Tournaments Found',
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
            onPressed: _loadTournaments,
            child: const Text('Refresh'),
          ),
        ],
      ),
    );
  }

  void _showTournamentDetails(TournamentModel tournament) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => TournamentDetailsScreen(tournament: tournament),
      ),
    ).then((result) {
      // If registration was successful, refresh the tournaments list
      if (result == true) {
        _loadTournaments();
      }
    });
  }
}
