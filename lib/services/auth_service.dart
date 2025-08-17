import 'package:flutter/material.dart';
import 'package:winzone_arena/models/user_model.dart';
import 'package:winzone_arena/services/api_service.dart';

class AuthService extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  UserModel? get currentUser => _apiService.currentUser;
  bool get isAuthenticated => _apiService.isAuthenticated;

  AuthService() {
    _initialize();
  }

  Future<void> _initialize() async {
    await _apiService.initialize();
    notifyListeners();
  }

  // Email & Password Sign Up
  Future<Map<String, dynamic>> signUpWithEmailAndPassword(
    String email,
    String password,
    String name,
    {String? phoneNumber}
  ) async {
    try {
      final result = await _apiService.register(
        name: name,
        email: email,
        password: password,
        phoneNumber: phoneNumber,
      );
      
      if (result['success']) {
        notifyListeners();
      }
      
      return result;
    } catch (e) {
      print('Error signing up: $e');
      rethrow;
    }
  }

  // Email & Password Sign In
  Future<Map<String, dynamic>> signInWithEmailAndPassword(
    String email,
    String password,
  ) async {
    try {
      final result = await _apiService.login(
        email: email,
        password: password,
      );
      
      if (result['success']) {
        notifyListeners();
      }
      
      return result;
    } catch (e) {
      print('Error signing in: $e');
      rethrow;
    }
  }

  // Google Sign In
  Future<Map<String, dynamic>> signInWithGoogle({
    required String idToken,
    required String name,
    required String email,
    String? profilePicture,
  }) async {
    try {
      final result = await _apiService.googleSignIn(
        idToken: idToken,
        name: name,
        email: email,
        profilePicture: profilePicture,
      );
      
      if (result['success']) {
        notifyListeners();
      }
      
      return result;
    } catch (e) {
      print('Error signing in with Google: $e');
      rethrow;
    }
  }

  // Verify Token
  Future<Map<String, dynamic>> verifyToken() async {
    try {
      final result = await _apiService.verifyToken();
      
      if (result['success']) {
        notifyListeners();
      }
      
      return result;
    } catch (e) {
      print('Error verifying token: $e');
      rethrow;
    }
  }

  // Update User Profile
  Future<Map<String, dynamic>> updateUserProfile({
    String? name,
    String? profilePicture,
    Map<String, String>? gameIds,
  }) async {
    try {
      final result = await _apiService.updateProfile(
        name: name,
        profilePicture: profilePicture,
        gameIds: gameIds,
      );
      
      if (result['success']) {
        notifyListeners();
      }
      
      return result;
    } catch (e) {
      print('Error updating profile: $e');
      rethrow;
    }
  }

  // Sign Out
  Future<void> signOut() async {
    try {
      await _apiService.logout();
      notifyListeners();
    } catch (e) {
      print('Error signing out: $e');
    }
  }

  // Check API Health
  Future<bool> checkApiHealth() async {
    return await _apiService.checkApiHealth();
  }
}
