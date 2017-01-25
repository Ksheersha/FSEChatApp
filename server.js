var express = require ('express');
var app = express();
var moment= require ('moment');
var server =require('http').createServer(app);
var io = require('socket.io').listen(server);
var path = require ('path');
var mongoose = require ('mongoose');

users=[];
connections=[];

server.listen(process.env.Port || 8080);
console.log ('Server running');


mongoose.connect('mongodb://localhost/ChatApp',function(err)
{
    if (err)
        throw err;
    else
        console.log("Connected to DB");
});

var chatSchema = mongoose.Schema({
    user: String,
    msg: String,
    created:{type: String, default:(new Date()).toUTCString()}//toTimeString() }

});

var Chat = mongoose.model('Message',chatSchema);

app.get('/',function(req,res){

   res.sendFile(path.join(__dirname + '/index.html'));
});



io.sockets.on('connection',function(socket){

    //User
    socket.on('new user',function(data,callback)
    {
        callback(true);
        socket.username=data;
        users.push(socket.username);
        updateUserNames();
        // console.log("called user func()");
    });

    function updateUserNames()
    {
        io.sockets.emit('get users',users);
        // console.log("inside user func()");

    }

    connections.push(socket);
    console.log('Connections: %s user connected',connections.length);


    var limitData = Chat.find({});
   limitData.limit(5).exec(function(err,docs)
    {
        if (err) throw err;

       // console.log ('Chat data limited to 5');

        //Load Chat history

     //   console.log('Retreiving Chat History' + docs);
            socket.emit('load old messages', docs);

    });

    socket.on('notifyUser', function(user){
        io.emit('notifyUser', user);
    });
//Message
     socket.on('send message',function(data){

         var newMsg = new Chat({msg:data,user:socket.username});
         newMsg.save (function (err) {
             if (err) throw err;
             console.log ('Saving Chat');
             io.sockets.emit('new message',{msg:data,user:socket.username,created:(new Date()).toUTCString()});
                 //moment((new Date()).getTime()).format('DD-MM-YYYY HH:mm:ss')});
                 //timestamp :  (new Date()).toUTCString()});
                //(new Date()).toDateString()});

             console.log('Data length'+data.length);

         });

     });





    //Disconnect

    socket.on('disconnect',function(data)
    {
        users.splice(users.indexOf(socket.username), 1);
        updateUserNames();

        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconnected: %s user connected', connections.length);
    });

});