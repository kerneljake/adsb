#!/usr/bin/env python

import csv
import sys
from datetime import datetime
from pytz import timezone

MY_TIMEZONE = 'US/Central'

buffer = {}
my_tz = timezone(MY_TIMEZONE)
utc_tz = timezone('UTC')

with open(sys.argv[1], 'rb') if len(sys.argv) > 1 else sys.stdin as csvfile:
	reader = csv.reader(csvfile, delimiter=',')
	for row in reader:
		msg_type, transmission_type, session_id, aircraft_id, icao_hex, flight_id, date_gen, time_gen, date_logged, time_logged, callsign, altitude, speed, bearing, latitude, longitude, vertical_rate, squawk, alert, emergency, spi, onground = row
		if ("MSG" != msg_type):
			continue
		loc_dt = my_tz.localize(datetime.strptime(date_gen + " " + time_gen, "%Y/%m/%d %H:%M:%S.%f"))
		utc_dt = loc_dt.astimezone(utc_tz)
		second_string = utc_dt.strftime("%Y%m%d%H%M%S")

		try:
			buffer[icao_hex]['icao'] = icao_hex
		except (KeyError):
			buffer.setdefault(icao_hex, {'icao': icao_hex})

		if "1" == transmission_type:
			buffer[icao_hex]['callsign'] = callsign.strip()
		elif "3" == transmission_type:
			try:
				if second_string != buffer[icao_hex]['events'][-1]['t']:
					buffer[icao_hex]['events'].append({})
			except (KeyError):
				buffer[icao_hex].setdefault('events', [{}])

			buffer[icao_hex]['events'][-1]['a'] = int(altitude)
			buffer[icao_hex]['events'][-1]['p'] = [ float(longitude), float(latitude) ]
			buffer[icao_hex]['events'][-1]['t'] = second_string

		elif "4" == transmission_type:
                        try:
				if second_string != buffer[icao_hex]['events'][-1]['t']:
					buffer[icao_hex]['events'].append({})
                        except (KeyError):
				buffer[icao_hex].setdefault('events', [{}])

			buffer[icao_hex]['events'][-1]['s'] = int(speed)
			buffer[icao_hex]['events'][-1]['b'] = int(bearing)
			if vertical_rate:
				buffer[icao_hex]['events'][-1]['v'] = int(vertical_rate)
			buffer[icao_hex]['events'][-1]['t'] = second_string

for key in buffer.keys():
	if 'events' in buffer[key]:
		print key + ": " + str(len( buffer[key]['events']) )

print buffer['AC4144']
