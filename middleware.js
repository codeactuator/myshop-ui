// middleware.js
module.exports = (req, res, next) => {
    // Allow all origins for simplicity in development
    res.header('Access-Control-Allow-Origin', '*');
    // Allow specific headers
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    // Allow specific methods, including PATCH
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
};