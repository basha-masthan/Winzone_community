import 'package:flutter/material.dart';
import 'package:winzone_arena/models/transaction_model.dart';
import 'package:winzone_arena/services/api_service.dart';

class PaymentService extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  // Create deposit transaction
  Future<Map<String, dynamic>> createDeposit({
    required double amount,
    required String paymentMethod,
  }) async {
    try {
      print('Creating deposit: $amount via $paymentMethod');
      
      final result = await _apiService.createDeposit(
        amount: amount,
        paymentMethod: paymentMethod,
      );
      
      print('Deposit created successfully');
      return result;
    } catch (e) {
      print('Error creating deposit: $e');
      rethrow;
    }
  }

  // Create withdrawal transaction
  Future<Map<String, dynamic>> createWithdrawal({
    required double amount,
    required String withdrawalMethod,
    required String accountDetails,
  }) async {
    try {
      print('Creating withdrawal: $amount via $withdrawalMethod');
      
      final result = await _apiService.createWithdrawal(
        amount: amount,
        withdrawalMethod: withdrawalMethod,
        accountDetails: accountDetails,
      );
      
      print('Withdrawal created successfully');
      return result;
    } catch (e) {
      print('Error creating withdrawal: $e');
      rethrow;
    }
  }

  @override
  void dispose() {
    super.dispose();
  }
}
