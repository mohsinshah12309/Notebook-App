const express = require('express');
var cors=require('cors')

const connectToMongo = require('./db');
const app = express();
const port = 5000; // Changed to match your request port
const notesRouter = require('./routes/notes');
app.use(cors())

// Middleware
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes); // Proper route mounting
app.use('/api/notes', notesRouter); // assuming you've imported it as notesRouter
// Start server
app.listen(port, () => {
  console.log(`Notebok backend Server running on port ${port}`);
});

connectToMongo();
