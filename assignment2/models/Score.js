var mongoose = require('mongoose')
var Schema = mongoose.Schema

var GameSchema = new Schema(
    {
        score:{
            type:String,
            required:true
        },
        playerName:{
            type:String,
            required:true
        }
    }
)

mongoose.model('score', GameSchema)