const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', default: null },

    caption: { type: String, maxlength: 500, default: '' },
    imageUrl: { type: String, default: null },

    // Meal snapshot at time of post
    mealSnapshot: {
      name: { type: String },
      calories: { type: Number },
      healthScore: { type: Number },
      mealCategory: { type: String },
    },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],

    visibility: { type: String, enum: ['public', 'friends'], default: 'public' },
  },
  { timestamps: true },
);

postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
