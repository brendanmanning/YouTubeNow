if [ "$(id -u)" != "0" ]; then
   echo "Please run as root or sudo" 1>&2
   exit 1
fi
echo "Step 1 of 3"
git clone https://github.com/brendanmanning/YouTubeNow.git > /dev/null
echo "Step 2 of 3"
cd YouTubeNow/
npm install --save express@4.10.2 > /dev/null
echo "Step 3 of 3"
npm install --save socket.io > /dev/null
echo "Finished! The server is being started now!"
echo "To start it again run: node server.js (inside this folder)"
node server.js
