const express = require('express');
const router = express.Router();
const path = require('path');
// ==== START =====  call multer uplaod file
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/user')// local save file
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "." + path.extname(file.originalname)); //rename file
    }
})
const upload = multer({ storage });

router.post("/api/register", async (req, res) => {
    const Encrypt = require('../middleware/encrypt')
    const User = require('../models/User');
    const { Username, Fullname, Email, Password } = req.body;

    //kiểm trả tên, Email đã có trong database chưa?
    await User.findOne({ $or: [{ Username: Username }, { Email: Email }] })
        .then(async user => {
            if (user) {
                res.status(400).json({ status: 'no', msg: 'Tên hoặc Email đã tồn tại.' })
            } else { //nếu chưa có thì lưu người dùng mới vào database
                const encryptedPassword = await Encrypt.hash(Password); //mã hóa mật khẩu
                //lưu User mới
                let newUser = new User({
                    Username: Username,
                    Fullname: Fullname,
                    Email: Email,
                    Password: encryptedPassword,
                    Avatar: 'user/no_avatar.png',
                    status: 1,
                    role: "user"
                })
                await newUser.save().then(async nUser => {
                    const token = require('../middleware/token');
                    const AccessToken = token.getGenerateAccessToken(nUser._id,nUser.Username,nUser.Email);//tạo token
                    res.status(201).json({ status: 'ok', msg: 'Đăng ký thành công', user: nUser, token: AccessToken })
                }).catch(err => {
                    console.log(err + ",insert new user");
                    res.status(500).json({ status: 'no', 'msg': 'Lỗi database' });
                });
            }
        }).catch(err => {
            console.log(err + ",find user");
            res.status(500).json({ status: 'no', 'msg': 'Lỗi database' });
        });
})

router.post("/api/login", async (req, res) => {
    //middleware
    const Encrypt = require('../middleware/encrypt');
    const token = require('../middleware/token');
    //model
    const User = require('../models/User');
    const { Email, Password } = req.body;

    //kiểm tra người dùng này đã có trond DB không?
    await User.findOne({ $or: [{ Username: Email }, { Email: Email }] }).then(async result => {
        if (result) {
            if (result.status === 0) {
                res.status(400).json({ status: 'no', 'msg': 'User is locked' });
            } else {
                const login = await Encrypt.check(Password, result.Password); //kiểm tra mật khẩu
                if (login) { // mật khẩu đúng
                    const accessToken = token.getGenerateAccessToken(result._id, result.Username, result.Email); //tạo Access Token;
                    if (result.role === 'user') {
                        const Favorite = require('../models/Favourite')
                        const Book = require('../models/Book')
                        await Favorite.find({ User_id: result._id }).populate('Book_id').then((myfavourite) => {
                            res.status(200).json({ status: 'ok', msg: 'Login success', user: result, myfavourite: myfavourite, 'token': accessToken });
                        }).catch((err) => {
                            console.log(err)
                        })
                    } else {
                        res.status(200).json({ status: 'ok', msg: 'Login success', user: result, 'token': accessToken });
                    }
                } else { // mật khẩu sai
                    res.status(400).json({ status: 'no', 'msg': 'Incorrect password', });
                }
            }
        } else {
            res.status(400).json({ status: 'no', 'msg': 'Email dose not Exit.', });
        }
    }).catch(err => {
        console.log(err + ",find User");
        res.status(500).json({ 'msg': 'Lỗi database' })
    });
})

const token = require('../middleware/token');
const isAdmin = require('../middleware/isAdmin');

//Tìm người dùng bằn ID
router.get("/api/auth/user/:id", token.jwtValidate, (req, res) => {
    const User = require('../models/User');
    const id = req.params.id;
    User.findById(id).then(result => {
        if (result) {
            res.status(200).json({ status: 'ok', msg: 'Tìm người dùng bằn ID', user: result })
        } else {
            res.status(400).json({ status: 'no', msg: 'Không tìm thấy người dùng ID này', })
        }
    }).catch(err => {
        console.log(err)
        res.status(400).json({ status: 'no', msg: 'Không tìm thấy người dùng ID này', })
    })
})

router.patch("/api/auth/user/update/fullname", token.jwtValidate, (req, res) => {
    const User = require('../models/User');
    const { id, Fullname } = req.body;
    console.log(id)
    console.log(req.body)
    User.findByIdAndUpdate(id, { Fullname: Fullname }).then(result => {
        if (result) {
            res.status(200).json({ status: 'ok', msg: 'Cập nhật Fullname thành công' })
        } else {
            res.status(400).json({ status: 'no', msg: 'Không Cập nhật Fullname của ID này' })
        }
    }).catch(err => {
        console.log(err)
        res.status(400).json({ status: 'no', msg: 'Không tìm thấy người dùng ID này', })
    })
})

//Cập nhật Fullname
router.patch("/api/auth/user/update/avatar", token.jwtValidate, upload.single('avatar'), (req, res) => {
    const User = require('../models/User');
    const id = req.body.id;
    const filename = `user/${req.file.filename}`

    User.findByIdAndUpdate(id, { Avatar: filename }).then(result => {
        if (result) {
            //Xóa Avatar cũ
            if (result.Avatar !== 'user/no_avatar.png') {
                const fs = require('fs');
                const filePath = 'public/' + result.Avatar;
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                    } else {
                        console.log('File deleted successfully!');
                    }
                });
            }
            res.status(200).json({ status: 'ok', msg: 'Cập nhật Fullname thành công' })
        } else {
            res.status(400).json({ status: 'no', msg: 'Không Cập nhật Fullname của ID này' })
        }
    }).catch(err => {
        console.log(err)
        res.status(400).json({ status: 'no', msg: 'Không tìm thấy người dùng ID này', })
    })
})


// ############### Admin Login #######################
router.post("/api/admin/login", async (req, res) => {
    //middleware
    const Encrypt = require('../middleware/encrypt');
    const token = require('../middleware/token');
    //model
    const Admin = require('../models/Admin');
    const { Email, Password } = req.body;

    //kiểm tra người dùng này đã có trond DB không?
    await Admin.findOne({ $or: [{ Username: Email }, { Email: Email }] }).then(async result => {
        if (result) {
            const login = await Encrypt.check(Password, result.Password); //kiểm tra mật khẩu
            if (login) { // mật khẩu đúng
                const accessToken = token.getTokenAdmin(result.Username, result.Password); //tạo Access Token;
                res.status(200).json({ status: 'ok', msg: 'Đăng nhập thành công', admin: result, 'token': accessToken });
            } else { // mật khẩu sai
                res.status(400).json({ status: 'no', 'msg': 'Mật khẩu không đúng', });
            }
        } else {
            res.status(400).json({ status: 'no', 'msg': 'Email không tồn tại.', });
        }
    }).catch(err => {
        console.log(err + ",find User");
        res.status(500).json({ 'msg': 'Lỗi database' })
    });
})
// ############### Admin Logout #######################
// router.get("/api/admin/logout" ,token.jwtValidate,isAdmin, (req,res)=>{
// })
module.exports = router;