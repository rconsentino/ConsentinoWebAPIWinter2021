var socket = io()
var gameDiv = document.getElementById('gameDiv')
var error = document.getElementById('err')
//Game related code====================================
var chatText = document.getElementById('chat-text')
var chatInput = document.getElementById('chat-input')
var chatForm = document.getElementById('chat-form')
var px = 0
var py = 0
var clientId;
ctx.font = '30px Arial'

socket.on('connected',function(data){
    clientId = data
    console.log(clientId)
})

var c = document.querySelector("canvas");
var ctx = c.getContext("2d");
var timer = requestAnimationFrame(main);
var gravity = 1;
var asteroids = new Array();
var numAsteroids = 10;
var gameOver = true;
var score = 0;
var gameStates = [];
var currentState = 0;
var ship;
var highScore = 0;
var bgMain = new Image();
var cookieSprite = new Image();
var highScoreElements = document.querySelector('.highscore');

bgMain.src = "images/rocks.jpg";
cookieSprite.src = "images/cookie.png";

//event listener to trigger main when image is loaded
bgMain.onload = function(){
    main();
}

cookieSprite.onload = function(){
    main();
}

function randomRange(high, low){
    return Math.random() * ( high - low) + low;
}

//Asteroids GameObject Class
function Asteroids(){
    this.radius = randomRange(15,2);
    this.x = randomRange(0 + this.radius, c.width - this.radius); 
    this.y = randomRange(0 + this.radius, c.height - this.radius)- c.height;
    this.vx = randomRange(-5,-10);
    this.vy = randomRange(10,5);
    this.color = "white";

    this.draw = function(){
        ctx.save();
        ctx.drawImage(cookieSprite,this.x - this.radius,this.y-this.radius,this.radius*2, this.radius*2)
        ctx.restore();

    }
}



