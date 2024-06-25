const mongoose = require('mongoose')
const condb = require('../config/condb')

let ctgSchema = mongoose.Schema({
    CategoryName:String
});

let Category = condb.model("category",ctgSchema);
module.exports = Category;