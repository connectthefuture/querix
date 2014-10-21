/**
* Set up of the configuration manager
* Do not edit the defaults in this file, create a settings.json file instead
*/

var nconf = require('nconf');

nconf.file('settings.json');

nconf.defaults({
  "productions": {
  },
  "log4js": {
    "appenders": [
      {"type": "console"}
    ],
    "levels": {
      "[all]": "INFO"
    }
  }
});

module.exports = exports = nconf;
