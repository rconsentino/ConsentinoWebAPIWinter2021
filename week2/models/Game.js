var mongoose = require('mongoose')
var Schema = mongoose.Schema

var GameSchema = new Schema(
    {
        game:{
            type:String,
            required:true
        }
    }
)

mongoose.model('game', GameSchema)