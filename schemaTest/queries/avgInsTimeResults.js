db.tests.aggregate(

  // Pipeline
  [
    // Stage 1
    {
      $match: { 
          "argv.testName" : "debug", 
          "testCompleted" : true
      }
    },

    // Stage 2
    {
      $project: { 
          "_id" : 0, 
          "testName" : "$argv.testName", 
          "docSize" : 1, 
          "totalSeconds" : 1, 
          "numInserted" : 1, 
          "testTimeSec" : 1, 
          "avgInsRate" : 1, 
          "testStartTime" : 1
      }
    },

    // Stage 3
    {
      $sort: { 
          "docSize" : 1
      }
    },

    // Stage 4
    {
      $group: { 
          "_id" : "$totalSeconds", 
          "insRate" : {
              "$push" : {
                  "docSize" : "$docSize", 
                  "avgInsRate" : "$avgInsRate"
              }
          }
      }
    },

    // Stage 5
    {
      $project: {
        "totalSeconds" : "$_id",
        "_id" : 0,
        "insRate" : 1,
        "one" : {$arrayElemAt : ["$insRate", 0]},
        "ten" : {$arrayElemAt : ["$insRate", 1]},
        "sixty" : {$arrayElemAt : ["$insRate", 2]}
      }
    },

    // Stage 6
    {
      $project: {
         "totalSeconds" : 1,
         "oneInsRate" : "$one.avgInsRate",
         "tenInsRate" : "$ten.avgInsRate",
         "sixtyInsRate" : "$sixty.avgInsRate"
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
