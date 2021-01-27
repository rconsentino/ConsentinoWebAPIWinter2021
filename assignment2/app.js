var express = require('express')
var mongoose = require('mongoose')
var app = express()
var path = require('path')
var bodyparser = require('body-parser')

//sets up middleware
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended:true}))
app.use(express.json())

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

//POST route
app.post('/saveHighScore',function(req,res)
{
    console.log("Request Made")
    console.log(req.body)

    new Score(req.body).save().then(function()
    {
        res.redirect('scoreList.html')
    })
})

//gets the data for the list
app.get('/getData',function(req,res)
{
    Score.find({}).then(function(score)
    {
        res.json({score})
        res.json({playerName})
    })
})

app.use(express.static(__dirname+"/views"))
app.listen(5000, function()
{
    console.log("Listening on port 5000")
})