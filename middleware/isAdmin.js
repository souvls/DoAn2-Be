
const isAdmin = async (req, res, next) => {
    const User = require('../models/User');
    const encrypt = require('../middleware/encrypt')
    await User.findOne({ Username: req.data.username }).then((result) => {
        //console.log(req.data)
        if (result) {

            if (result.role === "admin") {
                return next();
            } else {
                console.log('=> not admin');
                res.status(401).json({ status: "no", 'msg': 'not admin' })
            }

        } else {
            console.log('=> not admin');
            res.status(401).json({ status: "no", 'msg': 'not admin' })
        }

    }).catch(() => {
    })

}
module.exports = isAdmin