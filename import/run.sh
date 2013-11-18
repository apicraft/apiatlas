#!/bin/bash

if [ -e "./import/import.json" ]	
then
	rm ./import/import.json
fi

node ./import/collate.js > ./import/import.json
cat ./import/import.json
