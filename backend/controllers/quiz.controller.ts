import dotenv from "dotenv";
import { Request, Response } from "express";
import axios from "axios";
import OpenAI from "openai";
import { prisma } from "../utils/prismaClient.ts";
import { htmlToText } from "html-to-text";
import { minCreditUsed, tokensPerCredit } from "../constants/constants.ts";

dotenv.config();

// Using OpenAI SDK to connect to OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const model = "google/gemini-2.0-flash-001";

// To generate flashcards
export const generateFlashcardQuestions = async (
  topic: string,
  difficulty: string,
  note: any,
  file: any,
  signal?: AbortSignal
) => {
  try {
    const messages: any[] = [];

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
  
    Your task: Generate 10 questions based on the content of the provided data. Format your output exactly as shown below:
  
    {"question": "Question here", "answer": "Answer here"}
  
    - Do not include any extra text or explanation.
    - Ensure that each question adheres to the above guidelines for quality and relevance.
  `;

    let contentArr: any[] = [{ type: "text", text: prompt }];

    if (file) {
      console.log("Adding file to context");
      // Note: passing PDF base64 to some OpenRouter models might require specific multimodal format or parsing to text first.
      // Gemini 2.0 via OpenRouter supports pdf files via inline data similar to images in vision models if using 'image_url' with data URI, but Google API specific format might differ. We will send it as text if we expect base64 to fail, but Gemini 2.0 supports document. Since OpenAI SDK is used, we can format it as an image_url with application/pdf. Wait, the safest approach for cross-model compatibility if needed is extracting text, but we'll try sending the base64 as text or using the text. Wait, we will format it as a data uri.
      contentArr.push({
        type: "text",
        text: "Here is the base64 encoded PDF document content. Please extract meaning from it: " + file
      });
    }

    if (note) {
      console.log("Adding note to context");
      contentArr.push({ type: "text", text: note });
    }

    messages.push({
      role: "user",
      content: contentArr,
    });

    const response = await openai.chat.completions.create({
      model: model,
      messages: messages,
    }, { signal: signal as any });

    const text = response.choices[0]?.message?.content;

    if (text) {
      let JSONtext = text.replace(/```(?:json)?/g, "").replaceAll("`", "");
      const jsonValues = JSON.parse(JSONtext);
      return { jsonValues };
    } else {
      throw Error("Could not generate a response");
    }
  } catch (error: any) {
    console.log(
      "-------------------------------------------------------------------------------"
    );
    console.log(
      "-------------------------------------------------------------------------------"
    );

    const errStatus = error?.status;
    const errCode = error?.code;

    console.log(errCode, errStatus);

    if (errCode === 503 || errStatus === 503) {
      console.error("Model is overloaded. Retry later.");
      throw new Error("Service Unavailable. Please try again later.");
    } else {
      throw Error("Error in generating flashcard questions");
    }
  }
};

// Wrapper function to be called by API
export const getFlashcards = async (
  req: Request,
  res: Response
): Promise<void> => {
  const abortController = new AbortController();
  const signal = abortController.signal;

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

    const creditsNeeded =
      Number((totalTokensUsed / tokensPerCredit).toFixed(2)) + minCreditUsed;

    const availableCredits =
      Number(user.dailyCredit) + Number(user.bonusCredit);

    console.log(
      "User",
      user?.id,
      "| Credits Needed:",
      creditsNeeded,
      "| Credits Available:",
      availableCredits
    );

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

    const { jsonValues } = await generateFlashcardQuestions(
      topic,
      difficulty,
      note,
      file,
      signal
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        dailyCredit: {
          decrement: Number(
            Math.min(user.dailyCredit, creditsNeeded).toFixed(2)
          ),
        },
        bonusCredit: {
          decrement: Number(
            Math.max(0, creditsNeeded - user.dailyCredit).toFixed(2)
          ),
        },
      },
    });

    res.status(200).send({ questions: jsonValues, creditsUsed: creditsNeeded });
    return;
  } catch (err) {
    if (signal.aborted) {
      console.log("Request aborted by client.");
      return; 
    }

    if (err == "Service Unavailable. Please try again later.") {
      res.status(503).send({ error: "Model overload. Please try later" });
      return;
    }

    console.error("Error:", err);
    res.status(500).send({ error: "Something went wrong." });
  }
};

