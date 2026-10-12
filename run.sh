#!/usr/bin/env bash
# Usage: ./run.sh            (uses "games" from config.json)
#        ./run.sh 25         (play 25 battles then stop; 0 = unlimited)
cd "$(dirname "$0")"
rm -f STOP
exec node bot.js "$@"
