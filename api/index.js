import express from 'express';
import path from 'path';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectRedis from 'connect-redis';
import redis from 'redis';
import Post from '../models/post.js';
import User from '../models/user.js';

dotenv.config();

const RedisStore = connectRedis(session);
const redisClient = redis.createClient({
    url: process.env.REDIS_URL, // Assuming Redis URL in .env
    legacyMode: true
});
redisClient.connect().catch(console.error);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: true,
        httpOnly: true,
        maxAge: 3600000 // 1 hour
    }
}));

app.get('/', async (req, res) => {
    if (!req.session.userName) {
        res.redirect('/userinfo');
    } else {
        try {
            const posts = await Post.find({ user: req.session.userId });
            res.render('index', { userName: req.session.userName, posts });
        } catch (error) {
            next(error); // Use next to handle errors
        }
    }
});

app.get('/post/:id', async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post) {
            res.render('post_readonly', { post, userName: req.session.userName || 'Guest' });
        } else {
            res.status(404).send('Post not found');
        }
    } catch (error) {
        next(error);
    }
});

app.get('/userinfo', (req, res) => {
    res.render('userinfo');
});

app.post('/userinfo', async (req, res, next) => {
    const { name, email } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            req.session.userName = name;
            req.session.userId = user._id;
        } else {
            user = new User({ name, email });
            await user.save();
            req.session.userName = name;
            req.session.userId = user._id;
        }
        res.redirect('/');
    } catch (error) {
        next(error);
    }
});

app.post('/new', async (req, res, next) => {
    const { title, content } = req.body;
    try {
        const newPost = new Post({ title, content, user: req.session.userId });
        await newPost.save();
        res.redirect('/');
    } catch (error) {
        next(error);
    }
});

app.post('/delete/:id', async (req, res, next) => {
    try {
        const post = await Post.findOne({ _id: req.params.id, user: req.session.userId });
        if (post) {
            await post.deleteOne();
            res.redirect('/');
        } else {
            res.status(403).send('Forbidden: You can only delete your own posts');
        }
    } catch (error) {
        next(error);
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).send('Internal Server Error');
});

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

export default app;
