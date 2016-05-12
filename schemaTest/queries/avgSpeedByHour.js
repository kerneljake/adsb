db.data.aggregate(

  // Pipeline
  [
    // Stage 1
    {
      $unwind: "$events"
    },

    // Stage 2
    {
      $project: {
         "hour" : {$hour : "$events.t"},
         "s" : "$events.s"
      }
    },

    // Stage 3
    {
      $group: {
        _id : "$hour",
        avgSpeed : {$avg : "$s"}
      }
    },

    // Stage 4
    {
      $project: {
         "_id" : 0,
         "hour" : "$_id",
         "avgSpeed" : "$avgSpeed"
      }
    }
  ],

  // Options
  {
    cursor: {
      batchSize: 50
    },

    allowDiskUse: true
  }

  // Created with 3T MongoChef, the GUI for MongoDB - http://3t.io/mongochef

);
