# adsb

Read [dump1090](https://github.com/MalcolmRobb/dump1090.git) data from a [stream](http://woodair.net/SBS/Article/Barebones42_Socket_Data.htm) and insert it into MongoDB.


#### Read from dump1090's port 30003 ####

First, start dump1090 with --net 

```
$ dump1090 --interactive --net --fix
```

Then ingest from a network stream:

```
$ nc somehost 30003 | ./ingest.py
```
You could also save the stream to a file along the way if you wanted:
```
$ nc somehost 30003 | tee somefile.csv | ./ingest.py
```

#### Read from a CSV file ####

```
$ ./ingest.py somefile.csv
```

#### Read an uncompressed file stream with '-' argument ####
```
$ 7za e -so somefile.csv.7z  | ./ingest.py -
```
