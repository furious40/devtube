const mongoose = require('mongoose');
require('dotenv').config();
var ImageKit = require("imagekit");
const axios = require('axios');
const multer = require('multer')


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);



const conn = mongoose.connection.once('open', function () {
    console.log("Connected to MongoDB");
});

conn.on('error', function (err) {
    console.log("Error connecting to MongoDB:", err);
});




var imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});


module.exports = { conn, imagekit };


const bunnyStreamEndpoint = `https://video.bunnycdn.com/library/${process.env.BUNNY_STREAM_LIBRARY_ID}/videos`


const createVideoEntry = async (fileName) => {
    const response = await axios.post(bunnyStreamEndpoint, { title: fileName }, {
        headers: {
            AccessKey: process.env.BUNNY_STREAM_API_KEY,
            'Content-Type': 'application/json'
        }
    })
    return response.data.guid
}


const storage = multer.memoryStorage()
const upload = multer({ storage })

// Export the configured modules and functions
module.exports = { conn, upload, imageKit, createVideoEntry, bunnyStreamEndpoint }