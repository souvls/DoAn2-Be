const mongoose = require('mongoose')
const condb = require('../config/condb')

let adminSchema = mongoose.Schema({
    Username:String,
    Fullname:String,
    Email:String,
    Password:String,
    Avatar:String,
});

let Admin = condb.model("admin",adminSchema);
module.exports = Admin;