require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const personRouter = require('./routes/person');
const matchRouter = require('./routes/match');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/person', personRouter);
app.use('/api/match', matchRouter);

// Mount matches route on the person router (POST /api/person/generate for 1v1 matches)
// The route is already in personRouter

const PORT = process.env.PORT || 5000;
const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mern_demo';

mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> {
    console.log('MongoDB connected');
    app.listen(PORT, ()=> console.log('Server running on port', PORT));
  })
  .catch(err => console.error('MongoDB connection error:', err));
