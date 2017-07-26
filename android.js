
//"use strict";

var request = require('request');
var fs = require('fs');
var async = require('async');
var shelljs = require('shelljs');
var _ = require('lodash');
var LineByLineReader = require('line-by-line');
var app = require('./curatore');
var logger = require('./logger');
var config = require('./public/resources/config.json');

//variable to hold the regular expression to match the ids of newlyPOSTed resources
var regex = /\d+$/g;

var serverUrl = config.serverUrl;
var appName = config.webapp;
var serverName = serverUrl  + appName;

var pathName;

/**
User login
**/
app.post('/login_user', function(req, res) {
    pathName = '[' + req.path + '] ';
    logger.info(pathName + "%s login attempt: %s", req.method, req.body.mail);
    var umail = req.body.mail;
    var upwd = req.body.password;
    sess = req.session;
    sess.name = umail;
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);

    //2)web server makes a get to glassfish
    //3)Check and send response packet back to Android App
    request({
        url: serverName + "tourist/" + umail,
        method: "GET",
        json: true,
        headers: [{
            'content-type': 'application/json'
        }]
    }, function(error, response, body) {
        if (error) {
            logger.error(pathName + "The data provider may be down");
            res.status(500).end();
            res.send({
                error: 1
            });
            return;
        }
        if (!error & response.statusCode === 200) {
            if (umail === body.email) {
                if (upwd === body.password) {
                    logger.info(pathName + "successful authentication, user: %s", umail);
                    res.send({
                        response: 'ok',
                        user: body.name
                    });
                    return;
                } else {
                    res.status(204).end();
                    res.send({
                        error: 1
                    });
                    logger.info(pathName + "incorrect password, user: %s", umail);
                    return;
                }
            } else {
                logger.info(pathName + "authentication failed, user: %s", umail);
                res.status(500).end();
                return;
            }
        } else if (!error & response.statusCode === 204) {
            logger.info(pathName + "user not found: %s", umail);
            res.status(204).end();
            return;

        } else if (!error & response.statusCode === 500) {
            logger.info(pathName + "HTTP code 500: Internal Server Error");
            res.status(500).end();
            return;
        }
    });
});

/**
Register new user
**/
app.post('/user_registration', function(req, res) {
    pathName = '[' + req.path + '] ';
    logger.info(pathName + "POST registration request: %s", req.body.mail);
    var uname = req.body.name;
    var username = req.body.surname;
    var umail = req.body.mail;
    var upwd = req.body.password;
    res.setHeader('Content-Type', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);

    //2)web server makes a post to glassfish

    request({
        url: serverName + "tourist",
        method: "POST",
        json: {
            name: uname,
            surname: username,
            email: umail,
            password: upwd
        }
    }, function(error, response, body) {
        if (!error & response.statusCode === 201) {
            logger.info(pathName + "successful registration, user: %s", umail);
            res.status(response.statusCode);
            res.send({
                response: 'ok'
            });
            return;
        } else {
            res.status(response.statusCode);
            res.send({
                error: 1
            });
            logger.info(pathName + "failed registration, user: %s " + umail);
            return;
        }
    });
});

