import cloudinary from "../utils/cloudinary.js";
import { prisma } from "../utils/prismaClient.js";
import { fileLimit, fileSizeLimit } from "../constants/constants.js";
// Upload multiple files
export const uploadFiles = async (req, res) => {
  try {
    const files = req?.files;
    // If no files uploaded
    if (!files || files.length === 0) {
      res.status(400).send({ message: "No files were uploaded." });
      return;
    }
    const userId = req?.body?.userId;
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(401).send({ message: "User not found." });
      return;
    }
    // Check the number of notes created
    const numberOfFilesUploaded = await prisma.userfile.count({
      where: { userId: user?.id },
    });
    // Send error if file limit is exceeded.
    if (numberOfFilesUploaded + files?.length > fileLimit) {
      res
        .status(403)
        .send({ data: "Exceeded maximum number of files possible." });
      return;
    }
    await Promise.allSettled(
      files.map(async (file) => {
        // Max file size check (Mb)
        if (Math.round(file?.size / (1024 * 1024)) > fileSizeLimit) {
          return;
        }
        // Upload file to cloudinary
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload(file.path, (err, result) => {
            if (err || !result) return reject(err);
            resolve(result);
          });
        });
        console.log(result);
        // Calculate base64 size for the file
        const base64size = result?.bytes + Math.round(result?.bytes * 0.33);
        // Create record in DB
        return prisma.userfile.create({
          data: {
            fileName: file?.originalname,
            assetId: result.asset_id,
            publicId: result.public_id,
            fileURL: result.secure_url,
            format: result.format,
            base64size: base64size,
            userId: user.id,
          },
        });
      }),
    );
    res.status(200).send({ data: "Files have been uploaded" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Something went wrong." });
  }
};
// Get number of files uploaded by the user
export const getNumberOfFiles = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).send({ message: "UserId are required." });
      return;
    }
    // Find the file in the DB to get the Cloudinary public_id
    const fileCount = await prisma.userfile.count({
      where: {
        userId: userId,
      },
    });
    res.status(200).send({ fileCount });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send({ message: "Something went wrong while deleting the file." });
  }
};
// Gets an existing note by ID
export const getFileById = async (req, res) => {
  try {
    const fileId = req?.body?.fileId;
    const userId = req?.body?.userId;
    const file = await prisma.userfile.findUnique({
      where: {
        assetId: fileId,
        userId: userId,
      },
      include: { user: true },
    });
    if (!file) {
      res.status(404).send({ data: "Note not found." });
      return;
    }
    res.status(200).send({ file });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).send({ data: "Something went wrong." });
  }
};
// Gets all files uploaded by a user
export const getFilesUploadedByAUser = async (req, res) => {
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
    const userFiles = await prisma.userfile.findMany({
      where: {
        userId: user?.id,
        OR: [{ fileName: { contains: searchTerm, mode: "insensitive" } }],
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: page * 4,
      take: 4,
    });
    // Check if next page exists
    const nextPageExists = await prisma.userfile.count({
      where: {
        userId: user?.id,
        OR: [{ fileName: { contains: searchTerm, mode: "insensitive" } }],
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: (page + 1) * 4,
    });
    // Return the current page posts and next page number
    res.status(200).send({
      files: userFiles,
      nextPage: nextPageExists != 0 ? page + 1 : null,
    });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).send({ data: "Something went wrong." });
  }
};
// Gets an existing note by ID
export const updateFileName = async (req, res) => {
  try {
    const fileId = req?.body?.fileId;
    const userId = req?.body?.userId;
    const fileName = req?.body?.fileName;
    const file = await prisma.userfile.findUnique({
      where: {
        assetId: fileId,
        userId: userId,
      },
    });
    if (!file) {
      res.status(404).send({ data: "Note not found." });
      return;
    }
    const updatedFile = await prisma.userfile.update({
      where: {
        id: file?.id,
      },
      data: {
        fileName: fileName,
      },
    });
    res.status(200).send({ file: updatedFile });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).send({ data: "Something went wrong." });
  }
};
// Deletes a specific file
export const deleteFile = async (req, res) => {
  try {
    const { fileId, userId } = req.body;
    if (!fileId || !userId) {
      res.status(400).send({ message: "fileId and userId are required." });
      return;
    }
    // Find the file in the DB to get the Cloudinary public_id
    const fileRecord = await prisma.userfile.findUnique({
      where: {
        assetId: fileId,
        userId: userId,
      },
    });
    if (!fileRecord) {
      res.status(404).send({ message: "File not found or unauthorized." });
      return;
    }
    // Delete file from Cloudinary
    await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(fileRecord.publicId, (err, result) => {
        if (err || result.result !== "ok") return reject(err || result);
        resolve(result);
      });
    });
    // Delete file metadata from DB
    await prisma.userfile.delete({
      where: {
        assetId: fileId,
      },
    });
    res.status(200).send({ message: "File deleted successfully." });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send({ message: "Something went wrong while deleting the file." });
  }
};
