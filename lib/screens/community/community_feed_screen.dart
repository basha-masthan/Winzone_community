import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:winzone_arena/services/api_service.dart';
import 'package:winzone_arena/models/post_model.dart';
import 'package:winzone_arena/widgets/post_card.dart';
import 'package:winzone_arena/screens/community/create_post_screen.dart';
import 'package:winzone_arena/utils/theme.dart';

class CommunityFeedScreen extends StatefulWidget {
  const CommunityFeedScreen({super.key});

  @override
  State<CommunityFeedScreen> createState() => _CommunityFeedScreenState();
}

class _CommunityFeedScreenState extends State<CommunityFeedScreen> {
  List<PostModel> _posts = [];
  bool _isLoading = false;
  bool _hasMorePosts = true;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadPosts();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      if (!_isLoading && _hasMorePosts) {
        _loadMorePosts();
      }
    }
  }

  Future<void> _loadPosts() async {
    setState(() => _isLoading = true);
    
    try {
      final apiService = ApiService();
      final posts = await apiService.getPosts(limit: 20);
      
      setState(() {
        _posts = posts;
        _isLoading = false;
        _hasMorePosts = posts.length >= 20;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading posts: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  Future<void> _loadMorePosts() async {
    if (_isLoading || !_hasMorePosts) return;
    
    setState(() => _isLoading = true);
    
    try {
      final apiService = ApiService();
      final morePosts = await apiService.getPosts(limit: 20);
      
      if (morePosts.isNotEmpty) {
        setState(() {
          _posts.addAll(morePosts);
          _isLoading = false;
          _hasMorePosts = morePosts.length >= 20;
        });
      } else {
        setState(() {
          _isLoading = false;
          _hasMorePosts = false;
        });
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading more posts: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  void _navigateToCreatePost() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const CreatePostScreen()),
    ).then((_) {
      // Refresh posts after creating a new one
      _loadPosts();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Community Feed'),
        backgroundColor: AppTheme.surfaceColor,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              // Implement search functionality
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadPosts,
        color: AppTheme.primaryColor,
        child: _posts.isEmpty && !_isLoading
            ? _buildEmptyState()
            : ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                itemCount: _posts.length + (_hasMorePosts ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == _posts.length) {
                    return _buildLoadingIndicator();
                  }
                  
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: PostCard(
                      post: _posts[index],
                      onLike: () => _handleLikePost(_posts[index]),
                      onComment: () => _handleCommentPost(_posts[index]),
                    ),
                  );
                },
              ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _navigateToCreatePost,
        backgroundColor: AppTheme.primaryColor,
        child: const Icon(
          Icons.add,
          color: AppTheme.textPrimary,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.forum_outlined,
            size: 80,
            color: AppTheme.textSecondary.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'No Posts Yet',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Be the first to share something with the community!',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppTheme.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _navigateToCreatePost,
            icon: const Icon(Icons.add),
            label: const Text('Create Post'),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingIndicator() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
        ),
      ),
    );
  }

  Future<void> _handleLikePost(PostModel post) async {
    try {
      final apiService = ApiService();
      await apiService.likePost(post.id);
      
      // Refresh posts to show updated like count
      _loadPosts();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error liking post: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  void _handleCommentPost(PostModel post) {
    // Navigate to post detail screen with comments
    // This will be implemented later
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Comment on: ${post.content.substring(0, 20)}...'),
        backgroundColor: AppTheme.primaryColor,
      ),
    );
  }
}
