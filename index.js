const express = require('express');
const bodyParser = require('body-parser');
const db = require('./queries');
const jwt = require('jsonwebtoken');
const middleware = require('./middleware');

class HandlerGenerator {
    login(req, res) {
        let username = req.body.username;
        let password = req.body.password;

        if(username && password){
            db.getLoginInfo(username, (response) => {
                let loginInfo = response[0];
                if(loginInfo && password === loginInfo.password){
                    db.updateLastLoginTime(username);
                    let token = jwt.sign({username:username},process.env.JWT_SECRET,{expiresIn:'24h'});
                    res.json({
                        success : true,
                        message : 'Authentication Successfull!', 
                        token,
                        loggedInUserInfo : {
                            id  : loginInfo.id,
                            name: loginInfo.name,
                            empId: loginInfo.emp_id 
                        }
                    });
                }else{
                    res.sendStatus(403);
                }
            });            
        }else{
            res.sendStatus(400);
        }
    }
}

function main() {
    const app = express();
    const port = process.env.PORT || 3000;
    const handlers = new HandlerGenerator();

    app.use(bodyParser.json());
    app.use(
        bodyParser.urlencoded({
            extended: true,
        })
    );   

    app.get('/', (request, response) => {
        response.json({ info: 'Buzz APIs' });
    });
    app.get('/users', db.getUsers);
    app.get('/buzzes', db.getBuzzList);
    app.get('/participants/:buzzNum', db.getParticipants);

    app.post('/login', handlers.login);
    app.post('/participants/update', middleware.checkToken, db.updateParticipants);

    app.listen(port, () => {
        console.log(`App running on port ${port}.`);
    });
}

main();