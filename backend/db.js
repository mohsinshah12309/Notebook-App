const mongoose = require('mongoose');

const mongoURI = "mongodb://localhost:27017/notebook"; // Add your database name

const connectToMongo = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB successfully");
    } catch (error) {
        console.error("Connection error:", error);
    }
};


module.exports = connectToMongo;