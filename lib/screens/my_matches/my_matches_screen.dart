import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:winzone_arena/services/auth_service.dart';
import 'package:winzone_arena/services/api_service.dart';
import 'package:winzone_arena/models/tournament_registration_model.dart';
import 'package:winzone_arena/utils/theme.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

class MyMatchesScreen extends StatefulWidget {
  const MyMatchesScreen({super.key});

  @override
  State<MyMatchesScreen> createState() => _MyMatchesScreenState();
}

class _MyMatchesScreenState extends State<MyMatchesScreen> {
  List<TournamentRegistrationModel> _myRegistrations = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadMyRegistrations();
  }

  Future<void> _loadMyRegistrations() async {
    setState(() => _isLoading = true);
    
    try {
      final apiService = ApiService();
      final authService = Provider.of<AuthService>(context, listen: false);
      final currentUser = authService.currentUser;
      
      if (currentUser == null) {
        throw Exception('User not authenticated');
      }

      print('Loading registrations for user: ${currentUser.uid}');
      
      // Get user's tournament registrations with populated tournament data
      final response = await http.get(
        Uri.parse('${ApiService.baseUrl}/users/${currentUser.uid}/registrations'),
        headers: apiService.headers,
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success']) {
          final registrations = (data['data']['registrations'] as List)
              .map((reg) => TournamentRegistrationModel.fromMap(reg))
              .toList();
          
          setState(() {
            _myRegistrations = registrations;
            _isLoading = false;
          });
        } else {
          throw Exception(data['message'] ?? 'Failed to load registrations');
        }
      } else {
        throw Exception('Failed to load registrations');
      }
      
      print('Found ${_myRegistrations.length} registrations');
      
    } catch (e) {
      print('Error loading registrations: $e');
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading matches: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.sports_esports, color: AppTheme.primaryColor),
            const SizedBox(width: 8),
            const Text('My Registered Matches'),
          ],
        ),
        backgroundColor: AppTheme.surfaceColor,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: _loadMyRegistrations,
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _isLoading
          ? _buildLoadingState()
          : _myRegistrations.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _loadMyRegistrations,
                  color: AppTheme.primaryColor,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _myRegistrations.length,
                    itemBuilder: (context, index) {
                      final registration = _myRegistrations[index];
                      return AnimatedContainer(
                        duration: Duration(milliseconds: 300 + (index * 100)),
                        curve: Curves.easeInOut,
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: _buildRegistrationCard(registration),
                        ),
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.of(context).pushNamed('/tournaments');
        },
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Join Tournament'),
        elevation: 8,
      ),
    );
  }

  Widget _buildRegistrationCard(TournamentRegistrationModel registration) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.surfaceColor,
            AppTheme.surfaceColor.withOpacity(0.9),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryColor.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with Tournament Title and Status
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Icon(
                        Icons.local_fire_department,
                        color: AppTheme.accentColor,
                        size: 24,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _getTournamentTitle(registration),
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: AppTheme.primaryColor,
                            fontWeight: FontWeight.bold,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: _getStatusColor(registration.status).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(25),
                    border: Border.all(
                      color: _getStatusColor(registration.status),
                      width: 1.5,
                    ),
                  ),
                  child: Text(
                    registration.statusText,
                    style: TextStyle(
                      color: _getStatusColor(registration.status),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 20),
            
            // Game Details
            _buildDetailRow(
              Icons.perm_identity,
              'Free Fire ID',
              registration.gameId,
              valueColor: AppTheme.neonGreen,
            ),
            
            const SizedBox(height: 12),
            
            _buildDetailRow(
              Icons.calendar_today,
              'Date',
              _formatDateTime(registration.startTime),
            ),
            
            const SizedBox(height: 12),
            
            // Financial Details in a Row
            Row(
              children: [
                Expanded(
                  child: _buildDetailRow(
                    Icons.track_changes,
                    'Entry Fee',
                    '₹${registration.entryFee > 0 ? registration.entryFee.toStringAsFixed(0) : 'Free'}',
                    valueColor: registration.entryFee > 0 ? AppTheme.accentColor : AppTheme.neonGreen,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildDetailRow(
                    Icons.emoji_events,
                    'Prize',
                    '₹${registration.winningPrize > 0 ? registration.winningPrize.toStringAsFixed(0) : '0'}',
                    valueColor: AppTheme.neonGreen,
                  ),
                ),
              ],
            ),
            
            // Only show per kill if it's greater than 0
            if (registration.perKill > 0) ...[
              const SizedBox(height: 12),
              _buildDetailRow(
                Icons.sports_kabaddi,
                'Per Kill',
                '₹${registration.perKill.toStringAsFixed(0)}',
                valueColor: AppTheme.accentColor,
              ),
            ],
            
            const SizedBox(height: 20),
            
            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _viewMatchDetails(registration),
                    icon: const Icon(Icons.visibility, size: 18),
                    label: const Text('View Details'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.primaryColor,
                      side: BorderSide(color: AppTheme.primaryColor, width: 1.5),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: registration.status == RegistrationStatus.pending
                        ? () => _cancelRegistration(registration)
                        : null,
                    icon: const Icon(Icons.cancel, size: 18),
                    label: const Text('Cancel'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.errorColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 2,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value, {Color? valueColor}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppTheme.primaryColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            icon,
            color: AppTheme.primaryColor,
            size: 18,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: TextStyle(
                  color: valueColor ?? AppTheme.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _getTournamentTitle(TournamentRegistrationModel registration) {
    // Use the tournament title from the model
    return registration.tournamentTitle;
  }

  Color _getStatusColor(RegistrationStatus status) {
    switch (status) {
      case RegistrationStatus.pending:
        return Colors.orange;
      case RegistrationStatus.confirmed:
        return Colors.amber;
      case RegistrationStatus.rejected:
        return Colors.red;
      case RegistrationStatus.cancelled:
        return Colors.grey;
    }
  }

  String _formatDateTime(DateTime dateTime) {
    try {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year} at ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return 'Date not available';
    }
  }

  Widget _buildLoadingState() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 3,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Container(
            height: 200,
            decoration: BoxDecoration(
              color: AppTheme.surfaceColor,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                Container(
                  height: 60,
                  margin: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                Container(
                  height: 20,
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  height: 20,
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.sports_esports_outlined,
              size: 80,
              color: AppTheme.primaryColor.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'No Matches Found',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: AppTheme.textPrimary,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'You haven\'t registered for any tournaments yet.\nGo to Tournaments to join some!',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppTheme.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.of(context).pushNamed('/tournaments');
            },
            icon: const Icon(Icons.emoji_events),
            label: const Text('Browse Tournaments'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 4,
            ),
          ),
        ],
      ),
    );
  }

  void _viewMatchDetails(TournamentRegistrationModel registration) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Viewing details for Tournament: ${registration.tournamentId}'),
        backgroundColor: AppTheme.primaryColor,
      ),
    );
  }

  Future<void> _cancelRegistration(TournamentRegistrationModel registration) async {
    try {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: Row(
            children: [
              Icon(Icons.warning, color: AppTheme.errorColor),
              const SizedBox(width: 8),
              const Text('Cancel Registration'),
            ],
          ),
          content: Text(
            'Are you sure you want to cancel your registration for Tournament ${registration.tournamentId}?'
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('No'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.errorColor,
              ),
              child: const Text('Yes, Cancel'),
            ),
          ],
        ),
      );

      if (confirmed == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Registration cancelled for ${registration.tournamentId}'),
            backgroundColor: AppTheme.neonGreen,
          ),
        );
        _loadMyRegistrations();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error cancelling registration: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }
}
