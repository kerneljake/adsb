var Step = require('step'),
    _und = require('underscore'),
    memTracker = require('./lambdaTracker.js'),
    ObjectID = require('MongoDB').ObjectID;

var self = {
    sAggPipeline : [
	{
	    $match: {
		"ts" : {$gte : new Date("2016-01-01T05:10:00.000+0000"), $lt : new Date("2016-01-01T05:20:00.000+0000") },
		"icao" : "foo"
	    }
	},
	{
	    $group : {
		"_id" : null,
		"sum" : {"$sum" : "$events.s"},
		"count" : {"$sum" : 1},
		"avg" : {"$avg" : "$events.s"}
	    }
	}
    ],
    incrementForEvent: function (lTracker, icao, event) {
	if (lTracker) {
//	    memTracker.foo();
	    memTracker.incrementForEvent(lTracker, icao, event);
	}
    },
    insertLambdaDoc: function (lCol, dCol, mData, lambdaDuration, queue, queueSize, lTracker, callback) {
	var startTS = new Date(mData.ts.valueOf());
	var prevStartTS = new Date(startTS.valueOf() - (lambdaDuration * 1000));

	if (lTracker) {
	    var insert = { insertOne : {document : memTracker.getCurrentLambda(lTracker, mData.icao)}};

	    queue.push(insert);
	    memTracker.createNewLambda(lTracker, mData.icao, mData.ts);
	    if (queue.length > queueSize)
		self.writeQueue(lCol, queue, callback);
	    else
		callback(null, true);
	}
	else
	Step (
	    function getSumsAndStart() {
		console.log("START of aggregate and findOne");
		self.aggregateRange(dCol, mData.icao, prevStartTS, startTS, this.parallel()); //calculate the values for the current interval
		lCol.findOne({"icao" : mData.icao, "ts" : prevStartTS}, this.parallel()); // get the previous lambda doc
	    },
	    function queueUpdate(err, aggResult, previousAgg) {
		console.log("END of aggregate and findOne");
		if (err) {
		    console.log("queueUpdate Error: %j", err);
		    callback(err, null);
		}

		if (!previousAgg) {
//		    console.log("No previous aggregation found for ", mData.icao);
		    previousAgg = {
			grandTotalSpeed: 0,
			grandEventCount: 0
		    };
		}
		
		var insert = { insertOne :
			       {document : {
//				   "_id" : new ObjectID(),
				   "icao" : mData.icao,
				   "callsign" : mData.icao,
				   "ts" : startTS,
				   "grandTotalSpeed" : previousAgg.grandTotalSpeed + aggResult.sum,
				   "grandEventCount" : previousAgg.grandEventCount + aggResult.count,
				   "totalSpeed" : aggResult.sum,
				   "eventCount" : aggResult.count,
				   "avgSpeed" : aggResult.avg
			       }}};

		queue.push(insert);
		if (queue.length >= queueSize)
		    self.writeQueue(lCol, queue, callback);
		else
		    callback(null, true);
	    }
	);
    },

    writeQueue: function(col, queue, callback) {


	if (queue.length > 0) {
            var writeArray = [];
	    writeArray.push.apply(writeArray, queue);
	    queue.length = 0;

	    console.log("Writing lambda queue. Length: ", writeArray.length);
	    col.bulkWrite(writeArray, {ordered: false}, function (err, result) {
		if (err) {
		    console.log("Error - lambda bulkWrite: %j", err);
		    callback(err);
		}
		else {
		    callback(null, true);
		}
	    });
	}
	else
	    callback(null, 0)
    },

    
    aggregateRange: function(col, icao, startTS, endTS, callback) {

	var aPipeline = self.sAggPipeline;
	aPipeline[0]["$match"].icao = icao;
	aPipeline[0]["$match"].ts["$gte"] = new Date(startTS);
	aPipeline[0]["$match"].ts["$lt"] = new Date(endTS);

//	console.log("Agg Pipeline: %j", aPipeline);

	var aggStream = col.aggregate(aPipeline, {}).stream();
	var resultsReturned = 0;

	aggStream.on('data', function(doc) {
//	    console.log("Aggregation Result: %j", doc);
	    ++resultsReturned;
	    callback(null, doc);
	});

	aggStream.on('error', function (doc) {
	    console.log("Lambda Aggregation Query failed: %j", doc);
	    callback(doc, false);
	});

        aggStream.on('end', function(doc) {
	    if (resultsReturned == 0) {
//		console.log("Starting new sum.");
		var result = {
		    sum : 0,
		    count: 0,
		    avg: 0
		};
		callback(null, result);
	    }
//	    else
//		console.log("Do nothing");
        });
    }
};

module.exports = self;
