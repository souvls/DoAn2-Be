const mongoose = require('mongoose')
const condb = require('../config/condb')

let SchemaBook = mongoose.Schema({
    Title:String,
    Author:String,
    Publisher:String,
    Publish_date:Date,
    Description:String,
    Image:String,
    File:String,
    Category:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category'
    },
    Rating:Number,
    Favourite:Number
});

let Book = condb.model("Book",SchemaBook);

module.exports = Book;