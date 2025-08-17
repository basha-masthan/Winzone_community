import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:winzone_arena/models/user_model.dart';
import 'package:winzone_arena/models/tournament_model.dart';
import 'package:winzone_arena/models/post_model.dart';
import 'package:winzone_arena/models/transaction_model.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:5000/api';
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';

  // Singleton pattern
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _authToken;
  UserModel? _currentUser;

  String? get authToken => _authToken;
  UserModel? get currentUser => _currentUser;
  bool get isAuthenticated => _authToken != null && _currentUser != null;

  // Initialize service
  Future<void> initialize() async {
    await _loadStoredData();
  }

  // Load stored authentication data
  Future<void> _loadStoredData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _authToken = prefs.getString(tokenKey);
      final userData = prefs.getString(userKey);
      if (userData != null) {
        _currentUser = UserModel.fromMap(json.decode(userData));
      }
    } catch (e) {
      print('Error loading stored data: $e');
    }
  }

  // Store authentication data
  Future<void> _storeAuthData(String token, UserModel user) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(tokenKey, token);
      await prefs.setString(userKey, json.encode(user.toMap()));
      _authToken = token;
      _currentUser = user;
    } catch (e) {
      print('Error storing auth data: $e');
    }
  }

  // Clear authentication data
  Future<void> _clearAuthData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(tokenKey);
      await prefs.remove(userKey);
      _authToken = null;
      _currentUser = null;
    } catch (e) {
      print('Error clearing auth data: $e');
    }
  }

  // HTTP headers with authentication
  Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json',
    };
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    return headers;
  }
  
  // Public headers getter
  Map<String, String> get headers => _headers;

  // Handle HTTP response
  Map<String, dynamic> _handleResponse(http.Response response) {
    final body = json.decode(response.body);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    } else {
      throw ApiException(
        message: body['message'] ?? 'Request failed',
        statusCode: response.statusCode,
      );
    }
  }

  // Authentication Methods
  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    String? phoneNumber,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: _headers,
        body: json.encode({
          'name': name,
          'email': email,
          'password': password,
          'phoneNumber': phoneNumber,
        }),
      );

      final data = _handleResponse(response);
      
      if (data['success']) {
        final user = UserModel.fromMap(data['data']['user']);
        await _storeAuthData(data['data']['token'], user);
      }

      return data;
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: _headers,
        body: json.encode({
          'email': email,
          'password': password,
        }),
      );

      final data = _handleResponse(response);
      
      if (data['success']) {
        final user = UserModel.fromMap(data['data']['user']);
        await _storeAuthData(data['data']['token'], user);
      }

      return data;
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<Map<String, dynamic>> googleSignIn({
    required String idToken,
    required String name,
    required String email,
    String? profilePicture,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/google'),
        headers: _headers,
        body: json.encode({
          'idToken': idToken,
          'name': name,
          'email': email,
          'profilePicture': profilePicture,
        }),
      );

      final data = _handleResponse(response);
      
      if (data['success']) {
        final user = UserModel.fromMap(data['data']['user']);
        await _storeAuthData(data['data']['token'], user);
      }

      return data;
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<Map<String, dynamic>> verifyToken() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/verify'),
        headers: _headers,
      );

      final data = _handleResponse(response);
      
      if (data['success']) {
        final user = UserModel.fromMap(data['data']['user']);
        _currentUser = user;
        // Update stored user data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(userKey, json.encode(user.toMap()));
      }

      return data;
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<void> logout() async {
    try {
      if (_authToken != null) {
        await http.post(
          Uri.parse('$baseUrl/auth/logout'),
          headers: _headers,
        );
      }
    } catch (e) {
      print('Error during logout: $e');
    } finally {
      await _clearAuthData();
    }
  }

  // User Methods
  Future<Map<String, dynamic>> updateProfile({
    String? name,
    String? profilePicture,
    Map<String, String>? gameIds,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/users/profile'),
        headers: _headers,
        body: json.encode({
          if (name != null) 'name': name,
          if (profilePicture != null) 'profilePicture': profilePicture,
          if (gameIds != null) 'gameIds': gameIds,
        }),
      );

      final data = _handleResponse(response);
      
      if (data['success']) {
        final user = UserModel.fromMap(data['data']['user']);
        _currentUser = user;
        // Update stored user data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(userKey, json.encode(user.toMap()));
      }

      return data;
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<Map<String, dynamic>> getUserProfile(String userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/users/$userId'),
        headers: _headers,
      );

      return _handleResponse(response);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  // Tournament Methods
  Future<List<TournamentModel>> getTournaments({
    String? game,
    String? type,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, String>{
        'limit': limit.toString(),
      };
      if (game != null) queryParams['game'] = game;
      if (type != null) queryParams['type'] = type;

      final uri = Uri.parse('$baseUrl/tournaments').replace(queryParameters: queryParams);
      print('API Request URL: $uri');
      print('API Request Headers: $_headers');
      
      final response = await http.get(uri, headers: _headers);
      
      print('API Response Status: ${response.statusCode}');
      print('API Response Body: ${response.body}');

      final data = _handleResponse(response);
      print('Parsed API Response: $data');
      
      if (data['success']) {
        final tournamentsList = data['data']['tournaments'] as List;
        print('Tournaments list length: ${tournamentsList.length}');
        
        final tournaments = tournamentsList
            .map((json) {
              print('Parsing tournament: $json');
              return TournamentModel.fromMap(json);
            })
            .toList();
        
        print('Successfully parsed ${tournaments.length} tournaments');
        return tournaments;
      }
      
      print('API response not successful');
      return [];
    } catch (e) {
      print('Error getting tournaments: $e');
      return [];
    }
  }

  Future<TournamentModel?> getTournament(String id) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/tournaments/$id'),
        headers: _headers,
      );

      final data = _handleResponse(response);
      
      if (data['success']) {
        return TournamentModel.fromMap(data['data']['tournament']);
      }
      
      return null;
    } catch (e) {
      print('Error getting tournament: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>> registerForTournament(String tournamentId, {String? gameId}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/tournaments/$tournamentId/register'),
        headers: _headers,
        body: json.encode({
          'gameId': gameId,
        }),
      );

      return _handleResponse(response);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<Map<String, dynamic>> unregisterFromTournament(String tournamentId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/tournaments/$tournamentId/register'),
        headers: _headers,
      );

      return _handleResponse(response);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  // Post Methods
  Future<List<PostModel>> getPosts({int limit = 20}) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/posts?limit=$limit'),
        headers: _headers,
      );

      final data = _handleResponse(response);
      
      if (data['success']) {
        return (data['data']['posts'] as List)
            .map((json) => PostModel.fromMap(json))
            .toList();
      }
      
      return [];
    } catch (e) {
      print('Error getting posts: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>> createPost({
    required String content,
    String? imageUrl,
    String postType = 'general',
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/posts'),
        headers: _headers,
        body: json.encode({
          'content': content,
          'imageUrl': imageUrl,
          'postType': postType,
        }),
      );

      return _handleResponse(response);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<Map<String, dynamic>> likePost(String postId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/posts/$postId/like'),
        headers: _headers,
      );

      return _handleResponse(response);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<Map<String, dynamic>> addComment(String postId, String content) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/posts/$postId/comments'),
        headers: _headers,
        body: json.encode({'content': content}),
      );

      return _handleResponse(response);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  // Transaction Methods
  Future<List<TransactionModel>> getUserTransactions() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/transactions'),
        headers: _headers,
      );

      final data = _handleResponse(response);
      
      if (data['success']) {
        return (data['data']['transactions'] as List)
            .map((json) => TransactionModel.fromMap(json))
            .toList();
      }
      
      return [];
    } catch (e) {
      print('Error getting transactions: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>> createDeposit({
    required double amount,
    required String paymentMethod,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/transactions/deposit'),
        headers: _headers,
        body: json.encode({
          'amount': amount,
          'paymentMethod': paymentMethod,
        }),
      );

      return _handleResponse(response);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  Future<Map<String, dynamic>> createWithdrawal({
    required double amount,
    required String withdrawalMethod,
    required String accountDetails,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/transactions/withdrawal'),
        headers: _headers,
        body: json.encode({
          'amount': amount,
          'withdrawalMethod': withdrawalMethod,
          'accountDetails': accountDetails,
        }),
      );

      return _handleResponse(response);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  // Game Methods
  Future<List<Map<String, dynamic>>> getGames() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/games'),
        headers: _headers,
      );

      final data = _handleResponse(response);
      
      if (data['success']) {
        return List<Map<String, dynamic>>.from(data['data']['games']);
      }
      
      return [];
    } catch (e) {
      print('Error getting games: $e');
      return [];
    }
  }

  // Health check
  Future<bool> checkApiHealth() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/health'),
        headers: _headers,
      );

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException({required this.message, this.statusCode});

  @override
  String toString() => 'ApiException: $message (Status: $statusCode)';
}
