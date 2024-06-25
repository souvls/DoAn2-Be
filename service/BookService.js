const express = require('express');
const router = express.Router();
const path = require('path');
const token = require('../middleware/token');
const isAdmin = require('../middleware/isAdmin');
// ==== START =====  call multer uplaod file
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = file.fieldname === 'File' ? 'file' : 'book_cover';
        cb(null, 'public/' + dir)// local save file
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); //rename file
    }
})
const upload = multer({ storage });

// ######### Start  Gobal ####################

//tìm sách
router.get("/api/book/search", async (req, res) => {
    try {
        const Book = require('../models/Book');
        const Category = require('../models/Category')
        const key = req.query.key;
        await Book.find({
            $or: [
                { Title: { $regex: `^${key}` } },
                { Title: { $regex: `${key}$` } },
                { Author: { $regex: key } },
                { Publisher: { $regex: key } },
            ]
        }).populate("Category").then(result => {
            res.status(200).json(result)
        })
        // await Book.find({ Category: key })
        //     .populate("Category").then(result => {
        //         res.status(200).json(result)
        //     })
    } catch (err) {
        console.log(err)
    }
})
//lấy top 6 rating
router.get("/api/book/rating", async (req, res) => {
    const Book = require('../models/Book');
    await Book.find({}, null, { sort: { Rating: -1 } }).limit(4).then(result => {
        res.status(200).json(result)
    })
})

router.get("/api/book/random", async (req, res) => {
    const Book = require('../models/Book');
    await Book.aggregate([
        { $sample: { size: 8 } }
    ]).then(result => {
        //console.log(result);
        res.status(200).json(result)
    });
})
// //lấy danh sách yêu thích của người dùng
// router.get("/api/auth/user/favorite/:id", async (req, res) => {
//     const id = req.params.id
//     const Favorite = require('../models/Favourite')
//     await Favorite.find({ User_id: id }).then(result => {
//         res.status(200).json(result)
//     })
// })

