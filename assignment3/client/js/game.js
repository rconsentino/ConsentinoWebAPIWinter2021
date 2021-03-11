var socket = io()
// sign in related client code ==========================
var signDiv = document.getElementById("signInDiv")
var signDivUsername = document.getElementById("signInDiv-username")
var signDivPassword = document.getElementById("signInDiv-password")
var signDivSignIn = document.getElementById("signInDiv-signIn")
var signDivSignUp = document.getElementById("signInDiv-signUp")
var gameDiv = document.getElementById("gameDiv")
var error = document.getElementById("err")

// load the images
var bgMain = new Image()
var cookieSprite = new Image()
bgMain.src = "client/images/rocks.jpg"
cookieSprite.src = "client/images/cookie.png"

var score = 0

socket.on("increaseScore")
{
    score++
}

// add event listerners for sign in buttons
signDivSignIn.onclick = function()
{
    socket.emit('signIn', {username:signDivUsername.value, password:signDivPassword.value})
}

signDivSignUp.onclick = function()
{
    socket.emit('signUp', {username:signDivUsername.value, password:signDivPassword.value})
}

socket.on("signInResponse", function(data)
{
    
    if(data.success)
    {
        // log the user in
        signDiv.style.display = "none"
        gameDiv.style.display = "inline-block"
    }
    else
    {
        //alert("Sign in Unsuccessful")
        error.innerHTML = "Sign in Unsuccessful"
    }

})

socket.on("signUpResponse", function(data)
{
    if(data.success)
    {
        // log the user in
        error.innerHTML = "Sign Up Successful, Please Login"
    }
    else
    {
        //alert("Sign in Unsuccessful")
        error.innerHTML = "Sign Up Unsuccessful"
    }

})

// game releated code ===================================
var canvas = document.getElementById("canvas")
var ctx = canvas.getContext("2d")
var chatText = document.getElementById('chat-text')
var chatInput = document.getElementById('chat-input')
var chatForm = document.getElementById('chat-form')
var gameOver = false
ctx.font = "30px Arial"
var px = 0
var py = 0
var clientId;

socket.on('connected', function(data)
{
    clientId = data;
    console.log(clientId)
})

//event listeners for keypresses and mouse clicks / mouse position
document.addEventListener('keydown', keyPressDown)
document.addEventListener('keyup', keyPressUp)

function keyPressDown(e)
{
    if(e.keyCode === 87) // up
    {
        socket.emit("keypress", {inputId:'up', state:true})
    }
    else if(e.keyCode === 65) // left
    {
        socket.emit("keypress", {inputId:'left', state:true})
    }
    else if(e.keyCode === 68) // right
    {
        socket.emit("keypress", {inputId:'right', state:true})
    }
    else if(e.keyCode === 13)
    {
        socket.emit("keypress", {inputId:'enter', state:true})
    }
}

function keyPressUp(e)
{
    if(e.keyCode === 87) // up
    {
        socket.emit("keypress", {inputId:'up', state:false})
    }
    else if(e.keyCode === 65) // left
    {
        socket.emit("keypress", {inputId:'left', state:false})
    }
    else if(e.keyCode === 68) // right
    {
        socket.emit("keypress", {inputId:'right', state:false})
    }
    else if(e.keyCode === 13)
    {
        socket.emit("keypress", {inputId:'enter', state:false})
    }
}

socket.on('newPosition', function(data)
{
    ctx.clearRect(0,0, canvas.width, canvas.height)

    ctx.drawImage(bgMain,0,0, 800,600)

    ctx.font = "30px Arial"
    ctx.fillText("Score: " + score, 500, 50)

    for(var i = 0; i < data.player.length; i++)
    {
        if(clientId == data.player[i].id)
        {
            px = data.player[i].x
            py = data.player[i].y
        }   
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.moveTo(data.player[i].x + 10, data.player[i].y -20);
        ctx.lineTo(data.player[i].x + 20,data.player[i].y + 10);
        ctx.lineTo(data.player[i].x ,data.player[i].y + 10);
        ctx.lineTo(data.player[i].x + 10, data.player[i].y -20);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }   

    score = 0
    for(var i = 0; i < data.asteroid.length; i++)
    {
        ctx.drawImage(cookieSprite, 
            data.asteroid[i].x - data.asteroid[i].radius,
            data.asteroid[i].y - data.asteroid[i].radius,
            data.asteroid[i].radius * 2, data.asteroid[i].radius * 2)
        ctx.beginPath()
    
        ctx.arc(data.asteroid[i].x, data.asteroid[i].y, data.asteroid[i].radius, 0, 2 * Math.PI)
        ctx.stroke()
        score += data.asteroid[i].score
    }        
})

socket.on('addToChat',function(data)
{
    chatText.innerHTML += `<div>${data}</div>`
})

socket.on('evalResponse',function(data)
{
    chatText.innerHTML += `<div>${data}</div>`
    console.log(data)
})

chatForm.onsubmit = function(e)
{
    e.preventDefault()

    if(chatInput.value[0]==='/')
    {
        socket.emit('evalServer',chatInput.value.slice(1))
    }
    else
    {
        socket.emit('sendMessageToServer', chatInput.value)
    }
    // clear out the input field
    chatInput.value = ""
}