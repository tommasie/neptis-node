var express = require('express');
var request = require('request');
var url = require('url');
var app = require(__dirname + '/bootstrap');
var config = require(__dirname + '/public/resources/config.json');
var logger = require('./logger');

var serverUrl = config.serverUrl;
var appName = config.webapp;
var serverName = serverUrl  + appName;

var pathName;

var cityRouter = express.Router();
cityRouter.use(function(req,res,next) {
    pathName = '[' + req.baseUrl + '] ';
    logger.info(pathName + req.method + " " + req.ip);
    next();
});
cityRouter.route('/')
    .get(function(req,res) {
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
    })
    .post(function(req,res) {
            var city = req.body.name;
            var region = req.body.region;
            var attractions = JSON.parse(req.body.attractions);

            var id_city;
            request({
                url: serverName + "city/",
                method: "POST",
                json: {
                    name: city,
                    region: region
                }
            }, function (error, response, body) {
                logger.debug(response.statusCode);
                if (!error && response.statusCode === 201) {
                    logger.info(path, response.statusCode, "City " + city + " added");
                    var loc = response.headers.location;
                    var id = loc.match(regex);
                    id_city = id[0];
                    for(var i = 0; i < attractions.length; i++) {
                        attractions[i].city = {id:id_city};
                    }
                    request({
                        url: serverName + "attractionc/",
                        method: "POST",
                        json:attractions
                    }, function (error, response, body) {
                        if (!error & response.statusCode === 204) {
                            logger.info(path, response.statusCode, "Attractions of city " + city + " added");
                            res.sendStatus(201);
                            return;
                        } else {
                            logger.error(path, response.statusCode, "The attractions of city " + city + " could not be added");
                            res.sendStatus(500);
                            return;
                        }
                    });
                    return;
                } else if (response.statusCode === 400) { // city already present
                    logger.error("!-- ERROR in adding city --! code: ", response.statusCode);
                    res.send({
                        error: 1
                    });
                    return;
                }
        });
    });

cityRouter.route('/:city_id')
    .get(function(req,res) {
        cityId = req.params.city_id;
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
    })
    .put(function(req,res) {

    })
    .delete(function(req,res) {

    });

app.use('/cities',cityRouter);

var museumRouter = express.Router();
museumRouter.use(function(req,res,next) {
    pathName = '[' + req.baseUrl + '] ';
    logger.info(pathName + req.method + " " + req.ip);
    next();
});

