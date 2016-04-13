
// To Do
// 1. Data aggregated in documents based upon tailnumber and time period [DONE 13Apr2016]
// 2. multiple types of events
// 3. process command line arguments
// 4. sort out the node project issue

// run like:
//   node schemaTest.js --batchSize 100 --numAircraft 500 --docSize 60 --numParaBatch 5 --start "2016-01-01T00:00:00.000-0500" --totalSeconds 3

var MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    Step = require('step'),
    _und = require('underscore'),
    processArgs = require('minimist');

var argvObj = processArgs(process.argv.slice(2));
console.log("Command Args: %j", argvObj);

function setCommandLineValue(field, argObj) {
    var val = argObj[field];

    if (val === undefined) throw new Error("Missing required command line argument: " + field);

    return val;
}

// command line arguments
var batchSize = setCommandLineValue("batchSize", argvObj);       // Size of batches used for mongodb inserts in bulk API
var numAircraft = setCommandLineValue("numAircraft", argvObj);   // Number of aircraft being tracked
var docSize = setCommandLineValue("docSize", argvObj);           // Number of seconds of data in each document.
var numParaBatch = setCommandLineValue("numParaBatch", argvObj); // Number of matches to insert in parallel
var start = setCommandLineValue("start", argvObj);               // Start time for sensor readings - JSON date format string
var totalSeconds = setCommandLineValue("totalSeconds", argvObj); // Number of seconds for which to generate data


var startTime = new Date(start);
var currentTime = new Date(startTime);
var currentIntTime = new Date(startTime);	// the time of the current interval used to batch the events into a single document per sensor
var endTime = new Date(start);
endTime.setSeconds(endTime.getSeconds() + totalSeconds);
var threadsRunning = 0;

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
var url = 'mongodb://localhost:27017/adsb';

function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}

function generateTailNumbers(numPlanes, aCodes) {
    var tNums = [];
    var AC;
    var flightNum;
    
    
    for (t = 0; t < numPlanes; t++) {
	flightNum = randomIntInc(1000, 9999);
	AC = aCodes[randomIntInc(0, aCodes.length - 1)];
	tNums.push(AC + flightNum);
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


function generateSensorReadings(cTime, intTime) {

    var readings = [];
    var reading = {
        "s" : 154,
        "b" : 150,
        "t" : new Date(cTime),
        "v" : 0
    };
    
    var timeStamp = formatTimeStamp(intTime);
    
    for (t = 0; t < tailNumbers.length; t++) {

	var r = _und.clone(reading);
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
    
    if ((currentTime < endTime) && (bQueue.length < numParaBatch)) {
	// generate the readings for the current time period
	readings = generateSensorReadings(currentTime, currentIntTime);
	newBatches = generateBatches(readings, batchSize);

	// increment the currentTime
	currentTime.setSeconds(currentTime.getSeconds() + 1);

	// if we have hit the next document interval boundary set currentIntTime to currentTime
	if ((((currentTime.getTime() - currentIntTime.getTime()) / 1000) % docSize) == 0) currentIntTime.setTime(currentTime.getTime());

	bQueue.push.apply(bQueue, newBatches);
        console.log("filled batch queue. currentTime: ", currentTime);
    }
}


function generateMDBOperation(reading) {

    var numSec = (reading.t.getTime() - reading.mData.ts.getTime()) / 1000;
    var mData = reading.mData;
    var result;
    
    delete reading.mData;
    if ((numSec % docSize) == 0) {
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

    console.log("Bulk write operation: %j", result);
    return result;
}

// Kick off the insert
// Refill the batch queue


function processBatch(dataCol, bQueue, callback) {

    var batch = bQueue.pop();

    //    batch.map(function (reading) {return {"insertOne" : {"document" : reading}}}).forEach(function(arg) {console.log("Inserting: %j", arg);});

    if (batch) {
	threadsRunning++;
        dataCol.bulkWrite(
	    batch.map(generateMDBOperation),
	    {ordered : false},
	    function (err, r) {
		threadsRunning--;
		if (err) {
                    console.log("Error - bulkWrite: %j", err);
		    callback(err);
		}
		else {
                    console.log("Inserted: " + r.nInserted);

		    process.nextTick(function () {
			processBatch(dataCol, bQueue, callback);
		    });
		}
	    }
	);
	fillBatchQueue(bQueue);
    }
    else {
	console.log("Thread Done");
	if (threadsRunning == 0) {
	    console.log("Processing Done.");
	    callback(null, "Okay");
	}
    }
}

function performTests(dataCol, callback) {
    
    var bQueue = [];

    fillBatchQueue(bQueue);
    
    for (b = 0; b < numParaBatch; b++) {
	    processBatch(dataCol, bQueue, callback);
    }
}

// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");

    var alCodeCol = db.collection('airlineCodes');
    var dataCol = db.collection('data');
    
    Step (
	function dropData() {
	    dataCol.drop(this);
	},
	function loadAirlineCodes (err, result) {
	    console.log("load airline codes");
	    alCodeCol.distinct("IATA", this);
	},
	function setAirlineCodes (error, aCodes) {
        if (error) {console.log(error);}
        assert.equal(null, error);

	    console.log("loaded airline codes");
	 //   assert.ifError(err);

	    airlineCodes = aCodes;

        console.log("Airline codes: " + airlineCodes);
	    tailNumbers = generateTailNumbers(numAircraft, airlineCodes);
	    console.log("Tail Numbers: " + tailNumbers);
	    
	    performTests(dataCol, this);
	},
	function done (err, result) {
	    if (err) {
		console.log("Error: " + err);
	    }
	    else {
		console.log ("Test done: " + result);
	    }
	    db.close();
	}

    );
});
