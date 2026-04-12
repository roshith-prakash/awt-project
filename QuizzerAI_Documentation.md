# HootLearn: Complete Project Technical Documentation

Welcome to the comprehensive codebase documentation for **HootLearn** (also known as the AWT Project). This document serves as a guide for anyone looking to understand the project's architecture, its components, data flow, and technologies used.

---

## 1. Project Overview

HootLearn is a full-stack, AI-powered web application that helps users generate custom quizzes, flashcards, and fact-checking exercises out of personal notes or uploaded PDF documents. 

Users can upload their study materials or create notes using a built-in rich-text editor. They can then utilize an LLM (Large Language Model) integration to synthetically generate learning modules (MCQs, Flashcards, Fact-or-Not questions). The platform limits usage via a built-in daily credit system that resets every day.

---

## 2. Technology Stack

### Frontend 
* **Framework:** React 19 + TypeScript built with Vite.
* **Styling & UI:** Tailwind CSS v4, Shadcn UI, Radix UI components, Framer Motion (tailwind-merge, clsx).
* **State Management & Data Fetching:** `@tanstack/react-query`, React Context, Axios.
* **Routing:** React Router v7.
* **Authentication:** Firebase Auth.
* **Key Libraries:** `react-quill-new` (Rich text editing), `react-pdf` (Document viewer), `react-easy-crop`, `browser-image-compression`.

### Backend
* **Framework:** Node.js with Express.js (TypeScript).
* **Database & ORM:** MongoDB (NoSQL) with Prisma ORM.
* **Cache & Rate Limiting:** Redis (for caching daily reset state) and `express-rate-limit`.
* **File Storage:** Cloudinary (PDFs & Assets), managed with `multer`.
* **AI Generation:** `@google/genai` (Google Gemini SDK) for content generation and token estimation, though the architecture supports abstraction to OpenAI-compatible sources like OpenRouter.
* **Security:** Helmet, CORS, Data compression (`diff-match-patch` for text versioning), HTML Parser (`html-to-text`).

---

## 3. Database Architecture (Prisma/MongoDB)

The `schema.prisma` file defines several core models that outline the domain:

1. **`User`**: 
   Stores basic Firebase synchronized data (firebaseUID, email, display picture). More importantly, it keeps track of AI limits: `dailyCredit` and `bonusCredit`.
2. **`Userfile`**: 
   Represents uploaded PDFs or documents. Tracks metadata, file URLs hosted physically on Cloudinary (`publicId`, `assetId`), file size, and the relation to the uploading `User`.
3. **`Note` & `NoteVersion`**: 
   Represents user-created study notes using React Quill. To ensure safety, `NoteVersion` tracks a version history of notes over time if significant changes are made.
4. **`Quiz`**: 
   A generic JSON repository for generated quizzes associated with users, characterized by a `quizType` (Flashcards, MCQ, FactOrNot).
5. **`DailyLimitUpdateDate`**: 
   A singleton utility model tracking the last time the global daily credit limit was reset.

---

## 4. Backend Components & Flow

The backend fundamentally uses an MVC-esque pattern with Routes and Controllers.

### `quiz.controller.ts` (Core AI Flow)
This is the heart of HootLearn. It calculates limits, prompts the LLM, and formats JSON.
1. **Flow Check**: Validates if the user has enough `dailyCredit` + `bonusCredit` to run the task. It preemptively estimates required credits based on document file size (`base64size / 4`) and word count.
2. **Context Compilation**: Pulls context either from a Cloudinary PDF (downloading it to an ArrayBuffer and converting to `base64`) or HTML notes (parsing formatting).
3. **AI Prompting**: Feeds context and predefined structured prompts to `gemini-3-flash-preview` to formulate JSON outputs (MCQ options, Flashcard Q&A format, or Fact checks) based on the user's difficulty preference.
4. **Expense Deduction**: Deducts the respective credits from the user's allowance and answers the frontend with JSON.

### `file.controller.ts`
* Receives `multipart/form-data` streams securely using `multer`.
* Validates maximum file count limits per user and total MB boundaries.
* Pushes chunks to `Cloudinary` and saves the asset keys and CDN links to a new `Userfile` MongoDB document.

