const mongoose = require('mongoose')
const condb = require('../config/condb')

let Schema = mongoose.Schema({
    Book_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
    },
    User_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

});

let Favourite = condb.model("favourite", Schema);
module.exports = Favourite;