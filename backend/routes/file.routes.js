import upload from "../utils/multer.js";
import { uploadFiles, deleteFile, getFilesUploadedByAUser, getFileById, updateFileName, getNumberOfFiles, } from "../controllers/file.controller.js";
import { Router } from "express";
// Initialize router
const router = Router();
// Health check route for file routes
router.get("/", (_, res) => {
    res.status(200).send({ data: "Files Route Active" });
});
// ---------------------------------------------------------------------
// FILE ROUTES
// Upload multiple files for a user
router.post("/upload-files", upload.array("files"), uploadFiles);
// Get the number of files uploaded by user.
router.post("/get-number-of-files", getNumberOfFiles);
// Get all files uploaded by a specific user (paginated)
router.post("/get-files-for-user", getFilesUploadedByAUser);
// Get a single file by its ID
router.post("/get-file-by-id", getFileById);
// Update File Name
router.post("/update-file-name", updateFileName);
// Delete a file and its metadata
router.post("/delete-file", deleteFile);
// ---------------------------------------------------------------------
export default router;