### `note.controller.ts`
* Simple CRUD functions for managing textual notes, with an integrated versioning system (`diff-match-patch` is utilized). When users update notes, the controller tracks if 15 minutes have passed or >5% of text changed to create a `NoteVersion` snapshot.

### `user.controller.ts` & `userquiz.controller.ts`
* Manage Firebase token verifications and persist quiz records locally.

### Server Main (`index.ts`)
* Configures Express middlewares: CORS whitelisting (Frontends and Localhost), `express-rate-limit` to prevent DDoS, and standard Helmet safety boundaries.
* Implements a unique **Daily Credits Reset cron-like mechanism via middleware**: When `/api/v1/update-limit` is pinged, it checks Redis cache. If it dictates that a reset is due, a Prisma operation resets all users' `dailyCredit` and updates `DailyLimitUpdateDate`, subsequently caching the next 24 hours timeline into `redisClient`.

---

## 5. Frontend Components & User Interface

The frontend `src` structure divides into `/pages`, `/components`, `/context`, and `/firebase`.

### Pages (Routing Screens)
* **Authentication (`Login`, `Signup`, `ForgotPassword`, `VerifyEmail`)**: Integrated tightly with Firebase to handle unauthenticated vs authenticated states.
* **Dashboard (`Home.tsx`, `Profile.tsx`, `Quizzes.tsx`)**: The control panels where a user can view their remaining credits, existing notes/files, and history of generated quizzes.
* **Generators (`FlashCardQuiz.tsx`, `MCQQuiz.tsx`, `FactOrNot.tsx`)**: Specific screens that accept the Quiz settings (Difficulty, Topic), pull data by dispatching Axios events to the backend, and visually present the AI JSON payload through interactive elements.
* **Editors (`NoteEditor.tsx`, `File.tsx`, `Files.tsx`)**: Management screens wrapping `react-quill` and native file selectors to upload and manage the study context data.

### Components (Reusables)
* **`Navbar.tsx` & `Protector.tsx`**: Manages the routing lifecycle, validating whether the user is logged in effectively acting as a global layout wrapper and route guard.
* **Modals (`FileSelectModal.tsx`, `NoteSelectModal.tsx`)**: Reusable floating dialogues that allow a user to attach a previous reference component into their LLM prompt.
* **UI Elements (`FlashCard.tsx`, `MCQ.tsx`)**: Extracted stateless presentation logic to elegantly display dynamic lists with framer-motion animations.

---

## 6. End-to-End Execution Flow (Example: Generating an MCQ)

To understand how the pieces fit together, here is the chronological data flow of an end-user generating an MCQ from a PDF:

1. **Interaction**: The user logs in (Firebase issues a token, `Protector.tsx` validates session).
2. **File Selection**: User navigates to `/files` and uploads `physics_chapter_1.pdf`.
3. **Upload Request**: The Frontend bundles it in `FormData` via `axios` and sends it to the API. The Backend uses `multer` -> uploads to Cloudinary -> persists the remote URL in Prisma, returning success.
4. **Trigger Generation**: User opens `MCQQuiz.tsx`, toggles `FileSelectModal.tsx`, selects 'physics_chapter_1.pdf', sets difficulty to 'Hard', and clicks "Generate".
5. **Preprocessing Check**: The Backend hits `getMCQs()`. It counts the PDF tokens. The module inspects Prisma to see if user's credits > required credits. 
6. **AI Processing**: Backend pushes the extracted base64 document and textual prompt constraints to the LLM (Gemini/OpenRouter). 
7. **Post-processing**: The LLM JSON is extracted and sanitized. The Backend deducts credits in the DB and replies asynchronously to the Frontend.
8. **UI Presentation**: The Frontend `react-query` resolves the state. `MCQQuiz.tsx` maps over the JSON options, displaying interactive `MCQ.tsx` custom components for the user to solve their newly tailored quiz.
9. **Persistence**: At any point, the user can click "Save Quiz", pinging `userquiz.controller.ts` to stash the questions JSON inside the respective DB table for future study sessions.

---

## Summary

In conclusion, HootLearn manages an intensive full-stack flow smartly by mapping rigorous cost parameters around intensive AI tasks, offloading heavy file lifting to Cloudinary, and implementing rapid caching/limiting layers using Redis, ensuring a swift and safe user experience.
