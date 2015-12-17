var express = require('express'); // Get the module
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.use('/public', express.static('public'));

io.on('connection', function(socket){
  
  socket.on('update', function(msg){
    var m=JSON.parse(msg);
    //var m=m.client;
    io.emit(m.client, m.msg);
  });
});

http.listen(8000, function(){
  console.log('listening on *:8001');
});