//tìm sách bằng ID
router.get("/api/book/:id", async (req, res) => {
    const id = req.params.id
    const Book = require('../models/Book');
    const Category = require('../models/Category')
    await Book.findById(id).populate("Category")
        .then(result => {
            res.status(200).json(result)
        })
})
//lấy danh sách Review của sách bằng ID sách
router.get("/api/book/review/:id", async (req, res) => {
    const id = req.params.id
    const Review = require('../models/Review')
    const User = require('../models/User');
    await Review.find({ Book_id: id }).populate("User_id")
        .then(result => {
            res.status(200).json(result)
        })
})
router.get('/api/epub/:id', (req, res) => {
    const fs = require('fs')
    const epubId = req.params.id; // Lấy id từ request parameter
    const filePath = `public/file/alice.epub`; // Đường dẫn đến thư mục chứa file ePub
    const fileName = `ssdsd.epub`; // Tên file ePub


    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.status(404).send('File Not Found');
        } else {
            res.setHeader('Content-Type', 'application/epub+zip');
            // res.attachment(fileName); // Thiết lập tên file cho phảnồi
            //console.log(data)
            // res.send(data);
            // res.set(data);
        }
    });
});
router.get('/epub/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "../public/file", filename);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.log(err)
            res.status(404).send('File not found');
        }
    });
});
// ######### End  Gobal ####################
// ######### For user login ####################
router.post('/api/autosave', token.jwtValidate, async (req, res) => {
    const HistoryLocation = require('../models/HistoryLocation');
    const id = req.data.id
    const { Book_id, Location, Progress } = req.body
    // console.log(req.data.id)
    // console.log(req.body)

    try {
        if (id && Book_id && Location && Progress) {
            await HistoryLocation.findOne({ $and: [{ User_id: id }, { Book_id: Book_id }] }).then(async (result) => {
                if (!result) {
                    let newData = new HistoryLocation({
                        User_id: id,
                        Book_id: Book_id,
                        Location: Location,
                        Progress: Progress
                    })
                    await newData.save()
                } else {
                    await HistoryLocation.updateOne(
                        { $and: [{ User_id: id }, { Book_id: Book_id }] },
                        { $set: { Location: Location, Progress: Progress } },
                        { upsert: true }
                    )
                }
            })
        }
        res.status(200).json({ status: "ok" })
    } catch (err) {
        console.log(err)
    }

})
router.get("/api/autosave/:id", token.jwtValidate, async (req, res) => {

    try {
        const HistoryLocation = require('../models/HistoryLocation');
        const User_id = req.data.id
        console.log(req.data)
        const Book_id = req.params.id
        await HistoryLocation.findOne({ $and: [{ User_id: User_id }, { Book_id: Book_id }] })
            .then(async (result) => {
                if (result) {
                    console.log(result)
                    res.status(200).json({ status: "ok", result: result })
                } else {
                    res.status(200).json({ status: "no", result: result })
                }
            })
            .catch(err => {
                res.status(200).json({ status: "no", result: [] })
            })
    } catch (err) {

        console.log(err)
        res.status(200).json({ status: "no", result: [] })
    }
})
// ######### For user login ####################
//################# For Admin ###########################
//lấy danh sách tài liệu
router.get("/api/admin/books", token.jwtValidate, isAdmin, async (req, res) => {
    const Book = require('../models/Book');
    const Category = require('../models/Category')
    await Book.find().populate("Category")
        .then(result => {
            res.status(200).json(result)
        })
})
//thêm sách mới
router.post("/api/admin/book", token.jwtValidate, isAdmin, upload.fields([{ name: 'File', maxCount: 1 }, { name: 'Image', maxCount: 1 }]), async (req, res) => {
    const { Title, Author, Publisher, Publish_date, Description, Category } = req.body
    //console.log(req.body)
    const filename = req.files.File[0].filename
    const imgname = 'book_cover/' + req.files.Image[0].filename

    //lưu thông tin
    if (req.files.Image != null) { //nếu có ảnh bìa
        const Book = require('../models/Book');
        const newBook = new Book({
            Title: Title,
            Author: Author,
            Publisher: Publisher,
            Publish_date: Publish_date,
            Description: Description,
            Image: imgname,
            File: filename,
            Category: Category,
            Rating: 0,
            Favourite: 0
        })
        newBook.save()
            .then(() => {
                res.status(201).json({ status: 'ok', msg: 'Thêm sách thành công' })
            })
            .catch(err => {
                console.log(err)
            })

    } else {
    }
})
//Update thông tin sách
router.put("/api/admin/book", token.jwtValidate, isAdmin, upload.fields([{ name: 'File', maxCount: 1 }, { name: 'Image', maxCount: 1 }]), async (req, res) => {
    const { Id, Title, Author, Publisher, Publish_date, Description, Category } = req.body
    const Book = require('../models/Book');
    console.log(req.body)
    if (req.files.Image) { // nếu có thay đổi ảnh bìa
        const imgname = 'book_cover/' + req.files.Image[0].filename
        await Book.findByIdAndUpdate(Id, { Title: Title, Author: Author, Publisher: Publisher, Publish_date: Publish_date, Description: Description, Image: imgname, Category: Category })
            .then((result) => {
                //xoá ảnh bìa cũ
                const fs = require('fs');
                const filePath = 'public/' + result.Image;
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                    } else {
                        console.log('File deleted successfully!');
                    }
                });
                res.status(200).json({ status: 'ok', msg: 'Cập nhật thành công' })
            })
            .catch(err => {
                console.log(err)
            })
    } else {
        await Book.findByIdAndUpdate(Id, { Title: Title, Author: Author, Publisher: Publisher, Publish_date: Publish_date, Description: Description, Category: Category })
            .then(() => {
                res.status(200).json({ status: 'ok', msg: 'Cập nhật thành công' })
            })
            .catch(err => {
                console.log(err)
            })
    }
})
//Xóa sách
router.delete("/api/admin/book/:id", token.jwtValidate, isAdmin, async (req, res) => {
    const id = req.params.id
    console.log(id)
    const Book = require('../models/Book');
    await Book.findByIdAndDelete(id)
        .then((result) => {
            //xoá file PDF
            const fs = require('fs');
            const filePath = 'public/' + result.File;
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                } else {
                    console.log('File deleted successfully!');
                }
            });
            res.status(200).json({ status: 'ok', msg: 'Xóa thành công' })
        })
        .catch(err => console.log(err))
})
//tim sach for admin
router.get("/api/admin/book/search", async (req, res) => {
    const Book = require('../models/Book');
    const Category = require('../models/Category')
    const key = req.query.key
    const cgt = req.query.cgt
    if (req.query.key && cgt === '') {
        await Book.find({
            $or: [
                { Title: { $regex: `^${key}` } },
                { Title: { $regex: `${key}$` } },
                { Author: { $regex: key } },
                { Publisher: { $regex: key } },
            ]
        }).populate("Category").then(result => {
            res.status(200).json(result)
        })
    } else if ((req.query.key === '' && cgt)) {
        await Book.find({ Category: cgt })
            .populate("Category").then(result => {
                res.status(200).json(result)
            })
    } else {
        await Book.find({
            Category: cgt, $or: [
                { Title: { $regex: `^${key}` } },
                { Title: { $regex: `${key}$` } },
            ]
        }).populate("Category").then(result => {
            res.status(200).json(result)
        })

    }
})

