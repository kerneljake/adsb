db.testing.aggregate(

  // Pipeline
  [
    // Stage 1
    {
      $unwind: "$events"
      
    },

    // Stage 2
    {
      $match: {
        "events.a": {$exists : 0}
      }
                 	  
    },

    // Stage 3
    {
      $group: {
         _id : null,
         count : {$sum : 1}
      }
    }
  ],

  // Options
  {
    cursor: {
      batchSize: 50
    }
  }

  // Created with 3T MongoChef, the GUI for MongoDB - http://3t.io/mongochef

);
