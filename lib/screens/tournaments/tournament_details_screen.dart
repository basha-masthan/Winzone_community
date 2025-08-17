import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:winzone_arena/models/tournament_model.dart';
import 'package:winzone_arena/services/auth_service.dart';
import 'package:winzone_arena/services/api_service.dart';
import 'package:winzone_arena/utils/theme.dart';
import 'package:cached_network_image/cached_network_image.dart';

class TournamentDetailsScreen extends StatefulWidget {
  final TournamentModel tournament;

  const TournamentDetailsScreen({
    super.key,
    required this.tournament,
  });

  @override
  State<TournamentDetailsScreen> createState() => _TournamentDetailsScreenState();
}

class _TournamentDetailsScreenState extends State<TournamentDetailsScreen> {
  bool _isLoading = false;
  bool _rulesAccepted = false;
  final _gameIdController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _gameIdController.dispose();
    super.dispose();
  }

  Future<void> _registerForTournament() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_rulesAccepted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please accept the rules and conditions first'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final apiService = ApiService();
      final result = await apiService.registerForTournament(
        widget.tournament.id,
        gameId: _gameIdController.text.trim(),
      );

      if (result['success'] && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Successfully registered for tournament!'),
            backgroundColor: AppTheme.neonGreen,
          ),
        );
        Navigator.of(context).pop(true); // Return true to indicate successful registration
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Registration failed'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text(widget.tournament.title),
        backgroundColor: AppTheme.surfaceColor,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Tournament Header Image
            if (widget.tournament.image.isNotEmpty)
              Container(
                width: double.infinity,
                height: 200,
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(20),
                    bottomRight: Radius.circular(20),
                  ),
                ),
                child: ClipRRect(
                  borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(20),
                    bottomRight: Radius.circular(20),
                  ),
                  child: CachedNetworkImage(
                    imageUrl: widget.tournament.image,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      color: AppTheme.surfaceColor,
                      child: const Center(
                        child: CircularProgressIndicator(
                          valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
                        ),
                      ),
                    ),
                    errorWidget: (context, url, error) => Container(
                      color: AppTheme.surfaceColor,
                      child: const Icon(
                        Icons.error,
                        color: AppTheme.errorColor,
                        size: 50,
                      ),
                    ),
                  ),
                ),
              ),

            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Tournament Title and Basic Info
                  Text(
                    widget.tournament.title,
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: AppTheme.textPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  
                  Text(
                    widget.tournament.description,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Tournament Stats Grid
                  _buildStatsGrid(),
                  const SizedBox(height: 24),

                  // Tournament Details
                  _buildDetailSection('Tournament Details', [
                    _buildDetailRow('Game', widget.tournament.game),
                    _buildDetailRow('Type', widget.tournament.type.toString().split('.').last.toUpperCase()),
                    _buildDetailRow('Mode', 'Squad'), // Default mode
                    _buildDetailRow('Map', 'Bermuda'), // Default map
                    _buildDetailRow('Date & Time', _formatDateTime(widget.tournament.dateTime)),
                    _buildDetailRow('Total Slots', '${widget.tournament.registeredSlots}/${widget.tournament.totalSlots}'),
                  ]),
                  const SizedBox(height: 24),

                  // Prize Pool
                  _buildDetailSection('Prize Pool', [
                    _buildDetailRow('Entry Fee', '₹${widget.tournament.entryFee}'),
                    _buildDetailRow('Winning Prize', '₹${widget.tournament.prizePool}'),
                    _buildDetailRow('Per Kill Bonus', '₹${widget.tournament.entryFee > 0 ? widget.tournament.entryFee * 0.1 : 0}'),
                  ]),
                  const SizedBox(height: 24),

                  // Rules and Regulations
                  _buildDetailSection('Rules & Regulations', [
                    ...widget.tournament.rules.map((rule) => _buildRuleItem(rule)),
                  ]),
                  const SizedBox(height: 24),

                  // Rules Acceptance
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceColor,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _rulesAccepted ? AppTheme.neonGreen : AppTheme.textSecondary.withOpacity(0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        Checkbox(
                          value: _rulesAccepted,
                          onChanged: (value) {
                            setState(() {
                              _rulesAccepted = value ?? false;
                            });
                          },
                          activeColor: AppTheme.neonGreen,
                        ),
                        Expanded(
                          child: Text(
                            'I have read and agree to all the rules and conditions of this tournament',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppTheme.textPrimary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Game ID Input
                  if (_rulesAccepted) ...[
                    _buildDetailSection('Registration Details', [
                      Form(
                        key: _formKey,
                        child: Column(
                          children: [
                            TextFormField(
                              controller: _gameIdController,
                              decoration: InputDecoration(
                                labelText: 'Your Game ID',
                                hintText: 'Enter your in-game ID for ${widget.tournament.game}',
                                prefixIcon: const Icon(Icons.sports_esports),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(color: AppTheme.primaryColor, width: 2),
                                ),
                              ),
                              validator: (value) {
                                if (value == null || value.trim().isEmpty) {
                                  return 'Please enter your game ID';
                                }
                                if (value.trim().length < 3) {
                                  return 'Game ID must be at least 3 characters';
                                }
                                return null;
                              },
                            ),
                          ],
                        ),
                      ),
                    ]),
                    const SizedBox(height: 24),
                  ],

                  // Registration Button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _rulesAccepted && !_isLoading ? _registerForTournament : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        foregroundColor: AppTheme.textPrimary,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : Text(
                              'Register for Tournament',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsGrid() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.surfaceColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.textSecondary.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildStatItem(
              'Entry Fee',
              '₹${widget.tournament.entryFee}',
              Icons.payment,
              widget.tournament.type.toString().split('.').last == 'free' 
                  ? AppTheme.neonGreen 
                  : AppTheme.primaryColor,
            ),
          ),
          Container(
            width: 1,
            height: 40,
            color: AppTheme.textSecondary.withOpacity(0.2),
          ),
          Expanded(
            child: _buildStatItem(
              'Prize Pool',
              '₹${widget.tournament.prizePool}',
              Icons.emoji_events,
              AppTheme.neonGreen,
            ),
          ),
          Container(
            width: 1,
            height: 40,
            color: AppTheme.textSecondary.withOpacity(0.2),
          ),
          Expanded(
            child: _buildStatItem(
              'Slots',
              '${widget.tournament.registeredSlots}/${widget.tournament.totalSlots}',
              Icons.people,
              AppTheme.primaryColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 8),
        Text(
          value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            color: AppTheme.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: AppTheme.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildDetailSection(String title, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.textSecondary.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: AppTheme.textPrimary,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppTheme.textSecondary,
            ),
          ),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppTheme.textPrimary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRuleItem(String rule) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 6,
            height: 6,
            margin: const EdgeInsets.only(top: 8, right: 12),
            decoration: const BoxDecoration(
              color: AppTheme.neonGreen,
              shape: BoxShape.circle,
            ),
          ),
          Expanded(
            child: Text(
              rule,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} at ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}
