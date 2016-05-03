db.data.aggregate(

  // Pipeline
  [
    // Stage 1
    {
      $match: {
       "ts" : {$gte : ISODate("2016-01-01T05:10:00.000+0000"), $lt : ISODate("2016-01-01T05:20:00.000+0000") }
      }
    },

    // Stage 2
    {
      $group: { 
          "_id" : "$icao", 
          "avgSpeed" : {
              "$avg" : "$events.s"
          }
      }
    }

  ]

  // Created with 3T MongoChef, the GUI for MongoDB - http://3t.io/mongochef

);
