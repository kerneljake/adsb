#!/usr/bin/env python

import csv
import sys
from datetime import datetime
from pytz import timezone

MY_TIMEZONE = 'US/Central'

buffer = {}
my_tz = timezone(MY_TIMEZONE)

with open(sys.argv[1], 'rb') if len(sys.argv) > 1 else sys.stdin as csvfile:
	reader = csv.reader(csvfile, delimiter=',')
	for row in reader:
		msg_type, transmission_type, session_id, aircraft_id, icao_hex, flight_id, date_gen, time_gen, date_logged, time_logged, callsign, altitude, speed, bearing, latitude, longitude, vertical_rate, squawk, alert, emergency, spi, onground = row
		if ("MSG" != msg_type):
			continue
		aware = my_tz.localize(datetime.strptime(date_gen + " " + time_gen, "%Y/%m/%d %H:%M:%S.%f"))
		second_string = aware.strftime("%Y%m%d%M%S")

		buffer.setdefault(icao_hex, {})
		if "1" == transmission_type:
			buffer[icao_hex]['callsign'] = callsign.strip()
		elif "3" == transmission_type:
			buffer[icao_hex].setdefault('events', {}).setdefault(second_string, {})
			buffer[icao_hex]['events'][second_string].update({ 'a': altitude, 'p': [ longitude, latitude ] })
		elif "4" == transmission_type:
			buffer[icao_hex].setdefault('events', {}).setdefault(second_string, {})
			buffer[icao_hex]['events'][second_string].update({ 's': speed, 'b': bearing })

for key in buffer.keys():
	if 'events' in buffer[key]:
		print key + ": " + str(len( buffer[key]['events']) )
