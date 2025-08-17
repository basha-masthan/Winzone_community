enum TransactionType { deposit, withdrawal, entryFee, winning, refund }
enum TransactionStatus { pending, processing, completed, failed, cancelled }

class TransactionModel {
  final String id;
  final String userId;
  final TransactionType type;
  final double amount;
  final TransactionStatus status;
  final String? paymentMethod;
  final String? withdrawalMethod;
  final String? accountDetails;
  final String? transactionId;
  final String? adminNote;
  final DateTime createdAt;
  final DateTime? completedAt;

  TransactionModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.amount,
    required this.status,
    this.paymentMethod,
    this.withdrawalMethod,
    this.accountDetails,
    this.transactionId,
    this.adminNote,
    required this.createdAt,
    this.completedAt,
  });

  factory TransactionModel.fromMap(Map<String, dynamic> map) {
    return TransactionModel(
      id: map['_id'] ?? map['id'] ?? '',
      userId: map['userId'] ?? '',
      type: _parseTransactionType(map['type']),
      amount: (map['amount'] ?? 0.0).toDouble(),
      status: _parseTransactionStatus(map['status']),
      paymentMethod: map['paymentMethod'],
      withdrawalMethod: map['withdrawalMethod'],
      accountDetails: map['accountDetails'],
      transactionId: map['transactionId'],
      adminNote: map['adminNote'],
      createdAt: map['createdAt'] is String 
          ? DateTime.parse(map['createdAt']) 
          : DateTime.now(),
      completedAt: map['completedAt'] is String 
          ? DateTime.parse(map['completedAt']) 
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'type': type.toString().split('.').last,
      'amount': amount,
      'status': status.toString().split('.').last,
      'paymentMethod': paymentMethod,
      'withdrawalMethod': withdrawalMethod,
      'accountDetails': accountDetails,
      'transactionId': transactionId,
      'adminNote': adminNote,
      'createdAt': createdAt.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
    };
  }

  static TransactionType _parseTransactionType(dynamic value) {
    if (value is String) {
      switch (value.toLowerCase()) {
        case 'deposit':
          return TransactionType.deposit;
        case 'withdrawal':
          return TransactionType.withdrawal;
        case 'entryfee':
          return TransactionType.entryFee;
        case 'winning':
          return TransactionType.winning;
        case 'refund':
          return TransactionType.refund;
        default:
          return TransactionType.deposit;
      }
    }
    return TransactionType.deposit;
  }

  static TransactionStatus _parseTransactionStatus(dynamic value) {
    if (value is String) {
      switch (value.toLowerCase()) {
        case 'pending':
          return TransactionStatus.pending;
        case 'processing':
          return TransactionStatus.processing;
        case 'completed':
          return TransactionStatus.completed;
        case 'failed':
          return TransactionStatus.failed;
        case 'cancelled':
          return TransactionStatus.cancelled;
        default:
          return TransactionStatus.pending;
      }
    }
    return TransactionStatus.pending;
  }

  String get typeText {
    switch (type) {
      case TransactionType.deposit:
        return 'Deposit';
      case TransactionType.withdrawal:
        return 'Withdrawal';
      case TransactionType.entryFee:
        return 'Entry Fee';
      case TransactionType.winning:
        return 'Winning';
      case TransactionType.refund:
        return 'Refund';
    }
  }

  TransactionModel copyWith({
    String? id,
    String? userId,
    TransactionType? type,
    double? amount,
    TransactionStatus? status,
    String? paymentMethod,
    String? withdrawalMethod,
    String? accountDetails,
    String? transactionId,
    String? adminNote,
    DateTime? createdAt,
    DateTime? completedAt,
  }) {
    return TransactionModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      type: type ?? this.type,
      amount: amount ?? this.amount,
      status: status ?? this.status,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      withdrawalMethod: withdrawalMethod ?? this.withdrawalMethod,
      accountDetails: accountDetails ?? this.accountDetails,
      transactionId: transactionId ?? this.transactionId,
      adminNote: adminNote ?? this.adminNote,
      createdAt: createdAt ?? this.createdAt,
      completedAt: completedAt ?? this.completedAt,
    );
  }
}