app.post('/compute-plan-city', function(req, res) {
    pathName = '[' + req.path + '] ';
    var umail = req.body.mail;
    var name = req.body.type; // for example {Rome}
    uname = name.toLowerCase().replace(/ /g, "_");
    var uid = req.body.id; //1 = roma
    var visits = req.body.number_visits;
    var must = req.body.must; //must
    var exclude = req.body.exclude; //exclude
    var lat = req.body.lat;
    var lon = req.body.lon;
    var dd = req.body.data;
    var travel_mode = req.body.travel_mode;

    var tr_mode;
    if (travel_mode === "Walking")
        tr_mode = "walking";
    else if (travel_mode === "Driving")
        tr_mode = "driving";
    else if (travel_mode === "Public Transport")
        tr_mode = "transit";

    var attractionsArray = {};

    var problemFile = "/home/thomas/tesi/problems/city/" + uname + "_problem" + ".pddl";
    var domainFile = "/home/thomas/tesi/problems/city/" + uname + "_domain" + ".pddl";

    var problemData;

    logger.info(pathName + "POST, user: %s", umail);
    res.setHeader('Content-Type', 'application/json');

    var attractionsCUrl = serverName + "attractionc/cityId=" + uid;
    request({
        url: attractionsCUrl,
        method: "GET",
        json: true,
        headers: [{
            'content-type': 'application/json'
        }]
    }, function (error, response, body) {
        if (!error & response.statusCode === 200) {
            for (let i = 0; i < body.length; i++) {
                if(!(_.includes(exclude, body[i].id.toString())))
                    attractionsArray[body[i].id] = body[i];
            }

            //Write problem.pddl
            problemData = "(define (problem Visit) (:domain City)\n\t(:objects\n\t\tstart ";

            _.forIn(attractionsArray, function(value, key) {
                problemData += "top_" + key + " ";
            });
            problemData += "- topology_state\n\t\t";

            for(let i = 0; i <= visits; i++)
                problemData += "v" + i + " ";
            problemData += "- visit_state\n\t\t";

            _.forIn(attractionsArray, function(value, key) {
                problemData += "att_" + key + " ";
            });
            problemData += "- attraction\n\t)\n\t";

            problemData += "(:init\n\t\t(cur_state start)\n\t\t(cur_state v0)\n\n\t\t(= (total-cost) 0)\n\t)\n\n\t";
            problemData += "(:goal\n\t\t(and\n\t\t\t(cur_state v" + visits + ")\n\t\t\t";
            _.forEach(must, function(attrId) {
                problemData += "(visited att_" + attrId + ")\n\t\t";
            });
            problemData += "\n\t\t)\n\t)\n\t(:metric minimize (total-cost))\n)";
            //TODO add excluded attractions
            fs.writeFile(problemFile,
                problemData,
                'utf8',
                function (err) {
                    if (err) {
                        logger.err(err);
                    }
                    logger.info("The problem file: ", uname + "_problem.pddl was created!");
            });

            //Write domain.pddl
            var domainHeader = "(define (domain City)\n\t(:requirements :typing :equality)\n\t(:types topology_state visit_state - state attraction)\n\t" +
                    "(:predicates\n\t\t(cur_state ?s - state)\n\t\t(visited ?a - attraction)\n\t)\n\t(:functions\n\t\t(total-cost)\n\t)\n\t";

            var attractionsTimeMap = {};
            async.series([
                //Write the header of the domain file
                function(callback) {
                    fs.writeFileSync(domainFile, domainHeader, 'utf8');
                    logger.info("The domain file: ", uname + "_domain.pddl was created!");
                    callback();
                },
                //Gather sensing data from the DB
                function(callback) {
                    //** SENSING PART **
                    // -- T CODA
                    var urlSensing = serverName + "sensing/cityId=" + uid;
                    request({
                        url: urlSensing,
                        method: "GET",
                        json: true,
                        headers: [{
                                'content-type': 'application/json'
                            }]
                    }, function(error,response, body) {
                        //body content: [{attractionM:{}, value:double}]
                        if (error) {
                            logger.err(error);
                            callback(error);
                        }
                        if (!error & response.statusCode === 200) {
                            string = "";
                            for (let i = 0; i < body.length; i++) {
                                let id = body[i].attractionC.id;
                                let cost = parseInt(Math.round(parseFloat(body[i].value)),10);
                                for (let j = 0; j < visits; j++) {
                                    string += "(:action visit-v" + j + "-" + id + "\n\t\t";
                                    string += ":precondition (and (cur_state top_" + id + ") (cur_state v" + j + ") (not (visited att_" + id + ")))\n\t\t";
                                    string += ":effect (and (cur_state v" + (j + 1) + ") (not (cur_state v" + j + ")) (visited att_" + id +") (increase (total-cost) " + cost +"))\n\t)\n\t";
                                }
                            }
                            fs.appendFileSync(domainFile, string, 'utf-8');
                            callback();
                        } else {
                            res.sendStatus(500);
                            //callback(error);
                        }
                    });
                },
                //Write the rest of the domain file
                function(callback) {
                    var sorg, dest;
                    var added = {};
                    _.forIn(attractionsArray, function(value, key) {
                        logger.debug(value);
                        distanceFromStart2(lat, lon, value, umail);
                        added[key] = [];
                        _.forIn(attractionsArray, function(value2, key2) {
                            if(key !== key2)
                                if(!(_.includes(added[key2], key)))
                                    distanceBetweenAttractions2(value, value2);
                        });
                    });

                    setTimeout(callback,1500);

                    function distanceBetweenAttractions2(loc1, loc2) {
                        var apiKey = ' AIzaSyCvJCBmyIVGAPPJYJqjMobgZ5aQfT6CRmQ ';
                        reqUrl = "https://maps.googleapis.com/maps/api/distancematrix/json?origins=" + loc1.latitude + "," + loc1.longitude;
                        reqUrl += "&destinations=" + loc2.latitude + "," + loc2.longitude;
                        reqUrl += "&language=it-IT&mode=" + tr_mode + "&key=" + apiKey;
                        request({
                            url: reqUrl,
                            method: "POST",
                            json: true,
                            headers: [{
                                'content-type': 'application/json'
                            }]
                        }, function(error, response, body) {
                            if (!error & response.statusCode === 200) {
                                if (body.status === 'OK') {
                                    var time = body.rows[0].elements[0].duration.value;
                                    time = +time;
                                    var minutes = Math.ceil(time / 60);
                                    //TODO
                                    //addTmoveAtCity(sorgId, destId, minutes, dd);
                                    var string;
                                    string = "(:action move-" + loc1.id + "-" + loc2.id + "\n\t\t";
                                    string += ":precondition (cur_state top_" + loc1.id + ")\n\t\t";
                                    string += ":effect (and (cur_state top_" + loc2.id + ") (not(cur_state top_" + loc1.id + ")) ";
                                    string += "(increase (total-cost) " + minutes + "))\n\t)\n\t";
                                    string = "(:action move-" + loc2.id + "-" + loc1.id + "\n\t\t";
                                    string += ":precondition (cur_state top_" + loc2.id + ")\n\t\t";
                                    string += ":effect (and (cur_state top_" + loc1.id + ") (not(cur_state top_" + loc2.id + ")) ";
                                    string += "(increase (total-cost) " + minutes + "))\n\t)\n\t";
                                    fs.appendFileSync(domainFile, string, 'utf8');
                                }
                            } else {
                                logger.info(pathName + "google API failed!: ");
                                return callback({err:"err"});
                            }
                        });
                    }

                    function distanceFromStart2(lat, long, destination, umail) {
                        var apiKey = ' AIzaSyCvJCBmyIVGAPPJYJqjMobgZ5aQfT6CRmQ ';
                        var reqUrl = "https://maps.googleapis.com/maps/api/distancematrix/json?origins=" + lat + "," + long;
                        reqUrl += "&destinations=" + destination.latitude + "," + destination.longitude;
                        reqUrl += "&language=it-IT&mode=" + tr_mode + "&key=" + apiKey;
                        request({
                            url: reqUrl,
                            method: "POST",
                            json: true,
                            headers: [{
                                'content-type': 'application/json'
                            }]
                        }, function(error, response, body) {
                            logger.debug(response.statusCode);
                            if (!error & response.statusCode === 200) {
                                if (body.status === 'OK') {
                                    var time = body.rows[0].elements[0].duration.value;
                                    time = +time;
                                    var minutes = Math.ceil(time / 60);
                                    var string;
                                    string = "(:action move-start-" + destination.id + "\n\t\t";
                                    string += ":precondition (cur_state start)\n\t\t";
                                    string += ":effect (and (cur_state top_" + destination.id + ") (not(cur_state start)) ";
                                    string += "(increase (total-cost) " + minutes + "))\n\t)\n\t";
                                    fs.appendFileSync(domainFile,string,'utf8');
                                }
                            }
                        });
                    }
                },
                //write the closing bracket of the domain file
                function(callback) {
                    fs.appendFileSync(domainFile, "\n)", 'utf-8');
                    logger.info("Domain computed");
                    callback();
                },
                //Call the planner
                function(callback) {
                    goalAndPlanner();
                    callback();
                }
            ], function(err) {
                if(err) {
                    logger.info(err);
                    res.send(500).end();
                    return;
                }
            });
        }
    });

    //--------------------------------------------------------------------------------------------------------
    function goalAndPlanner() {

            shelljs.cd('/home/thomas/tesi/planners/downward');
            logger.debug("domain file:", domainFile);
            logger.debug("problem file:", problemFile);
            var solutionOutput = "/home/thomas/tesi/planners/solution/" + uname + ".sol";
            var ff = " --heuristic \"hff=ff()\" --search \"lazy_greedy([hff], preferred=[hff])\"";
            var astar = " --search \"astar(blind())\"";
            var exec_string = "./fast-downward.py --build release64 ";
            exec_string += domainFile + " " + problemFile + ff;
            exec_string += " > " + solutionOutput;
            logger.debug("exec string:", exec_string);
            //shelljs.exec(exec_string, {silent:true}, function(status, output) {
            shelljs.exec(exec_string, function(status, output) {
                logger.debug(output);
                setTimeout(function() {
                    logger.info("T I M E O U T _ R E A C  H E D !");
                }, 10000);
                if (status !== 0) {
                    res.status(500).end();
                    return;
                }
                lr = new LineByLineReader(solutionOutput);
                lr.on('error', function(err) {
                    logger.error(" 'err' contains error object x");
                    return;
                });

                var visits = [];
                lr.on('line', function(line) {
                    if(line.includes("visit")) {
                        visits.push(line.split('-')[2].split(' ')[0]);
                    }
                });

                lr.on('end', function() {
                    var outputList = [];
                    var outputObject = {
                        type : "city",
                        name: name,
                        route : outputList
                    };

                    for(let i = 0; i < visits.length; i++) {
                        var attraction = attractionsArray[+visits[i]];
                        var obj = {
                            name: attraction.name,
                            coordinates: {latitude: attraction.latitude, longitude: attraction.longitude},
                            radius: attraction.radius,
                            rating: attraction.rating,
                            id: attraction.id
                        }
                        outputList.push(obj);
                    }
                    // All lines are read, file is closed now.
                    logger.info("End");
                    logger.debug("ready: " + JSON.stringify(outputObject));
                    res.status(200);
                    res.send(JSON.stringify(outputObject));

                    shelljs.exec('rm ' + solutionOutput, function(status, output) {
                        if (status)
                            logger.debug("error during delete solution file");
                        else logger.debug("file solution deleted successfully");
                    });
                    return;
                });

            }); //fine exec

    } //fine Goal&Planner
}); //fine plan