// ################### Danh mục ############
//Danh sách danh mục
router.get("/api/category", async (req, res) => {
    const Category = require('../models/Category')
    await Category.find().then((result) => {
        res.status(200).json(result)
    })
})

//tìm danh mục bằng id
router.get("/api/category/:id", async (req, res) => {
    const Category = require('../models/Category')
    const id = req.params.id
    await Category.findById(id).then((result) => {
        res.status(201).json(result)
    })
})
// thêm danh mục
router.post("/api/admin/category/add", token.jwtValidate, isAdmin, async (req, res) => {
    const Category = require('../models/Category')
    const { CategoryName } = req.body
    console.log(CategoryName)
    var newCategory = new Category({
        CategoryName: CategoryName
    })
    await newCategory.save().then((result) => {
        if (result) {
            res.status(201).json({ status: 'ok', msg: 'success' })
        }
    }).catch((err) => {
        console.log(err)
        res.status(400).json({ status: 'no', msg: 'error' })
    })
})
// cập nhật danh mục
router.patch("/api/admin/category/update", token.jwtValidate, isAdmin, (req, res) => {
    const Category = require('../models/Category')
    const { id, newName } = req.body
    if (newName != '') {
        Category.findByIdAndUpdate(id, { CategoryName: newName })
            .then(() => res.status(200).json({ status: 'ok', msg: 'update success' }))
            .catch((err) => {
                console.log(err)
                res.status(400).json({ status: 'no', msg: 'error' })
            })
    } else {
        res.status(200).json({ status: 'ok', msg: 'error' })
    }
})
//xóa danh mục
router.delete("/api/admin/category/:id", token.jwtValidate, isAdmin, async (req, res) => {
    const Category = require('../models/Category');
    const Book = require('../models/Book')
    const id = req.params.id
    console.log(id)
    //kiểm trả khóa ngoài
    await Book.find({ Category: id })
        .then(async result => {
            console.log()
            if (result.length > 0) {
                res.status(400).json({ status: 'no', msg: 'error' })
            } else {
                await Category.findByIdAndDelete(id).then(() => {
                    res.status(200).json({ status: 'ok', msg: 'delete success' })
                })
            }
        })
})

module.exports = router