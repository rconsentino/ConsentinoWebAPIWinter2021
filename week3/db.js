var mongoose = require('mongoose')
var dbURI = 'mongodb://localhost/Players'

if(process.env.NODE_ENV === 'production'){
    dbURI = process.env.MONGOLAB_URI
}

mongoose.connect(dbURI,{
    useNewUrlParser:true,
    useUnifiedTopology:true
})

mongoose.Promise = Promise

mongoose.connection.on('connected', function(){
    console.log("Mongoose connected to " + dbURI)
})