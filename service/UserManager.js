const express = require('express');
const router = express.Router();
//const path = require('path');
const token = require('../middleware/token');
const isAdmin = require('../middleware/isAdmin');
module.exports = router

//liệt kê danh sách người dùng
router.get("/api/admin/users",token.jwtValidate,isAdmin,async (req,res)=>{
    const User = require('../models/User');
    await User.find()
        .then(result =>{
            res.status(200).json(result)
        })
        .catch(err =>{
            console.log(err)
        })
})
//đổi status
router.put("/api/admin/user/status/:id",token.jwtValidate,isAdmin,async (req,res)=>{
    const id = req.params.id;
    const User = require('../models/User');
    await User.findById(id)
        .then(async result =>{
            var x = 0;
            if(result.status === 0){
                x = 1;
            }
            await User.findByIdAndUpdate(result._id,{status:x})
                .then(()=>{
                    res.status(200).json({status:'ok',msg:'đổi thành công'})
                })
        })
})
//tìm kiểm user
router.get("/api/admin/user/search/:key",async (req,res)=>{
    const key = req.params.key
    const User = require('../models/User');
    console.log(key);
    try{
        await User.findById(key).then((result =>{
            res.status(200).json(result);
            console.log({result});
        }))
    }catch{
        await User.find({$or:[
            {Username:{$regex:`^${key}`}},
            {Username:{$regex:`${key}$`}},
            {Fullname:{$regex:`^${key}`}},
            {Fullname:{$regex:`${key}$`}},
            {Email:{$regex:`^${key}`}},
            {Email:{$regex:`${key}$`}},
        ]})
            .then((result)=>{
                res.status(200).json(result);
                console.log(result);
        })
    }

})