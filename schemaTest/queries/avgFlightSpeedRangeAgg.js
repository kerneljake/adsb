db.data.aggregate(

  // Pipeline
  [
    // Stage 1
    {
      $match: { 
          "ts" : {
              "$gte" : ISODate("2016-01-01T05:10:00.000+0000"), 
              "$lt" : ISODate("2016-01-01T05:20:00.000+0000")
          }
      }
    },

    // Stage 2
    {
      $group: { 
          "_id" : "$icao", 
          "speedTotal" : {
              "$sum" : "$eSTotal"
          }, 
          "countTotal" : {
              "$sum" : "$eCount"
          }
      }
    },

    // Stage 3
    {
      $project: {
      	_id : 0,
      	"icao" : "$_id",
      	"avgSpeed": {"$divide" : ["$speedTotal", "$countTotal"]}
      }
    }

  ]

  // Created with 3T MongoChef, the GUI for MongoDB - http://3t.io/mongochef

);
