var _und = require('underscore');

var self = {

    createNewLambda : function (map, icao, time) {

	var lambda = map[icao];
	    
	if (lambda) {
	    lambda.ts = time;
	    lambda.totalSpeed = 0;
	    lambda.eventCount = 0;
	    lambda.avgSpeed = null;
	}
	else
	    map[icao] = {
		"icao": icao,
		"callsign": icao,
		"ts" : time,
		"grandTotalSpeed" : 0,
		"grandEventCount" : 0,
		"totalSpeed" : 0,
		"eventCount" : 0,
		"avgSpeed" : null
	    };

    },

    getCurrentLambda : function (map, icao) {

	map[icao].avgSpeed = map[icao].totalSpeed / map[icao].eventCount;
	return _und.clone(map[icao]);
    },

    incrementForEvent : function (map, icao, event) {
	if (map[icao]) {
	    map[icao].grandTotalSpeed = map[icao].grandTotalSpeed + event.s;
	    map[icao].grandEventCount++;
	    map[icao].totalSpeed = map[icao].totalSpeed + event.s;
	    map[icao].eventCount++;
	}
	else
	    self.createNewLambda(map, icao, event.t);
    },

    foo: function() {console.log("hello");}
    
};

module.exports = self;
