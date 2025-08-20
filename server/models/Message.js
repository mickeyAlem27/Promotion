const mongoose = require('mongoose');

/**
 * Combined Message and Conversation Schema
 * This model handles both direct messages and conversation metadata
 */
const messageSchema = new mongoose.Schema({
  // Conversation identifiers
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    validate: {
      validator: function(participants) {
        // Ensure unique participants and at least 2 participants
        return new Set(participants).size === participants.length && participants.length >= 2;
      },
      message: 'Conversation must have at least 2 unique participants'
    }
  }],
  
  // Message content
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  
  // Message status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  
  // Conversation metadata
  isPartOfThread: {
    type: Boolean,
    default: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  unreadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for thread messages (replies to a message)
messageSchema.virtual('thread', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'parentMessage',
  justOne: false
});

// Indexes for better query performance
messageSchema.index({ participants: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, isRead: 1 });
messageSchema.index({ content: 'text' });

/**
 * Get or create a conversation between two users
 * @param {ObjectId} user1 - First user ID
 * @param {ObjectId} user2 - Second user ID
 * @returns {Promise<Object>} The conversation document
 */
messageSchema.statics.findOrCreateConversation = async function(user1, user2) {
  const participants = [user1, user2].sort();
  
  let conversation = await this.findOne({
    participants: { $all: participants, $size: participants.length },
    isPartOfThread: false
  });
  
  if (!conversation) {
    conversation = await this.create({
      participants,
      sender: user1,
      recipient: user2,
      content: 'Conversation started',
      isPartOfThread: false
    });
  }
  
  return conversation;
};

/**
 * Get messages for a conversation with pagination
 * @param {ObjectId} conversationId - The conversation ID
 * @param {Object} options - Pagination options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Messages per page (default: 20)
 * @returns {Promise<Object>} Paginated messages
 */
messageSchema.statics.getConversationMessages = async function(conversationId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  
  const [messages, total] = await Promise.all([
    this.find({ conversationId, isPartOfThread: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'firstName lastName photo role')
      .populate('recipient', 'firstName lastName photo role'),
    this.countDocuments({ conversationId, isPartOfThread: true })
  ]);
  
  return {
    messages,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

// Create the model
const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