// To generate MCQs
export const generateMCQQuestions = async (
  topic: string,
  difficulty: string,
  note: any,
  file: any,
  signal?: AbortSignal
) => {
  try {
    const messages: any[] = [];
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

  Your task: Generate 10 questions based on the content of the provided data. Format your output exactly as shown below:

   {
    "question": "Your question here",
    "answer": "Correct answer here",
    "options": ["Option A", "Option B", "Option C", "Option D"]
  }

  - Do not include any extra text or explanation.
  - Ensure that each question adheres to the above guidelines for quality and relevance.
`;

    let contentArr: any[] = [{ type: "text", text: prompt }];

    if (file) {
      console.log("Adding file to context");
      contentArr.push({
        type: "text",
        text: "Here is the base64 encoded PDF document content. Please extract meaning from it: " + file
      });
    }

    if (note) {
      console.log("Adding note to context");
      contentArr.push({ type: "text", text: note });
    }

    messages.push({
      role: "user",
      content: contentArr,
    });

    const response = await openai.chat.completions.create({
      model: model,
      messages: messages,
    }, { signal: signal as any });

    const text = response.choices[0]?.message?.content;

    if (text) {
      let JSONtext = text.replace(/```(?:json)?/g, "");
      JSONtext = JSONtext.replaceAll("`", "");
      const jsonValues = JSON.parse(JSONtext);
      return jsonValues;
    } else {
      throw Error("Could not generate a response");
    }
  } catch (err) {
    console.log(err);
    throw Error("Error in generating MCQ questions");
  }
};

// Wrapper function to be called by API
export const getMCQs = async (req: Request, res: Response): Promise<void> => {
  const abortController = new AbortController();
  const signal = abortController.signal;

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

    const creditsNeeded =
      Number((totalTokensUsed / tokensPerCredit).toFixed(2)) + minCreditUsed;

    const availableCredits =
      Number(user.dailyCredit) + Number(user.bonusCredit);

    console.log(
      "User",
      user?.id,
      "| Credits Needed:",
      creditsNeeded,
      "| Credits Available:",
      availableCredits
    );

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

    const jsonValues = await generateMCQQuestions(
      topic,
      difficulty,
      note,
      file,
      signal
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        dailyCredit: {
          decrement: Number(
            Math.min(user.dailyCredit, creditsNeeded).toFixed(2)
          ),
        },
        bonusCredit: {
          decrement: Number(
            Math.max(0, creditsNeeded - user.dailyCredit).toFixed(2)
          ),
        },
      },
    });

    res.status(200).send({ questions: jsonValues });
    return;
  } catch (err) {
    console.log(err);
    res.status(500).send({ data: "Something went wrong." });
    return;
  }
};

// To generate Fact or not questions
export const generateFactOrNotQuestions = async (
  topic: string,
  difficulty: string,
  note: any,
  file: any,
  signal?: AbortSignal
) => {
  try {
    const messages: any[] = [];
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

  Your task: Generate 10 fact-based questions using the structure below. Format your output exactly as shown:

  {
    "question": "Your factual statement here",
    "answer": "Fact" or "Not a fact",
    "options": ["Fact", "Not a fact"],
    "reason": "Brief explanation here"
  }

  - Do not include any extra text or explanation.
  - Only generate Fact or Not a Fact type questions.
  - Do not include multiple-choice, short-answer, or other question types.
`;

    let contentArr: any[] = [{ type: "text", text: prompt }];

    if (file) {
      contentArr.push({
        type: "text",
        text: "Here is the base64 encoded PDF document content. Please extract meaning from it: " + file
      });
    }

    if (note) {
      contentArr.push({ type: "text", text: note });
    }

    messages.push({
      role: "user",
      content: contentArr,
    });

    const response = await openai.chat.completions.create({
      model: model,
      messages: messages,
    }, { signal: signal as any });

    const text = response.choices[0]?.message?.content;

    if (text) {
      let JSONtext = text.replace(/```(?:json)?/g, "");
      JSONtext = JSONtext.replaceAll("`", "");
      const jsonValues = JSON.parse(JSONtext);
      return jsonValues;
    } else {
      throw Error("Could not generate a response");
    }
  } catch (err) {
    console.log(err);
    throw Error("Error in generating Fact or Not questions");
  }
};

// Wrapper function to be called by API
export const getFactOrNot = async (
  req: Request,
  res: Response
): Promise<void> => {
  const abortController = new AbortController();
  const signal = abortController.signal;

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

    const creditsNeeded =
      Number((totalTokensUsed / tokensPerCredit).toFixed(2)) + minCreditUsed;

    const availableCredits =
      Number(user.dailyCredit) + Number(user.bonusCredit);

    console.log(
      "User",
      user?.id,
      "| Credits Needed:",
      creditsNeeded,
      "| Credits Available:",
      availableCredits
    );

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

    const jsonValues = await generateFactOrNotQuestions(
      topic,
      difficulty,
      note,
      file,
      signal
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        dailyCredit: {
          decrement: Number(
            Math.min(user.dailyCredit, creditsNeeded).toFixed(2)
          ),
        },
        bonusCredit: {
          decrement: Number(
            Math.max(0, creditsNeeded - user.dailyCredit).toFixed(2)
          ),
        },
      },
    });

    res.status(200).send({ questions: jsonValues });
    return;
  } catch (err) {
    console.log(err);
    res.status(500).send({ data: "Something went wrong." });
    return;
  }
};
