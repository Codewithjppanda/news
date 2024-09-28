import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Post from './models/post.js'; // Correct Import for Post model
import User from './models/user.js'; // Import the User model

// Load environment variables
dotenv.config();

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Middleware Setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Session Setup
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Routes
// Modified '/' route to allow public access to posts
app.get('/', async (req, res) => {
    try {
        const posts = await Post.find(); // Retrieve all posts without requiring user authentication
        res.render('index', { userName: req.session.userName || 'Guest', posts: posts });
    } catch (error) {
        console.error('Error retrieving posts:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/userinfo', (req, res) => {
    res.render('userinfo');
});

app.post('/userinfo', async (req, res) => {
    const userName = req.body.name;
    const userEmail = req.body.email;

    try {
        let user = await User.findOne({ email: userEmail });

        if (user) {
            req.session.userName = userName;
            req.session.userId = user._id; // Store the user's ID in the session
            res.redirect('/');
        } else {
            user = new User({ name: userName, email: userEmail });
            await user.save();

            req.session.userName = userName;
            req.session.userId = user._id; // Store the new user's ID in the session
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error saving user data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Secured route to create a new post
app.post('/new', async (req, res) => {
    if (!req.session.userId) {
        return res.status(403).send('Forbidden: You must be logged in to create a post.');
    }
    const { title, content } = req.body;
    try {
        const newPost = new Post({
            title,
            content,
            user: req.session.userId // Associate the post with the current user
        });
        await newPost.save();
        res.redirect('/');
    } catch (error) {
        console.error('Error saving post:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Modified to allow public access to view individual posts
app.get('/post/:id', async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.params.id });
        if (post) {
            res.render('post', { post: post, userName: req.session.userName || 'Guest' });
        } else {
            res.status(404).send('Post not found');
        }
    } catch (error) {
        console.error('Error retrieving post:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Secured delete route to ensure only the post owner can delete
app.post('/delete/:id', async (req, res) => {
    if (!req.session.userId) {
        return res.status(403).send('Forbidden: You must be logged in to delete a post.');
    }
    try {
        const post = await Post.findOne({ _id: req.params.id, user: req.session.userId });

        if (post) {
            await post.deleteOne();
            res.redirect('/');
        } else {
            res.status(403).send('Forbidden: You can only delete your own posts');
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 30000 // Increase timeout to 30 seconds
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Start the server
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
