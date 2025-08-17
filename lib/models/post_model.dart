class PostModel {
  final String id;
  final String userId;
  final String userName;
  final String? userProfilePicture;
  final String content;
  final String? imageUrl;
  final List<String> likes;
  final List<CommentModel> comments;
  final DateTime createdAt;
  final String postType;

  PostModel({
    required this.id,
    required this.userId,
    required this.userName,
    this.userProfilePicture,
    required this.content,
    this.imageUrl,
    required this.likes,
    required this.comments,
    required this.createdAt,
    required this.postType,
  });

  factory PostModel.fromMap(Map<String, dynamic> map) {
    return PostModel(
      id: map['_id'] ?? map['id'] ?? '',
      userId: map['userId'] ?? '',
      userName: map['userName'] ?? '',
      userProfilePicture: map['userProfilePicture'],
      content: map['content'] ?? '',
      imageUrl: map['imageUrl'],
      likes: List<String>.from(map['likes'] ?? []),
      comments: (map['comments'] as List<dynamic>?)
              ?.map((comment) => CommentModel.fromMap(comment))
              .toList() ??
          [],
      createdAt: map['createdAt'] is String 
          ? DateTime.parse(map['createdAt']) 
          : DateTime.now(),
      postType: map['postType'] ?? 'general',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'userName': userName,
      'userProfilePicture': userProfilePicture,
      'content': content,
      'imageUrl': imageUrl,
      'likes': likes,
      'comments': comments.map((comment) => comment.toMap()).toList(),
      'createdAt': createdAt.toIso8601String(),
      'postType': postType,
    };
  }

  PostModel copyWith({
    String? id,
    String? userId,
    String? userName,
    String? userProfilePicture,
    String? content,
    String? imageUrl,
    List<String>? likes,
    List<CommentModel>? comments,
    DateTime? createdAt,
    String? postType,
  }) {
    return PostModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      userName: userName ?? this.userName,
      userProfilePicture: userProfilePicture ?? this.userProfilePicture,
      content: content ?? this.content,
      imageUrl: imageUrl ?? this.imageUrl,
      likes: likes ?? this.likes,
      comments: comments ?? this.comments,
      createdAt: createdAt ?? this.createdAt,
      postType: postType ?? this.postType,
    );
  }
}

class CommentModel {
  final String id;
  final String userId;
  final String userName;
  final String content;
  final DateTime createdAt;

  CommentModel({
    required this.id,
    required this.userId,
    required this.userName,
    required this.content,
    required this.createdAt,
  });

  factory CommentModel.fromMap(Map<String, dynamic> map) {
    return CommentModel(
      id: map['_id'] ?? map['id'] ?? '',
      userId: map['userId'] ?? '',
      userName: map['userName'] ?? '',
      content: map['content'] ?? '',
      createdAt: map['createdAt'] is String 
          ? DateTime.parse(map['createdAt']) 
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'userName': userName,
      'content': content,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
