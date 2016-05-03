
// To Do
// 1. Data aggregated in documents based upon tailnumber and time period [DONE 13Apr2016]
// 2. multiple types of events
// 3. process command line arguments [DONE 13Apr2016]
// 4. sort out the node project issue

// run like:
//   node schemaTest.js --batchSize 100 --numAircraft 500 --docSize 60 --numParaBatch 5 --start "2016-01-01T00:00:00.000-0500" --totalSeconds 3

var MongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID,
    assert = require('assert'),
    Step = require('step'),
    _und = require('underscore'),
    processArgs = require('minimist'),
    moment = require('moment');

var argvObj = processArgs(process.argv.slice(2));
//console.log("Command Args: %j", argvObj);

function setCommandLineValue(field, argObj) {
    var val = argObj[field];

    if (val === undefined) throw new Error("Missing required command line argument: " + field);

    return val;
}

var config = {
    _id: new ObjectID(),
    argv: argvObj,		                                // command line args
    batchSize: setCommandLineValue("batchSize", argvObj),       // Size of batches used for mongodb inserts in bulk API
    numAircraft: setCommandLineValue("numAircraft", argvObj),   // Number of aircraft being tracked
    docSize: setCommandLineValue("docSize", argvObj),           // Number of seconds of data in each document.
    numParaBatch: setCommandLineValue("numParaBatch", argvObj), // Number of matches to insert in parallel
    start: setCommandLineValue("start", argvObj),               // Start time for sensor readings - JSON date format string
    totalSeconds: setCommandLineValue("totalSeconds", argvObj), // Number of seconds for which to generate data
    host: setCommandLineValue("host", argvObj),
    port: setCommandLineValue("port", argvObj),

    testCompleted: false,
    insertReportInterval: 10000,
    lastReportCount: 0,

    threadsRunning: 0,
    numInserted: 0,
    testTimeSec: 0,
    avgInsRate: 0,
    SBVThreshold:  31,
    readingTypes: [
	{
	    //	"type" : 'sbv',
            "s" : 154,
            "b" : 150,
            "t" : null,
            "v" : 0
	},
	{
	    //	"type" : 'all',
            "a" : 9350, 
            "b" : 150, 
            "p" : [-98.62762, 30.03657], 
            "s" : 152, 
            "t" : null,
            "v" : 192
	}
    ],
    fieldRanges: {
	"a" : [0, 40000],
	"b" : [0, 359],
	"p" : [-180, 180], 
	"s" : [0, 660],
	"v" : [0, 300] 
    }

};

config.startTime = new Date(config.start);
config.currentTime = new Date(config.startTime);
config.currentIntTime = new Date(config.startTime);	// the time of the current interval used to batch the events into a single document per sensor
config.endTime = new Date(config.start);
config.endTime.setSeconds(config.endTime.getSeconds() + config.totalSeconds);

// command line arguments
// var batchSize = setCommandLineValue("batchSize", argvObj);       // Size of batches used for mongodb inserts in bulk API
// var numAircraft = setCommandLineValue("numAircraft", argvObj);   // Number of aircraft being tracked
// var docSize = setCommandLineValue("docSize", argvObj);           // Number of seconds of data in each document.
// var numParaBatch = setCommandLineValue("numParaBatch", argvObj); // Number of matches to insert in parallel
// var start = setCommandLineValue("start", argvObj);               // Start time for sensor readings - JSON date format string
// var totalSeconds = setCommandLineValue("totalSeconds", argvObj); // Number of seconds for which to generate data


// var startTime = new Date(start);
// var currentTime = new Date(startTime);
// var currentIntTime = new Date(startTime);	// the time of the current interval used to batch the events into a single document per sensor
// var endTime = new Date(start);
// endTime.setSeconds(endTime.getSeconds() + totalSeconds);
// var threadsRunning = 0;

// meta data
var airlineCodes = []; 		// list of all ICAO/IATA airline codes
var tailNumbers = [];		// list of tail numbers used for the data set


// Document Attribute Key
//  _id      - "YYYYMMDDHH:ICAO"
//  icao     - 6 characters. First two characters are the airline code, the remaining 3-4 digits are the flight number
//  ts       - start time for block of data for aircraft
//  s        - speed
//  b        - bearing
//  v        - vertical rate
//  a        - altitude
//  p        - [longitude, latitude]
//  t        - time
//  callsign - call sign

// 1. Create a batch to insert
// 2. Insert the batch
// 3. while we are waiting for the insert to happen, create the next batch
// 4. Got to 3



// Connection URL
var url = 'mongodb://' + config.host + ':' + config.port + '/adsb';

function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}

function generateTailNumber(aCodes) {
    return aCodes[randomIntInc(0, aCodes.length - 1)] + randomIntInc(1000, 9999);
}