app.post('/compute-plan-museum', function(req, res) {
    pathName = '[' + req.path + '] ';

    var umail = req.body.mail;
    var name = req.body.type; // for example {Rome}
    var uname = name.toLowerCase().replace(/ /g, "_");
    var uid = req.body.id; //1 = id museo
    var visits = req.body.number_visits;

    var must = req.body.must; //must
    var exclude = req.body.exclude; //exclude
    logger.debug(JSON.stringify(exclude));

    //Proper room management
    var rooms = {};
    var roomsName2Id = {};
    var attr2room = {};
    var roomIds = {};
    var adjacencies = {};

    var attractionsMap = {};

    var problemFile = "/home/thomas/tesi/problems/museum/" + uname + "_problem.pddl";
    var domainFile = "/home/thomas/tesi/problems/museum/" + uname + "_domain.pddl";

    logger.info(pathName, "POST, user: %s", umail);
    res.setHeader('Content-Type', 'application/json');

    var attractionsMUrl = serverName + "attractionm/museumId=" + uid;
    request({
        url: attractionsMUrl,
        method: "GET",
        json: true,
        headers: [{
            'content-type': 'application/json'
        }]
    }, function (error, response, body) {
        if (!error & response.statusCode === 200) {
            var attractions = [];
            for (let i = 0; i < body.length; i++) {
                //Include the attraction only if not in the 'exclude' list
                if(!(_.includes(exclude, body[i].id.toString()))) {
                    var a = {
                        id : body[i].id,
                        name : body[i].name,
                        rating : body[i].rating
                    };
                    attractionsMap[body[i].id] = a;
                    attractions.push(body[i]);
                }
            }

            var adjPath = __dirname + "/adjacencies/" + attractions[0].areaM.museum.city.name + "/" + attractions[0].areaM.museum.name;
            var json = fs.readFileSync(adjPath,'utf-8');
            var adj = JSON.parse(json);
            request({
                url: serverName + "adj/museumId="+uid,
                    method: "GET"
            }, function(req,res,body) {
                adjacencies = JSON.parse(body);
                //Write problem.pddl
                problemData = "(define (problem Visit) (:domain Museum)\n\t(:objects\n\t\tstart ";

                for (let i = 0; i < attractions.length; i++) {
                    var areaName = attractions[i].areaM.name.toLowerCase().replace(/ /g, '_');
                    if(roomsName2Id[areaName] === undefined)
                        roomsName2Id[areaName] = attractions[i].areaM;
                    if(rooms[areaName] === undefined)
                        rooms[areaName] = [];
                    rooms[areaName].push(attractions[i].id);

                    roomIds[attractions[i].areaM.id] = areaName;
                }
                startRoom = roomIds[adjacencies.start];
                endRoom = roomIds[adjacencies.end];

                _.forIn(rooms,function(value,key) {
                    _.forEach(value, function(v) {
                       attr2room[v] = key;
                    });
                });

                _.forIn(rooms, function(value, key) {
                    if(key !== "start")
                        problemData += key + " ";
                });

                problemData += "- topology_state\n\t\t";
                for(let i = 0; i <= visits; i++)
                    problemData += "v" + i + " ";
                problemData += "- visit_state\n\t\t";

                _.forIn(rooms, function(room, key) {
                    _.forEach(room, function(attraction) {
                        problemData += attraction + " ";
                    });
                });

                problemData += "- attraction\n\t)\n\t";
                problemData += "(:init\n\t\t(cur_state " + startRoom + ")\n\t\t(cur_state v0)\n\n\t\t(= (total-cost) 0)\n\t)\n\n\t";
                problemData += "(:goal\n\t\t(and\n\t\t\t(cur_state v" + visits + ")\n\t\t\t(cur_state " + endRoom + ")\n\t\t";
                _.forEach(must, function(attraction) {
                    problemData += "\t(visited " + attraction + ")\n\t\t"
                });
                problemData += "\n\t\t)\n\t)\n\t(:metric minimize (total-cost))\n)";
                fs.writeFile(problemFile,
                    problemData,
                    'utf8',
                    function (err) {
                        if (err) {
                            logger.err(err);
                        }
                        logger.info("The problem file: ", uname + "_problem.pddl was created!");
                });

                //Write domain.pddl
                var domainHeader = "(define (domain Museum)\n\t(:requirements :typing :equality)\n\t(:types topology_state visit_state - state attraction)\n\t" +
                        "(:predicates\n\t\t(cur_state ?s - state)\n\t\t(visited ?a - attraction)\n\t)\n\t(:functions\n\t\t(total-cost)\n\t)\n\t";

                var attractionsTimeMap = {};
                async.series([
                    //Write the header of the domain file
                    function(callback) {
                        fs.writeFileSync(domainFile, domainHeader, 'utf8');
                        logger.info("The domain file: ", uname + "_domain.pddl was created!");
                        callback();
                    },
                    function(callback) {
                        //** SENSING PART **
                        var urlSensing = serverName + "sensing/museumId=" + uid;
                        request({
                            url: urlSensing,
                            method: "GET",
                            json: true,
                            headers: [{
                                    'content-type': 'application/json'
                                }]
                        }, function(error,response, body) {
                            //body content: [{attractionM:{}, value:double}]
                            if (error) {
                                logger.err(error);
                                callback(error);
                            }
                            if (!error & response.statusCode === 200) {
                                string = "";
                                for (let i = 0; i < body.length; i++) {
                                    let id = body[i].attractionM.id;
                                    let cost = parseInt(Math.round(parseFloat(body[i].value)),10);
                                    for (let j = 0; j < visits; j++) {
                                        string += "(:action visit-v" + j + "-" + id + "\n\t\t";
                                        string += ":precondition (and (cur_state " + attr2room[id] + ") (cur_state v" + j + ") (not (visited att_" + id + ")))\n\t\t";
                                        string += ":effect (and (cur_state v" + (j + 1) + ") (not (cur_state v" + j + ")) (visited att_" + id +") (increase (total-cost) " + cost +"))\n\t)\n\t";
                                    }
                                }
                                fs.appendFileSync(domainFile, string, 'utf-8');
                                callback();
                            } else {
                                res.sendStatus(500);
                                callback(error);
                            }
                        });
                    },
                    //Write the rest of the domain file
                    function(callback) {
                        var string;
                        var adjPath = __dirname + "/adjacencies/" + attractions[0].areaM.museum.city.name + "/" + attractions[0].areaM.museum.name;
                        var json = fs.readFileSync(adjPath,'utf-8');
                        var adj = JSON.parse(json);
                        _.forIn(adjacencies, function(value,key) {
                            var minutes = 1;
                            if(key !== "start" && key !== "end") {
                                var src = roomIds[key];
                                _.forEach(value, function(next) {
                                    next = roomIds[next];
                                    string = "(:action move-" + src + "-" + next + "\n\t\t";
                                    string += ":precondition (cur_state " + src + ")\n\t\t";
                                    string += ":effect (and (cur_state " + next + ") (not(cur_state " + src + ")) ";
                                    string += "(increase (total-cost) " + minutes + "))\n\t)\n\t";

                                    string += "(:action move-" + next + "-" + src + "\n\t\t";
                                    string += ":precondition (cur_state " + next + ")\n\t\t";
                                    string += ":effect (and (cur_state " + src + ") (not(cur_state " + next + ")) ";
                                    string += "(increase (total-cost) " + minutes + "))\n\t)\n\t";
                                    fs.appendFileSync(domainFile, string, 'utf8');
                                });
                            }
                        });
                        callback();
                    },
                    //write the closing bracket of the domain file
                    function(callback) {
                        fs.appendFileSync(domainFile, "\n)", 'utf-8');
                        logger.info("Domain computed");
                        callback();
                    },
                    //Call the planner
                    function(callback) {
                        goalAndPlanner();
                        callback();
                    }
                ], function(err) {
                    if(err) {
                        logger.info(err);
                        res.send(500).end();
                        return;
                    }
                });
            });
        }
    });

    function goalAndPlanner() {

            shelljs.cd('/home/thomas/tesi/planners/downward');
            logger.debug("domain file:", domainFile);
            logger.debug("problem file:", problemFile);
            var solutionOutput = "/home/thomas/tesi/planners/solution/" + uid + ".sol";
            var ff = " --heuristic \"hff=ff()\" --search \"lazy_greedy([hff], preferred=[hff])\"";
            var astar = " --search \"astar(blind())\"";
            var exec_string = "./fast-downward.py --build release64 ";
            exec_string += domainFile + " " + problemFile + astar;
            exec_string += " > " + solutionOutput;
            logger.debug("exec string:", exec_string);
            //shelljs.exec(exec_string, {silent:true}, function(status, output) {
            shelljs.exec(exec_string, function(status, output) {
                setTimeout(function() {
                    logger.info("T I M E O U T _ R E A C  H E D !");
                }, 10000);
                if (status !== 0) {
                    res.status(500).end();
                    return;
                }
                lr = new LineByLineReader(solutionOutput);
                lr.on('error', function(err) {
                    logger.error(" 'err' contains error object x");
                    return;
                });

                var resRooms = [];

                lr.on('line', function(line) {
                    if(line.includes("visit-v")) {
                        var attrId = line.split('-')[2].split(' ')[0];
                        var roomName = attr2room[attrId];
                        var room = _.find(resRooms, {"name":roomsName2Id[roomName].name});
                        if (room === undefined) {
                            room = {
                                id : roomsName2Id[roomName].id,
                                name : roomsName2Id[roomName].name,
                                attractions : []
                            };
                            resRooms.push(room);
                        }
                        room.attractions.push(attractionsMap[attrId]);
                    }
                });

                lr.on('end', function() {
                    var obj = {
                            type : "museum",
                            name : name,
                            route : resRooms,
                            id : ""
                        };
                    // All lines are read, file is closed now.
                    logger.info("End");
                    logger.debug("ready: " + JSON.stringify(obj));
                    res.status(200);
                    res.send(JSON.stringify(obj));

                    shelljs.exec('rm ' + solutionOutput, function(status, output) {
                        if (status)
                            logger.debug("error during delete solution file");
                        else logger.debug("file solution deleted successfully");
                    });
                    return;
                });
            }); //fine exec
    } //fine Goal&Planner
}); //fine compute-plan-museum
/* REPORT */
app.post('/report_queue', function(req, res) {
    pathName = '[' + req.path + '] ';
    var category = req.body.category;
    var attrId = req.body.attractionId;
    var minutes = req.body.minutes;
    var dd = req.body.data; // aggiungerla in sensing

    // se esiste una tupla in tcoda di colosseo 10' non devo aggiungere in tcoda ma solo in sensing
	logger.info(pathName + "category: %s", category);
    var reqUrl = serverName;
    var reqBody = {minutes: minutes};
    if (category === 'city') {
        reqUrl += "queue/";
        reqBody.attractionC = {id: attrId};
    } else {
        reqUrl += "queue/";
        reqBody.attractionM = {id: attrId};
    }
    //reqUrl += attrId + "," + minutes;
    logger.info(JSON.stringify(reqBody));

    request({
        url: reqUrl,
        method: "POST",
        json: reqBody,
        headers: [{
            'content-type': 'application/json'
        }]
    }, function(error,response,body) {
        logger.info("Request statusCode: " + response.statusCode);
        if (!error && response.statusCode === 201) {
            logger.info(response.statusCode, "*** Tcoda added  *** ");
            var tqueueId;
            var loc = response.headers.location;
            var id = loc.match(regex);
            tqueueId = id[0];
            request({
                url: serverName + "sensing/",
                method: "POST",
                json: {
                    data: dd,
                    TQueue: {
                        id: tqueueId
                    }
                },
                headers: [{
                    'content-type': 'application/json'
                }]
            }, function(error, response, body) {
                logger.info("Request statusCode: " + response.statusCode);
                //logger.info("*** response ", response);
                if (!error & response.statusCode === 204) {
                    logger.info("*** Post only in sensing succeded *** ");
                    res.sendStatus(201);
                }
            });
        }
    });
}); // route_queue

