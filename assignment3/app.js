var express = require('express')
var app = express()
var path = require('path')
var bodyparser = require('body-parser')
var mongoose = require('mongoose')
var serv = require('http').Server(app)
var io = require('socket.io')(serv,{})
var debug = true

app.get('/', function(req,res)
{
    res.sendFile(__dirname+'/views/index.html')
})

app.use('/views', express.static(__dirname+'/views'))

app.use(express.static(__dirname+"/views"))
app.listen(5000, function()
{
    console.log("Listening on port 5000")
})

var SocketList = {}

var GameObject = function()
{
    var self = {
        x:400,
        y:300,
        spX:0,
        spY:0,
        id:""
    }

    self.update = function()
    {
        self.updatePosition()
    }
    self.updatePosition = function()
    {
        self.x += self.spX
        self.y += self.spY
    }
    self.getDist = function(point){
        return Math.sqrt(Math.pow(self.x - point.x,2)+Math.pow(self.y-point.y,2))
    }
    return self
}

var Player =function(id){
    
    var self = GameObject()
    self.id = id
    self.number = Math.floor(Math.random()*10)
    self.right = false
    self.left = false
    self.up = false
    self.down = false
    self.speed = 10
    
    var playerUpdate = self.update

    self.update = function(){
        self.updateSpeed()
        playerUpdate()
    }

    self.updateSpeed = function(){
        if(self.right){
            self.spX = self.speed
        }else if(self.left){
            self.spX = -self.speed
        }else{
            self.spX = 0
        }

        if(self.up){
            self.spY = -self.speed
        }else if(self.down){
            self.spY = self.speed
        }else{
            self.spY = 0
        }
    }

    Player.list[id] = self

    return self
}

Player.list = {}

//list of functions for player connection and movement
Player.onConnect = function(socket){
    
    var player = new Player(socket.id)
    
    //recieves player input
    socket.on('keypress',function(data){
        //console.log(data.state)
        if(data.inputId === 'up')
            player.up = data.state
        if(data.inputId === 'left')
            player.left = data.state
        if(data.inputId === 'right')
            player.right = data.state
    })
}

Player.onDisconnect = function(socket){
    delete Player.list[socket.id]
}

Player.update = function(){
    var pack = []
   
    for (var i in Player.list) {
        var player = Player.list[i]
        player.update()
        //console.log(player)
        pack.push({
            x: player.x,
            y: player.y,
            number:player.number,
            id:player.id 
        })
    }

    return pack
}

//Connection to game
io.sockets.on('connection', function(socket){
    console.log("Socket Connected")

    socket.id = Math.random()
    SocketList[socket.id] = socket
    
    //disconnection event
    socket.on('disconnect',function(){
        delete SocketList[socket.id]
        Player.onDisconnect(socket)
    })

    //handleing chat event
    socket.on('sendMessageToServer',function(data){
        console.log(data)
       var playerName = (" " + socket.id).slice(2,7)
       for(var i in SocketList){
           SocketList[i].emit('addToChat', playerName + ": "+ data)
       }
    })

    socket.on('evalServer',function(data){
        if(!debug){
            return
        }
        var res = eval(data)
        socket.emit('evalResponse', res)
    })
})

//Setup Update Loop 
setInterval(function(){
    var pack = {
        player:Player.update()
    }
  // var pack = Player.update();
    for (var i in SocketList) {
        var socket = SocketList[i]
        socket.emit('newPositions',pack)
    }
}, 1000/30)

//makes the connection to the database server
mongoose.connect('mongodb://localhost:27017/highScore',
{
    useNewUrlParser:true
}).then(function()
{
    console.log("Connected to MongoDB Database")
}).catch(function(err)
{
    console.log(err)
})

//load in database templates
require('./models/Score')
var Score = mongoose.model('score')
