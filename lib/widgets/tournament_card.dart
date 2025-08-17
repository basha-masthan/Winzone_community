import 'package:flutter/material.dart';
import 'package:winzone_arena/models/tournament_model.dart';
import 'package:winzone_arena/utils/theme.dart';

class TournamentCard extends StatelessWidget {
  final TournamentModel tournament;
  final Function(TournamentModel)? onTap;
  final VoidCallback? onRegister;

  const TournamentCard({
    super.key,
    required this.tournament,
    this.onTap,
    this.onRegister,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onTap?.call(tournament),
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        color: AppTheme.surfaceColor,
        elevation: 2,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with Game and Type
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getGameColor(tournament.game),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      tournament.game,
                      style: const TextStyle(
                        color: AppTheme.textPrimary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: tournament.type == TournamentType.paid 
                          ? AppTheme.neonYellow 
                          : AppTheme.neonGreen,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      tournament.type == TournamentType.paid ? 'PAID' : 'FREE',
                      style: const TextStyle(
                        color: AppTheme.textPrimary,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getStatusColor(tournament.status),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      tournament.status.toString().split('.').last.toUpperCase(),
                      style: const TextStyle(
                        color: AppTheme.textPrimary,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 12),
              
              // Tournament Title
              Text(
                tournament.title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              
              const SizedBox(height: 8),
              
              // Tournament Details
              Row(
                children: [
                  Icon(
                    Icons.calendar_today,
                    size: 16,
                    color: AppTheme.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _formatDateTime(tournament.dateTime),
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Icon(
                    Icons.people,
                    size: 16,
                    color: AppTheme.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${tournament.registeredSlots}/${tournament.totalSlots}',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 8),
              
              // Prize Pool and Entry Fee
              Row(
                children: [
                  Icon(
                    Icons.monetization_on,
                    size: 16,
                    color: AppTheme.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '₹${tournament.prizePool.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.neonGreen,
                    ),
                  ),
                  if (tournament.type == TournamentType.paid) ...[
                    const SizedBox(width: 16),
                    Icon(
                      Icons.payment,
                      size: 16,
                      color: AppTheme.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '₹${tournament.entryFee.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.neonYellow,
                      ),
                    ),
                  ],
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Progress Bar
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Registration Progress',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      Text(
                        '${((tournament.registeredSlots / tournament.totalSlots) * 100).toInt()}%',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  LinearProgressIndicator(
                    value: tournament.registeredSlots / tournament.totalSlots,
                    backgroundColor: AppTheme.backgroundColor,
                    valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Action Button
              SizedBox(
                width: double.infinity,
                height: 40,
                child: ElevatedButton(
                  onPressed: tournament.canRegister ? onRegister : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: tournament.canRegister 
                        ? AppTheme.primaryColor 
                        : AppTheme.textSecondary.withOpacity(0.3),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: Text(
                    tournament.isFull 
                        ? 'Tournament Full' 
                        : tournament.canRegister 
                            ? 'Register Now' 
                            : 'Registration Closed',
                    style: TextStyle(
                      color: tournament.canRegister 
                          ? AppTheme.textPrimary 
                          : AppTheme.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getGameColor(String game) {
    switch (game.toLowerCase()) {
      case 'pubg':
      case 'bgmi':
        return AppTheme.neonGreen;
      case 'free fire':
        return AppTheme.neonBlue;
      case 'call of duty':
        return AppTheme.neonPurple;
      case 'chess':
        return AppTheme.neonYellow;
      default:
        return AppTheme.primaryColor;
    }
  }

  Color _getStatusColor(TournamentStatus status) {
    switch (status) {
      case TournamentStatus.upcoming:
        return AppTheme.neonBlue;
      case TournamentStatus.ongoing:
        return AppTheme.neonGreen;
      case TournamentStatus.completed:
        return AppTheme.textSecondary;
      case TournamentStatus.cancelled:
        return AppTheme.errorColor;
    }
  }

  String _formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = dateTime.difference(now);
    
    if (difference.inDays > 0) {
      return '${difference.inDays}d ${difference.inHours % 24}h';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ${difference.inMinutes % 60}m';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m';
    } else {
      return 'Starting now';
    }
  }
}
