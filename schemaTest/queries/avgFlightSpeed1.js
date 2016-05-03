db.data.aggregate(

  // Pipeline
  [
    // Stage 1
    {
      $group: {
         "_id" : "$icao",
         "avgSpeed" : {"$avg" : "$events.s"}
      }
    }

  ]

  // Created with 3T MongoChef, the GUI for MongoDB - http://3t.io/mongochef

);
