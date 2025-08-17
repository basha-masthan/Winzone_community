import 'package:winzone_arena/models/tournament_model.dart';

enum RegistrationStatus { pending, confirmed, rejected, cancelled }

class TournamentRegistrationModel {
  final String id;
  final String tournamentId;
  final String userId;
  final String userName;
  final String gameId;
  final double entryFee;
  final double winningPrize;
  final double perKill;
  final String mode;
  final DateTime startTime;
  final RegistrationStatus status;
  final String? adminNote;
  final DateTime createdAt;
  final DateTime? updatedAt;

  TournamentRegistrationModel({
    required this.id,
    required this.tournamentId,
    required this.userId,
    required this.userName,
    required this.gameId,
    required this.entryFee,
    required this.winningPrize,
    required this.perKill,
    required this.mode,
    required this.startTime,
    this.status = RegistrationStatus.pending,
    this.adminNote,
    required this.createdAt,
    this.updatedAt,
  });

  factory TournamentRegistrationModel.fromMap(Map<String, dynamic> map) {
    // Handle populated tournament data
    String tournamentId = '';
    
    if (map['tournament'] is Map<String, dynamic>) {
      // Tournament is populated
      final tournament = map['tournament'] as Map<String, dynamic>;
      tournamentId = tournament['_id'] ?? '';
    } else {
      // Tournament is just an ID
      tournamentId = map['tournament'] ?? '';
    }
    
    return TournamentRegistrationModel(
      id: map['_id'] ?? map['id'] ?? '',
      tournamentId: tournamentId,
      userId: map['user'] ?? '',
      userName: map['userName'] ?? '',
      gameId: map['gameId'] ?? '',
      entryFee: (map['entryFee'] ?? 0.0).toDouble(),
      winningPrize: (map['winningPrize'] ?? 0.0).toDouble(),
      perKill: (map['perKill'] ?? 0.0).toDouble(),
      mode: map['mode'] ?? '',
      startTime: map['startTime'] is String 
          ? DateTime.parse(map['startTime']) 
          : DateTime.now(),
      status: _parseRegistrationStatus(map['status']),
      adminNote: map['adminNote'],
      createdAt: map['createdAt'] is String 
          ? DateTime.parse(map['createdAt']) 
          : DateTime.now(),
      updatedAt: map['updatedAt'] is String 
          ? DateTime.parse(map['updatedAt']) 
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'tournament': tournamentId,
      'user': userId,
      'userName': userName,
      'gameId': gameId,
      'entryFee': entryFee,
      'winningPrize': winningPrize,
      'perKill': perKill,
      'mode': mode,
      'startTime': startTime.toIso8601String(),
      'status': status.toString().split('.').last,
      'adminNote': adminNote,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  static RegistrationStatus _parseRegistrationStatus(dynamic value) {
    if (value is String) {
      switch (value.toLowerCase()) {
        case 'pending':
          return RegistrationStatus.pending;
        case 'confirmed':
          return RegistrationStatus.confirmed;
        case 'rejected':
          return RegistrationStatus.rejected;
        case 'cancelled':
          return RegistrationStatus.cancelled;
        default:
          return RegistrationStatus.pending;
      }
    }
    return RegistrationStatus.pending;
  }

  TournamentRegistrationModel copyWith({
    String? id,
    String? tournamentId,
    String? userId,
    String? userName,
    String? gameId,
    double? entryFee,
    double? winningPrize,
    double? perKill,
    String? mode,
    DateTime? startTime,
    RegistrationStatus? status,
    String? adminNote,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return TournamentRegistrationModel(
      id: id ?? this.id,
      tournamentId: tournamentId ?? this.tournamentId,
      userId: userId ?? this.userId,
      userName: userName ?? this.userName,
      gameId: gameId ?? this.gameId,
      entryFee: entryFee ?? this.entryFee,
      winningPrize: winningPrize ?? this.winningPrize,
      perKill: perKill ?? this.perKill,
      mode: mode ?? this.mode,
      startTime: startTime ?? this.startTime,
      status: status ?? this.status,
      adminNote: adminNote ?? this.adminNote,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  bool get isPending => status == RegistrationStatus.pending;
  bool get isConfirmed => status == RegistrationStatus.confirmed;
  bool get isRejected => status == RegistrationStatus.rejected;
  bool get isCancelled => status == RegistrationStatus.cancelled;
  
  // Get tournament title from populated data
  String get tournamentTitle {
    // This would need to be set when creating the model from populated data
    // For now, return a default title
    return 'Tournament #${tournamentId.substring(0, 8)}';
  }

  String get statusText {
    switch (status) {
      case RegistrationStatus.pending:
        return 'Pending';
      case RegistrationStatus.confirmed:
        return 'Confirmed';
      case RegistrationStatus.rejected:
        return 'Rejected';
      case RegistrationStatus.cancelled:
        return 'Cancelled';
    }
  }
}
