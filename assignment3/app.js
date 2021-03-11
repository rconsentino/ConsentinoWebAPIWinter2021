var express = require("express")
var app = express()
var serv = require("http").Server(app)
var io = require("socket.io")(serv,{})
var debug = true
var mongoose = require('mongoose')
require('./db')
require('./models/Player')

// game declarations

var gravity = 1;
var asteroids = new Array();
var numAsteroids = 10;
var gameOver = true;
var score = 0;
var gameStates = [];
var currentState = 0;
var isPlaying = false
var playerCount = 0

function randomRange(high, low){
    return Math.random() * ( high - low) + low;
}

var PlayerData = mongoose.model('player')

//file communication
app.get('/', function(req, res)
{
    res.sendFile(__dirname+'/client/index.html')
})

//server side communication
app.use('/client', express.static(__dirname+'/client'))
serv.listen(3000, function()
{
    console.log("Connected on localhost 3000")
})

var SocketList = {}

// class for a gameobject
var GameObject = function()
{
    var self = 
    {
        x:400,
        y:300,
        spX:0,
        spY:0,
        id:"",
       
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
    self.getDist = function(point)
    {
        return Math.sqrt(Math.pow(self.x - point.x, 2) + Math.pow(self.y - point.y, 2))
    }

    return self
}

var Player = function(id)
{
    var self = GameObject()
    self.id = id
    self.number = Math.floor(Math.random() * 10)
    self.right = false
    self.left = false
    self.up = false
    self.speed = 5
    self.width = 20
    self.height = 20
    self.vx = 0
    self.vy = 0
    self.flameLength = 30

    var playerUpdate = self.update

    self.update = function()
    {
        self.updateSpeed()
        playerUpdate()

    }

    self.updateSpeed = function()
    {
        // left and right
        if(self.right && self.x < 780)
        {
            self.spX = self.speed
        }
        else if(self.left && self.x > 0)
        {
            self.spX = -self.speed
        }
        else
        {
            self.spX = 0;
        }
        // up and down
        if(self.up && self.y > 20)
        {
            self.spY = -self.speed
        }
        else
        {
            if(self.y < 590)
            {
                self.spY = 3;
            }
            else
            {
                self.spY = 0
            }

        }
    }

    Player.list[id] = self

    return self
}

Player.list = {}

// list of functions for player connection and movement
Player.onConnect = function(socket)
{
    playerCount++
    var player = new Player(socket.id)
        // receive the player inputs
        socket.on('keypress', function(data)
        {
            if(data.inputId === 'up')
            {
                player.up = data.state
            }

            if(data.inputId === 'left')
            {
                player.left = data.state
            }
            if(data.inputId === 'right')
            {
                player.right = data.state
            }
            if(data.inputId === 'enter')
            {
                if(isPlaying == false)
                {
                    gameStart()
                }
                isPlaying = true;
            }

        })
}

Player.onDisconnect = function(socket)
{
    playerCount--
    delete Player.list[socket.id]
}

Player.update = function()
{
    var pack = []
    for(var i in Player.list)
    {
        var player = Player.list[i]
        player.update()   
        pack.push(
            {
                x:player.x,
                y:player.y,
                number:player.number,
                id:player.id,
            })  
    }

    return pack
}

var Asteroid = function()
{
    var self = GameObject()
    self.radius = randomRange(15,2)
    self.x = randomRange(0 + self.radius, 800 - self.radius); 
    self.y = randomRange(0 + self.radius, 600 - self.radius)- 600;
    self.id = Math.random()
    self.spX = 0
    self.spY = randomRange(1,5);
    self.color = "white"
    self.score = 0

    var asteroidUpdate = self.update
    self.update = function()
    {
        asteroidUpdate()
 
    }
    Asteroid.list[self.id] = self
    return self
}

Asteroid.list = {}

Asteroid.update = function()
{
    var pack = []
    for(var i in Asteroid.list)
    {
        var asteroid = Asteroid.list[i]
        asteroid.update()   

        //checks for collision between asteroid and ship
        for(var i in Player.list)
        {
            var dX = Player.list[i].x - asteroid.x;
            var dY = Player.list[i].y - asteroid.y;
            var dist = Math.sqrt((dX*dX)+(dY*dY));

            if(detectCollision(dist, (Player.list[i].height/2 + asteroid.radius)))
            {
                // gameOver = true
                console.log("Collision!")
                delete Player.list[i]
                playerCount--

                if(playerCount <= 0)
                {
                    console.log("Game Over")
                }

            }
        }

        if(asteroid.toRemove)
        {
            delete Asteroid.list[i]
        }
        else
        {
            pack.push(
            {
                x:asteroid.x,
                y:asteroid.y,
                radius:asteroid.radius,
                score:asteroid.score
            })  
        }
    }
    return pack
}

Asteroid.Create = function()
{
    for (var i = 0; i < numAsteroids; i++) 
    {
        asteroids[i] = new Asteroid();
    }
}

var Players = 
{

}

var isPasswordValid = function(data,cb)
{
    PlayerData.findOne({username:data.username}, function(err, username)
    {
        cb(data.password == username.password)
    })
}

var isUsernameTaken = function(data, cb)
{
    PlayerData.findOne({username:data.username}, function(err,username)
    {
        if(username == null)
        {
            cb(false)
        }
        else
        {
            cb(true)
        }
    })
}

var addUser = function(data)
{
    new PlayerData(data).save()
}

function gameStart()
{
    Asteroid.Create()
}

// connection to game
io.sockets.on('connection', function(socket)
{
    console.log("Socket Connected")

    socket.id = Math.random()

    //add something to SocketList
    SocketList[socket.id] = socket
    
    // send the id to the client
   

    // signIn event
    socket.on("signIn", function(data)
    {
        isPasswordValid(data, function(res)
        {
            if(res)
            {
                Player.onConnect(socket)
                socket.emit('connected', socket.id)
                socket.emit('signInResponse', {success: true})
            }
            else
            {
                socket.emit('signInResponse', {success: false})
            }
        })
    })

    // signUp event
    socket.on('signUp', function(data)
    {
        isUsernameTaken(data, function(res)
        {
            if(res)
            {
                socket.emit('signUpResponse', {success:false})
            }
            else
            {
                addUser(data)
                socket.emit('signUpResponse', {success:true})
            }
        })
    })

    // disconnection event
    socket.on("disconnect", function()
    {
        delete SocketList[socket.id]
        Player.onDisconnect(socket)
    })

    // handling chat event
    socket.on("sendMessageToServer", function(data)
    {
        var playerName = (" " + socket.id).slice(2,7)
        for(var i in SocketList)
        {
            SocketList[i].emit('addToChat', playerName + ": " + data)
        }
    })
    socket.on("evalServer", function(data)
    {
        if(!debug)
        {
            return
        }
        var res = eval(data)
        socket.emit('evalResponse', res)
    })

})

//---Collision Detection Function---
function detectCollision(distance, calcDistance){
    return distance < calcDistance;
}

// setup update loop
setInterval(function()
{
    for(var i in asteroids)
    {
        if(asteroids[i].y > 625)
        {
            asteroids[i].spY = randomRange(1,5)
            asteroids[i].radius = randomRange(15,2)
            asteroids[i].x = randomRange(0 + asteroids[i].radius, 800 - asteroids[i].radius); 
            asteroids[i].y = randomRange(0 + asteroids[i].radius, 600 - asteroids[i].radius)- 600;
            asteroids[i].score++
        }
    }

    var pack = 
    {
        player: Player.update(),
        asteroid: Asteroid.update()
    }

    for(var i in SocketList)
    {
        var socket = SocketList[i]
        socket.emit('newPosition', pack)
    }
}, 1000/30)

//--Score Timer Function---
function scoreTimer(){
    if(gameOver == false){
        score++;
        if(score % 5 == 0){
            numAsteroids += 5;
            console.log(numAsteroids);
        }
       // console.log(score);
        setTimeout(scoreTimer, 1000);
    }
}