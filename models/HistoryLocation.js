const mongoose = require('mongoose')
const condb = require('../config/condb')

let Schema = mongoose.Schema({
    Book_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
    },
    User_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    Location:String,
    Progress:Number
});

let History_location = condb.model("history_location",Schema);
module.exports = History_location;