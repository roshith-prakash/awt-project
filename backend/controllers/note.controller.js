import { prisma } from "../utils/prismaClient.js";
import { v4 as uuidv4 } from "uuid";
import { htmlToText } from "html-to-text";
import { noteLimit } from "../constants/constants.js";
// import { diff_match_patch } from "diff-match-patch";
// Creates a blank note
export const createNewNote = async (req, res) => {
    try {
        const userId = req?.body?.userId;
        // Find the user
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            res.status(404).send({ data: "User not found." });
            return;
        }
        // Check the number of notes created
        const numberOfNotesCreated = await prisma.note.count({
            where: { userId: user?.id },
        });
        // Send error if note limit is exceeded.
        if (numberOfNotesCreated >= noteLimit) {
            res
                .status(403)
                .send({ data: "Exceeded maximum number of notes possible." });
            return;
        }
        const noteId = uuidv4();
        // Create a new blank note for the user
        const note = await prisma.note.create({
            data: {
                title: "Blank Note",
                noteId,
                userId: user.id,
            },
        });
        res.status(200).send({ note });
        return;
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ data: "Something went wrong." });
    }
};
// Get number of notes created by the user
export const getNumberOfNotes = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            res.status(400).send({ message: "UserId are required." });
            return;
        }
        // Find the file in the DB to get the Cloudinary public_id
        const noteCount = await prisma.note.count({
            where: {
                userId: userId,
            },
        });
        res.status(200).send({ noteCount });
    }
    catch (err) {
        console.error(err);
        res
            .status(500)
            .send({ message: "Something went wrong while deleting the file." });
    }
};
// Gets an existing note by ID
export const getNoteByID = async (req, res) => {
    try {
        const noteId = req?.body?.noteId;
        const userId = req?.body?.userId;
        const note = await prisma.note.findUnique({
            where: {
                noteId: noteId,
                OR: [{ userId: userId }, { isPublic: true }],
            },
            include: { user: true },
        });
        if (!note) {
            res.status(404).send({ data: "Note not found." });
            return;
        }
        res.status(200).send({ note });
        return;
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ data: "Something went wrong." });
    }
};
// Gets all notes created by a user
export const getNotesCreatedByAUser = async (req, res) => {
    try {
        const searchTerm = req?.body?.searchTerm;
        const userId = req?.body?.userId;
        const page = req?.body?.page;
        // Find the user
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        // User not found error
        if (!user) {
            res.status(404).send({ data: "User not found." });
            return;
        }
        // Find all notes with limited content (first 100 characters)
        const notes = await prisma.note.findMany({
            where: {
                userId: user?.id,
                OR: [
                    { title: { contains: searchTerm, mode: "insensitive" } },
                    { content: { contains: searchTerm, mode: "insensitive" } },
                    { noteId: { contains: searchTerm, mode: "insensitive" } },
                ],
            },
            select: {
                noteId: true,
                title: true,
                content: true,
            },
            orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
            skip: page * 4,
            take: 4,
        });
        // Modify the content field to only include the first 500 characters
        const modifiedNotes = notes.map((note) => ({
            ...note,
            content: note.content ? htmlToText(note.content).substring(0, 500) : "", // Fetch the first 150 chars of the content
        }));
        // Check if next page exists
        const nextPageExists = await prisma.note.count({
            where: {
                userId: user?.id,
                OR: [
                    { title: { contains: searchTerm, mode: "insensitive" } },
                    { content: { contains: searchTerm, mode: "insensitive" } },
                    { noteId: { contains: searchTerm, mode: "insensitive" } },
                ],
            },
            orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
            skip: (page + 1) * 4,
        });
        // Return the current page posts and next page number
        res.status(200).send({
            notes: modifiedNotes,
            nextPage: nextPageExists != 0 ? page + 1 : null,
        });
        return;
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ data: "Something went wrong." });
    }
};
// Updates an existing note
export const updateNote = async (req, res) => {
    try {
        const { userId, noteId, title, content, isPublic } = req.body;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).send({ data: "User not found." });
            return;
        }
        const note = await prisma.note.findUnique({
            where: { noteId, userId },
        });
        if (!note) {
            res.status(404).send({ data: "Note not found / User is unauthorized." });
            return;
        }
        // Update the main note
        const updatedNote = await prisma.note.update({
            where: { id: note.id },
            data: { title, content, isPublic },
        });

        res.status(200).send({ updatedNote });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ data: "Something went wrong." });
    }
};
// Renames an existing note
export const renameNote = async (req, res) => {
    try {
        const { userId, noteId, title } = req.body;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).send({ data: "User not found." });
            return;
        }
        const note = await prisma.note.findUnique({
            where: { noteId, userId },
        });
        if (!note) {
            res.status(404).send({ data: "Note not found / User is unauthorized." });
            return;
        }
        // Update the main note
        const updatedNote = await prisma.note.update({
            where: { id: note.id },
            data: { title },
        });
        res.status(200).send({ updatedNote });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ data: "Something went wrong." });
    }
};
// Deletes an existing note
export const deleteNote = async (req, res) => {
    try {
        const userId = req?.body?.userId;
        const noteId = req?.body?.noteId;
        // Find the user
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        // User not found
        if (!user) {
            res.status(404).send({ data: "Note not found / User is unauthorized." });
            return;
        }
        // Find the note to be deleted
        const note = await prisma.note.findUnique({
            where: {
                noteId: noteId,
                userId: userId,
            },
            select: {
                id: true,
            },
        });
        if (!note) {
            res
                .status(401)
                .send({ data: "User is not authorized to delete the file." });
            return;
        }
        // Delete all note versions
        await prisma.noteVersion.deleteMany({
            where: {
                noteId: note?.id,
            },
        });
        // Delete the note
        await prisma.note.delete({
            where: {
                id: note?.id,
            },
        });
        res.status(200).send({ data: "Note deleted successfully." });
        return;
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ data: "Something went wrong." });
    }
};