app.post('/report_visit', function(req,res) {
    pathName = '[' + req.path + '] ';
    var category = req.body.category;
    var attrId = req.body.attractionId;
    var minutes = req.body.minutes;
    var dd = req.body.data; // aggiungerla in sensing

    // se esiste una tupla in tcoda di colosseo 10' non devo aggiungere in tcoda ma solo in sensing
	logger.info(pathName + "category: %s", category);
    var reqUrl = serverName + "visit/";
    var reqBody = {minutes: minutes};
    if (category === 'city')
        reqBody.attractionC = {id: attrId};
    else
        reqBody.attractionM = {id: attrId};
    //reqUrl += attrId + "," + minutes;
    logger.info(JSON.stringify(reqBody));

    request({
        url: reqUrl,
        method: "POST",
        json: reqBody,
        headers: [{
            'content-type': 'application/json'
        }]
    }, function(error,response,body) {
        logger.info("Request statusCode: " + response.statusCode);
        if (!error && response.statusCode === 201) {
            logger.info(response.statusCode, "*** Tvisita added  *** ");
            var tvisitId;
            var loc = response.headers.location;
            var id = loc.match(regex);
            tvisitId = id[0];
            request({
                url: serverName + "sensing/",
                method: "POST",
                json: {
                    data: dd,
                    TVisit: {
                        id: tvisitId
                    }
                },
                headers: [{
                    'content-type': 'application/json'
                }]
            }, function(error, response, body) {
                logger.info("Request statusCode: " + response.statusCode);
                if (!error & response.statusCode === 204) {
                    logger.info("*** Post only in sensing succeded *** ");
                    res.sendStatus(201);
                }
            });
        }
    });

});

