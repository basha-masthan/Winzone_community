import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:winzone_arena/services/auth_service.dart';
import 'package:winzone_arena/services/api_service.dart';
import 'package:winzone_arena/models/post_model.dart';
import 'package:winzone_arena/utils/theme.dart';

class CreatePostScreen extends StatefulWidget {
  const CreatePostScreen({super.key});

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final _formKey = GlobalKey<FormState>();
  final _contentController = TextEditingController();
  String _selectedPostType = 'general';
  bool _isLoading = false;

  final List<Map<String, String>> _postTypes = [
    {'value': 'general', 'label': 'General'},
    {'value': 'gameplay', 'label': 'Gameplay'},
    {'value': 'tournament', 'label': 'Tournament'},
    {'value': 'achievement', 'label': 'Achievement'},
    {'value': 'question', 'label': 'Question'},
  ];

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _createPost() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      final user = authService.currentUser;
      
      if (user == null) {
        throw Exception('User not authenticated');
      }

      final apiService = ApiService();
      await apiService.createPost(
        content: _contentController.text.trim(),
        postType: _selectedPostType,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Post created successfully!'),
            backgroundColor: AppTheme.neonGreen,
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error creating post: ${e.toString()}'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Create Post'),
        backgroundColor: AppTheme.surfaceColor,
        elevation: 0,
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _createPost,
            child: _isLoading
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(AppTheme.textPrimary),
                    ),
                  )
                : const Text(
                    'Post',
                    style: TextStyle(
                      color: AppTheme.primaryColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            // Post Type Selection
            Container(
              padding: const EdgeInsets.all(16),
              color: AppTheme.surfaceColor,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Post Type',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppTheme.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    children: _postTypes.map((type) {
                      final isSelected = _selectedPostType == type['value'];
                      return FilterChip(
                        label: Text(type['label']!),
                        selected: isSelected,
                        onSelected: (selected) {
                          setState(() {
                            _selectedPostType = type['value']!;
                          });
                        },
                        selectedColor: AppTheme.primaryColor,
                        checkmarkColor: AppTheme.textPrimary,
                        labelStyle: TextStyle(
                          color: isSelected ? AppTheme.textPrimary : AppTheme.textSecondary,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            
            // Content Input
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: TextFormField(
                  controller: _contentController,
                  maxLines: 5,
                  style: const TextStyle(color: AppTheme.textPrimary),
                  decoration: InputDecoration(
                    labelText: 'What\'s on your mind?',
                    labelStyle: const TextStyle(color: AppTheme.textSecondary),
                    hintText: 'Share your thoughts, achievements, or gaming experiences...',
                    hintStyle: TextStyle(color: AppTheme.textSecondary.withOpacity(0.7)),
                    border: const OutlineInputBorder(),
                    enabledBorder: const OutlineInputBorder(
                      borderSide: BorderSide(color: AppTheme.textSecondary),
                    ),
                    focusedBorder: const OutlineInputBorder(
                      borderSide: BorderSide(color: AppTheme.primaryColor, width: 2),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter post content';
                    }
                    if (value.trim().length < 10) {
                      return 'Post content must be at least 10 characters';
                    }
                    return null;
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
