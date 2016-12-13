if [ "$(id -u)" != "0" ]; then
   echo "Please run as root or sudo" 1>&2
   exit 1
fi
git clone https://github.com/brendanmanning/YouTubeNow.git
cd YouTubeNow/
npm install --save express@4.10.2
npm install --save socket.io
echo "Finished! The server is being started now!" 1>&2
echo "To start it again run: node server.js (inside this folder)" 1>&2
node server.js
