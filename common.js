var request = require('request');
var app = require(__dirname + '/bootstrap');
var config = require(__dirname + '/public/resources/config.json');
var logger = require('./logger');

var serverUrl = config.serverUrl;
var appName = config.webapp;
var serverName = serverUrl  + appName;

var pathName;

app.get('/get_city', function(req, res) {
    pathName = '[' + req.path + '] ';
    logger.info(pathName + req.method + " " + req.ip);
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);

    request({
        url: serverName + "city",
        method: "GET",
        json: true,
        headers: [{
            'content-type': 'application/json'
        }]

    }, function(error, response, body) {

        logger.info(pathName + "Request statusCode: " + response.statusCode);
        if (!error & response.statusCode === 200) {
            res.status(200).type('json').send(body);
            return;
        } else {
            logger.warn(pathName + "/get_city fallita!: ");
            return;
        }
    });
});

app.get('/get_museum', function(req, res) {
    pathName = '[' + req.path + '] ';
    logger.info(pathName + req.method + " " + req.ip);
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);

    request({
        url: serverName + "museum",
        method: "GET",
        json: true,
        headers: [{
            'content-type': 'application/json'
        }]

    }, function(error, response, body) {

        logger.info(pathName + "Request statusCode: " + response.statusCode);
        if (!error & response.statusCode === 200) {
            //logger.info(pathName + "***  get response : ",body);
            //res.status(response.statusCode);
            //res.send({ response : 'ok'})
            res.send(body);
            return;
        } else {
            //res.status(response.statusCode);
            //res.send({error : 'reg_error'});
            //res.send(body);
            logger.info(pathName + "/get_museum fallita!: ");
            return;
        }
    });
});

app.post('/get_aream', function(req, res) {
    path = '[' + req.path + '] ';
    logger.info(pathName + req.method);
    res.set('Content-Type', 'application/json');
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.set("Access-Control-Allow-Credentials", true);
    museumId = req.body.id;
    logger.info(path, "Museum id:", museumId);

    request({
        url: serverName + "aream/museumId=" + museumId,
        method: "GET",
        json: true,
        headers: [{
            'content-type': 'application/json'
        }]

    }, function(error, response, body) {

        if (!error & response.statusCode === 200) {
            logger.info(pathName + "***  get response : ", body);
            res.status(response.statusCode);
            res.send(body);
            return;
        } else {
            logger.info(pathName + "/get_aream failed!: ");
            return;
        }
    });
});

app.post('/get_attractionm', function(req, res) {
    pathName = '[' + req.path + '] ';
    logger.info(pathName + req.method + " " + req.ip);
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);
    area = req.body.area;
    logger.info(pathName + "id area: ", area);

    request({
        url: serverName + "attractionm/areaId=" + area,
        method: "GET",
        json: true,
        headers: [{
            'content-type': 'application/json'
        }]

    }, function(error, response, body) {

        logger.info(pathName + "Request statusCode: " + response.statusCode);
        if (!error & response.statusCode === 200) {
            logger.info(pathName + "***  get response : ", body);
            res.status(response.statusCode);
            //res.send({ response : 'ok'})
            res.send(body);
            return;
        } else {
            //res.status(response.statusCode);
            //res.send({error : 'reg_error'});
            //res.send(body);
            logger.info(pathName + "/get_attractionm failed!: ");
            return;
        }
    });
});

app.get('/get_oam', function(req, res) {
    pathName = '[' + req.path + '] ';
    logger.info(pathName + req.method + " " + req.ip);
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);

    request({
        url: serverName + "oam",
        method: "GET",
        json: true,
        headers: [{
            'content-type': 'application/json'
        }]

    }, function(error, response, body) {
        logger.info(pathName + "Request statusCode: " + response.statusCode);
        if (!error & response.statusCode === 200) {
            //logger.info(pathName + "***  get response : ",body);
            //res.status(response.statusCode);
            //res.send({ response : 'ok'})
            res.send(body);
            return;
        } else {
            //res.status(response.statusCode);
            //res.send({error : 'reg_error'});
            //res.send(body);
            logger.info(pathName + "/get_oam fallita!: ");
            return;
        }
    });
});

app.post('/get_areaOam', function(req, res) {
    pathName = '[' + req.path + '] ';
    logger.info(pathName + req.method);
    res.set('Content-Type', 'application/json');
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.set("Access-Control-Allow-Credentials", true);
    var museumId = req.body.id;
    logger.info(pathName + "[/get_areaOam] OAM id: ", museumId);

    request({
        url: serverName + "areaoam/museumId=" + museumId,
        method: "GET",
        json: true,
        headers: [{
            'content-type': 'application/json'
        }]

    }, function(error, response, body) {

        if (!error & response.statusCode === 200) {
            logger.info(pathName + "***  get response : ", body);
            res.status(response.statusCode);
            //res.send({ response : 'ok'})
            res.send(body);
            return;
        } else {
            //res.status(response.statusCode);
            //res.send({error : 'reg_error'});
            //res.send(body);
            logger.info(pathName + "/get_areaOam failed!: ");
            return;
        }
    });
});

app.post('/get_attractionOam', function(req, res) {
    pathName = '[' + req.path + '] ';
    logger.info(pathName + req.method + " " + req.ip);
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);
    area = req.body.area;
    logger.info(pathName + "id area: ", area);

    request({
        url: serverName + "attractionoam/areaId=" + area,
        method: "GET",
        json: true,
        headers: [{
            'content-type': 'application/json'
        }]

    }, function(error, response, body) {

        logger.info(pathName + "Request statusCode: " + response.statusCode)
        if (!error & response.statusCode === 200) {
            logger.info(pathName + "***  get response : ", body);
            res.status(response.statusCode);
            //res.send({ response : 'ok'})
            res.send(body);
            return;
        } else {
            //res.status(response.statusCode);
            //res.send({error : 'reg_error'});
            //res.send(body);
            logger.info(pathName + "/get_attractionOam failed!: ");
            return;
        }
    });
});

app.get('/get_attractionC', function(req, res) {
    pathName = '[' + req.path + '] ';
    logger.info(pathName + req.method + " " + req.ip);
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);
    cityId = req.body.city;
    logger.info(pathName + "id city: ", cityId);
    request({
        url: serverName + "attractionc/cityId=" + cityId,
        method: "GET",
        json: true,
        headers: [{
            'content-type': 'application/json'
        }]
    }, function(error, response, body) {
        logger.info(pathName + "Request statusCode: " + response.statusCode);
        if (!error & response.statusCode === 200) {
            logger.info(pathName + "***  get response : ", body);
            res.status(response.statusCode);
            //res.send({ response : 'ok'})
            res.send(body);
            return;
        } else {
            //res.status(response.statusCode);
            //res.send({error : 'reg_error'});
            //res.send(body);
            logger.info(pathName + "/get_attractionC failed!: ");
            return;
        }

    });
});

module.exports = app;
