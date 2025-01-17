const jwt = require('jsonwebtoken');

const checkToken = (req, res, next) => {
    let token = req.headers['x-access-token'] || req.headers['authorization']; //Express Headers
    if(token){
        if(token.startsWith('Bearer ')){
            //Remove 'Bearer ' from string
            token = token.slice(7,token.length)
        }
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if(err){
                return res.json({
                    success: false,
                    message: 'Token is not valid'
                });
            }else{
                req.decoded = decoded;
                next();
            }
        });
    } else{
        return res.json({
            success: false,
            message: 'Auth token is not supplied'
        });
    }
}

module.exports = {
    checkToken
}