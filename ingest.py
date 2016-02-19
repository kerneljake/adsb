#!/usr/bin/env python
# read dump1090 data from a stream and store it in MongoDB.
# assumption: message timestamps are monotonically increasing.

import csv
import sys
import time
from datetime import datetime
from pytz import timezone

# customize the next line for your timezone
MY_TIMEZONE = 'US/Central'
# flush interval (seconds)
FLUSH_INTERVAL = 5

buffer = {}
my_tz = timezone(MY_TIMEZONE)
utc_tz = timezone('UTC')

with open(sys.argv[1], 'rb') if len(sys.argv) > 1 else sys.stdin as csvfile:
	reader = csv.reader(csvfile, delimiter=',')
	start = time.time()
	for row in reader:
		msg_type, transmission_type, session_id, aircraft_id, icao_hex, flight_id, date_gen, time_gen, date_logged, time_logged, callsign, altitude, speed, bearing, latitude, longitude, vertical_rate, squawk, alert, emergency, spi, onground = row
		if ("MSG" != msg_type):
			continue
		loc_dt_ms = my_tz.localize(datetime.strptime(date_gen + " " + time_gen, "%Y/%m/%d %H:%M:%S.%f"))
		loc_dt = loc_dt_ms.replace(microsecond = 0)
		utc_dt = loc_dt.astimezone(utc_tz)
		# note if I use a timestamp string for _id, then it must include milliseconds in order
		# to prevent collisions if my buffer is flushed between two events in the same second

		# initialize the topmost dictionary with icao_hex
		try:
			buffer[icao_hex]['icao'] = icao_hex
		except (KeyError):
			buffer.setdefault(icao_hex, {'icao': icao_hex})

		# process each message type
		if "1" == transmission_type:
			buffer[icao_hex]['callsign'] = callsign.strip()
		elif "3" == transmission_type:
			try:
				if utc_dt != buffer[icao_hex]['events'][-1]['t']:
					buffer[icao_hex]['events'].append({})
			except (KeyError):
				buffer[icao_hex].setdefault('events', [{}])

			buffer[icao_hex]['events'][-1]['a'] = int(altitude)
			buffer[icao_hex]['events'][-1]['p'] = [ float(longitude), float(latitude) ]
			buffer[icao_hex]['events'][-1]['t'] = utc_dt
		elif "4" == transmission_type:
                        try:
				if utc_dt != buffer[icao_hex]['events'][-1]['t']:
					buffer[icao_hex]['events'].append({})
                        except (KeyError):
				buffer[icao_hex].setdefault('events', [{}])

			buffer[icao_hex]['events'][-1]['s'] = int(speed)
			buffer[icao_hex]['events'][-1]['b'] = int(bearing)
			if vertical_rate:
				buffer[icao_hex]['events'][-1]['v'] = int(vertical_rate)
			buffer[icao_hex]['events'][-1]['t'] = utc_dt

		now = time.time()
		if now - start >= FLUSH_INTERVAL:
			start = now
			print buffer
			print
			buffer.clear()

# DEBUGGING stuff
for key in buffer.keys():
	if 'events' in buffer[key]:
		print key + ": " + str(len( buffer[key]['events']) )

print buffer['AC4144']
