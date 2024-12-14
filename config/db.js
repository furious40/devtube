const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/devtube');

mongoose.connection.once('open', function() {
    console.log("Connected to MongoDB");
});

mongoose.connection.on('error', function(err) {
    console.log("Error connecting to MongoDB:", err);
});

module.exports = mongoose.connection;