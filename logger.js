var winston = require('winston');
var moment = require('moment');

var ts = function() {
    return moment().format("DD/MM/YYYY HH:mm:ss");
}

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(
        {
            json: false,
            timestamp: ts,
            colorize: true }),
    new winston.transports.File(
        {
            filename: __dirname + '/logs/debug.log',
            timestamp: ts,
            json: false })
  ],
  exceptionHandlers: [
    new (winston.transports.Console)({
            json: true,
            timestamp: ts,
            colorize: true }),
    new winston.transports.File({
            filename: __dirname + '/logs/exception.log',
            timestamp: ts,
            json: false })
  ],
  exitOnError: false
});

module.exports = logger;
