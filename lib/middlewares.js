const mongoose = require('mongoose');

const checkDBConnection = (req,res,next) => {
    if(mongoose.connection.readyState === 1) {
        next();
    } else {
        res.status(500).send('Database connection failed');
    }
}

const isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/');
    }
}

function asyncHandler(fn) {
    return function (req, res, next) {
        return Promise
        .resolve(fn(req, res, next))
        .catch(next);


    }
}


module.exports = {
    checkDBConnection,
    checkChannel,
    isLoggedIn,
    asyncHandler
};