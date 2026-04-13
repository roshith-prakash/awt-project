import {
  createQuiz,
  deleteQuiz,
  getNumberOfQuizzes,
  getQuizById,
  getQuizzesCreatedByAUser,
  renameQuiz,
  updateQuiz,
} from "../controllers/userquiz.controller.js";
import { Router } from "express";
// Initialize router
const router = Router();
// Health check route
router.get("/", (_, res) => {
  res.status(200).send({ data: "User Quiz Route Active" });
});
// ---------------------------------------------------------------------
// User Quiz ROUTES
// Create a new quiz for a user
router.post("/create-quiz", createQuiz);
// Get the number of quizzes created by user.
router.post("/get-number-of-quizzes", getNumberOfQuizzes);
// Get all quizzes created by a specific user (paginated)
router.post("/get-quizzes-for-user", getQuizzesCreatedByAUser);
// Get a single quiz by its ID
router.post("/get-quiz-by-id", getQuizById);
// Update a quiz's title
router.post("/rename-quiz", renameQuiz);
// Update a quiz's content
router.post("/update-quiz", updateQuiz);
// Delete a quiz (user ownership required)
router.post("/delete-quiz", deleteQuiz);
// ---------------------------------------------------------------------
export default router;
