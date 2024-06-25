const express = require('express');
const dotenv = require('dotenv');
//const mongoose = require('mongoose')
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const authentication = require('./service/Authentication');
const book = require('./service/BookService');
const user = require('./service/UserManager');
const service_for_user = require('./service/ServiecForUser')
const dashboard = require('./service/Dashboard');
const backup_ = require("./service/BackupData");
//use file .env
dotenv.config();

//const condb = require('./config/condb')
const app = express();
// Public folder
app.use(express.static('public'));

app.use(morgan('dev'));
app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));

app.get('/', (req, res) => {
    res.status(200).json({ 'stattus': 'ok' });
});
app.use(authentication);
app.use(book);
app.use(user);
app.use(dashboard);
app.use(service_for_user);
app.use(backup_);

// ====> Run server
app.listen(process.env.PORT, () => {
    console.log('start server:' + ' http://localhost:' + process.env.PORT);
})