function generateTailNumbers(numPlanes, aCodes) {
    var tNums = [];
    var tNumHash = {};
    var tailNum;

    for (t = 0; t < numPlanes; t++) {
	tailNum = generateTailNumber(aCodes);
	while (tNumHash[tailNum] == 1) {
	    tailNum = generateTailNumber(aCodes);
	}
	tNumHash[tailNum] = 1;
	tNums.push(tailNum); // this doesn't guarantee uniqueness. Not sure I care.
    }

    return tNums;
}

function formatTimeStamp(date) {

    var yy = date.getFullYear();
    var mm = date.getMonth()+1;
    var dd = date.getDate();
    var hh = date.getHours();
    var ii = date.getMinutes();
    var ss = date.getSeconds();

    if ( dd < 10 ) dd = '0' + dd;
    if ( mm < 10 ) mm = '0' + mm;
    if ( hh < 10 ) hh = '0' + hh;
    if ( ii < 10 ) ii = '0' + ii;
    if ( ss < 10 ) ss = '0' + ss;

    tStamp = "" + yy + mm + dd + hh + ii + ss;
    
//    console.log("Date: " + date + " Time Stamp: " + tStamp);

    return tStamp;


}

// Sample Data:
//   ALL: 839264    (69 %)
//   SBV: 373349    (31 %)
//  Total: 1212613


function setRandomValues(reading, ranges) {

    var newVal1;
    var newVal2;
    Object.keys(reading).forEach(function(field, index) {
	if (ranges[field] !== undefined) {
	    if (field != "p") {
		newVal1 = randomIntInc(ranges[field][0], ranges[field][1]);
		reading[field] = newVal1;
	    }
	    else {
		newVal1 = randomIntInc(ranges[field][0], ranges[field][1]);
		newVal2 = randomIntInc(ranges[field][0], ranges[field][1]);
		reading[field] = [newVal1, newVal2];
	    }
	}
    });
}

function generateReading(cTime) {

    
    var random = randomIntInc(0, 100);
    var reading;
    
    if (random < config.SBVThreshold) {
	reading = _und.clone(config.readingTypes[0]);

	setRandomValues(reading, config.fieldRanges);
    }
    else {
	reading = _und.clone(config.readingTypes[1]);

	setRandomValues(reading, config.fieldRanges);
    }

    reading.t = new Date(cTime);
    return reading;
}

function generateSensorReadings(cTime, intTime) {

    var readings = [];
    var timeStamp = formatTimeStamp(intTime);
    
    for (t = 0; t < tailNumbers.length; t++) {

	var r = generateReading(cTime);
	r.mData = {
	    _id : timeStamp + ":" + tailNumbers[t],
	    icao : tailNumbers[t],
	    callsign : tailNumbers[t],
	    ts : new Date(intTime)
	};
	readings.push(r);
    }

    return readings;
}

function generateBatches (readings, bSize) {

    var batch;
    var restBatches;
    
    if (readings.length > 0) {
	batch = readings.splice(0, bSize);
	restBatches = generateBatches(readings, bSize); 
	restBatches.push(batch);
    }
    else {
	restBatches = [];
    }

    return restBatches;

}

function fillBatchQueue(bQueue) {

    var readings;
    var newBatches;
    
    if ((config.currentTime < config.endTime) && (bQueue.length < config.numParaBatch)) {
	// generate the readings for the current time period
	readings = generateSensorReadings(config.currentTime, config.currentIntTime);
	newBatches = generateBatches(readings, config.batchSize);

	// increment the currentTime
	config.currentTime.setSeconds(config.currentTime.getSeconds() + 1);

	// if we have hit the next document interval boundary set currentIntTime to currentTime
	if ((((config.currentTime.getTime() - config.currentIntTime.getTime()) / 1000) % config.docSize) == 0)
	    config.currentIntTime.setTime(config.currentTime.getTime());

	bQueue.push.apply(bQueue, newBatches);
//        console.log("filled batch queue. currentTime: ", config.currentTime, "length: ", bQueue.length);
    }
}


function generateMDBOperation(reading) {

    var numSec = (reading.t.getTime() - reading.mData.ts.getTime()) / 1000;
    var mData = reading.mData;
    var result;
    
    delete reading.mData;
    if (config.docSize == 1) {
	// insert new document with events as a subdocument instead of an array
	result = {insertOne :
		  {document : {
		      "_id" : mData._id,
		      "icao" : mData.icao,
		      "callsign" : mData.callsign,
		      "ts" : mData.ts,
		      "events" : reading
		  }}};
    }
    else if ((numSec % config.docSize) == 0) {
	// start a new document grouping interval
	result = {insertOne :
		  {document : {
		      "_id" : mData._id,
		      "icao" : mData.icao,
		      "callsign" : mData.callsign,
		      "ts" : mData.ts,
		      "events" : [reading]
		  }}};
    }
    else {
	result = {updateOne : {
	    filter : {
		"_id" : mData._id
	    },
	    update : {
		$push : {"events" : reading}
	    }
	}};
    }

//    console.log("Bulk write operation: %j", result);
    return result;
}

