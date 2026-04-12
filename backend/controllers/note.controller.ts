import { Request, Response } from "express";
import { prisma } from "../utils/prismaClient.ts";
import { v4 as uuidv4 } from "uuid";
import { htmlToText } from "html-to-text";
import { noteLimit } from "../constants/constants.ts";
// import { diff_match_patch } from "diff-match-patch";

// Creates a blank note
export const createNewNote = async (
  req: Request,
  res: Response
): Promise<void> => {
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
  } catch (err) {
    console.error(err);
    res.status(500).send({ data: "Something went wrong." });
  }
};

// Get number of notes created by the user
export const getNumberOfNotes = async (
  req: Request,
  res: Response
): Promise<void> => {
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
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send({ message: "Something went wrong while deleting the file." });
  }
};

// Gets an existing note by ID
export const getNoteByID = async (
  req: Request,
  res: Response
): Promise<void> => {
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
  } catch (err) {
    console.error(err);
    res.status(500).send({ data: "Something went wrong." });
  }
};

// Gets all notes created by a user
export const getNotesCreatedByAUser = async (
  req: Request,
  res: Response
): Promise<void> => {
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

    // Modify the content field to only include the first 150 characters
    const modifiedNotes = notes.map((note) => ({
      ...note,
      content: note.content ? htmlToText(note.content).substring(0, 300) : "", // Fetch the first 150 chars of the content
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
  } catch (err) {
    console.error(err);
    res.status(500).send({ data: "Something went wrong." });
  }
};

// Updates an existing note
export const updateNote = async (
  req: Request,
  res: Response
): Promise<void> => {
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

    // const dmp = new diff_match_patch();

    // // Convert HTML to plain text
    // const oldText = htmlToText(note.content || "", { wordwrap: false });
    // const newText = htmlToText(content || "", { wordwrap: false });

    // // Calculate % change using diff-match-patch
    // const diffs = dmp.diff_main(oldText, newText);
    // const totalChars = Math.max(oldText.length, newText.length);
    // const changedChars = diffs
    //   .filter(([op]) => op !== 0)
    //   .reduce((sum, [, text]) => sum + text.length, 0);
    // const percentChanged =
    //   totalChars === 0 ? 0 : (changedChars / totalChars) * 100;

    // // Get latest version (if any)
    // const latestVersion = await prisma.noteVersion.findFirst({
    //   where: { noteId: note.id },
    //   orderBy: { createdAt: "desc" },
    // });

    // const now = new Date();
    // let createVersion = false;

    // // Rule 1: If no version exists yet
    // if (!latestVersion) {
    //   createVersion = true;
    // } else {
    //   // Rule 2: Time-based (15+ minutes)
    //   const lastVersionTime = new Date(latestVersion.createdAt);
    //   const timeDiffMinutes =
    //     (now.getTime() - lastVersionTime.getTime()) / 60000;
    //   if (timeDiffMinutes >= 15) createVersion = true;

    //   // Rule 3: Significant change (5%+)
    //   if (percentChanged >= 5) createVersion = true;
    // }

    // if (createVersion) {
    //   await prisma.noteVersion.create({
    //     data: {
    //       noteId: updatedNote.id,
    //       title: updatedNote.title,
    //       content: updatedNote.content,
    //     },
    //   });

    //   // Keep only latest 5 versions
    //   const extraVersions = await prisma.noteVersion.findMany({
    //     where: { noteId: note.id },
    //     orderBy: { createdAt: "desc" },
    //     skip: 5,
    //   });

    //   // Delete old version
    //   if (extraVersions.length > 0) {
    //     const oldVersionIds = extraVersions.map((v) => v.id);
    //     await prisma.noteVersion.deleteMany({
    //       where: { id: { in: oldVersionIds } },
    //     });
    //   }
    // }

    res.status(200).send({ updatedNote });
  } catch (err) {
    console.error(err);
    res.status(500).send({ data: "Something went wrong." });
  }
};

// Renames an existing note
export const renameNote = async (
  req: Request,
  res: Response
): Promise<void> => {
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
  } catch (err) {
    console.error(err);
    res.status(500).send({ data: "Something went wrong." });
  }
};

// Deletes an existing note
export const deleteNote = async (
  req: Request,
  res: Response
): Promise<void> => {
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
  } catch (err) {
    console.error(err);
    res.status(500).send({ data: "Something went wrong." });
  }
};
