const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const axios = require("axios"); // Import Axios
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const PORT = 3065;

app.use(bodyParser.json());

// Your database logic for user authentication (e.g., Prisma, Mongoose, etc.)
const mockUsers = [
  {
    id: 1,
    username: "john",
    passwordHash:
      "$2b$10$1fENQYc7FmwX34zjP3e7cO7M9Oydyw33BU68TsA1Kmo.9zhcIl4uy",
  }, // bcrypt hash of "password1"
  {
    id: 2,
    username: "mark",
    passwordHash:
      "$2b$10$2NDa.QHCgs9ltHH5TtB.o.Wi2Wi3ycA8nziu7qRv4UPZm8Fmr/eBC",
  }, // bcrypt hash of "password2"
  {
    id: 3,
    username: "luke",
    passwordHash:
      "$2b$10$5TZlyuxDb3L.z/qr7G0iiekmM1au.bAYnZlCvwAmH9KIf26EGLE9u",
  }, // bcrypt hash of "password3"
  {
    id: 4,
    username: "matthew",
    passwordHash:
      "$2b$10$h4xUERMTue8qWj5JAXpTFOMdaaBf/h6c3W7BxUzVwt2ukd5vDhYb2",
  },
  // Add more users as needed
];

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username
    const user = await prisma.user.findFirst({
      where: {
        username: username,
      },
    });

    console.log("User:", user); // Log user object

    if (!user || typeof password !== "string" || !user.password) {
      console.log("Invalid username, password, or password hash");
      return res.status(401).json({ message: "Invalid username or password" });
    }

    console.log("Password Hash:", user.password); // Log password hash

    if (!bcrypt.compareSync(password, user.password)) {
      console.log("Invalid username or password");
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      "secretkey",
      { expiresIn: "1h" }
    );

    // Send token in the response
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Missing token" });
  }

  jwt.verify(token, "secretkey", (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    req.user = decoded; // Attach user information to request
    next();
  });
};

app.get("/api/posts", async (req, res) => {
  try {
    const posts = await prisma.post.findMany();
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Define endpoint to get a specific post by ID
app.get("/api/posts/:id", async (req, res) => {
  const postId = parseInt(req.params.id);

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST endpoint with token requirement
app.post("/api/posts", verifyToken, async (req, res) => {
  // Ensure that req.user contains valid user information from the token
  const { userId } = req.user;

  try {
    // Access the request body for data
    const { title, content } = req.body;

    // Create a new post associated with the user
    const newPost = await prisma.post.create({
      data: {
        title,
        content,
        userId,
      },
    });

    res.json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT endpoint with token requirement
app.put("/api/posts/:id", verifyToken, async (req, res) => {
  // Ensure that req.user contains valid user information from the token
  const { userId } = req.user;
  const postId = parseInt(req.params.id);

  try {
    // Access the request body for updated data
    const { title, content } = req.body;

    // Check if the post exists and is associated with the user
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost || existingPost.userId !== userId) {
      return res.status(404).json({ error: "Post not found or unauthorized" });
    }

    // Update the post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title,
        content,
      },
    });

    res.json({ message: "Post updated successfully", post: updatedPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE endpoint with token requirement
app.delete("/api/posts/:id", verifyToken, async (req, res) => {
  // Ensure that req.user contains valid user information from the token
  const { userId } = req.user;
  const postId = parseInt(req.params.id);

  try {
    // Check if the post exists and is associated with the user
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost || existingPost.userId !== userId) {
      return res.status(404).json({ error: "Post not found or unauthorized" });
    }

    // Delete the post
    await prisma.post.delete({
      where: { id: postId },
    });

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
