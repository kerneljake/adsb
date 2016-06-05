#!/bin/bash

TESTNAME=debug2Jun04
THREADS=6

HOST=localhost
#HOST=ec2-54-208-26-116.compute-1.amazonaws.com
PORT=27017
#PORT=27000

#SMALL
#TIME=3600
TIME=180		       

node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 1 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME  --host $HOST --port $PORT --testName $TESTNAME --preAggS false  --lambda 1 --lTrackmem false
#node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 1 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME  --host $HOST --port $PORT --testName $TESTNAME --preAggS false  --lambda 60 --lTrackmem
#node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 10 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME --host $HOST --port $PORT --testName $TESTNAME --preAggS true --lambda 1 --lTrackmem false
#node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 60 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME --host $HOST --port $PORT --testName $TESTNAME --preAggS true --lambda 1 --lTrackmem false

#MEDIUM - 1 day
TIME=86400			

#node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 1 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME  --host $HOST --port $PORT --testName $TESTNAME
#node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 10 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME --host $HOST --port $PORT --testName $TESTNAME
#node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 60 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME --host $HOST --port $PORT --testName $TESTNAME


#LARGE - 3 days
TIME=259200			

#node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 1 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME  --host $HOST --port $PORT --testName $TESTNAME
#node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 10 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME --host $HOST --port $PORT --testName $TESTNAME
#node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 60 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME --host $HOST --port $PORT --testName $TESTNAME