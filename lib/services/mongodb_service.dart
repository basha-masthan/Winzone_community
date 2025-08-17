import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:winzone_arena/models/user_model.dart';
import 'package:winzone_arena/models/tournament_model.dart';
import 'package:winzone_arena/models/post_model.dart';
import 'package:winzone_arena/models/transaction_model.dart';

class MongoDBService {
  static const String baseUrl = 'http://localhost:5000/api'; // Local backend URL
  static const String mongoUri = 'mongodb+srv://basha:king@freefire.lrfkfsu.mongodb.net/Flutter-winzone?retryWrites=true&w=majority&appName=FreeFire';
  
  // Headers for API requests
  static Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // User Operations
  static Future<UserModel?> getUserById(String userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/users/$userId'),
        headers: _headers,
      );
      
      if (response.statusCode == 200) {
        return UserModel.fromMap(json.decode(response.body));
      }
      return null;
    } catch (e) {
      print('Error getting user: $e');
      return null;
    }
  }

  static Future<bool> createUser(UserModel user) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/users'),
        headers: _headers,
        body: json.encode(user.toMap()),
      );
      
      return response.statusCode == 201;
    } catch (e) {
      print('Error creating user: $e');
      return false;
    }
  }

  static Future<bool> updateUser(UserModel user) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/users/${user.uid}'),
        headers: _headers,
        body: json.encode(user.toMap()),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error updating user: $e');
      return false;
    }
  }

  static Future<bool> updateUserBalance(String userId, double newBalance) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/users/$userId/balance'),
        headers: _headers,
        body: json.encode({'balance': newBalance}),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error updating user balance: $e');
      return false;
    }
  }

  // Tournament Operations
  static Future<List<TournamentModel>> getTournaments({
    String? game,
    TournamentType? type,
    TournamentStatus? status,
  }) async {
    try {
      String url = '$baseUrl/tournaments';
      List<String> queryParams = [];
      
      if (game != null) queryParams.add('game=$game');
      if (type != null) queryParams.add('type=${type.toString().split('.').last}');
      if (status != null) queryParams.add('status=${status.toString().split('.').last}');
      
      if (queryParams.isNotEmpty) {
        url += '?${queryParams.join('&')}';
      }
      
      final response = await http.get(
        Uri.parse(url),
        headers: _headers,
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => TournamentModel.fromMap(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error getting tournaments: $e');
      return [];
    }
  }

  static Future<TournamentModel?> getTournamentById(String tournamentId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/tournaments/$tournamentId'),
        headers: _headers,
      );
      
      if (response.statusCode == 200) {
        return TournamentModel.fromMap(json.decode(response.body));
      }
      return null;
    } catch (e) {
      print('Error getting tournament: $e');
      return null;
    }
  }

  static Future<bool> registerForTournament(String userId, String tournamentId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/tournaments/$tournamentId/register'),
        headers: _headers,
        body: json.encode({'userId': userId}),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error registering for tournament: $e');
      return false;
    }
  }

  static Future<bool> unregisterFromTournament(String userId, String tournamentId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/tournaments/$tournamentId/register/$userId'),
        headers: _headers,
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error unregistering from tournament: $e');
      return false;
    }
  }

  // Post Operations
  static Future<List<PostModel>> getPosts({int limit = 20, int offset = 0}) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/posts?limit=$limit&offset=$offset'),
        headers: _headers,
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => PostModel.fromMap(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error getting posts: $e');
      return [];
    }
  }

  static Future<bool> createPost(PostModel post) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/posts'),
        headers: _headers,
        body: json.encode(post.toMap()),
      );
      
      return response.statusCode == 201;
    } catch (e) {
      print('Error creating post: $e');
      return false;
    }
  }

  static Future<bool> likePost(String postId, String userId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/posts/$postId/like'),
        headers: _headers,
        body: json.encode({'userId': userId}),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error liking post: $e');
      return false;
    }
  }

  static Future<bool> unlikePost(String postId, String userId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/posts/$postId/like/$userId'),
        headers: _headers,
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error unliking post: $e');
      return false;
    }
  }

  static Future<bool> addComment(String postId, CommentModel comment) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/posts/$postId/comments'),
        headers: _headers,
        body: json.encode(comment.toMap()),
      );
      
      return response.statusCode == 201;
    } catch (e) {
      print('Error adding comment: $e');
      return false;
    }
  }

  // Transaction Operations
  static Future<List<TransactionModel>> getUserTransactions(String userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/transactions?userId=$userId'),
        headers: _headers,
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => TransactionModel.fromMap(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error getting user transactions: $e');
      return [];
    }
  }

  static Future<bool> createTransaction(TransactionModel transaction) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/transactions'),
        headers: _headers,
        body: json.encode(transaction.toMap()),
      );
      
      return response.statusCode == 201;
    } catch (e) {
      print('Error creating transaction: $e');
      return false;
    }
  }

  static Future<bool> updateTransactionStatus(String transactionId, TransactionStatus status) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/transactions/$transactionId/status'),
        headers: _headers,
        body: json.encode({'status': status.toString().split('.').last}),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error updating transaction status: $e');
      return false;
    }
  }

  // Leaderboard Operations
  static Future<List<UserModel>> getLeaderboard({int limit = 50}) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/leaderboard?limit=$limit'),
        headers: _headers,
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => UserModel.fromMap(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error getting leaderboard: $e');
      return [];
    }
  }

  // Search Operations
  static Future<List<TournamentModel>> searchTournaments(String query) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/tournaments/search?q=${Uri.encodeComponent(query)}'),
        headers: _headers,
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => TournamentModel.fromMap(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error searching tournaments: $e');
      return [];
    }
  }
}
