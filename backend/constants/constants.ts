// The number of notes a user can create.
export const noteLimit = 10;

// The number of files a user can upload.
export const fileLimit = 5;

// The number of quizzes a user can create / save.
export const quizLimit = 10;

// The max size of file a user can upload. (Mb)
export const fileSizeLimit = 5;

// The credit given to a user daily. Can be used for quiz generation.
export const dailyCredit = 10.0;

// The number of tokens that is used for 1 credit
export const tokensPerCredit = 150000;

// Minimum credit used
export const minCreditUsed = 0.5;

// The types of quizzes that can be created.
// Flashcard: A simple flashcard quiz with a question and an answer.
// MCQ: A multiple-choice quiz with a question and multiple options.
// Fact or Not: A quiz where the user has to determine if a statement is a fact or not.
export const quizTypes = {
  flashcard: "Flashcard",
  mcq: "MCQ",
  factornot: "Fact or Not",
};
