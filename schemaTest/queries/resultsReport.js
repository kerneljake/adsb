
db.tests.find({"argv.testName" : "debug", testCompleted: true}, {_id: 0, "argv.testName" : 1, docSize : 1, totalSeconds: 1, numInserted: 1, testTimeSec: 1, avgInsRate: 1, "stats.size": 1, "stats.storageSize": 1, "stats.avgObjSize": 1, "stats.count": 1, "stats.totalIndexSize": 1,"queryResult.name": 1, "queryResult.count": 1, "queryResult.testDuration" : 1}).sort({testStartTime : -1})





// all results in a single table
db.tests.aggregate(
    [
	{$match : {"argv.testName" : "debug", testCompleted: true}},
	{$unwind : "$queryResult"},
	{$project : {
	    _id: 0,
	    testName : "$argv.testName",
	    docSize : 1,
	    totalSeconds: 1,
	    numInserted: 1,
	    testTimeSec: 1,
	    avgInsRate: 1,
	    collectionSize: "$stats.size",
	    collectionStorageSize: "$stats.storageSize",
	    collectionAvgObjSize: "$stats.avgObjSize",
	    collectionCount: "$stats.count",
	    collectionTotalIndexSize: "$stats.totalIndexSize",
	    queryName: "$queryResult.name",
	    queryResCount: "$queryResult.count",
	    queryDuration: "$queryResult.testDuration",
	    testStartTime: 1}
	},
	{$sort : {"testStartTime" : -1}}
    ]
)

// insert rate results
db.tests.aggregate(
    [
	{$match : {"argv.testName" : "debug", testCompleted: true}},
	{$project : {
	    _id: 0,
	    testName : "$argv.testName",
	    docSize : 1,
	    totalSeconds: 1,
	    numInserted: 1,
	    testTimeSec: 1,
	    avgInsRate: 1,
	    collectionSize: "$stats.size",
	    collectionStorageSize: "$stats.storageSize",
	    collectionAvgObjSize: "$stats.avgObjSize",
	    collectionCount: "$stats.count",
	    collectionTotalIndexSize: "$stats.totalIndexSize",
	    queryName: "$queryResult.name",
	    queryResCount: "$queryResult.count",
	    queryDuration: "$queryResult.testDuration",
	    testStartTime: 1}
	},
	{$sort : {"docSize" : 1}},
	{$group : {
	    _id : "$docSize",
	    insRate : {$push : {totalSeconds : "$totalSeconds", avgInsRate : "$avgInsRate"}}
	  }
	}
    ]
)

