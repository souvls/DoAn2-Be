const mongoose = require('mongoose')
const condb = require('../config/condb')

let Schema = mongoose.Schema({
    Book_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'book'
    },
    User_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    Rating:Number,
    Comment:String,
    Review_Date:String
});

let Review = condb.model("review",Schema);
module.exports = Review;