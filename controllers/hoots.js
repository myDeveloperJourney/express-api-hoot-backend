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
        .populate(['author', 'comments.author']);
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
            return res.status(403).send('You\'re not allowed to do that!');
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

// DELETE /hoots/:hootId DELETE Route "Protected"
router.delete('/:hootId', verifyToken, async (req, res) => {
    try {
        const hoot = await Hoot.findById(req.params.hootId);

        if(!hoot.author.equals(req.user._id)) {
            return res.status(403).send('You\'re not allowed to do that!');
        }

        const deletedHoot = await Hoot.findByIdAndDelete(req.params.hootId);
        res.status(200).json(deletedHoot);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// POST /hoots/:hootId/comments CREATE comment "protected"
router.post('/:hootId/comments', verifyToken, async (req, res) => {
    try {
        req.body.author = req.user._id; // adding requesting user as author
        const hoot = await Hoot.findById(req.params.hootId);
        hoot.comments.push(req.body);
        await hoot.save();

        const newComment = hoot.comments[hoot.comments.length - 1]; // get most recent comment
        newComment._doc.author = req.user; // add requesting user's details

        res.status(201).json(newComment);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
