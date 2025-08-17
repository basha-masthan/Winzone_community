const express = require('express');
const Post = require('../models/Post');
const { authenticateToken, requireOwnershipOrAdmin, validateBody } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get posts with pagination
router.get('/', async (req, res) => {
  try {
    const { limit = 20, offset = 0, postType, userId } = req.query;
    
    const posts = await Post.getPosts(parseInt(limit), parseInt(offset), postType, userId);
    
    // Mark if user has liked each post
    const userIdStr = req.user.userId;
    posts.forEach(post => {
      post.isLikedByUser = post.likes.includes(userIdStr);
    });

    res.json({
      success: true,
      data: { posts }
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts',
      error: error.message
    });
  }
});

// Get trending posts
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10, days = 7 } = req.query;
    
    const posts = await Post.getTrendingPosts(parseInt(limit), parseInt(days));
    
    res.json({
      success: true,
      data: { posts }
    });

  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending posts',
      error: error.message
    });
  }
});

// Search posts
router.get('/search/query', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const posts = await Post.searchPosts(q, parseInt(limit));
    
    // Mark if user has liked each post
    const userIdStr = req.user.userId;
    posts.forEach(post => {
      post.isLikedByUser = post.likes.includes(userIdStr);
    });

    res.json({
      success: true,
      data: { posts }
    });

  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching posts',
      error: error.message
    });
  }
});

// Create new post
router.post('/', validateBody(['content']), async (req, res) => {
  try {
    const { content, imageUrl, postType, tags, location } = req.body;
    const userId = req.user.userId;

    // Get user info
    const user = await require('../models/User').findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const post = new Post({
      userId,
      userName: user.name,
      userProfilePicture: user.profilePicture,
      content,
      imageUrl,
      postType: postType || 'text',
      tags: tags || [],
      location
    });

    await post.save();

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { post }
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating post',
      error: error.message
    });
  }
});

// Get post by ID
router.get('/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('userId', 'name email profilePicture');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Mark if user has liked the post
    const userIdStr = req.user.userId;
    post.isLikedByUser = post.likes.includes(userIdStr);

    res.json({
      success: true,
      data: { post }
    });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching post',
      error: error.message
    });
  }
});

// Update post
router.put('/:postId', requireOwnershipOrAdmin('userId'), validateBody(['content']), async (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await post.editPost(content, imageUrl);

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: { post }
    });

  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating post',
      error: error.message
    });
  }
});

// Delete post
router.delete('/:postId', requireOwnershipOrAdmin('userId'), async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: error.message
    });
  }
});

// Like post
router.post('/:postId/like', async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await post.likePost(userId);

    res.json({
      success: true,
      message: 'Post liked successfully',
      data: { likeCount: post.likes.length + 1 }
    });

  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking post',
      error: error.message
    });
  }
});

// Unlike post
router.delete('/:postId/like', async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await post.unlikePost(userId);

    res.json({
      success: true,
      message: 'Post unliked successfully',
      data: { likeCount: post.likes.length - 1 }
    });

  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unliking post',
      error: error.message
    });
  }
});

// Add comment
router.post('/:postId/comments', validateBody(['content']), async (req, res) => {
  try {
    const { content } = req.body;
    const postId = req.params.postId;
    const userId = req.user.userId;

    // Get user info
    const user = await require('../models/User').findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await post.addComment({
      userId,
      userName: user.name,
      userProfilePicture: user.profilePicture,
      content
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { commentCount: post.comments.length + 1 }
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
});

// Remove comment
router.delete('/:postId/comments/:commentId', async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await post.removeComment(commentId, userId);

    res.json({
      success: true,
      message: 'Comment removed successfully',
      data: { commentCount: post.comments.length - 1 }
    });

  } catch (error) {
    console.error('Remove comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing comment',
      error: error.message
    });
  }
});

// Report post
router.post('/:postId/report', validateBody(['reason']), async (req, res) => {
  try {
    const { reason } = req.body;
    const postId = req.params.postId;
    const userId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await post.reportPost(userId, reason);

    res.json({
      success: true,
      message: 'Post reported successfully'
    });

  } catch (error) {
    console.error('Report post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reporting post',
      error: error.message
    });
  }
});

module.exports = router;
