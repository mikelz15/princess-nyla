#!/bin/bash
cd "$(dirname "$0")"
PORT=8765
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")
printf '{ "url": "http://%s:%s" }\n' "$IP" "$PORT" > tablet.json
if lsof -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  open "http://127.0.0.1:$PORT"
  osascript -e "display notification \"On the iPad open http://$IP:$PORT\" with title \"Princess Nyla\""
  exit 0
fi
python3 -m http.server $PORT --bind 0.0.0.0 >/tmp/princess-nyla-server.log 2>&1 &
sleep 0.4
open "http://127.0.0.1:$PORT"
osascript -e "display notification \"On the iPad open http://$IP:$PORT\" with title \"Princess Nyla\""

