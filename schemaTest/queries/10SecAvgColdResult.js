db.tests.aggregate(

  // Pipeline
  [
    // Stage 1
    {
      $match: { 
          "argv.testName" : "complete08Jun", 
          "testCompleted" : true, 
          "queryResult" : {
              "$exists" : true
          }, 
          "testStartTime" : {
              "$gt" : ISODate("2016-06-08T00:00:00.000+0000")
          }
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
          "testStartTime" : 1, 
          "lambda" : 1, 
          "preAggS" : 1, 
          "lTrackMem" : 1, 
          "queryResult" : 1, 
          "testType" : {
              "$cond" : {
                  "if" : {
                      "$and" : [
                          {
                              "$eq" : [
                                  "$docSize", 
                                  1
                              ]
                          }, 
                          {
                              "$eq" : [
                                  "$lambda", 
                                  1
                              ]
                          }
                      ]
                  }, 
                  "then" : "one", 
                  "else" : {
                      "$cond" : {
                          "if" : {
                              "$and" : [
                                  {
                                      "$eq" : [
                                          "$docSize", 
                                          1
                                      ]
                                  }, 
                                  {
                                      "$ne" : [
                                          "$lambda", 
                                          1
                                      ]
                                  }, 
                                  {
                                      "$eq" : [
                                          "$lTrackMem", 
                                          false
                                      ]
                                  }
                              ]
                          }, 
                          "then" : "lambda", 
                          "else" : {
                              "$cond" : {
                                  "if" : {
                                      "$and" : [
                                          {
                                              "$eq" : [
                                                  "$docSize", 
                                                  1
                                              ]
                                          }, 
                                          {
                                              "$ne" : [
                                                  "$lambda", 
                                                  1
                                              ]
                                          }, 
                                          {
                                              "$eq" : [
                                                  "$lTrackMem", 
                                                  true
                                              ]
                                          }
                                      ]
                                  }, 
                                  "then" : "lambdaMem", 
                                  "else" : {
                                      "$cond" : {
                                          "if" : {
                                              "$eq" : [
                                                  "$docSize", 
                                                  10
                                              ]
                                          }, 
                                          "then" : "ten", 
                                          "else" : {
                                              "$cond" : {
                                                  "if" : {
                                                      "$eq" : [
                                                          "$docSize", 
                                                          60
                                                      ]
                                                  }, 
                                                  "then" : "sixty", 
                                                  "else" : "other"
                                              }
                                          }
                                      }
                                  }
                              }
                          }
                      }
                  }
              }
          }
      }
    },

    // Stage 3
    {
      $unwind: "$queryResult"
    },

    // Stage 4
    {
      $match: { 
          "queryResult.name" : "Avg 10 min speed - cold cache"
      }
    },

    // Stage 5
    {
      $group: { 
          "_id" : "$totalSeconds", 
          "queryResult" : {
              "$push" : {
                  "testDuration" : "$queryResult.testDuration", 
                  "docSize" : "$docSize", 
                  "lambda" : "$lambda", 
                  "preAggS" : "$preAggS", 
                  "testType" : "$testType"
              }
          }
      }
    },

    // Stage 6
    {
      $project: { 
          "_id" : 0, 
          "totalSeconds" : "$_id", 
          "one" : {
              "$filter" : {
                  "input" : "$queryResult", 
                  "as" : "result", 
                  "cond" : {
                      "$eq" : [
                          "$$result.testType", 
                          "one"
                      ]
                  }
              }
          }, 
          "lambda" : {
              "$filter" : {
                  "input" : "$queryResult", 
                  "as" : "result", 
                  "cond" : {
                      "$eq" : [
                          "$$result.testType", 
                          "lambda"
                      ]
                  }
              }
          }, 
          "lambdaMem" : {
              "$filter" : {
                  "input" : "$queryResult", 
                  "as" : "result", 
                  "cond" : {
                      "$eq" : [
                          "$$result.testType", 
                          "lambdaMem"
                      ]
                  }
              }
          }, 
          "ten" : {
              "$filter" : {
                  "input" : "$queryResult", 
                  "as" : "result", 
                  "cond" : {
                      "$eq" : [
                          "$$result.testType", 
                          "ten"
                      ]
                  }
              }
          }, 
          "sixty" : {
              "$filter" : {
                  "input" : "$queryResult", 
                  "as" : "result", 
                  "cond" : {
                      "$eq" : [
                          "$$result.testType", 
                          "sixty"
                      ]
                  }
              }
          }
      }
    },

    // Stage 7
    {
      $project: { 
          "totalSeconds" : 1, 
          "one" : {
              "$arrayElemAt" : [
                  "$one", 
                  0
              ]
          }, 
          "lambda" : {
              "$arrayElemAt" : [
                  "$lambda", 
                  0
              ]
          }, 
          "lambdaMem" : {
              "$arrayElemAt" : [
                  "$lambdaMem", 
                  0
              ]
          }, 
          "ten" : {
              "$arrayElemAt" : [
                  "$ten", 
                  0
              ]
          }, 
          "sixty" : {
              "$arrayElemAt" : [
                  "$sixty", 
                  0
              ]
          }
      }
    },

    // Stage 8
    {
      $project: { 
          "totalSeconds" : 1, 
          "oneDuration" : "$one.testDuration", 
          "lambdaDuration" : "$lambda.testDuration", 
          "lambdaMemDuration" : "$lambdaMem.testDuration", 
          "tenDuration" : "$ten.testDuration", 
          "sixtyDuration" : "$sixty.testDuration"
      }
    },

    // Stage 9
    {
      $sort: { 
          "totalSeconds" : 1
      }
    }

  ]

  // Created with 3T MongoChef, the GUI for MongoDB - http://3t.io/mongochef

);
