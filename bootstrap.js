var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var morgan = require('morgan');

var app = express();
app.use(session({
    secret: 'v3ryc0mpl!c@t3dk3y',
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge: 30*60*1000}
}));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(morgan("dev"));

app.use('/', express.static(__dirname + '/public'));

module.exports = app;
