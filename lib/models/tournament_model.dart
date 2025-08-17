enum TournamentType { free, paid }
enum TournamentStatus { upcoming, ongoing, completed, cancelled }

class TournamentModel {
  final String id;
  final String title;
  final String game;
  final TournamentType type;
  final double entryFee;
  final double prizePool;
  final int totalSlots;
  final int registeredSlots;
  final DateTime dateTime;
  final String description;
  final List<String> rules;
  final TournamentStatus status;
  final List<String> registeredUsers;
  final Map<String, dynamic> results;
  final DateTime createdAt;
  final String createdBy;
  final String image;

  TournamentModel({
    required this.id,
    required this.title,
    required this.game,
    required this.type,
    required this.entryFee,
    required this.prizePool,
    required this.totalSlots,
    required this.registeredSlots,
    required this.dateTime,
    required this.description,
    required this.rules,
    required this.status,
    required this.registeredUsers,
    required this.results,
    required this.createdAt,
    required this.createdBy,
    required this.image,
  });

  factory TournamentModel.fromMap(Map<String, dynamic> map) {
    return TournamentModel(
      id: map['_id'] ?? map['id'] ?? '',
      title: map['title'] ?? '',
      game: map['gameName'] ?? map['game'] ?? '', // Use gameName from API
      type: _parseTournamentType(map['type']),
      entryFee: (map['entryFee'] ?? 0.0).toDouble(),
      prizePool: (map['winningPrize'] ?? map['prizePool'] ?? 0.0).toDouble(), // Map winningPrize to prizePool
      totalSlots: map['totalSlots'] ?? 0,
      registeredSlots: map['registeredSlots'] ?? 0,
      dateTime: map['dateTime'] is String 
          ? DateTime.parse(map['dateTime']) 
          : DateTime.now(),
      description: map['description'] ?? '',
      rules: List<String>.from(map['rules'] ?? []),
      status: _parseTournamentStatus(map['status']),
      registeredUsers: List<String>.from(map['registeredUsers'] ?? []),
      results: Map<String, dynamic>.from(map['results'] ?? {}),
      createdAt: map['createdAt'] is String 
          ? DateTime.parse(map['createdAt']) 
          : DateTime.now(),
      createdBy: map['createdBy'] ?? '',
      image: map['image'] ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'game': game,
      'type': type.toString().split('.').last,
      'entryFee': entryFee,
      'prizePool': prizePool,
      'totalSlots': totalSlots,
      'registeredSlots': registeredSlots,
      'dateTime': dateTime.toIso8601String(),
      'description': description,
      'rules': rules,
      'status': status.toString().split('.').last,
      'registeredUsers': registeredUsers,
      'results': results,
      'createdAt': createdAt.toIso8601String(),
      'createdBy': createdBy,
      'image': image,
    };
  }

  static TournamentType _parseTournamentType(dynamic value) {
    if (value is String) {
      switch (value.toLowerCase()) {
        case 'free':
          return TournamentType.free;
        case 'paid':
          return TournamentType.paid;
        default:
          return TournamentType.free;
      }
    }
    return TournamentType.free;
  }

  static TournamentStatus _parseTournamentStatus(dynamic value) {
    if (value is String) {
      switch (value.toLowerCase()) {
        case 'upcoming':
          return TournamentStatus.upcoming;
        case 'ongoing':
          return TournamentStatus.ongoing;
        case 'completed':
          return TournamentStatus.completed;
        case 'cancelled':
          return TournamentStatus.cancelled;
        default:
          return TournamentStatus.upcoming;
      }
    }
    return TournamentStatus.upcoming;
  }

  bool get isFull => registeredSlots >= totalSlots;
  bool get canRegister => !isFull && status == TournamentStatus.upcoming;
  bool get isRegistered => registeredUsers.isNotEmpty;

  TournamentModel copyWith({
    String? id,
    String? title,
    String? game,
    TournamentType? type,
    double? entryFee,
    double? prizePool,
    int? totalSlots,
    int? registeredSlots,
    DateTime? dateTime,
    String? description,
    List<String>? rules,
    TournamentStatus? status,
    List<String>? registeredUsers,
    Map<String, dynamic>? results,
    DateTime? createdAt,
    String? createdBy,
    String? image,
  }) {
    return TournamentModel(
      id: id ?? this.id,
      title: title ?? this.title,
      game: game ?? this.game,
      type: type ?? this.type,
      entryFee: entryFee ?? this.entryFee,
      prizePool: prizePool ?? this.prizePool,
      totalSlots: totalSlots ?? this.totalSlots,
      registeredSlots: registeredSlots ?? this.registeredSlots,
      dateTime: dateTime ?? this.dateTime,
      description: description ?? this.description,
      rules: rules ?? this.rules,
      status: status ?? this.status,
      registeredUsers: registeredUsers ?? this.registeredUsers,
      results: results ?? this.results,
      createdAt: createdAt ?? this.createdAt,
      createdBy: createdBy ?? this.createdBy,
      image: image ?? this.image,
    );
  }
}