//class for player ship
function PlayerShip(){
    this.x = c.width/2;
    this.y = c.height/2;
    this.w = 20;
    this.h = 20;
    this.vx = 0;
    this.vy = 0;
    this.up = false;
    this.left = false;
    this.right = false;
    this.flamelength = 30;

    this.draw = function(){
        ctx.save();
        ctx.translate(this.x,this.y);

        // draws afterburner flame
        if(this.up == true ||  this.left == true || this.right == true){
            ctx.save();
            //animate flame
            if(this.flamelength == 30){
                this.flamelength = 10;
            }
            else{
                this.flamelength = 30;
            }
            ctx.beginPath();
            ctx.fillStyle = "orange";
            ctx.moveTo(0, this.flamelength);
            ctx.lineTo(5, 5);
            ctx.lineTo(-5, 5);
            ctx.lineTo(0, this.flamelength);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.moveTo(0, -10);
        ctx.lineTo(10, 10);
        ctx.lineTo(-10, 10);
        ctx.lineTo(0, -10);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    this.move = function(){
        this.x += this.vx;
        this.y += this.vy;

        if(this.y > c.height - 10){
            this.y = c.height - 10;
            this.vy = 0;
        }
        //right boundary of screen
        if(this.x > c.width - 10 ){
            this.x = c.width - 10;
            this.vx = 0;
        }
        //left boundary of screen
        if(this.x < 0 + 10 ){
            this.x = 0 + 10;
            this.vx = 0;
        }

        //top boundary of screen
        if(this.y < 0 + 10){
            this.y = 0 + 10;
            this.vy = 0;
        }
    }

}

function gameStart() {
    //for loop to create all instances of asteroids
    for (var i = 0; i < numAsteroids; i++) {
        asteroids[i] = new Asteroids();
    }
    //this creates an instance of the ship
    ship = new PlayerShip();
}



//event listeners for keypresses and mouse clicks and mouse posiition
document.addEventListener('keydown', keyPressDown)
document.addEventListener('keyup', keyPressUp)

function keyPressDown(e) {
    if (gameOver == false) {
        if (e.keyCode === 68)//right
            socket.emit('keypress', { inputId: 'right', state: true })
        else if (e.keyCode === 65)//left
            socket.emit('keypress', { inputId: 'left', state: true })
        else if (e.keyCode === 87)//up
            socket.emit('keypress', { inputId: 'up', state: true })
    }
}

function keyPressUp(e) {
    if (gameOver == false) {
        if (e.keyCode === 68)//right
            socket.emit('keypress', { inputId: 'right', state: false })
        else if (e.keyCode === 65)//left
            socket.emit('keypress', { inputId: 'left', state: false })
        else if (e.keyCode === 87)//up
            socket.emit('keypress', { inputId: 'up', state: false })
    }
}

socket.on('newPositions', function (data) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (var i = 0; i < data.player.length; i++) {
        if(clientId == data.player[i].id){
            px = data.player[i].x
            py = data.player[i].y
        }
        ctx.fillText(data.player[i].number, data.player[i].x, data.player[i].y);
    }
    for (var i = 0; i < data.bullet.length; i++) {
        ctx.fillRect(data.bullet[i].x + 5, data.bullet[i].y - 10,10,10);
    }
})

socket.on('addToChat',function(data){
    chatText.innerHTML += `<div>${data}</div>`
})

socket.on('evalResponse',function(data){
    chatText.innerHTML += `<div>${data}</div>`
    console.log(data)
})

chatForm.onsubmit = function(e){
    e.preventDefault()

    if(chatInput.value[0]==='/'){
        socket.emit('evalServer', chatInput.value.slice(1))
    }else{
        socket.emit('sendMessageToServer', chatInput.value)
    }
    //clear out the input field
    chatInput.value = ""
}


function keyPressDown(e) {
    //console.log("Key pressed " + e.keyCode);
    if (gameOver == false) {
        if (e.keyCode === 38) {
            ship.up = true;
        }

        if (e.keyCode === 37) {
            ship.left = true;
        }
        if (e.keyCode === 39) {
            ship.right = true;
        }
    }
    if (gameOver == true) {
        if (e.keyCode === 13) {

            if (currentState == 2) {
                currentState = 0;
                score = 0;
                numAsteroids = 10;
                asteroids = [];
                gameStart();
                main();
            }
            else {
                gameStart();
                gameOver = false;
                currentState = 1;
                main();
                scoreTimer();
            }

        }
    }
}

//GameStates state machine. This is what sets up menu screens and main agme scene

//---Main Menu---
gameStates[0] = function(){
    highScoreElements.style.display = "none";
    ctx.drawImage(bgMain,0,0,c.width,c.height);
    ctx.save();
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center"
    ctx.fillText("Asteroid Avoidance", c.width/2, c.height/2 - 30);
    ctx.font = "15px Arial";
    ctx.fillText("Press Enter to Start", c.width/2, c.height/2 + 20);
    ctx.restore();
}

//---Game Scene---
gameStates[1] = function(){
    //Draws score to the HUD
    ctx.save();
    ctx.font = "15px Arial";
    ctx.fillStyle = 'white';
    ctx.fillText("Score: " + score.toString(), c.width - 150, 30);
    ctx.restore();
    

    //ship.vy += gravity;

    //Key presses move the ship
    if(ship.up == true){
        ship.vy = -10;
    }
    else{
        ship.vy = 3;
    }

    if(ship.left == true){
        ship.vx = -3;
    }
    else if(ship.right == true){
        ship.vx = 3;
    }
    else{
        ship.vx = 0;
    }
    // loops through asteroid instances in array and draws them to the screen
    for(var i = 0; i<asteroids.length; i++){
        var dX = ship.x - asteroids[i].x;
        var dY = ship.y - asteroids[i].y;
        var dist = Math.sqrt((dX*dX)+(dY*dY));

        //checks for collision between asteroid and ship
        if(detectCollision(dist, (ship.h/2 + asteroids[i].radius))){
           // console.log("Colliding with asteroid " + i);
            
            currentState = 2;
            gameOver = true;
            //document.removeEventListener("keydown", keyPressDown);
            //document.removeEventListener("keyup", keyPressUp);
        }

        //recycles asteroids
        if(asteroids[i].y > c.height + asteroids[i].radius){
            asteroids[i].y = randomRange(c.height -asteroids[i].radius,asteroids[i].radius)-c.height;
            asteroids[i].x = randomRange(c.width + asteroids[i].radius,asteroids[i].radius);
        }

        if(gameOver == false){
            asteroids[i].y += asteroids[i].vy;
        }

        asteroids[i].draw();
    }
    
    ship.draw();
    if(gameOver == false){
        ship.move();
    }

    while(asteroids.length < numAsteroids){
        asteroids.push(new Asteroids());
    }
}

// //---Game Over Screen---
// gameStates[2] = function(){
//     highScoreElements.style.display = "block";
//     if(score > highScore){
//         highScore = score;
//         ctx.save();
//         ctx.font = "30px Arial";
//         ctx.fillStyle = "white";
//         ctx.textAlign = "center"
//         ctx.fillText("Game Over, Your score was: " + score.toString(), c.width/2, c.height/2 - 60);
//         ctx.fillText("Your New High Score is: " + highScore.toString() , c.width/2, c.height/2 - 30);
//         ctx.fillText("New Record!!", c.width/2, c.height/2 );
//         ctx.font = "15px Arial";
//         ctx.fillText("Press Enter to Start", c.width/2, c.height/2 + 20);
//         ctx.restore();
//         setScore(highScore);
//     }
//     else{
//         ctx.save();
//         ctx.font = "30px Arial";
//         ctx.fillStyle = "white";
//         ctx.textAlign = "center"
//         ctx.fillText("Game Over, Your score was: " + score.toString(), c.width/2, c.height/2 - 60);
//         ctx.fillText("Your high Score is: " + highScore.toString(), c.width/2, c.height/2 - 30);
//         ctx.font = "15px Arial";
//         ctx.fillText("Press Enter to Start", c.width/2, c.height/2 + 20);
//         ctx.restore();
//     }

    
// }


//---Main Game Loop---
function main() {
    ctx.clearRect(0, 0, c.width, c.height);
   
    if (gameOver == false) {
        timer = requestAnimationFrame(main);
    }
    gameStates[currentState]();
}


//---Collision Detection Function---
function detectCollision(distance, calcDistance){
    return distance < calcDistance;
}


//--Score Timer Function---
function scoreTimer(){
    if(gameOver == false){
        score++;
        //using modulus divide the score by 5 and inf the remainder is zero addastteroids
        if(score % 5 == 0){
            numAsteroids += 5;
            console.log(numAsteroids);
        }
       // console.log(score);
        setTimeout(scoreTimer, 1000);
    }
}


