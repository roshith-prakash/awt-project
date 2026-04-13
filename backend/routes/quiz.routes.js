import { Router } from "express";
import { getFactOrNot, getFlashcards, getMCQs, } from "../controllers/quiz.controller.js";
// Create a router.
const router = Router();
// Default route to check if auth routes are accessible.
router.get("/", (_, res) => {
    res.status(200).send({ data: "Quiz Route" });
});
// Route to get flashcards
router.post("/get-flashcards", getFlashcards);
// Route to get MCQs
router.post("/get-mcqs", getMCQs);
// Route to get MCQs
router.post("/get-fact-or-not", getFactOrNot);
export default router;