museumRouter.route('/')
    .get(function(req,res) {
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
                res.send(body);
                return;
            } else {
                logger.info(pathName + "/get_museum fallita!: ");
                return;
            }
        });
    })
    .post(function(req,res) {
        var city = req.body.city;
        var region = req.body.region;
        var museumName = req.body.museumName;
        var attractions = JSON.parse(req.body.attractions);
        var startRoom = req.body.startRoom;
        var endRoom = req.body.endRoom;
        logger.debug("attractions:", JSON.stringify(attractions));
        var id_city;
        var id_museum;
        var id_area;

        _.forEach(attractions.adjacent, function(value) {
            value = value.toLowerCase.replace(/ /g, '_');
        });
        var adj = {};
        for(var i = 0; i < attractions.length; i++) {
            adj[attractions.name.toLowerCase.replace(/ /g, '_')] = attractions.adjacent;
        }
        adj.start = startRoom;
        adj.end = endRoom;

        request({
            url: serverName + "city/",
            method: "POST",
            json: {
                name: city,
                region: region
            }
        }, function (error, response, body) {
            if (!error && response.statusCode === 201) {
                logger.info(path, response.statusCode, "City " + city + " added");
                var loc = response.headers.location;
                var id = loc.match(regex);
                id_city = id[0];
                logger.debug(path, "City id:", id_city);
                request({
                    url: serverName + "museum/",
                    method: "POST",
                    json: {
                        name: museumName,
                        city: {
                            id: id_city
                        }
                    }
                }, function (error, response, body) {
                    if (!error && response.statusCode === 201) {
                        logger.info(path, response.statusCode, "Museum " + museumName + " added");
                        loc = response.headers.location;
                        id = loc.match(regex);
                        id_museum = id[0];
                        logger.debug(path, "Museum id:", id_museum);
                        /*db.cypher({
                            query: "MERGE (:Museum {name:{name}, id:{id}, city:{city}, region:{region}})",
                            params: {
                                name: museumName,
                                id: id_museum,
                                city: city,
                                region: region
                            }
                        }, function (err, res) {
                            if (err)
                                logger.error(path, "Error on museum CREATE", err);
                            else logger.info(path, "Museum added to Neo4j", res);
                        });*/

                        //Manage the adjacencies on a local JSON file
                        var adjPath = __dirname + "/adjacencies/" + city;
                        if(!fs.existsSync(adjPath)) {
                            fs.mkdirSync(adjPath);
                        }
                        fs.writeFileSync(adjPath + "/" + museumName, JSON.stringify(adj),'utf-8');
                        /* since Node is all asynchronous, a normal for cannot be used to
                         * iterate over the areas, since the area variable will immediately get to the last value
                         * in the object before the requests have been fully handled, therefore an async library
                         * was needed to reduce the number of calls to the DB */
                        async.each(attractions, function (area, callback) {
                            request({
                                url: serverName + "aream/",
                                method: "POST",
                                json: {
                                    name: area.name,
                                    museum: {
                                        id: id_museum
                                    }
                                }
                            }, function (error, response, body) {
                                if (!error && response.statusCode === 201) {

                                    logger.info(path, response.statusCode, "Area " + area.name + " added");
                                    loc = response.headers.location;
                                    id = loc.match(regex);
                                    id_area = id[0];
                                    logger.info(path, "Area id:", id_area);

                                    /*db.cypher({
                                        query: "MERGE (:Area {name:{name}, id:{id}})",
                                        params: {
                                            name: attractions[area].name,
                                            id: id_area
                                        }
                                    }, function (err, res) {
                                        if (err)
                                            logger.error(path, "Error on area CREATE", err);
                                        else logger.info(path, "Area " + attractions[area].name + " added to Neo4j", res);
                                    });*/
                                    for (var i = 0; i < area.attractions.length; i++) {
                                        var attraction = area.attractions[i];
                                        attraction.areaM = {id: id_area};
                                    }
                                    logger.debug(JSON.stringify(area.attractions));
                                    request({
                                        url: serverName + "attractionm/",
                                        method: "POST",
                                        json: area.attractions
                                    }, function (error, response, body) {
                                        if (!error && response.statusCode === 201) {
                                            logger.info(path, response.statusCode, "Attractions of area " + area.name + " added");
                                        } else if (response.statusCode === 500) {
                                            logger.error(path, response.statusCode, "Error in adding attractions of area " + area.name);
                                        } else logger.error(response.statusCode);
                                        //Needed to signal the end of a single iteration of async.each()
                                        callback();
                                    });

                                } else logger.error(path, response.statusCode, "Error while adding area " + area.name);
                            });
                            // Callback function for async.each(), called one it has finished the iteration
                        }, function (err) {
                            if (err)
                                res.sendStatus(500);
                            else
                                res.sendStatus(200);
                            return;
                        });

                        return;
                    } else {
                        logger.error(path, response.statusCode, "Error while adding museum " + museumName);
                        return;
                    }
                });
                return;
                return;
            } else if (response.statusCode === 400) {
                logger.error(path, response.statusCode, "Error while adding city " + city);
                res.sendStatus(500);
                return;
            }
        });
    });

museumRouter.route('/:museum_id')
    .get(function(req,res) {
        request({
            url: serverName  + 'attractionm/museumId=' + req.params.museum_id,
            method: "GET",
            json: true,
            headers: [{
                'content-type': 'application/json'
            }]
        }, function(error, response, body) {
            logger.info(pathName + "request statusCode: " + response.statusCode);
            if (!error & response.statusCode === 200) {
                logger.info(pathName + "OK");
                res.status(response.statusCode);
                logger.debug(JSON.stringify(body));
                res.send(body);
            } else {
                res.status(response.statusCode);
                res.send("error /get_attraction");
                logger.info(pathName + "failed!");
            }
        });
    })
    .put(function(req,res) {

    })
    .delete

app.use('/museums',museumRouter);

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

module.exports = app;
