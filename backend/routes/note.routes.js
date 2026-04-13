import { createNewNote, deleteNote, getNoteByID, getNotesCreatedByAUser, getNumberOfNotes, renameNote, updateNote, } from "../controllers/note.controller.js";
import { Router } from "express";
// Initialize router
const router = Router();
// Health check route
router.get("/", (_, res) => {
    res.status(200).send({ data: "Note Route Active" });
});
// ---------------------------------------------------------------------
// NOTE ROUTES
// Create a new blank note for a user
router.post("/create-note", createNewNote);
// Get the number of notes created by user.
router.post("/get-number-of-notes", getNumberOfNotes);
// Get all notes created by a specific user (paginated)
router.post("/get-notes-for-user", getNotesCreatedByAUser);
// Get a single note by its ID
router.post("/get-note-by-id", getNoteByID);
// Update a note's title and content
router.post("/update-note", updateNote);
// Update a note's title
router.post("/rename-note", renameNote);
// Delete a note (user ownership required)
router.post("/delete-note", deleteNote);
// ---------------------------------------------------------------------
export default router;
