class UserModel {
  final String uid;
  final String name;
  final String email;
  final String? phoneNumber;
  final String? profilePicture;
  final double balance;
  final double moneyWon;
  final double depositedAmount;
  final Map<String, String> gameIds;
  final List<String> registeredTournaments;
  final int matchesPlayed;
  final int wins;
  final int totalKills;
  final int rankingScore;
  final DateTime createdAt;
  final DateTime lastActive;
  final bool isActive;
  final bool isBanned;
  final String? banReason;
  final String role;

  UserModel({
    required this.uid,
    required this.name,
    required this.email,
    this.phoneNumber,
    this.profilePicture,
    this.balance = 0.0,
    this.moneyWon = 0.0,
    this.depositedAmount = 0.0,
    this.gameIds = const {},
    this.registeredTournaments = const [],
    this.matchesPlayed = 0,
    this.wins = 0,
    this.totalKills = 0,
    this.rankingScore = 0,
    required this.createdAt,
    required this.lastActive,
    this.isActive = true,
    this.isBanned = false,
    this.banReason,
    this.role = 'user',
  });

  factory UserModel.fromMap(Map<String, dynamic> map) {
    return UserModel(
      uid: map['uid'] ?? '',
      name: map['name'] ?? '',
      email: map['email'] ?? '',
      phoneNumber: map['phoneNumber'],
      profilePicture: map['profilePicture'],
      balance: (map['balance'] ?? 0.0).toDouble(),
      moneyWon: (map['moneyWon'] ?? 0.0).toDouble(),
      depositedAmount: (map['depositedAmount'] ?? 0.0).toDouble(),
      gameIds: Map<String, String>.from(map['gameIds'] ?? {}),
      registeredTournaments: List<String>.from(map['registeredTournaments'] ?? []),
      matchesPlayed: map['matchesPlayed'] ?? 0,
      wins: map['wins'] ?? 0,
      totalKills: map['totalKills'] ?? 0,
      rankingScore: map['rankingScore'] ?? 0,
      createdAt: map['createdAt'] is String 
          ? DateTime.parse(map['createdAt']) 
          : DateTime.now(),
      lastActive: map['lastActive'] is String 
          ? DateTime.parse(map['lastActive']) 
          : DateTime.now(),
      isActive: map['isActive'] ?? true,
      isBanned: map['isBanned'] ?? false,
      banReason: map['banReason'],
      role: map['role'] ?? 'user',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'name': name,
      'email': email,
      'phoneNumber': phoneNumber,
      'profilePicture': profilePicture,
      'balance': balance,
      'moneyWon': moneyWon,
      'depositedAmount': depositedAmount,
      'gameIds': gameIds,
      'registeredTournaments': registeredTournaments,
      'matchesPlayed': matchesPlayed,
      'wins': wins,
      'totalKills': totalKills,
      'rankingScore': rankingScore,
      'createdAt': createdAt.toIso8601String(),
      'lastActive': lastActive.toIso8601String(),
      'isActive': isActive,
      'isBanned': isBanned,
      'banReason': banReason,
      'role': role,
    };
  }

  UserModel copyWith({
    String? uid,
    String? name,
    String? email,
    String? phoneNumber,
    String? profilePicture,
    double? balance,
    double? moneyWon,
    double? depositedAmount,
    Map<String, String>? gameIds,
    List<String>? registeredTournaments,
    int? matchesPlayed,
    int? wins,
    int? totalKills,
    int? rankingScore,
    DateTime? createdAt,
    DateTime? lastActive,
    bool? isActive,
    bool? isBanned,
    String? banReason,
    String? role,
  }) {
    return UserModel(
      uid: uid ?? this.uid,
      name: name ?? this.name,
      email: email ?? this.email,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      profilePicture: profilePicture ?? this.profilePicture,
      balance: balance ?? this.balance,
      moneyWon: moneyWon ?? this.moneyWon,
      depositedAmount: depositedAmount ?? this.depositedAmount,
      gameIds: gameIds ?? this.gameIds,
      registeredTournaments: registeredTournaments ?? this.registeredTournaments,
      matchesPlayed: matchesPlayed ?? this.matchesPlayed,
      wins: wins ?? this.wins,
      totalKills: totalKills ?? this.totalKills,
      rankingScore: rankingScore ?? this.rankingScore,
      createdAt: createdAt ?? this.createdAt,
      lastActive: lastActive ?? this.lastActive,
      isActive: isActive ?? this.isActive,
      isBanned: isBanned ?? this.isBanned,
      banReason: banReason ?? this.banReason,
      role: role ?? this.role,
    );
  }
}