// Kick off the insert
// Refill the batch queue


function processBatch(dataCol, bQueue, callback) {

    var batch = bQueue.shift();

    //    batch.map(function (reading) {return {"insertOne" : {"document" : reading}}}).forEach(function(arg) {console.log("Inserting: %j", arg);});

    if (batch) {
	config.threadsRunning++;
        dataCol.bulkWrite(
	    batch.map(generateMDBOperation),
	    {ordered : false},
	    function (err, r) {
		config.threadsRunning--;
		if (err) {
                    console.log("Error - bulkWrite: %j", err);
		    callback(err);
		}
		else {
//                    console.log("Inserted: " + r.nInserted + " Updated: " + r.nModified);
		    config.numInserted = config.numInserted + config.batchSize;

		    if (config.numInserted >= (config.lastReportCount + config.insertReportInterval)) {
			config.lastReportCount = config.numInserted;
			console.log(new Date() + "> Insert count: " + config.numInserted);
		    }

		    process.nextTick(function () {
			processBatch(dataCol, bQueue, callback);
		    });
		}
	    }
	);
	fillBatchQueue(bQueue);
    }
    else {
//	console.log("Thread Done");
	if (config.threadsRunning == 0) {
	    console.log("Processing Done.");
	    callback(null, "Okay");
	}
    }
}

function performTests(dataCol, callback) {
    
    var bQueue = [];

    fillBatchQueue(bQueue);
    
    for (b = 0; b < config.numParaBatch; b++) {
	    processBatch(dataCol, bQueue, callback);
    }
}

function logTestStart(logCol, callback) {

    logCol.insertOne(config, {}, function (err, r) {
	if (err) {
	    console.log("logTestStart Error: %j", err);
	}
	else {
	    console.log("Starting test at: " + config.testStartTime);
	}
	callback(err, r);
    });
}

function dbColStats(dataCol, callback) {
    dataCol.stats(function(err, stats) {
	if (err) {
	    console.log("Get Collection Stats Error: %j", err);
	}
	else {
	    config.stats = stats;
	    callback(err, stats);
	}
    });
}

function logTestEnd(logCol, callback) {

    config.testTimeSec = moment(config.testEndTime).diff(moment(config.testStartTime), 'seconds');
    config.avgInsRate = config.numInserted / config.testTimeSec;
    
    logCol.updateOne({_id : config._id},
		     {$set : {testEndTime: config.testEndTime,
			      numInserted: config.numInserted,
			      testTimeSec: config.testTimeSec,
			      avgInsRate: config.avgInsRate,
			      stats: config.stats,
			      testCompleted: true}},
		     {},
		     function (err, r) {
			 if (err) {
			     console.log("logTestEnd Error: %j", err);
			 }
			 else {
			     
			     console.log("Ending test at: " + config.testEndTime + " " + config.numInserted + " inserted.");
			     console.log("Total time (sec): " + config.testTimeSec + " Avg. Insert Rate: " + config.avgInsRate);
			 }
			 callback(err, r);
		     });
}




// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");

    var alCodeCol = db.collection('airlineCodes');
    var dataCol = db.collection('data');
    var testLogCol = db.collection('tests');
    
    Step (
	function dropData() {
	    dataCol.drop(this);
	},
	function loadAirlineCodes (err, result) {
//	    console.log("load airline codes");
	    alCodeCol.distinct("IATA", this);
	},
	function setAirlineCodes (error, aCodes) {
            if (error) {console.log(error);}
            assert.equal(null, error);

//	    console.log("loaded airline codes");
	 //   assert.ifError(err);

	    airlineCodes = aCodes;

//            console.log("Airline codes: " + airlineCodes);
	    tailNumbers = generateTailNumbers(config.numAircraft, airlineCodes);
//	    console.log("Tail Numbers: " + tailNumbers);

	    config.testStartTime = new Date();
	    logTestStart(testLogCol, this);
	},
	function performTestStart(err, result) {
	    if (err) {
		console.log("Error: " + err);
	    }
	    performTests(dataCol, this);
	},
	function getColStats(err, result) {
	    if (err) {
		console.log("Error: " + err);
	    }
	    dbColStats(dataCol, this);
	},
	function logTestResults(err, result) {
	    if (err) {
		console.log("Error: " + err);
	    }
	    config.testEndTime= new Date();
	    logTestEnd(testLogCol, this);
	},
	function done (err, result) {
	    if (err) {
		console.log("Error: " + err);
	    }
	    else {
		console.log ("Test Complete: %j", config);
	    }
	    db.close();
	}

    );
});
