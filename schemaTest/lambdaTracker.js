var _und = require('underscore');

var self = {

    createNewLambda : function (map, icao, time) {

	var lambda = map[icao];
	var hour = time.getHours();
	    
	if (lambda) {
	    lambda.ts = time;
	    lambda.totalSpeed = 0;
	    lambda.eventCount = 0;
	    lambda.avgSpeed = null;
	}
	else {
	    map[icao] = {
		"icao": icao,
		"callsign": icao,
		"ts" : time,
		"grandTotalSpeed" : 0,
		"grandEventCount" : 0,
		"totalSpeed" : 0,
		"eventCount" : 0,
		"avgSpeed" : null,
		"hoursTotal": []
	    };

	    for (i = 0; i < 24; i++) {
		map[icao].hoursTotal[i] = {
		    hour : i,
		    sTotal : 0,
		    sCount : 0
		};
	    };
	}
    },

    getCurrentLambda : function (map, icao) {

	map[icao].avgSpeed = map[icao].totalSpeed / map[icao].eventCount;
	return _und.clone(map[icao]);
	//WARNING - the hoursTotal field has not been cloned so it could be updated before it is written to MongoDB
    },

    incrementForEvent : function (map, icao, event) {
	var hour = event.t.getHours();
	
	if (map[icao]) {
	    map[icao].grandTotalSpeed = map[icao].grandTotalSpeed + event.s;
	    map[icao].grandEventCount++;
	    map[icao].totalSpeed = map[icao].totalSpeed + event.s;
	    map[icao].eventCount++;
	    map[icao].hoursTotal[hour].sTotal = map[icao].hoursTotal[hour].sTotal + event.s;
	    map[icao].hoursTotal[hour].sCount++;
	}
	else
	    self.createNewLambda(map, icao, event.t);
    }

//    foo: function() {console.log("hello");}
    
};

module.exports = self;
