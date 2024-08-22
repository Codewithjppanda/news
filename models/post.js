import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    title: String,
    content: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Reference to the User model
});

const Post = mongoose.model('Post', postSchema);

export default Post;
