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
Add city
**/
app.post('/addCity', function (req, res) {
    var path = '[' + req.path + '] ';
    logger.info(path, req.method);
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
                    res.sendStatus(200);
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
    })
})

app.post('/addMuseum', function (req, res) {
    var path = '[' + req.path + '] ';
    logger.info(path, req.method);
    logger.info(path + "Museum name: ", req.body.museumName);
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

/**
Add OAM
**/
app.post('/addOpenedMuseum', function (req, res) {
    var path = '[' + req.path + '] ';
    logger.info(path, req.method);
    city = req.body.city;
    region = req.body.region;
    museumName = req.body.museumName;
    attractions = JSON.parse(req.body.attractions);
    var id_area;
    var id_museum;
    var id_city;
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
            request({
                url: serverName + "oam/",
                method: "POST",
                json: {
                    name: museumName,
                    city: {
                        id: id_city
                    }
                }
            }, function (error, response, body) {
                if (!error & response.statusCode === 201) {
                    logger.info(path, response.statusCode, "OAM " + museumName + " added");
                    loc = response.headers.location;
                    id = loc.match(regex);
                    id_museum = id[0];
                    logger.info(path, "OAM id:", id_museum);
                    //TODO fix for OAM
                    async.each(Object.keys(attractions), function (area, callback) {
                        request({
                            url: serverName + "aream/",
                            method: "POST",
                            json: {
                                name: attractions[area].name,
                                museum: {
                                    id: id_museum
                                }
                            }
                        }, function (error, response, body) {
                            if (!error && response.statusCode === 201) {
                                logger.info(path, response.statusCode, "Area " + attractions[area].name + " added");
                                loc = response.headers.location;
                                id = loc.match(regex);
                                id_area = id[0];
                                logger.info(path, "Area id:", id_area);
                                db.cypher({
                                    query: "MERGE (:Area {name:{name}, id:{id}})",
                                    params: {
                                        name: attractions[area].name,
                                        id: id_area
                                    }
                                }, function (err, res) {
                                    if (err)
                                        logger.error(path, "Error on area CREATE", err);
                                    else logger.info(path, "Area " + attractions[area].name + " added to Neo4j", res);
                                });
                                for (var i = 0; i < attractions[area].attractions.length; i++) {
                                    var attraction = attractions[area].attractions[i];
                                    attraction.areaOam = {id:id_area};
                                }
                                request({
                                    url: serverName + "attractionm/",
                                    method: "POST",
                                    json: attractions[area].attractions
                                }, function (error, response, body) {
                                    if (!error && response.statusCode === 201) {
                                        logger.info(path, response.statusCode, "Attractions of area " + attractions[area].name + " added");
                                    } else if (response.statusCode === 500) {
                                        logger.error(path, response.statusCode, "Error in adding attractions of area " + attractions[area].name);
                                    } else logger.error(response.statusCode);
                                    //Needed to signal the end of a single iteration of async.each()
                                    callback();
                                });

                            } else logger.error(path, response.statusCode, "Error while adding area " + attractions[area].name);
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
                    logger.info("!-- ERROR in adding museum  --! code: ", response.statusCode);
                    //res.send("Operation failed");
                    return;
                }
            });
            return;
        } else if (response.statusCode === 400) { // city already present
            logger.info("!-- ERROR in adding city --! code: ", response.statusCode);
            res.send({
                error: 1
            });
            return;
        }
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
    } else if (category === 'Opened Museum') {
        request({
            url: serverName + "areaoam/",
            method: "POST",
            json: {
                name: areaName,
                oam: {
                    id: museumId
                }
            }
        }, function (error, response, body) {
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
    if (structure === 'Opened Museum') {
        request({
            url: serverName + "areaoam/" + id_area,
            method: "PUT",
            json: {
                oam: {
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
                logger.info("*** Update succeded *** ");
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
    if (structure === 'Opened Museum') {
        request({
            url: serverName + "oam/" + id_museum,
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
                logger.info("*** Update succeded *** ");
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
    if (structure === 'Opened Museum') {
        id_areaOam = req.body.id_area;
        request({
            url: serverName + "attractionoam/" + id_attr,
            method: "PUT",
            json: {
                areaOam: {
                    id: id_areaOam
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
            if (!error & response.statusCode === 204) {
                logger.info("*** Update succeded *** ");
                res.status(response.statusCode);
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
    if (structure === 'Opened Museum') {
        id_areaOam = req.body.areaId;
        request({
            url: serverName + "attractionoam/" + id_attr,
            method: "PUT",
            json: {
                areaOam: {
                    id: id_areaOam
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
});

app.post('/create-pddl', function (req, res) {
    logger.info("*** POST '/create-pddl': " + req.body.type);
    utype = req.body.type; // {city, museum, oam}
    //var id,uname;
    var id;
    var uname;
    var myurl;
    // var uname = req.body.name; // for example {Rome}
    /******** prendo id museo/citta/oam **********/

    if (utype === 'City') {
        city = req.body.name;
        region = req.body.region;
        uname = req.body.name;
        request({
            url: serverName + "city/" + city + "," + region,
            method: "GET",
            json: true,
            headers: [{
                'content-type': 'application/json'
            }]
        }, function (error, response, body) {
            if (!error & response.statusCode === 200) {
                logger.info('*** Operation GET CITY ID succeded,id: ', body[0].id, '***');
                id = body[0].id;
                var unameLow = uname.toLowerCase().replace(/ /g, "_");
                logger.info("id da variabile ", id);
                myurl = serverName + "attractionc/cityId=" + id;
                fileProblem = "/home/thomas/tesi/problems/city/" + unameLow + ".pddl";
                /* pddl creation */

                request({
                    url: myurl,
                    method: "GET",
                    json: true, // <--Very important!!!
                    headers: [{
                        'content-type': 'application/json'
                    }] // change to Json
                }, function (error, response, body) {
                    logger.info("Request statusCode: " + response.statusCode);
                    if (!error & response.statusCode === 200) {
                        logger.info("Select riuscita: " + utype + "," + uname);
                        // logger.info("response : ",response.body);
                        logger.info("body", body);
                        logger.info("lunghezza body", body.length);
                        /** CODE TO CREATE PROBLEM FILE **/
                        //scrittura su file

                        //start - area
                        //roma - area
                        //colosseo - attrazione

                        var area = unameLow + " - area";
                        var attractions = "";
                        var inside = "";
                        var category = "";

                        for (var i = 0; i < body.length; i++) { //json (and not body) because body is in xml format
                            attractions += body[i].name.toLowerCase().replace(/ /g, "_") + " - attrazione \n";
                            inside += "(inside " + body[i].name.toLowerCase().replace(/ /g, "_") + " " + unameLow + ")\n";
                            category += "(categoria " + body[i].name.toLowerCase().replace(/ /g, "_") + " antico)\n";

                        }

                        var fs = require('fs');
                        fs.writeFile(fileProblem,
                            " ;; *** problema citta *** \n(define (problem visita_citta) \n(:domain neptis) \n(:objects \nmoderno - categoria \nantico - categoria \nstart - area \n" + area + "\n" + attractions + " ) \n;; *** start init part (made by user app) ***\n(:init\n" + inside + "" + category,
                            'utf8',
                            function (err) {
                                if (err) {
                                    return logger.info(err);
                                }
                                logger.info("The problem file: ", uname + ".pddl was created!");
                            });

                        /** END WRITE FILEs operations **/

                        res.send({
                            result: '1'
                        });
                        return;
                    } else {
                        res.send({
                            result: '0'
                        });
                        logger.info("Select error: ", utype + ",", uname);
                        return;
                    }
                });
            } else {
                logger.info("Something goes wrong :( ");
            }
        });
        /* end pddl creation  */
    }

    if (utype === 'Museum') {
        city = req.body.cityName;
        museumName = req.body.museumName;
        region = req.body.region;
        uname = req.body.museumName;
        request({
            url: serverName + "city/" + city + "," + region,
            method: "GET",
            json: true,
            headers: [{
                'content-type': 'application/json'
            }]
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                logger.info("City id taken ", body[0].id);
                id_city = body[0].id;
                request({
                    url: serverName + "museum/" + museumName + "," + id_city,
                    method: "GET",
                    json: true,
                    headers: [{
                        'content-type': 'application/json'
                    }]
                }, function (error, response, body) {
                    if (!error && response.statusCode === 200) {

                        logger.info("---> prova body:", body);

                        logger.info("Museum id taken ", body[0].id);
                        var unameLow = uname.toLowerCase().replace(/ /g, "_");
                        id = body[0].id;
                        // qui va creazione pddl
                        myurl = serverName + "attractionm/museumId=" + id;
                        fileProblem = "/home/thomas/tesi/problems/museum/" + unameLow + ".pddl";

                        request({
                            url: myurl,
                            method: "GET",
                            json: true, // <--Very important!!!
                            headers: [{
                                'content-type': 'application/json'
                            }] // change to Json
                        }, function (error, response, body) {
                            logger.info("Request statusCode: " + response.statusCode);
                            if (!error & response.statusCode === 200) {
                                logger.info("Select riuscita: " + utype + "," + uname);
                                // logger.info("response : ",response.body);
                                logger.info("body", body);
                                logger.info("lunghezza body", body.length);
                                /** CODE TO CREATE PROBLEM FILE **/
                                //scrittura su file

                                //start - area
                                //roma - area
                                //colosseo - attrazione
                                /*   if(nome area = nome museo) uname è area
                                 *   else nome area = area
                                 *
                                 * */
                                var area = "";
                                var attractions = "";
                                var inside = "";
                                var category = "";

                                logger.info("******** area museo", body[0].areaM.name, ".nome museo ", uname)
                                if (body[0].areaM.name === uname) { //if museum has no areas
                                    area = unameLow + "- area";

                                    for (var i = 0; i < body.length; i++) { //json (and not body) because body is in xml format
                                        attractions += body[i].name.toLowerCase().replace(/ /g, "_") + " - attrazione \n";
                                        inside += "(inside " + body[i].name.toLowerCase().replace(/ /g, "_") + " " + unameLow + ")\n";
                                        category += "(categoria " + body[i].name.toLowerCase().replace(/ /g, "_") + " antico)\n";

                                    }

                                } else { //museum has areas

                                    var area_temp = "";
                                    for (var i = 0; i < body.length; i++) {
                                        if (area_temp != body[i].areaM.name.toLowerCase().replace(/ /g, "_") + " - area \n") {
                                            area += body[i].areaM.name.toLowerCase().replace(/ /g, "_") + " - area \n";
                                            area_temp = body[i].areaM.name.toLowerCase().replace(/ /g, "_") + " - area \n";
                                            logger.info("dentro al for,area : ", area);
                                        }

                                        attractions += body[i].name.toLowerCase().replace(/ /g, "_") + " - attrazione \n";
                                        inside += "(inside " + body[i].name.toLowerCase().replace(/ /g, "_") + " " + body[i].areaM.name.toLowerCase().replace(/ /g, "_") + ")\n";
                                        category += "(categoria " + body[i].name.toLowerCase().replace(/ /g, "_") + " antico)\n";

                                    }

                                }

                                /*        var attractions = "";
                                var inside = "";
                                var category = "";


                                for(var i=0; i<body.length; i++){ //json (and not body) because body is in xml format
                                	attractions += body[i].name.toLowerCase().replace(/ /g,"_") + " - attrazione \n";
                                	inside += "(inside "+body[i].name.toLowerCase().replace(/ /g,"_")+" "+areaInside+")\n";
                                	category += "(categoria "+body[i].name.toLowerCase().replace(/ /g,"_")+" antico)\n";

                                } */

                                var fs = require('fs');
                                fs.writeFile(fileProblem,
                                    " ;; *** problema citta *** \n(define (problem visita_citta) \n(:domain neptis) \n(:objects \nmoderno - categoria \nantico - categoria \nstart - area \n" + area + "\n" + attractions + " ) \n;; *** start init part (made by user app) ***\n(:init\n" + inside + "" + category,
                                    'utf8',
                                    function (err) {
                                        if (err) {
                                            return logger.info(err);
                                        }
                                        logger.info("The problem file: ", uname + ".pddl was created!");
                                    });

                                /** END WRITE FILEs operations **/

                                res.send({
                                    result: '1'
                                });
                                return;
                            } else {
                                res.send({
                                    result: '0'
                                });
                                logger.info("Select error: ", utype + ",", uname);
                                return;
                            }
                        });

                        /********************************/
                    } else logger.info("Something goes wrong when taking id museum");
                });
            } else logger.info("Something goes wrong in taking id city ");
        });

    }

    if (utype === 'Opened Museum') {
        city = req.body.cityName;
        museumName = req.body.museumName;
        region = req.body.region;
        uname = req.body.museumName;
        request({
            url: serverName + "city/" + city + "," + region,
            method: "GET",
            json: true,
            headers: [{
                'content-type': 'application/json'
            }]
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                logger.info("City id taken ", body[0].id);
                id_city = body[0].id;
                request({
                    url: serverName + "oam/" + museumName + "," + id_city,
                    method: "GET",
                    json: true,
                    headers: [{
                        'content-type': 'application/json'
                    }]
                }, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        logger.info("-- Opene Museum id taken ", body[0].id);
                        var unameLow = uname.toLowerCase().replace(/ /g, "_");
                        logger.info("-- stringa manipolata ", unameLow);
                        id = body[0].id;
                        // qui va creazione pddl
                        myurl = serverName + "attractionoam/oamId=" + id;
                        fileProblem = "/home/thomas/tesi/problems/oam/" + unameLow + ".pddl";

                        request({
                            url: myurl,
                            method: "GET",
                            json: true, // <--Very important!!!
                            headers: [{
                                'content-type': 'application/json'
                            }] // change to Json
                        }, function (error, response, body) {
                            logger.info("Request statusCode: " + response.statusCode);
                            if (!error & response.statusCode === 200) {
                                logger.info("Select riuscita: " + utype + "," + uname);
                                // logger.info("response : ",response.body);
                                logger.info("body", body);
                                logger.info("lunghezza body", body.length);
                                /** CODE TO CREATE PROBLEM FILE **/
                                //scrittura su file

                                //start - area
                                //roma - area
                                //colosseo - attrazione
                                /*   if(nome area = nome museo) uname è area
                                 *   else nome area = area
                                 *
                                 * */
                                var area = "";
                                var attractions = "";
                                var inside = "";
                                var category = "";

                                logger.info("******** area museo", body[0].areaOam.name, ".nome museo ", uname)
                                if (body[0].areaOam.name === uname) { //if museum has no areas
                                    area = unameLow + "- area";

                                    for (var i = 0; i < body.length; i++) { //json (and not body) because body is in xml format
                                        attractions += body[i].name.toLowerCase().replace(/ /g, "_") + " - attrazione \n";
                                        inside += "(inside " + body[i].name.toLowerCase().replace(/ /g, "_") + " " + unameLow + ")\n";
                                        category += "(categoria " + body[i].name.toLowerCase().replace(/ /g, "_") + " antico)\n";

                                    }

                                } else { //museum has areas

                                    var area_temp = "";
                                    for (var i = 0; i < body.length; i++) {
                                        if (area_temp != body[i].areaOam.name.toLowerCase().replace(/ /g, "_") + " - area \n") {
                                            area += body[i].areaOam.name.toLowerCase().replace(/ /g, "_") + " - area \n";
                                            area_temp = body[i].areaOam.name.toLowerCase().replace(/ /g, "_") + " - area \n";
                                            logger.info("dentro al for,area : ", area);
                                        }

                                        area += body[i].areaOam.name.toLowerCase().replace(/ /g, "_") + " - area \n";
                                        logger.info("dentro al for,area : ", area);
                                        attractions += body[i].name.toLowerCase().replace(/ /g, "_") + " - attrazione \n";
                                        inside += "(inside " + body[i].name.toLowerCase().replace(/ /g, "_") + " " + body[i].areaOam.name.toLowerCase().replace(/ /g, "_") + ")\n";
                                        category += "(categoria " + body[i].name.toLowerCase().replace(/ /g, "_") + " antico)\n";

                                    }

                                }

                                var fs = require('fs');
                                fs.writeFile(fileProblem,
                                    " ;; *** problema citta *** \n(define (problem visita_citta) \n(:domain neptis) \n(:objects \nmoderno - categoria \nantico - categoria \nstart - area \n" + area + "\n" + attractions + " ) \n;; *** start init part (made by user app) ***\n(:init\n" + inside + "" + category,
                                    'utf8',
                                    function (err) {
                                        if (err) {
                                            return logger.info(err);
                                        }
                                        logger.info("The problem file: ", uname + ".pddl was created!");
                                    });

                                /** END WRITE FILEs operations **/

                                res.send({
                                    result: '1'
                                });
                                return;
                            } else {
                                res.send({
                                    result: '0'
                                });
                                logger.info("Select error: ", utype + ",", uname);
                                return;
                            }
                        });

                        /********************************/
                    } else logger.info("Something goes wrong when taking id museum");
                });
            } else logger.info("Something goes wrong in taking id city ");
        });

    }

});

module.exports = app;
