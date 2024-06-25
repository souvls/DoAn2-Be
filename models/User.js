const mongoose = require('mongoose')
const condb = require('../config/condb')

let userSchema = mongoose.Schema({
    Username:String,
    Fullname:String,
    Email:String,
    Password:String,
    Avatar:String,
    status:Number,
    role:String
});

let User = condb.model("user",userSchema);
module.exports = User;