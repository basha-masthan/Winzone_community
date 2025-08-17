const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userProfilePicture: {
    type: String,
    default: null
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userProfilePicture: {
    type: String,
    default: null
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
  postType: {
    type: String,
    required: true,
    enum: ['text', 'image', 'meme', 'gameplay'],
    default: 'text'
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportCount: {
    type: Number,
    default: 0
  },
  reportReasons: [{
    reason: String,
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  location: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ postType: 1, createdAt: -1 });
postSchema.index({ isApproved: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ 'comments.userId': 1 });

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for is liked by user (to be set dynamically)
postSchema.virtual('isLikedByUser').get(function() {
  return false; // Will be set by the API
});

// Method to like post
postSchema.methods.likePost = function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    return this.save();
  }
  throw new Error('Post already liked by user');
};

// Method to unlike post
postSchema.methods.unlikePost = function(userId) {
  const likeIndex = this.likes.indexOf(userId);
  if (likeIndex === -1) {
    throw new Error('Post not liked by user');
  }
  
  this.likes.splice(likeIndex, 1);
  return this.save();
};

// Method to add comment
postSchema.methods.addComment = function(commentData) {
  const comment = {
    id: mongoose.Types.ObjectId().toString(),
    userId: commentData.userId,
    userName: commentData.userName,
    userProfilePicture: commentData.userProfilePicture,
    content: commentData.content
  };
  
  this.comments.push(comment);
  return this.save();
};

// Method to remove comment
postSchema.methods.removeComment = function(commentId, userId) {
  const commentIndex = this.comments.findIndex(c => c.id === commentId);
  if (commentIndex === -1) {
    throw new Error('Comment not found');
  }
  
  const comment = this.comments[commentIndex];
  if (comment.userId.toString() !== userId.toString()) {
    throw new Error('Not authorized to remove this comment');
  }
  
  this.comments.splice(commentIndex, 1);
  return this.save();
};

// Method to edit post
postSchema.methods.editPost = function(newContent, newImageUrl = null) {
  this.content = newContent;
  if (newImageUrl) {
    this.imageUrl = newImageUrl;
  }
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

// Method to report post
postSchema.methods.reportPost = function(userId, reason) {
  if (!this.isReported) {
    this.isReported = true;
  }
  
  this.reportCount += 1;
  this.reportReasons.push({
    reason,
    reportedBy: userId
  });
  
  return this.save();
};

// Static method to get posts with pagination
postSchema.statics.getPosts = function(limit = 20, offset = 0, postType = null, userId = null) {
  const query = { isApproved: true };
  
  if (postType) {
    query.postType = postType;
  }
  
  if (userId) {
    query.userId = userId;
  }
  
  return this.find(query)
    .populate('userId', 'name profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset);
};

// Static method to search posts
postSchema.statics.searchPosts = function(query, limit = 20) {
  return this.find({
    $and: [
      { isApproved: true },
      {
        $or: [
          { content: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  })
    .populate('userId', 'name profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get trending posts
postSchema.statics.getTrendingPosts = function(limit = 10, days = 7) {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        isApproved: true,
        createdAt: { $gte: dateLimit }
      }
    },
    {
      $addFields: {
        score: {
          $add: [
            { $multiply: [{ $size: '$likes' }, 2] },
            { $multiply: [{ $size: '$comments' }, 1] }
          ]
        }
      }
    },
    { $sort: { score: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 1,
        content: 1,
        imageUrl: 1,
        postType: 1,
        likes: 1,
        comments: 1,
        createdAt: 1,
        'user.name': 1,
        'user.profilePicture': 1,
        score: 1
      }
    }
  ]);
};

// Pre-save middleware to generate comment ID
commentSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = mongoose.Types.ObjectId().toString();
  }
  next();
});

module.exports = mongoose.model('Post', postSchema);
