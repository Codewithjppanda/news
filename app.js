import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import session from "express-session";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from "dotenv";
import mongoose from "mongoose";

// Load environment variables
dotenv.config();

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Middleware Setup
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Session Setup
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Global variables to hold posts
let posts = [];

// Routes
app.get("/", (req, res) => {
    if (!req.session.userName) {
        res.redirect("/userinfo");
    } else {
        res.render("index", { userName: req.session.userName, posts: posts });
    }
});

app.get("/userinfo", (req, res) => {
    res.render("userinfo");
});

app.post("/userinfo", async (req, res) => {
    const userName = req.body.name;
    const userEmail = req.body.email;

    try {
        // Save the user information to the database
        const newUser = new User({ name: userName, email: userEmail });
        await newUser.save();

        // Store user information in session
        req.session.userName = userName;
        req.session.userEmail = userEmail;

        console.log(`New User: ${userName}, Email: ${userEmail}`);

        res.redirect("/");
    } catch (error) {
        console.error("Error saving user data:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/new", (req, res) => {
    const { title, content } = req.body;
    const newPost = { title, content, id: Date.now().toString() };
    posts.push(newPost); // Add new post to the posts array
    res.redirect("/");
});

app.get("/post/:id", (req, res) => {
    const post = posts.find(post => post.id === req.params.id);
    if (post) {
        res.render("post", { post: post });
    } else {
        res.status(404).send("Post not found");
    }
});

app.post("/delete/:id", (req, res) => {
    const id = req.params.id;
    posts = posts.filter((post) => post.id !== id); // Filter out the deleted post
    res.redirect("/");
});

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 30000 // Increase timeout to 30 seconds
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB connection error:", err));

// Define a schema and model for user data
const userSchema = new mongoose.Schema({
    name: String,
    email: String
});
const User = mongoose.model("User", userSchema);

// Start the server
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