app.post('/report_rating', function(req,res) {
    pathName = '[' + req.path + '] ';
    var category = req.body.category;
    var type = req.body.type;
    var attrId = req.body.attractionId;
    var rating = +req.body.rating;
    var dd = req.body.data; // aggiungerla in sensing

	logger.info(pathName + "category: %s", category);
    var reqUrl = serverName + "rating/";
    var reqBody = {rating: rating};
    if (category === 'city')
        reqBody.attractionC = {id: attrId};
    else
        reqBody.attractionM = {id: attrId};
    logger.info(JSON.stringify(reqBody));

    request({
        url: reqUrl,
        method: "POST",
        json: reqBody,
        headers: [{
            'content-type': 'application/json'
        }]
    }, function(error,response,body) {
        logger.info("Request statusCode: " + response.statusCode);
        if (!error && response.statusCode === 201) {
            logger.info(response.statusCode, "Rating for attractionId ", attrId, "added");
            var ratingId;
            var loc = response.headers.location;
            var id = loc.match(regex);
            ratingId = id[0];
            request({
                url: serverName + "sensing/",
                method: "POST",
                json: {
                    data: dd,
                    rating: {
                        id: ratingId
                    }
                },
                headers: [{
                    'content-type': 'application/json'
                }]
            }, function(error, response, body) {
                logger.info("Request statusCode: " + response.statusCode);
                //logger.info("*** response ", response);
                if (!error & response.statusCode === 204) {
                    logger.info("*** Post only in sensing succeded *** ");
                    res.sendStatus(201);
                }
            });
        }
    });
});

