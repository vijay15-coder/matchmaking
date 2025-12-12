require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Routers
const personRouter = require('./routes/person');
const matchRouter = require('./routes/match');

const app = express();

const cors = require("cors");

app.use(cors({
    origin: [
        "*",
        "https://matchmaking-u9a9.vercel.app"   // your frontend URL
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/person', personRouter);
app.use('/api/match', matchRouter);

// Environment Variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Check if missing Mongo URI (helpful for Render)
if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is missing from .env!");
  process.exit(1);
}

// Connect to MongoDB Atlas
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
  });
