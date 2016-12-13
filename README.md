# YouTubeNow
Watch YouTube videos with friends
## Setup
Download [nodejs](https://nodejs.org/en/) then pick an option
### Automatic
Run this in a Bash Shell:
```
sudo -su && wget https://raw.githubusercontent.com/brendanmanning/YouTubeNow/master/install.sh && chmod +x install.sh && ./install.sh
```
### Manual
Run this...
```
npm install --save express@4.10.2
```
And then do...
```
npm install --save socket.io
```
Finally (inside YouTubeNow directory)...
```
node server.js
```
Open [http://localhost:8080](http://localhost:8080) and pour youself some ☕
