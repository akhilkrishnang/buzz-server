const express = require('express');
const bodyParser = require('body-parser');
const db = require('./queries');
const app = express();
const port = 3000;

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
app.post('/participants/update', db.updateParticipants);

app.listen(port, () => {
    console.log(`App running on port ${port}.`);
});