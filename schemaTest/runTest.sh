#!/bin/bash

TESTNAME=complete08Jun
THREADS=24

#HOST=localhost
HOST=ec2-54-208-26-116.compute-1.amazonaws.com
#PORT=27017
PORT=27000

#SMALL
TIME=3600
#TIME=180

node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 1 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME  --host $HOST --port $PORT --testName $TESTNAME --preAggS false  --lambda 1 --lTrackMem false
node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 1 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME  --host $HOST --port $PORT --testName $TESTNAME --preAggS false  --lambda 60 --lTrackMem false
node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 1 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME  --host $HOST --port $PORT --testName $TESTNAME --preAggS false  --lambda 60 --lTrackMem true
node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 10 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME --host $HOST --port $PORT --testName $TESTNAME --preAggS true --lambda 1 --lTrackMem false
node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 60 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME --host $HOST --port $PORT --testName $TESTNAME --preAggS true --lambda 1 --lTrackMem false


#MEDIUM - 1 day
TIME=86400			

node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 1 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME  --host $HOST --port $PORT --testName $TESTNAME --preAggS false  --lambda 1 --lTrackMem false
node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 1 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME  --host $HOST --port $PORT --testName $TESTNAME --preAggS false  --lambda 60 --lTrackMem false
node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 1 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME  --host $HOST --port $PORT --testName $TESTNAME --preAggS false  --lambda 60 --lTrackMem true
node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 10 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME --host $HOST --port $PORT --testName $TESTNAME --preAggS true --lambda 1 --lTrackMem false
node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 60 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME --host $HOST --port $PORT --testName $TESTNAME --preAggS true --lambda 1 --lTrackMem false


#LARGE - 3 days
TIME=259200			

node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 1 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME  --host $HOST --port $PORT --testName $TESTNAME --preAggS false  --lambda 1 --lTrackMem false
node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 1 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME  --host $HOST --port $PORT --testName $TESTNAME --preAggS false  --lambda 60 --lTrackMem false
node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 1 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME  --host $HOST --port $PORT --testName $TESTNAME --preAggS false  --lambda 60 --lTrackMem true
node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 10 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME --host $HOST --port $PORT --testName $TESTNAME --preAggS true --lambda 1 --lTrackMem false
node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 60 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME --host $HOST --port $PORT --testName $TESTNAME --preAggS true --lambda 1 --lTrackMem false


#tests to rerun
# 1. Medium first test
# 2. All tests with lTrackMem true


