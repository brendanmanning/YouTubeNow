var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var rooms = [];

app.use(express.static(path.join(__dirname, 'public')));

app.get("/", function(req, res){
	res.sendFile(__dirname + "/index.html")
});

app.get("/play", function(req, res){
  res.sendFile(__dirname + "/room.html")
});

app.get("/join", function(req, res){
  res.sendFile(__dirname + "/join.html")
});

http.listen(8080, function(){
	console.log("Listening on port 8080");
});

// Socket Handling
io.on('connection', function(socket) {
  socket.on('disconnect', function(){
      // Remove the user from his/her room
      var room = roomFromId(socket.room);
      if(room != null)
      {
        console.log("Length before: " + room.sockets.length);
        room.sockets.splice(room.sockets.indexOf(socket), 1);
        console.log("Length after: " + room.sockets.length);
        room.updateUserList();
        room.sockets[0].emit('msg', "As the user here the longest, all new devices will sync their playback times with yours.");
        room.sockets[0].timesSentMessage++;
      }
  });

  // Event handling
  socket.on('joinroom', function(id, name) {
    if(name != "" && name != null) { socket.name = name; } else { socket.name = "An anonymous user"; }
  	if(socket.room == null)
  	{
  		var room = roomFromId(id);
  		if(room != null)
  		{
        if(name == room.creator)
        {
          if(room.csu)
          {
            socket.emit("msg", "That name is already taken");
            return;
          } else {
            room.csu = true;
          }
        }
        // Add the user
  			room.userJoin(socket);
        // Update the user's ui
        socket.emit('joined')
        // Update everyone's ui
        room.updateUserList();
  		} else {
  			socket.emit("msg", "That room does not exist (404)")
  		}
  	} else {
  		socket.emit("msg", "You are already in a room.")
  	}
  });

  socket.on('makeroom', function(video, creator, groupname){
  	if(video == "") { return; }
  	if(video == null) { return; }
  	if(socket.room == null)
  	{
  		// Create the room
  		var newRoom = new Room(generateID());

  		// Set the video
  		newRoom.setVideo(getVideoID(video));

      // Set the name
      newRoom.setName(groupname)

      // Set the creator's name
      newRoom.setCreator(creator);

  		// Add the room to the array
  		rooms.push(newRoom);

  		// Notify the user's browser to open the new page
  		socket.emit('created',newRoom.getId());
  	}
  });

  socket.on('changevideo', function(newurl, roomid){
    if(socket.room != null)
    {
      if(socket.room == roomid)
      {
        if(isValidVideoURL(newurl))
        {
          var room = roomFromId(roomid);
          room.video = getVideoID(newurl);
          room.esttime = 0;

          var sockets = room.sockets;
          for(var i = 0; i < sockets.length; i++)
           {
             sockets[i].emit("video", room.getVideo(), 0);
          }
        }
      }
    }
  });

  socket.on('getRoomInfo', function(roomID) {
    if(roomFromId(roomID) != null)
    {
      var r = roomFromId(roomID);
      socket.emit("roominfo",r.getName(), r.getCreator(), false);
    } else {
      socket.emit("roominfo", "_", "_", true);
    }
  });	

  // Page requests history
  socket.on('sendmessage', function(message) {
  	var room = roomFromId(socket.room)
  	if(room)
  	{
  		var name = socket.name;
  		if(name == null)
  		{
  			name = "Anonymous";
  		}

  		if(message == "")
  		{
  			socket.emit("chatmessage", "[SERVER]", "You can't send an blank message")
  			return;
  		}

  		if(name == "[SERVER]" || name == "server" || name == "admin" || name == "[server]")
  		{
  			socket.emit("chatmessage", "[SERVER]", "WARNING! You are not allowed to use usernames which might decieve other users!");
  			return;
  		}

  		room.messages.push(new Message(name, message.replaceAll("<", "&lt;")));
  		for(var s = 0; s < room.sockets.length; s++)
  		{
  			room.sockets[s].emit('chatmessage', name, message.replaceAll("<", "&lt;"));
  		}
  	}
  });

  socket.on('synctimes', function(seconds, video, room) {
    if(socket.room = room)
    {
      if(video == roomFromId(room).getVideo())
      {
        var s = roomFromId(room).sockets;
        for(var u = 0; u < s.length; u++)
        {
          s[u].emit('time', seconds);
        }
      } else {
        console.log("tried to update outdated video")
      }
    } else {
      console.log("user tried to hijack a room")
    }
  })

  socket.on('pause', function(roomid){
  	if(socket.room == roomid)
  	{
  		if(roomFromId(roomid) != null)
  		{
  			var sockets = roomFromId(roomid).sockets;
  			for(var i = 0; i < sockets.length; i++)
  			{
  				sockets[i].emit('pause');
  			}
  		}
  	}
  })

  socket.on('play', function(roomid){
  	if(socket.room == roomid)
  	{
  		if(roomFromId(roomid) != null)
  		{
  			var sockets = roomFromId(roomid).sockets;
  			for(var i = 0; i < sockets.length; i++)
  			{
  				sockets[i].emit('unpause');
  			}
  		}
  	}
  })
});

