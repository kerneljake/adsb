db.data.aggregate(

  // Pipeline
  [
    // Stage 1
    {
      $unwind: {
         "path" : "$events"
      }
    },

    // Stage 2
    {
      $group: {
         "_id" : "$icao",
         "avgSpeed" : {"$avg" : "$events.s"}
      }
    }

  ]

  // Created with 3T MongoChef, the GUI for MongoDB - http://3t.io/mongochef

);
