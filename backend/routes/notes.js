const express = require('express');
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");
const Notes = require("../models/Notes");
const { body, validationResult } = require("express-validator");
const mongoose = require('mongoose');

// ROUTE 1: Get all notes - GET "/api/notes/fetchallnotes" - Login required
router.get("/fetchallnotes", fetchUser, async (req, res) => {
    try {
        const notes = await Notes.find({ user: req.user.id });
        res.json(notes);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Server error" });
    }
});

// ROUTE 2: Add a new note - POST "/api/notes/addnote" - Login required
router.post("/addnote", fetchUser, [
    body('title', 'Title must be at least 3 characters').isLength({ min: 3 }),
    body('description', 'Description must be at least 5 characters').isLength({ min: 5 })
], async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { title, description, tag } = req.body;
        
        const note = new Notes({
            title,
            description,
            tag: tag || "General", // Default tag if not provided
            user: req.user.id
        });

        const savedNote = await note.save();
        res.json(savedNote);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Server error" });
    }
});

// ROUTE 3: Update existing note - PUT "/api/notes/updatenote/:id" - Login required
router.put("/updatenote/:id", fetchUser, async (req, res) => {
    try {
        const { title, description, tag } = req.body;
        const noteId = req.params.id;

        // Validate note ID
        if (!mongoose.Types.ObjectId.isValid(noteId)) {
            return res.status(400).json({ error: "Invalid note ID format" });
        }

        // Create update object
        const updateFields = {};
        if (title) updateFields.title = title;
        if (description) updateFields.description = description;
        if (tag) updateFields.tag = tag;

        // Check if note exists and belongs to user
        let note = await Notes.findById(noteId);
        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }

        if (note.user.toString() !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to update this note" });
        }

        // Update note
        note = await Notes.findByIdAndUpdate(
            noteId,
            { $set: updateFields },
            { new: true } // Return the updated document
        );

        res.json(note);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Server error" });
    }
});

// ROUTE 4: Delete note - DELETE "/api/notes/deletenote/:id" - Login required
router.delete("/deletenote/:id", fetchUser, async (req, res) => {
    try {
        const noteId = req.params.id;

        // Validate note ID
        if (!mongoose.Types.ObjectId.isValid(noteId)) {
            return res.status(400).json({ error: "Invalid note ID format" });
        }

        // Check if note exists and belongs to user
        let note = await Notes.findById(noteId);
        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }

        if (note.user.toString() !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to delete this note" });
        }

        // Delete note
        note = await Notes.findByIdAndDelete(noteId);
        res.json({ 
            success: true,
            message: "Note has been deleted",
            deletedNote: note 
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;