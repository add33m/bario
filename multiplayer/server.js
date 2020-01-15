let app = require('express')();
let http = require('http').createServer(app);
let io = require('socket.io')(http);

let PORT = 8442;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log("A user connected!");
});

http.listen(PORT, function(){
  console.log("Listening to port 8442!");
});