// Rooms
var Room = function(identifier) {
	this.id = identifier;
	this.sockets = [];
	this.video = null;
  	this.creator = null;
  	this.groupname = null;
  	this.esttime = 0;
  	this.csu = false; // Creator Signup Used
  	this.messages = [];
  	this.times = [];
};
Room.prototype.updateUserList = function()
{
  var content = "";
  for(var i = 0; i < this.sockets.length; i++)
  {
    content += "<li>" + this.sockets[i].name + "</li>"
  }

  for(var s = 0; s < this.sockets.length; s++)
  {
    this.sockets[s].emit('users', content);
  }
}
Room.prototype.setCreator = function(c)
{
  this.creator = c;
}
Room.prototype.getCreator = function() {
  if(this.creator == null) { return "Anonymous"; }
  return this.creator;
};
Room.prototype.setName = function(n)
{
  this.groupname = n;
}
Room.prototype.getName = function()
{
  if(this.groupname == null) { return "Unnamed Group"; }
  return this.groupname;
}
Room.prototype.setVideo = function(url)
{
	this.video = url;
}
Room.prototype.getVideo = function()
{
	return this.video;
}
Room.prototype.userJoin = function(socket)
{
	this.sockets.push(socket);

	// Update the user's socket object
	socket.room = this.id;

  // Send the user the current video
  socket.emit("video", this.video, this.esttime);

  // Set the count of "you are the user here the longest..." messages to 0
  socket.timesSentMessage = 0;

  // Sync all clients
  this.sockets[0].emit('serverRequestsSync');
  console.log("Sending sync request to socket with name " + this.sockets[0].name);
}
Room.prototype.userLeave = function(socket)
{
  // This method doesn't call anymore so don't put anything here
	this.sockets.splice(this.sockets.indexOf(socket),1);
}
Room.prototype.getAll = function()
{
  return this.sockets;
}
Room.prototype.getTimes = function()
{
	// By default, we sync all times with the user who's been in the group the longest
	// That is to say, the socket at index 0 of our array
	this.sockets[0].emit('serverRequestsSync');
	// The client should respond to this by emitting the sync times event, which will 
	// sync all clients to their current time
}
Room.prototype.getId = function() { return this.id; }

var Message = function(sender,text)
{
	this.user = sender;
	this.message = text;
}

function roomFromId(id)
{
	for(var i = 0; i < rooms.length; i++)
	{
		if(rooms[i].getId() == id) { return rooms[i]; }
	}

	return null;
}
function generateID()
{
	var ok = false;
	var id = null;
	while(!ok)
	{
		id = randomString(6);
		if(roomFromId(id) == null) {
			return id;
		}
	}
}
function randomString(length)
{
    	var text = "";
    	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    	for( var i=0; i < length; i++ )
      	 	text += possible.charAt(Math.floor(Math.random() * possible.length));

    	return text;
}
function getVideoID(ytURL)
{
  var str = ytURL.substr(ytURL.lastIndexOf("?v=") + 3);
  // Typically a YouTube ID is an 11 character alphanumeric string
  // with optional (+ and _) symbols.
  if(str.length == 11)
  {
    return str;
  } else {
    // If the extracted string is not 11 characters long, the URL
    // is probably either malformed or has added params (example: a playlist id)
    return null;
  }
}
function isValidVideoURL(ytURL)
{
  // This function just checks if the url is syntatically valid, not if a video actually 
  //...exists at that URL
  if(ytURL.startsWith("https://www.youtube.com/watch?v="))
  {
    if(ytURL.length == 43)
    {
      return true;
    }
  }

  return false;
}
String.prototype.replaceAll = function(search, replacement) {
   			 var target = this;
    		 return target.split(search).join(replacement);
		};