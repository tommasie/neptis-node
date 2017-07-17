var request = require('request');
var async = require('async');
var fs = require('fs');
var _ = require('lodash');
var app = require('./common');
var config = require('./public/resources/config.json');
var logger = require('./logger');

var serverUrl = config.serverUrl;
var appName = config.webapp;
var serverName = serverUrl  + appName;
var serverNode = config.serverNode;

var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://neo4j:emaldyst@localhost:7474');

//variable to hold the regular expression to match the ids of newlyPOSTed resources
var regex = /\d+$/g;

/**
Index page redirect
**/
app.get('/index', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

/**
Login
**/
app.post('/login_admin', function (req, res) {
    var path = '[' + req.path + '] ';
    logger.info(path, req.method, "client id:", req.body.badgeid);
    var uid = req.body.badgeid;
    var upwd = req.body.password;
    sess = req.session;
    sess.name = uid;
    res.type('application/json');
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Location");
    res.set("Access-Control-Allow-Credentials", true);

    request({
        url: serverName + "curator/" + uid,
        method: "GET",
        json: true,
        headers: [{
            'content-type': 'application/json'
        }]
    }, function (error, response, body) {
        console.log(response.statusCode);
        if (!error & response.statusCode === 200) {
            if (upwd === body.password) {
                logger.info(path, "authentication successful for user", uid);
                /*res.status(200).send({
                    redirect: serverNode + 'curatore'
                })*/
                res.status(200).location(serverNode + 'curatore').end();
                return;
            } else {
                logger.warn(path, "Password incorrect");
                res.sendStatus(500);
                return;
            }
        }
    });
});

/**
Logout
**/
app.get('/logout_admin', function (req, res) {
    logger.info("[/logout-admin] Logging administrator out");
    req.session.destroy();
    res.status(200).location(serverNode).end();
});

app.post('/registration', function (req, res) {
    logger.info("*** POST '/registration'");
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);

    name = req.body.name;
    surname = req.body.surname;
    badgeId = req.body.badgeId;
    email = req.body.email;
    password = req.body.pwd;

    request({
        url: serverName + "curator/",
        method: "POST",
        json: {
            name: name,
            surname: surname,
            badgeid: badgeId,
            email: email,
            password: password
        }
    }, function (error, response, body) {
        logger.info("Request statusCode: " + response.statusCode);
        if (!error & response.statusCode === 204) {
            logger.info("***  get response : ", body);
            res.send({
                redirect: serverName + 'curatore'
            });
            return;
        } else {
            logger.error("registration failed!: ");
            return;
        }
    });
});

app.get('/curatore', function (req, res) {
    sess = req.session;
    if (sess.name)
        res.sendFile(__dirname + '/private/curatore.html');
    else
        res.status(440).redirect(serverNode);
});

app.get('/creation', function (req, res) {
    sess = req.session;
    if (sess.name) {
        res.sendFile(__dirname + '/private/creation.html');
    } else {
        res.status(440).redirect(serverNode);
    }
});

app.get('/modification', function (req, res) {
    sess = req.session;
    if (sess.name)
        res.status(200).sendFile(__dirname + '/private/modification.html');
    else
        res.status(440).redirect(serverNode);
});



/**
Add Museum
**/
app.post('/test', function (req, res) {
    var path = '[' + req.path + '] ';
    logger.info(path, req.method);
    var links = JSON.parse(req.body.links);
    async.each(Object.keys(links), function (area, callback) {
        var obj = links[area];
        var roomA = obj.name;
        var queries = [];
        async.eachOfSeries(obj.list, function (areaB, key, cb) {
            db.cypher({
                query: "MATCH (a:Area {name:{nameA}}), (b:Area {name:{nameB}}) MERGE (a)-[:GOES_TO]->(b)",
                params: {
                    nameA: roomA,
                    nameB: areaB
                }
            }, function (err, res) {
                if (err)
                    logger.error(err);
                else logger.info(res);
                cb();
            });
        }, function (err) {
            if (err)
                logger.error(err);
            callback();
        });
    }, function (err) {
        if (err) res.sendStatus(500);
        else res.sendStatus(204);
    });
});

app.post('/addNewArea', function (req, res) {
    logger.info("*** POST addNewArea ***");
    var museumId = req.body.museumId;
    var areaName = req.body.area;
    var category = req.body.category;

    if (category === 'Museum') {
        request({
            url: serverName + "aream/",
            method: "POST",
            json: {
                name: areaName,
                museum: {
                    id: museumId
                }
            }
        }, function (error, response, body) {
            logger.info("Response code ", response.statusCode);
            if (!error & response.statusCode === 204) {
                logger.info("*** New Area added correctly!");
                res.send({
                    error: 0
                });
            } else {
                logger.info("Something goes wrong in adding new area");
                res.send({
                    error: 1
                });
            }
        });
    }
});