app.post('/avg_queue_time', function(req, res) {
    pathName = '[' + req.path + '] ';
    var attrId = req.body.attrId;
    var today_date = req.body.date;
    var today = moment(today_date).format('DD-MM-YYYY');
    var month_ago = today.subtract(30, 'days');

    request({
        url: serverName + "sensing/avg/tqueue/city/attractionCid=" + attrId,
        method: "GET",
        json: true,
        headers: [{
            'content-type': 'application/json'
        }]
    }, function(error, response, body) {
        logger.info("Request statusCode: " + response.statusCode);
        if (!error & response.statusCode === 200) {
            var curr_date;
            var queue_value;
            var avg;
            for (let i = 0; i < body.length; i++) {
                curr_date = moment(body[i].data).format('DD-MM-YYY');
                queue_value = body[i].TQueue.minutes;
                var diff = curr_date.diff(month_ago, 'days'); //returns difference in days b/w two date (curr_date - month_ago)

                avg += queue_value * (diff / 30);
                logger.info("data corrente ", curr_date, ",un mese fa ", month_ago, ",differenza in giorni ", diff);

            }
            return;
        } else {
            //res.status(response.statusCode);
            //res.send({error : 'reg_error'});
            //res.send(body);
            logger.info("/avg failed!: ");
            return;
        }
    });
});

module.exports = app;
