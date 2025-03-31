const express = require('express');
const verifyToken = require('../middleware/verify-token');
const Hoot = require('../models/hoot');
const router = express.Router();

// POST /hoots - CREATE Route "Protected"

router.post('/', verifyToken, async (req, res) => {
    try {
        // add the logged-in user's id to the author field
        req.body.author = req.user._id;
        const hoot = await Hoot.create(req.body);
        hoot._doc.author = req.user
        res.status(201).json(hoot);
    } catch (error) {
        console.log(error); // TODO: remove this before prod
        res.status(500).json({ error: error.message });
    }
});


// GET /hoots - READ Route "Protected"
router.get('/', verifyToken, async (req, res) => {
    try {
        const hoots = await Hoot.find({})
        .populate('author')
        .sort({createdAt: 'desc'});
        res.status(200).json(hoots);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// GET /hoots/:hootId READ Route "Protected"
router.get('/:hootId', verifyToken, async (req, res) => {
    try {
        const hoot = await Hoot.findById(req.params.hootId)
        .populate('author');
        res.status(200).json(hoot);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /hoots/:hootId UPDATE Route "Protected"
router.put('/:hootId', verifyToken, async (req, res) => {
    try {
        const hoot = await Hoot.findById(req.params.hootId);
        // make sure request user and author are the same person
        if(!hoot.author.equals(req.user._id)) { // if there are NOT equal
            res.status(403).send('You\'re not allowed to do that!');
        }

        const updatedHoot = await Hoot.findByIdAndUpdate(
            req.params.hootId,
            req.body,
            { new: true }
        );

        // {new: true } returns the document AFTER the update
        updatedHoot._doc.author = req.user // a great alternative since we don't have .populate
        res.status(200).json(updatedHoot);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
