#!/bin/bash

TIME=3600   #24 hours
THREADS=12

HOST=localhost
#HOST=ec2-54-208-26-116.compute-1.amazonaws.com
PORT=27017
#PORT=27000

node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 1 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME  --host $HOST --port $PORT
#node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 10 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME --host $HOST --port $PORT
#node schemaTest.js --batchSize 100 --numAircraft 5000 --docSize 60 --numParaBatch $THREADS --start "2016-01-01T00:00:00.000-0500" --totalSeconds $TIME --host $HOST --port $PORT



