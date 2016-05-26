db.data.aggregate(

  // Pipeline
  [
    // Stage 1
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

    // Stage 2
    {
      $project: {
      	_id : 0,
      	"icao" : "$_id",
      	"avgSpeed": {"$divide" : ["$speedTotal", "$countTotal"]}
      }
    }      
  ]
);
