db.tests.aggregate(

  // Pipeline
  [
    // Stage 1
    {
      $match: { 
          "argv.testName" : "complete08Jun", 
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
          "testStartTime" : 1, 
          "lambda" : 1, 
          "preAggS" : 1, 
          "lTrackMem" : 1, 
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
                  "lambda" : "$lambda", 
                  "preAggS" : "$preAggS", 
                  "avgInsRate" : "$avgInsRate", 
                  "testType" : "$testType"
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
          "one" : {
              "$filter" : {
                  "input" : "$insRate", 
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
                  "input" : "$insRate", 
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
                  "input" : "$insRate", 
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
                  "input" : "$insRate", 
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
                  "input" : "$insRate", 
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

    // Stage 6
    {
      $project: { 
          "totalSeconds" : 1, 
          "oneInsRate" : {
              "$arrayElemAt" : [
                  "$one", 
                  0
              ]
          }, 
          "lambdaInsRate" : {
              "$arrayElemAt" : [
                  "$lambda", 
                  0
              ]
          }, 
          "lambdaMemInsRate" : {
              "$arrayElemAt" : [
                  "$lambdaMem", 
                  0
              ]
          }, 
          "tenInsRate" : {
              "$arrayElemAt" : [
                  "$ten", 
                  0
              ]
          }, 
          "sixtyInsRate" : {
              "$arrayElemAt" : [
                  "$sixty", 
                  0
              ]
          }
      }
    },

    // Stage 7
    {
      $project: { 
          "totalSeconds" : 1, 
          "oneInsRate" : "$oneInsRate.avgInsRate", 
          "lambdaInsRate" : "$lambdaInsRate.avgInsRate", 
          "lambdaMemInsRate" : "$lambdaMemInsRate.avgInsRate", 
          "tenInsRate" : "$tenInsRate.avgInsRate", 
          "sixtyInsRate" : "$sixtyInsRate.avgInsRate"
      }
    },

    // Stage 8
    {
      $sort: { 
          "totalSeconds" : 1
      }
    }

  ]

  // Created with 3T MongoChef, the GUI for MongoDB - http://3t.io/mongochef

);
