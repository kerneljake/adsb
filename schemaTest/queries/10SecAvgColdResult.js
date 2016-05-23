db.tests.aggregate(

  // Pipeline
  [
    // Stage 1
    {
      $match: { 
          "argv.testName" : "debug", 
          "testCompleted" : true,
          "queryResult" : {$exists : true}
      }
    },

    // Stage 2
    {
      $unwind: "$queryResult"
    },

    // Stage 3
    {
      $match: {
          "queryResult.name" : "Avg 10 min speed - cold cache"
      }
    },

    // Stage 4
    {
      $group: {
         _id : "$totalSeconds",
         queryResult : {$push : {testDuration : "$queryResult.testDuration", docSize : "$docSize"}}
      }
    },

    // Stage 5
    {
      $project: {
         _id : 0,
         totalSeconds : "$_id",
         one: {$arrayElemAt : ["$queryResult", 0]},
         ten: {$arrayElemAt : ["$queryResult", 1]},
         sixty: {$arrayElemAt : ["$queryResult", 2]}
      }
    },

    // Stage 6
    {
      $project: {
         totalSeconds : 1,
         oneDuration: "$one.testDuration",
         tenDuration: "$ten.testDuration",
         sixtyDuration: "$sixty.testDuration",
      }
    },

    // Stage 7
    {
      $sort: {
         "totalSeconds" : 1
      }
    }

  ]

  // Created with 3T MongoChef, the GUI for MongoDB - http://3t.io/mongochef

);
