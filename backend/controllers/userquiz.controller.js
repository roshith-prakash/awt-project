import { prisma } from "../utils/prismaClient.js";
import { quizLimit } from "../constants/constants.js";
import { v4 as uuidv4 } from "uuid";
// Saves a new Quiz
export const createQuiz = async (req, res) => {
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
    // Check the number of quizzes created
    const numberofQuizzesCreated = await prisma.quiz.count({
      where: { userId: user?.id },
    });
    // Send error if quiz limit is exceeded.
    if (numberofQuizzesCreated >= quizLimit) {
      res
        .status(403)
        .send({ data: "Exceeded maximum number of saved quizzes possible." });
      return;
    }
    const quizId = uuidv4();
    // Create a new blank quiz for the user
    const quiz = await prisma.quiz.create({
      data: {
        name: req?.body?.name,
        quizType: req?.body?.quizType,
        questions: req?.body?.questions,
        isPublic: req?.body?.isPublic,
        quizId,
        userId: user.id,
      },
    });
    res.status(200).send({ quiz });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).send({ data: "Something went wrong." });
  }
};
// Get number of quizzes created by the user
export const getNumberOfQuizzes = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).send({ message: "UserId is required." });
      return;
    }
    // Find the file in the DB to get the Cloudinary public_id
    const quizCount = await prisma.quiz.count({
      where: {
        userId: userId,
      },
    });
    res.status(200).send({ quizCount });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Something went wrong." });
  }
};
// Gets an existing quiz by ID
export const getQuizById = async (req, res) => {
  try {
    const quizId = req?.body?.quizId;
    const userId = req?.body?.userId;
    const quiz = await prisma.quiz.findUnique({
      where: {
        quizId: quizId,
        OR: [{ userId: userId }, { isPublic: true }],
      },
      include: { user: true },
    });
    if (!quiz) {
      res.status(404).send({ data: "Quiz not found." });
      return;
    }
    res.status(200).send({ quiz });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).send({ data: "Something went wrong." });
  }
};
// Gets quizzes created by a user
export const getQuizzesCreatedByAUser = async (req, res) => {
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
    // Find all quizzes
    const quizzes = await prisma.quiz.findMany({
      where: {
        userId: user?.id,
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { quizId: { contains: searchTerm, mode: "insensitive" } },
          { quizType: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        name: true,
        quizId: true,
        isPublic: true,
        quizType: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: page * 4,
      take: 4,
    });
    // Check if next page exists
    const nextPageExists = await prisma.quiz.count({
      where: {
        userId: user?.id,
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { quizId: { contains: searchTerm, mode: "insensitive" } },
          { quizType: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: (page + 1) * 4,
    });
    // Return the current page posts and next page number
    res.status(200).send({
      quizzes,
      nextPage: nextPageExists != 0 ? page + 1 : null,
    });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).send({ data: "Something went wrong." });
  }
};
// Updates an existing quiz's content
export const updateQuiz = async (req, res) => {
  try {
    const { userId, quizId, name, quizType, questions, isPublic } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).send({ data: "User not found." });
      return;
    }
    const quiz = await prisma.quiz.findUnique({
      where: { quizId, userId },
    });
    if (!quiz) {
      res.status(404).send({ data: "Quiz not found / User is unauthorized." });
      return;
    }
    // Update the quiz
    const updatedQuiz = await prisma.quiz.update({
      where: { id: quiz.id },
      data: {
        name: name || quiz.name,
        quizType: quizType || quiz.quizType,
        questions: questions || quiz.questions,
        isPublic: isPublic !== undefined ? isPublic : quiz.isPublic,
      },
    });
    res.status(200).send({ updatedQuiz });
  } catch (err) {
    console.error(err);
    res.status(500).send({ data: "Something went wrong." });
  }
};
// Renames an existing quiz
export const renameQuiz = async (req, res) => {
  try {
    const { userId, quizId, name } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).send({ data: "User not found." });
      return;
    }
    const quiz = await prisma.quiz.findUnique({
      where: { quizId, userId },
    });
    if (!quiz) {
      res.status(404).send({ data: "Quiz not found / User is unauthorized." });
      return;
    }
    // Update the quiz
    const updatedQuiz = await prisma.quiz.update({
      where: { id: quiz.id },
      data: { name },
    });
    res.status(200).send({ updatedQuiz });
  } catch (err) {
    console.error(err);
    res.status(500).send({ data: "Something went wrong." });
  }
};
// Deletes an existing quiz
export const deleteQuiz = async (req, res) => {
  try {
    const userId = req?.body?.userId;
    const quizId = req?.body?.quizId;
    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    // User not found
    if (!user) {
      res.status(404).send({ data: "Quiz not found / User is unauthorized." });
      return;
    }
    // Find the note to be deleted
    const quiz = await prisma.quiz.findUnique({
      where: {
        quizId: quizId,
        userId: userId,
      },
      select: {
        id: true,
      },
    });
    if (!quiz) {
      res
        .status(401)
        .send({ data: "User is not authorized to delete the file." });
      return;
    }
    // Delete the note
    await prisma.quiz.delete({
      where: {
        id: quiz?.id,
      },
    });
    res.status(200).send({ data: "Quiz deleted successfully." });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).send({ data: "Something went wrong." });
  }
};
