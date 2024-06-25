const express = require('express');
const router = express.Router();
//const path = require('path');
const token = require('../middleware/token');
const isAdmin = require('../middleware/isAdmin');
module.exports = router

router.get("/api/admin/dashboard1", token.jwtValidate, isAdmin, async (req, res) => {
    const User = require('../models/User');
    const Book = require('../models/Book');
    const Category = require('../models/Category')
    await User.countDocuments() //đếm số lượng người dùng
        .then(async numUser => {
            await Book.countDocuments() //đếm số lượng sách
                .then(async numBook => {
                    await Book.find().sort({ Rating: -1 }).limit(5).populate('Category') //5 sách Rating nhiều nhất
                        .then(async bookRating => {
                            await Book.find().sort({ Favourite: -1 }).limit(5).populate('Category')
                                .then(async bookFavourite => {
                                    await Book.find().sort({ _id: 1 }).limit(5).populate('Category') //5 sách mới
                                        .then(bookNew => {
                                            res.status(200).json({ numUser: numUser - 1, numBook: numBook, bookRating: bookRating, bookFavourite: bookFavourite, bookNew: bookNew })
                                        })
                                })

                        }).catch(err => console.log(err))
                }).catch(err => console.log(err))
        }).catch(err => console.log(err))
})
router.get("/api/admin/avgrating", token.jwtValidate, isAdmin, async (req, res) => {
    const Book = require('../models/Book');
    const Category = require('../models/Category');
    await Book.aggregate([
        {
            $lookup: {
                from: 'categories', // Tên bộ sưu tập Category
                localField: 'Category', // Trường tham chiếu trong Product
                foreignField: '_id', // Trường tham chiếu trong Category
                as: 'category' // Tên để lưu trữ kết quả populate
            }
        },
        {
            $group: {
                _id: '$category.CategoryName',
                averageRating: { $avg: '$Rating' },
            }
        },
        {
            $sort: { averageRating: -1 }
        },
        {
            $project: {
                _id: '$_id',
                averageRating: '$averageRating',
            }
        },
        {
            $limit: 3
        }
    ]).then(results => {
        const temp = [];
        for (var i = 0; i < 3; i++) {
            const x = { "name": results[i]._id[0], rating: results[i].averageRating }
            temp.push(x);
        }
        //console.log(temp)
        res.status(200).json({ result: temp })
    }).catch(error => {
        console.error(error);
    });
});

router.get("/api/admin/avgfavourite", token.jwtValidate, isAdmin, async (req, res) => {
    const Book = require('../models/Book');
    const Category = require('../models/Category');
    await Book.aggregate([
        {
            $lookup: {
                from: 'categories', // Tên bộ sưu tập Category
                localField: 'Category', // Trường tham chiếu trong Product
                foreignField: '_id', // Trường tham chiếu trong Category
                as: 'category' // Tên để lưu trữ kết quả populate
            }
        },
        {
            $group: {
                _id: '$category.CategoryName',
                averageFavourite: { $avg: '$Favourite' }
            }
        },
        {
            $sort: { averageFavourite: -1 }
        },
        {
            $project: {
                _id: '$_id',
                averageFavourite: '$averageFavourite'
            }
        },
        {
            $limit: 3
        }
    ]).then(results => {
        const temp = [];
        for (var i = 0; i < 3; i++) {
            const x = { "name": results[i]._id[0], favourite: results[i].averageFavourite }
            temp.push(x);
        }
        //console.log(temp)
        res.status(200).json({ result: temp })
    }).catch(error => {
        console.error(error);
    });
});