/**
Modify museum area
**/
app.post('/modifyArea', function (req, res) {
    logger.info("*** route modify area ***");
    structure = req.body.category;
    id_area = req.body.areaId;
    name = req.body.areaName;
    id_museum = req.body.museumId;
    logger.info("parametri da richiesta ", structure, " ,", id_area, " ,", name);

    if (structure === 'Museum') {
        request({
            url: serverName + "aream/" + id_area,
            method: "PUT",
            json: {
                museum: {
                    id: id_museum
                },
                id: id_area,
                name: name
            },
            headers: [{
                'content-type': 'application/json'
            }]
        }, function (error, response, body) {
            logger.info("Request statusCode: " + response.statusCode);
            //logger.info("*** response ", response);
            if (!error & response.statusCode === 204) {
                logger.info("*** Update on area of Museum succeded *** ");
                //res.status(response.statusCode);
                res.send({
                    error: 0
                });
                return;
            } else res.send({
                error: 1
            });
        });
    }
});

app.post('/modifyMuseum', function (req, res) {
    logger.info("*** route modify museum ***");
    structure = req.body.category;
    city = req.body.city;
    museumName = req.body.museumName;
    id_museum = req.body.museumId;
    logger.info("parametri da richiesta ", structure, " ,", id_museum, " ,", museumName, " ,", city);

    if (structure === 'Museum') {
        request({
            url: serverName + "museum/" + id_museum,
            method: "PUT",
            json: {
                city: {
                    id: city
                },
                id: id_museum,
                name: museumName
            },
            headers: [{
                'content-type': 'application/json'
            }]
        }, function (error, response, body) {
            logger.info("Request statusCode: " + response.statusCode);
            //logger.info("*** response ", response);
            if (!error & response.statusCode === 204) {
                logger.info("*** Update of Museum succeded *** ");
                //res.status(response.statusCode);
                res.send({
                    error: 0
                });
                return;
            } else res.send({
                error: 1
            });
        });
    }
});

app.post('/disableAttr', function (req, res) {
    path = '[' + req.path + '] ';
    logger.info(path, req.method);
    structure = req.body.struct;
    id_attr = req.body.id_attr;
    name = req.body.name;

    if (structure === 'City') {
        id_city = req.body.id_city;
        request({
            url: serverName + "attractionc/" + id_attr,
            method: "PUT",
            json: {
                city: {
                    id: id_city
                },
                disabled: true,
                id: id_attr,
                name: name
            },
            headers: [{
                'content-type': 'application/json'
            }]
        }, function (error, response, body) {
            logger.info("Request statusCode: " + response.statusCode);
            //logger.info("*** response ", response);
            if (!error & response.statusCode === 204) {
                logger.info("*** Update succeded *** ");
                res.status(response.statusCode);
                //res.send({ response : 'ok'})

                return;
            }

        });
    }
    if (structure === 'Museum') {
        id_areaM = req.body.id_area;
        request({
            url: serverName + "attractionm/" + id_attr,
            method: "PUT",
            json: {
                areaM: {
                    id: id_areaM
                },
                disabled: true,
                id: id_attr,
                name: name
            },
            headers: [{
                'content-type': 'application/json'
            }]
        }, function (error, response, body) {
            logger.info("Request statusCode: " + response.statusCode);
            //logger.info("*** response ", response);
            if (!error & response.statusCode === 204) {
                logger.info("*** Update succeded *** ");
                res.status(response.statusCode);
                //res.send({ response : 'ok'})

                return;
            }

        });
    }
});

app.post('/modifyAttr', function (req, res) {
    logger.info("*** route modify attraction ***");
    structure = req.body.category;
    id_attr = req.body.attractionId;
    name = req.body.attractionName;
    logger.info("parametri da richiesta ", structure, " ,", id_attr, " ,", name);

    if (structure === 'City') {
        id_city = req.body.cityId;
        request({
            url: serverName + "attractionc/" + id_attr,
            method: "PUT",
            json: {
                city: {
                    id: id_city
                },
                disabled: true,
                id: id_attr,
                name: name
            },
            headers: [{
                'content-type': 'application/json'
            }]
        }, function (error, response, body) {
            logger.info("Request statusCode: " + response.statusCode);
            //logger.info("*** response ", response);
            if (!error & response.statusCode === 204) {
                logger.info("*** Update succeded *** ");
                //res.status(response.statusCode);
                res.send({
                    error: 0
                });

                return;
            } else {
                res.send({
                    error: 1
                });
            }

        });
    }
    if (structure === 'Museum') {
        id_areaM = req.body.areaId;
        request({
            url: serverName + "attractionm/" + id_attr,
            method: "PUT",
            json: {
                areaM: {
                    id: id_areaM
                },
                id: id_attr,
                name: name
            },
            headers: [{
                'content-type': 'application/json'
            }]
        }, function (error, response, body) {
            logger.info("Request statusCode: " + response.statusCode);
            //logger.info("*** response ", response);
            if (!error & response.statusCode === 204) {
                logger.info("*** Update on attraction Museum succeded *** ");
                //res.status(response.statusCode);
                res.send({
                    error: 0
                });

                return;
            } else {
                res.send({
                    error: 1
                });
            }

        });
    }
});

module.exports = app;
