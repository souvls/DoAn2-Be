const mongoose = require('mongoose');

const userDbConnection = mongoose.createConnection(process.env.DB_NAME,);

userDbConnection.on('open', async(err) => {
    if(err){ await console.log(err)}
    await console.log("=> database is connected!")
    }
);

module.exports = userDbConnection;