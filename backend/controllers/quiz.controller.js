import dotenv from "dotenv";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "../utils/prismaClient.js";
import { htmlToText } from "html-to-text";
import { minCreditUsed, tokensPerCredit } from "../constants/constants.js";
dotenv.config();
// Access your API key as an environment variable (see "Set up your API key" above)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });
const model = "gemini-3-flash-preview";
// Helper to extract JSON from text that might contain markdown or extra conversational text
const extractJSON = (text) => {
    try {
        // Try to find an array start '[' or object start '{'
        const arrayStart = text.indexOf("[");
        const objectStart = text.indexOf("{");
        // Determine which one comes first and find its corresponding end
        let start = -1;
        let end = -1;
        if (arrayStart !== -1 && (objectStart === -1 || arrayStart < objectStart)) {
            start = arrayStart;
            end = text.lastIndexOf("]");
        }
        else if (objectStart !== -1) {
            start = objectStart;
            end = text.lastIndexOf("}");
        }
        if (start === -1 || end === -1 || end < start) {
            throw new Error("No valid JSON structure found in response");
        }
        const jsonStr = text.substring(start, end + 1);
        return JSON.parse(jsonStr);
    }
    catch (error) {
        console.error("JSON extraction failed. Original text length:", text.length);
        console.debug("Raw response tail:", text.slice(-100));
        throw error;
    }
};
// To generate flashcards
export const generateFlashcardQuestions = async (topic, difficulty, note, file) => {
    try {
        const contents = [];
        const prompt = `
    You are an expert quiz creator with a focus on generating high-quality, accurate, and informative quiz questions based on the topic ${topic}. Follow these guidelines to ensure the best results:
  
    1. Accuracy: Ensure that all questions and answers are factually correct and derived from credible sources. Double-check details to avoid errors.
    2. Clarity: Frame questions in simple, concise language. Avoid ambiguity and complexity. Ensure that each question is specific and easy to understand.
    3. Relevance: All questions should be directly relevant to the content of the data provided. Only include information that directly relates to the main topic.
    4. Variety: Create a mix of question types, such as:
       - Multiple-choice: One correct answer with several distractors.
       - True/False: Simple statements for the user to verify.
       - Short-answer: Direct, specific answers to questions based on the data content.
    5. Level of Difficulty: The difficulty of the questions must be ${difficulty}.
    6. Precision: Avoid vague or overly general questions. Focus on details from the data.
    7. Conciseness: Ensure that all answers are brief (max 10 words) and directly related to the question.
    8. Fact-checking: Validate all answers using reliable and trustworthy references.
  
    Provided that both are available, use both the text context data and the document to form the questions.
  
    Your task: Generate exactly 10 questions based on the content of the provided data. 
    You MUST return ONLY a valid JSON array of objects. Do not include markdown backticks, explanations, or any text outside the array.
    
    Format:
    [
      {"question": "Question 1", "answer": "Answer 1"},
      ...
      {"question": "Question 10", "answer": "Answer 10"}
    ]
  `;
        contents.push({ text: prompt });
        if (file) {
            console.log("Adding file to context");
            contents.push({
                inlineData: {
                    mimeType: "application/pdf",
                    data: file,
                },
            });
        }
        if (note) {
            console.log("Adding note to context");
            contents.push({ text: note });
        }
        // Only now make the AI request
        const response = await ai.models.generateContent({
            model: model,
            contents: contents,
        });
        const text = response.text;
        if (text) {
            const jsonValues = extractJSON(text);
            return { jsonValues };
        }
        else {
            throw Error("Could not generate a response");
        }
    }
    catch (error) {
        console.log("-------------------------------------------------------------------------------");
        // console.log(error, typeof error);
        console.log("-------------------------------------------------------------------------------");
        const errStatus = error?.error?.status || error?.status;
        const errCode = error?.error?.code || error?.code;
        console.log(errCode, errStatus);
        if (errCode === 503 || errStatus === "UNAVAILABLE") {
            console.error("Gemini is overloaded. Retry later.");
            // Optionally:
            throw new Error("Service Unavailable. Please try again later.");
        }
        else {
            throw Error("Error in generating flashcard questions");
        }
    }
};
// Wrapper function to be called by API
export const getFlashcards = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.body.userId },
        });
        if (!user) {
            res.status(404).send({ error: "User not found" });
            return;
        }
        const topic = req.body.topic;
        const difficulty = req.body.difficulty;
        const noteId = req.body.noteId;
        const fileId = req.body.fileId;
        let note;
        let file;
        // Step 1: Estimate token usage BEFORE AI call
        let totalTokensUsed = 0;
        if (fileId) {
            file = await prisma.userfile.findUnique({
                where: { assetId: fileId },
            });
            if (!file) {
                res.status(404).send({ error: "File not found." });
                return;
            }
            totalTokensUsed += Math.ceil(file.base64size / 4);
        }
        if (noteId) {
            note = await prisma.note.findUnique({ where: { noteId } });
            if (note?.content) {
                const text = htmlToText(note.content);
                const wordCount = text.trim().split(/\s+/).length;
                totalTokensUsed += Math.ceil(wordCount * 0.75);
            }
            note = note?.content;
        }
        const creditsNeeded = Number((totalTokensUsed / tokensPerCredit).toFixed(2)) + minCreditUsed;
        const availableCredits = Number(user.dailyCredit) + Number(user.bonusCredit);
        console.log("User", user?.id, "| Credits Needed:", creditsNeeded, "| Credits Available:", availableCredits);
        if (availableCredits < creditsNeeded) {
            res
                .status(403)
                .send({ error: "Not enough credits to generate flashcards." });
            return;
        }
        if (file) {
            const resFile = await axios.get(file.fileURL, {
                responseType: "arraybuffer",
            });
            const pdfBuffer = Buffer.from(resFile.data, "binary");
            file = pdfBuffer.toString("base64");
        }
        // Step 2: Actually generate flashcards
        const { jsonValues } = await generateFlashcardQuestions(topic, difficulty, note, file);
        // Deduct credits now
        await prisma.user.update({
            where: { id: user.id },
            data: {
                dailyCredit: {
                    decrement: Number(Math.min(user.dailyCredit, creditsNeeded).toFixed(2)),
                },
                bonusCredit: {
                    decrement: Number(Math.max(0, creditsNeeded - user.dailyCredit).toFixed(2)),
                },
            },
        });
        res.status(200).send({ questions: jsonValues, creditsUsed: creditsNeeded });
        return;
    }
    catch (err) {
        if (err == "Service Unavailable. Please try again later.") {
            res?.status(503).send({ error: "Model overload. Please try later" });
        }
        console.error("Error:", err);
        res.status(500).send({ error: "Something went wrong." });
    }
};
// To generate MCQs
export const generateMCQQuestions = async (topic, difficulty, note, file) => {
    try {
        const contents = [];
        // Prompt to generate the MCQs
        const prompt = `
  You are an expert quiz creator with a focus on generating high-quality, accurate, and informative quiz questions based on the topic ${topic}. Follow these guidelines to ensure the best results:

  1. Accuracy: Ensure that all questions and answers are factually correct and derived from credible sources. Double-check details to avoid errors.
  2. Clarity: Frame questions in simple, concise language. Avoid ambiguity and complexity. Ensure that each question is specific and easy to understand.
  3. Relevance: All questions should be directly relevant to the content of the data provided. Only include information that directly relates to the main topic.
  4. Variety: Create a mix of question types, such as:
     - Multiple-choice: One correct answer with several distractors.
     - True/False: Simple statements for the user to verify.
     - Short-answer: Direct, specific answers to questions based on the data content.
  5. Level of Difficulty: The difficulty of the questions must be ${difficulty}.
  6. Precision: Avoid vague or overly general questions. Focus on details from the data.
  7. Conciseness: Ensure that all answers are brief (max 10 words) and directly related to the question.
  8. Fact-checking: Validate all answers using reliable and trustworthy references.

  Provided that both are available, use both the text context data and the document to form the questions.

  Your task: Generate exactly 10 questions based on the content of the provided data. 
  You MUST return ONLY a valid JSON array of objects. Do not include markdown backticks, explanations, or any text outside the array.

  Format:
  [
    {
      "question": "Your question here",
      "answer": "Correct answer here",
      "options": ["Option A", "Option B", "Option C", "Option D"]
    },
    ...
  ]
`;
        contents.push({ text: prompt });
        if (file) {
            console.log("Adding file to context");
            contents.push({
                inlineData: {
                    mimeType: "application/pdf",
                    data: file,
                },
            });
        }
        if (note) {
            console.log("Adding note to context");
            contents.push({ text: note });
        }
        // Create content for the prompt using Gemini
        const response = await ai.models.generateContent({
            model: model,
            contents: contents,
        });
        // Convert response to text
        const text = response.text;
        if (text) {
            const jsonValues = extractJSON(text);
            return jsonValues;
        }
        else {
            throw Error("Could not generate a response");
        }
    }
    catch (err) {
        console.log(err);
        throw Error("Error in generating MCQ questions");
    }
};
// Wrapper function to be called by API
export const getMCQs = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.body.userId },
        });
        if (!user) {
            res.status(404).send({ error: "User not found" });
            return;
        }
        const topic = req.body.topic;
        const difficulty = req.body.difficulty;
        const noteId = req.body.noteId;
        const fileId = req.body.fileId;
        let note;
        let file;
        // Step 1: Estimate token usage BEFORE AI call
        let totalTokensUsed = 0;
        if (fileId) {
            file = await prisma.userfile.findUnique({
                where: { assetId: fileId },
            });
            if (!file) {
                res.status(404).send({ error: "File not found." });
                return;
            }
            totalTokensUsed += Math.ceil(file.base64size / 4);
        }
        if (noteId) {
            note = await prisma.note.findUnique({ where: { noteId } });
            if (note?.content) {
                const text = htmlToText(note.content);
                const wordCount = text.trim().split(/\s+/).length;
                totalTokensUsed += Math.ceil(wordCount * 0.75);
            }
            note = note?.content;
        }
        const creditsNeeded = Number((totalTokensUsed / tokensPerCredit).toFixed(2)) + minCreditUsed;
        const availableCredits = Number(user.dailyCredit) + Number(user.bonusCredit);
        console.log("User", user?.id, "| Credits Needed:", creditsNeeded, "| Credits Available:", availableCredits);
        if (availableCredits < creditsNeeded) {
            res
                .status(403)
                .send({ error: "Not enough credits to generate flashcards." });
            return;
        }
        if (file) {
            const resFile = await axios.get(file.fileURL, {
                responseType: "arraybuffer",
            });
            const pdfBuffer = Buffer.from(resFile.data, "binary");
            file = pdfBuffer.toString("base64");
        }
        const jsonValues = await generateMCQQuestions(topic, difficulty, note, file);
        // Deduct credits now
        await prisma.user.update({
            where: { id: user.id },
            data: {
                dailyCredit: {
                    decrement: Number(Math.min(user.dailyCredit, creditsNeeded).toFixed(2)),
                },
                bonusCredit: {
                    decrement: Number(Math.max(0, creditsNeeded - user.dailyCredit).toFixed(2)),
                },
            },
        });
        res.status(200).send({ questions: jsonValues });
        return;
    }
    catch (err) {
        console.log(err);
        res.status(500).send({ data: "Something went wrong." });
        return;
    }
};
// To generate Fact or not questions
export const generateFactOrNotQuestions = async (topic, difficulty, note, file) => {
    try {
        const contents = [];
        // Prompt to generate the fact or not questions
        const prompt = `
  You are an expert quiz creator with a focus on generating high-quality, accurate, and informative true/false quiz questions based on the topic ${topic}. Follow these guidelines to ensure the best results:

  1. Accuracy: Ensure that all questions and answers are factually correct and derived from credible sources. Double-check details to avoid errors.
  2. Clarity: Frame each statement as a clear, concise factual claim. Avoid ambiguity and complexity.
  3. Relevance: All statements should be directly relevant to the content of the data provided. Only include information that directly relates to the main topic.
  4. Format: Each question must be a statement that can be marked as "Fact" or "Not a fact".
  5. Level of Difficulty: The difficulty of the questions must be ${difficulty}.
  6. Precision: Avoid vague or overly general statements. Focus on specific, verifiable details from the data.
  7. Conciseness: Keep statements brief and to the point.
  8. Fact-checking: Validate all answers using reliable and trustworthy references.

  Provided that both are available, use both the text context data and the document to form the questions.

  Your task: Generate exactly 10 fact-based questions using the structure below. 
  You MUST return ONLY a valid JSON array of objects. Do not include markdown backticks, explanations, or any text outside the array.

  Format:
  [
    {
      "question": "Your factual statement here",
      "answer": "Fact",
      "options": ["Fact", "Not a fact"],
      "reason": "Brief explanation here"
    },
    ...
  ]
`;
        contents.push({ text: prompt });
        if (file) {
            contents.push({
                inlineData: {
                    mimeType: "application/pdf",
                    data: file,
                },
            });
        }
        if (note) {
            contents.push({ text: note });
        }
        // Create content for the prompt using Gemini
        const response = await ai.models.generateContent({
            model: model,
            contents: contents,
        });
        // Convert response to text
        const text = response.text;
        if (text) {
            const jsonValues = extractJSON(text);
            return jsonValues;
        }
        else {
            throw Error("Could not generate a response");
        }
    }
    catch (err) {
        console.log(err);
        throw Error("Error in generating MCQ questions");
    }
};
// Wrapper function to be called by API
export const getFactOrNot = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.body.userId },
        });
        if (!user) {
            res.status(404).send({ error: "User not found" });
            return;
        }
        const topic = req.body.topic;
        const difficulty = req.body.difficulty;
        const noteId = req.body.noteId;
        const fileId = req.body.fileId;
        let note;
        let file;
        // Step 1: Estimate token usage BEFORE AI call
        let totalTokensUsed = 0;
        if (fileId) {
            file = await prisma.userfile.findUnique({
                where: { assetId: fileId },
            });
            if (!file) {
                res.status(404).send({ error: "File not found." });
                return;
            }
            totalTokensUsed += Math.ceil(file.base64size / 4);
        }
        if (noteId) {
            note = await prisma.note.findUnique({ where: { noteId } });
            if (note?.content) {
                const text = htmlToText(note.content);
                const wordCount = text.trim().split(/\s+/).length;
                totalTokensUsed += Math.ceil(wordCount * 0.75);
            }
            note = note?.content;
        }
        const creditsNeeded = Number((totalTokensUsed / tokensPerCredit).toFixed(2)) + minCreditUsed;
        const availableCredits = Number(user.dailyCredit) + Number(user.bonusCredit);
        console.log("User", user?.id, "| Credits Needed:", creditsNeeded, "| Credits Available:", availableCredits);
        // Check if user has enough credits
        if (availableCredits < creditsNeeded) {
            res
                .status(403)
                .send({ error: "Not enough credits to generate flashcards." });
            return;
        }
        // Fetch the file and convert to base64
        if (file) {
            const resFile = await axios.get(file.fileURL, {
                responseType: "arraybuffer",
            });
            const pdfBuffer = Buffer.from(resFile.data, "binary");
            file = pdfBuffer.toString("base64");
        }
        const jsonValues = await generateFactOrNotQuestions(topic, difficulty, note, file);
        // Deduct credits now
        await prisma.user.update({
            where: { id: user.id },
            data: {
                dailyCredit: {
                    decrement: Number(Math.min(user.dailyCredit, creditsNeeded).toFixed(2)),
                },
                bonusCredit: {
                    decrement: Number(Math.max(0, creditsNeeded - user.dailyCredit).toFixed(2)),
                },
            },
        });
        res.status(200).send({ questions: jsonValues });
        return;
    }
    catch (err) {
        console.log(err);
        res.status(500).send({ data: "Something went wrong." });
        return;
    }
};
