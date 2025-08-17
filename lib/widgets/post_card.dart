import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:winzone_arena/models/post_model.dart';
import 'package:winzone_arena/services/auth_service.dart';
import 'package:winzone_arena/services/api_service.dart';
import 'package:winzone_arena/utils/theme.dart';
import 'package:cached_network_image/cached_network_image.dart';

class PostCard extends StatelessWidget {
  final PostModel post;
  final VoidCallback? onTap;
  final VoidCallback? onLike;
  final VoidCallback? onComment;

  const PostCard({
    super.key,
    required this.post,
    this.onTap,
    this.onLike,
    this.onComment,
  });

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final currentUser = authService.currentUser;
    final isLikedByUser = currentUser != null && post.likes.contains(currentUser.uid);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: AppTheme.surfaceColor,
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // User Info Header
              Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundImage: post.userProfilePicture != null
                        ? NetworkImage(post.userProfilePicture!)
                        : null,
                    child: post.userProfilePicture == null
                        ? Text(
                            post.userName.isNotEmpty ? post.userName[0].toUpperCase() : 'U',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary,
                            ),
                          )
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          post.userName,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        Text(
                          _formatTimestamp(post.createdAt),
                          style: TextStyle(
                            fontSize: 12,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Post Type Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getPostTypeColor(post.postType),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      post.postType.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Post Content
              Text(
                post.content,
                style: const TextStyle(
                  color: AppTheme.textPrimary,
                  fontSize: 16,
                ),
              ),
              
              // Post Image (if any)
              if (post.imageUrl != null) ...[
                const SizedBox(height: 16),
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: CachedNetworkImage(
                    imageUrl: post.imageUrl!,
                    fit: BoxFit.cover,
                    width: double.infinity,
                    height: 200,
                    placeholder: (context, url) => Container(
                      height: 200,
                      color: AppTheme.backgroundColor,
                      child: const Center(
                        child: CircularProgressIndicator(),
                      ),
                    ),
                    errorWidget: (context, url, error) => Container(
                      height: 200,
                      color: AppTheme.backgroundColor,
                      child: const Icon(Icons.error),
                    ),
                  ),
                ),
              ],
              
              const SizedBox(height: 16),
              
              // Action Buttons
              Row(
                children: [
                  // Like Button
                  InkWell(
                    onTap: onLike ?? () => _handleLike(context),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: isLikedByUser ? AppTheme.primaryColor.withOpacity(0.1) : Colors.transparent,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isLikedByUser ? Icons.favorite : Icons.favorite_border,
                            color: isLikedByUser ? AppTheme.primaryColor : AppTheme.textSecondary,
                            size: 20,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${post.likes.length}',
                            style: TextStyle(
                              color: isLikedByUser ? AppTheme.primaryColor : AppTheme.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(width: 16),
                  
                  // Comment Button
                  InkWell(
                    onTap: onComment ?? () => _handleComment(context),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.chat_bubble_outline,
                            color: AppTheme.textSecondary,
                            size: 20,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${post.comments.length}',
                            style: const TextStyle(
                              color: AppTheme.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  
                  const Spacer(),
                  
                  // Share Button
                  IconButton(
                    onPressed: () => _handleShare(context),
                    icon: const Icon(
                      Icons.share_outlined,
                      color: AppTheme.textSecondary,
                      size: 20,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);
    
    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  Color _getPostTypeColor(String postType) {
    switch (postType.toLowerCase()) {
      case 'gameplay':
        return AppTheme.neonGreen;
      case 'tournament':
        return AppTheme.neonBlue;
      case 'achievement':
        return AppTheme.neonYellow;
      case 'question':
        return AppTheme.neonPurple;
      default:
        return AppTheme.primaryColor;
    }
  }

  Future<void> _handleLike(BuildContext context) async {
    try {
      final apiService = ApiService();
      await apiService.likePost(post.id);
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Post liked!'),
            backgroundColor: AppTheme.neonGreen,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error liking post: ${e.toString()}'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  void _handleComment(BuildContext context) {
    // TODO: Implement comment functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Comment feature coming soon!'),
        backgroundColor: AppTheme.neonBlue,
      ),
    );
  }

  void _handleShare(BuildContext context) {
    // TODO: Implement share functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Share feature coming soon!'),
        backgroundColor: AppTheme.neonBlue,
      ),
    );
  }
}
