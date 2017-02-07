var request = require('request');
var portscanner = require('portscanner');
var process = require('process');
var app = require('./android');
var logger = require('./logger');
var config = require(__dirname + '/public/resources/config.json');
var serverName = config.serverName;
var portNumber = config.portNumber;
var serverUrl = config.serverUrl;
var serverNode = config.serverNode;

logger.info("Server starting up");

process.on('SIGINT', function() {
    logger.info('Server shutting down');
    process.exit();
});

//Check wether the data layer is running
portscanner.checkPortStatus(8080, 'localhost', function(error, status) {
    if(error)
        throw error;
    if(status === 'open')
        logger.info('Data provider up and running');
    else if(status === 'closed')
        logger.warn("The data provider is down");
});

app.listen(9070, function() {
    logger.info('Server running at ' + serverNode);
});





 
