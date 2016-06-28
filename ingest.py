#!/usr/bin/env python
# read dump1090 data from a stream and store it in MongoDB.
# assumption: message timestamps are monotonically increasing.

import csv
import sys
import time
from datetime import datetime
from pytz import timezone
import signal
from pymongo import MongoClient

############ CONFIG HERE ############
# your timezone
MY_TIMEZONE = 'US/Central'
# flush interval (in seconds) when reading from stdin
FLUSH_INTERVAL = 5
# flush after reading this number of useful messages (not lines) from a file
FLUSH_MESSAGE_COUNT = 50
# database config
DATABASE = 'adsb'
COLLECTION = 'readings'
URI = 'mongodb://localhost:27017/'
############ END CONFIG #############

def flush_buffer():
	bulk = collection.initialize_unordered_bulk_op()
	for key in buffer:
		insert_doc = {"icao": buffer[key]['icao'], "t": buffer[key]['ts']}
		if 'callsign' in buffer[key]:
			insert_doc['callsign'] = buffer[key]['callsign']
		if 'events' in buffer[key] and len(buffer[key]['events']) > 0:
			for event in buffer[key]['events']:
				baseline = insert_doc.copy()
				baseline.update(event) # overwrite t
				bulk.insert(baseline)
		else:
			bulk.insert(insert_doc)
	result = bulk.execute()
	buffer.clear()

def catch_sigint(signal, frame):
	flush_buffer()
	sys.exit(0)

# database initialization
dbclient = MongoClient(URI)
db = dbclient[DATABASE]
collection = db[COLLECTION]

# variable initialization
buffer = {}
signal.signal(signal.SIGINT, catch_sigint)
messages_read = 0
my_tz = timezone(MY_TIMEZONE)
utc_tz = timezone('UTC')
from_network = True if 1 == len(sys.argv) else False # note: you can use '-' if you want to uncompress the input

# main loop
with sys.stdin if from_network or sys.argv[1] is '-' else open(sys.argv[1], 'rb') as csvfile:
	reader = csv.reader(csvfile, delimiter=',')
	start = time.time()
	for row in reader:
		msg_type, transmission_type, session_id, aircraft_id, icao_hex, flight_id, date_gen, time_gen, date_logged, time_logged, callsign, altitude, speed, bearing, latitude, longitude, vertical_rate, squawk, alert, emergency, spi, onground = row
		if ("MSG" != msg_type) or (transmission_type not in ["1","3","4"]):
			continue

		local_dt_ms = my_tz.localize(datetime.strptime(date_gen + " " + time_gen, "%Y/%m/%d %H:%M:%S.%f"))
		utc_dt_second = local_dt_ms.replace(microsecond = 0).astimezone(utc_tz) # UTC to the nearest second
		utc_str_hour = local_dt_ms.replace(microsecond = 0, second = 0, minute = 0).astimezone(utc_tz).strftime("%Y%m%d%H") # UTC to the nearest hour
		_id = utc_str_hour + ":" + icao_hex

		# initialize the dictionary
		try:
			buffer[_id]['icao'] = icao_hex
		except (KeyError):
			buffer.setdefault(_id, {'icao': icao_hex})
			# 'ts' is the timestamp of the first message recorded in a given document,
			# which may precede the timestamp in the first 'event' array element.
			# The following assignment is not idempotent, but we rectify during initial insert.
			buffer[_id]['ts'] = utc_dt_second

		# process each message type
		if "1" == transmission_type:
			buffer[_id]['callsign'] = callsign.strip()
		elif "3" == transmission_type:
			if not (altitude or longitude or latitude):
				continue
			try:
				if utc_dt_second != buffer[_id]['events'][-1]['t']:
					buffer[_id]['events'].append({})
			except (KeyError):
				buffer[_id].setdefault('events', [{}])

			if altitude:
				buffer[_id]['events'][-1]['a'] = int(altitude)
			buffer[_id]['events'][-1]['p'] = [ float(longitude), float(latitude) ]
			buffer[_id]['events'][-1]['t'] = utc_dt_second
		elif "4" == transmission_type:
			if not (speed or bearing or vertical_rate):
				continue
                        try:
				if utc_dt_second != buffer[_id]['events'][-1]['t']:
					buffer[_id]['events'].append({})
                        except (KeyError):
				buffer[_id].setdefault('events', [{}])

			if speed:
				buffer[_id]['events'][-1]['s'] = int(speed)
			if bearing:
				buffer[_id]['events'][-1]['b'] = int(bearing)
			if vertical_rate:
				buffer[_id]['events'][-1]['v'] = int(vertical_rate)
			buffer[_id]['events'][-1]['t'] = utc_dt_second

		if from_network:
			now = time.time()
			if now - start >= FLUSH_INTERVAL:
				flush_buffer()
				start = now
		else:
			messages_read = messages_read + 1
			if messages_read >= FLUSH_MESSAGE_COUNT:
				flush_buffer()
				messages_read = 0

# finally flush the buffer if we were reading from a file
flush_buffer()
