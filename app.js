import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import session from "express-session";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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
        res.redirect("/user-info");
    } else {
        res.render("index", { userName: req.session.userName, posts: posts });
    }
});

app.get("/user-info", (req, res) => {
    res.render("user-info");
});

app.post("/user-info", (req, res) => {
    const userName = req.body.name;
    const userEmail = req.body.email;

    // Save the user information to a file (optional)
    const userDataPath = path.join(__dirname, "userData.txt");
    fs.writeFileSync(userDataPath, `${userName}\n${userEmail}`);

    // Store user information in session
    req.session.userName = userName;
    req.session.userEmail = userEmail;

    // Log user information to the terminal
    console.log(`New User: ${userName}, Email: ${userEmail}`);

    res.redirect("/");
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

// Start the server
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
