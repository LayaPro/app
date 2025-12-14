const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

// Allow CORS for all origins
const cors = require('cors');
app.use(cors());

// Test endpoint
const testController = require('./controllers/testController');
app.get('/test', testController.getTest);

// TODO: Add routes from controllers

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

// NOTE: If deploying to AWS, ensure your Elastic Beanstalk environment's public IP or 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access.

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
