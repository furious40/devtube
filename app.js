const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const mongodb = require('./lib/db')














app.get('/api', function (req, res) {
    res.send('Welcome');
});

app.listen('3000');