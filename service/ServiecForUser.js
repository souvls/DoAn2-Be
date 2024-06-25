const express = require('express');
const router = express.Router();
const path = require('path');
const token = require('../middleware/token');


async function UpdateRating(book_id) {
    const Review = require('../models/Review');
    const Boook = require('../models/Book')
    var numUser = 0;
    var numStar = 0;
    var rating = 0
    await Review.find({ Book_id: book_id })
        .then(async (review) => {
            for (const i of review) {
                if (i.Rating > 0) {
                    numUser++;
                    numStar += i.Rating;
                }
            }
            rating = Math.floor(numStar / numUser)
            await Boook.findByIdAndUpdate(book_id, { Rating: rating })
        })
}
async function UpdateFavourite(book_id) {
    const Favorite = require('../models/Favourite');
    const Book = require('../models/Book');
    await Favorite.find({ Book_id: book_id })
        .then(async favourite => {
            const num = favourite.length;
            console.log(favourite)
            await Book.findByIdAndUpdate(book_id, { Favourite: num })
        })
}
//favorite , unfavorite
router.put("/api/auth/user/favorite", token.jwtValidate, async (req, res) => {
    const Favorite = require('../models/Favourite')
    const User_id = req.query.User_id;
    const Book_id = req.query.Book_id;

    if (User_id !== null && Book_id !== null) {
        await Favorite.findOne({ User_id: User_id, Book_id: Book_id })
            .then(result => {
                if (result) {
                    Favorite.findByIdAndDelete(result._id)
                        .then(() => {
                            UpdateFavourite(Book_id);
                            res.status(201).json({ status: "ok" })
                        })
                } else {
                    const newFavorite = new Favorite({
                        User_id: User_id,
                        Book_id: Book_id,
                    })
                    newFavorite.save()
                        .then(() => {
                            UpdateFavourite(Book_id);
                            res.status(201).json({ status: "ok" })
                        })
                }
            })
            .catch(err => console.log(err))
    }
})

//Rating and comment
router.put("/api/auth/user/review", token.jwtValidate, async (req, res) => {
    const Review = require('../models/Review');
    const { Book_id, User_id, Rating, Comment } = req.body

    await Review.findOne({ Book_id: Book_id, User_id: User_id })
        .then(result => {
            if (result) {
                Review.findByIdAndUpdate(result._id, { Rating: Rating, Comment: Comment })
                    .then(() => {
                        UpdateRating(Book_id);
                        res.status(201).json({ status: "ok" });
                    }).catch(err => console.log(err))

            } else {
                const newReview = new Review({
                    Book_id: Book_id,
                    User_id: User_id,
                    Rating: Rating,
                    Comment: Comment,
                    Review_Date: new Date().toISOString()
                })
                newReview.save()
                    .then(() => {
                        UpdateRating(Book_id);
                        res.status(201).json({ status: "ok" })
                    }).catch(err => console.log(err))

            }
        })

})

//yêu thích của tôi
router.get("/api/auth/myfavourite", token.jwtValidate, async (req, res) => {
    try {
        const Favorite = require('../models/Favourite')
        const Book = require('../models/Book')
        const User_id = req.data.id
        await Favorite.find({ User_id: User_id }).populate('Book_id')
            .then(result => {
                res.status(201).json({ status: "ok", result: result })
            })
    } catch (err) {
        //console.log(err)
        res.status(201).json({ status: "ok", result: [] })
    }

})
router.get("/api/auth/mybookmark", token.jwtValidate, async (req, res) => {
    try {
        const History_location = require('../models/HistoryLocation');
        const Book = require('../models/Book');
        const User_id = req.data.id
        await History_location.find({ User_id: User_id }).populate('Book_id')
            .then(result => {
                //console.log(result)
                res.status(201).json({ status: "ok", result: result })
            })
    } catch (err) {
        //console.log(err);
        res.status(201).json({ status: "ok", result: [] })
    }
})
module.exports = router