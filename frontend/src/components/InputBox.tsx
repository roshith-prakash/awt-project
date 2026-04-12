import {
  ErrorStatement,
  Input,
  PrimaryButton,
  SecondaryButton,
} from "@/components";
import { Globe, Lock, NotebookText } from "lucide-react";
import { useState } from "react";
import { BsFileEarmarkPdfFill, BsThreeDotsVertical } from "react-icons/bs";
import FileSelectModal from "./FileSelectModal";
import NoteSelectModal from "./NoteSelectModal";
import { RxCross2 } from "react-icons/rx";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { PopoverClose } from "@radix-ui/react-popover";
import AlertModal from "./reuseit/AlertModal";
import { MdOutlineDataSaverOn } from "react-icons/md";
import { axiosInstance } from "@/utils/axios";
import { useDBUser } from "@/context/UserContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const InputBox = ({
  buttonText,
  searchTerm,
  setSearchTerm,
  difficulty,
  setDifficulty,
  title,
  handleClick,
  isLoading,
  isFetching,
  inputError,
  questions,
  text,
  note,
  setNote,
  file,
  setFile,
}: {
  buttonText?: string;
  searchTerm?: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  difficulty: string;
  setDifficulty: React.Dispatch<React.SetStateAction<string>>;
  title: string;
  handleClick: () => void;
  isLoading?: boolean;
  isFetching?: boolean;
  inputError?: number;
  questions?: { question: string }[];
  text?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  note: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  file: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setNote: (note: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFile: (file: any) => void;
}) => {
  // Is note modal open
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<boolean>(false);
  // Is file modal open
  const [isFileModalOpen, setIsFileModalOpen] = useState<boolean>(false);
  // Is save quiz modal open
  const [isSaveQuizModalOpen, setIsSaveQuizModalOpen] =
    useState<boolean>(false);
  // Title of the quiz
  const [quizTitle, setQuizTitle] = useState<string>("");
  // Is Quiz public
  const [isPublic, setIsPublic] = useState<boolean>(false);
  // Disable button
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  // Quiz Title error
  const [quizTitleError, setquizTitleError] = useState<number>(0);

  const { dbUser } = useDBUser();
  const navigate = useNavigate();

  // Save the Quiz
  const saveQuiz = () => {
    setquizTitleError(0);

    if (quizTitle == null || quizTitle == undefined || quizTitle.length <= 0) {
      setquizTitleError(1);
      return;
    } else if (quizTitle?.length > 50) {
      setquizTitleError(2);
      return;
    }

    setquizTitleError(0);
    setIsDisabled(true);

    axiosInstance
      ?.post("/user-quiz/create-quiz", {
        name: quizTitle,
        userId: dbUser?.id,
        //@ts-expect-error possibly undefined but already checked
        quizType:
          title === "Fact Or Not"
            ? "Fact or Not"
            : questions[0]?.options?.length > 0
            ? "MCQ"
            : "Flashcard",
        isPublic: isPublic,
        questions: questions,
      })
      .then(() => {
        setIsDisabled(false);
        toast.success("Saved Quiz.", { position: "bottom-right" });
        setIsSaveQuizModalOpen(false);
        navigate("/quizzes");
      })
      .catch((err) => {
        if (err?.response?.status === 403) {
          toast.error("Maximum saved quiz limit reached.", {
            position: "bottom-right",
          });
          return;
        }
        toast.error("Could not save the quiz.", { position: "bottom-right" });
        setIsDisabled(false);
        console.log(err);
      });
  };

  console.log(questions);

  return (
    <div className="py-10 flex justify-center ">
      {/* Note Modal */}
      <NoteSelectModal
        selectedNote={note}
        onSelect={(selectedNote) => {
          setNote(selectedNote);
          setIsNoteModalOpen(false);
        }}
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
      />

      {/* File Modal */}
      <FileSelectModal
        selectedFile={file}
        onSelect={(selectedFile) => {
          setFile(selectedFile);
          setIsFileModalOpen(false);
        }}
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
      />

      <AlertModal
        onClose={() => {
          setIsSaveQuizModalOpen(false);
        }}
        isOpen={isSaveQuizModalOpen}
      >
        <div className="flex flex-col gap-y-2">
          {/* Title */}
          <h1 className="dark:text-darkmodetext font-bold text-2xl">
            Save this quiz
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Give your quiz a name to help you find it later.
          </p>

          <Input
            value={quizTitle}
            onChange={(e) => {
              setQuizTitle(e.target.value);

              if (
                e.target.value != null &&
                e.target.value != undefined &&
                e.target.value.length > 0 &&
                e.target.value?.length < 50
              ) {
                setquizTitleError(0);
              }
            }}
            onBlur={(e) => {
              if (
                e.target.value == null ||
                e.target.value == undefined ||
                e.target.value.length <= 0
              ) {
                setquizTitleError(1);
                return;
              } else if (e.target.value?.length > 50) {
                setquizTitleError(2);
                return;
              }
            }}
            placeholder="Add Quiz Title..."
          />

          {/* Error + Length */}
          <div className="flex w-full justify-between">
            <div>
              <ErrorStatement
                isOpen={quizTitleError == 1}
                text={"Please enter note title."}
              />

              <ErrorStatement
                isOpen={quizTitleError == 2}
                text={"Note Title cannot exceed 50 characters."}
              />
            </div>
            <p
              className={`text-right mt-0.5 mr-0.5 ${
                quizTitle?.length > 50 && "text-red-500"
              }`}
            >
              {quizTitle?.length}/50
            </p>
          </div>

          {/* Privacy */}
          <div className="grid mt-4 grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Public Option */}
            <div
              onClick={() => setIsPublic(true)}
              className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                isPublic
                  ? "border-cta dark:border-darkmodeCTA bg-cta/10 dark:bg-cta/30"
                  : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isPublic
                      ? "bg-cta/10 dark:bg-cta/30"
                      : "bg-slate-100 dark:bg-slate-700"
                  }`}
                >
                  <Globe
                    className={`w-4 h-4 ${
                      isPublic
                        ? "text-cta dark:text-darkmodeCTA"
                        : "text-slate-500"
                    }`}
                  />
                </div>
                <h3
                  className={`font-semibold ${
                    isPublic
                      ? "text-cta dark:text-white"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  Public Quiz
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This quiz is public and visible to everyone.
              </p>
            </div>

            {/* Private Option */}
            <div
              onClick={() => setIsPublic(false)}
              className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                !isPublic
                  ? "border-cta dark:border-darkmodeCTA bg-cta/10 dark:bg-cta/30"
                  : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    !isPublic
                      ? "bg-cta/10 dark:bg-cta/30"
                      : "bg-slate-100 dark:bg-slate-700"
                  }`}
                >
                  <Lock
                    className={`w-4 h-4 ${
                      !isPublic
                        ? "text-cta dark:text-darkmodeCTA"
                        : "text-slate-500"
                    }`}
                  />
                </div>
                <h3
                  className={`font-semibold ${
                    !isPublic
                      ? "text-cta dark:text-white"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  Private Quiz
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This quiz is private and only visible to you.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-5 flex gap-x-5 justify-end">
            <PrimaryButton
              disabled={isDisabled}
              disabledText="Please Wait..."
              className="text-sm"
              onClick={saveQuiz}
              text="Save Quiz"
            />
            <SecondaryButton
              disabled={isDisabled}
              disabledText="Please Wait..."
              className="text-sm text-black border-black hover:bg-black hover:border-black"
              onClick={() => setIsSaveQuizModalOpen(false)}
              text="Cancel"
            />
          </div>
        </div>
      </AlertModal>

      <div className="flex max-w-[95%] relative w-full sm:max-w-xl py-10 px-10 flex-col items-center gap-y-8 bg-white dark:bg-white/5 rounded-xl shadow-xl">
        {/* Save Quiz Popover */}
        {questions && questions?.length > 0 && (
          <div className="absolute top-5 right-5">
            <Popover>
              <PopoverTrigger className="flex items-center cursor-pointer">
                <BsThreeDotsVertical className="text-2xl" />
              </PopoverTrigger>

              <PopoverContent className="dark:bg-darkgrey dark:border-2 w-auto mt-2 mr-4 py-0 px-1">
                <div className="py-1 min-w-32 flex flex-col gap-y-1">
                  <PopoverClose>
                    <button
                      onClick={() => setIsSaveQuizModalOpen(true)}
                      className="cursor-pointer w-full flex items-center gap-x-3 justify-center hover:text-cta dark:hover:text-darkmodeCTA hover:bg-grey/50 dark:hover:bg-grey/5 py-1.5 transition-all"
                    >
                      <MdOutlineDataSaverOn />
                      <span className="-translate-x-1">Save Quiz</span>
                    </button>
                  </PopoverClose>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Page Title */}
        <div className="flex items-center gap-x-2">
          <p className="text-cta font-title  dark:text-darkmodeCTA text-3xl tracking-wider font-medium">
            {title}
          </p>
        </div>

        {/* Topic input text */}
        <p className="text-center font-medium text-xl">Enter your topic :</p>

        {/* Input box for topic */}
        <input
          disabled={isLoading || isFetching}
          type="text"
          value={searchTerm}
          placeholder="Enter the topic for the questions!"
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border-b-2 dark:border-darkmodetext p-1 text-center bg-transparent outline-none"
        />

        {inputError == 1 && (
          <p className="text-center text-red-500">Please enter a topic.</p>
        )}

        {inputError == 2 && (
          <p className="text-center text-red-500">
            Topic must not exceed 50 characters.
          </p>
        )}

        {/* Difficulty text */}
        <p className="text-center text-xl font-medium">Choose Difficulty :</p>

        {/* Radio Button Group for difficulty */}
        <div className="flex justify-evenly text-lg gap-x-10">
          {/* Radio Button for difficulty : EASY */}
          <div className="flex gap-x-2 justify-center">
            <input
              disabled={isLoading || isFetching}
              type="radio"
              className="accent-cta w-5 cursor-pointer"
              name="difficulty"
              value={"easy"}
              checked={difficulty == "easy"}
              onChange={(e) => setDifficulty(e.target.value)}
            />{" "}
            Easy
          </div>
          {/* Radio Button for difficulty : MEDIUM */}
          <div className="flex gap-x-2 justify-center">
            <input
              disabled={isLoading || isFetching}
              type="radio"
              className="accent-cta bg-transparent w-5 cursor-pointer"
              name="difficulty"
              value={"medium"}
              checked={difficulty == "medium"}
              onChange={(e) => setDifficulty(e.target.value)}
            />{" "}
            Medium
          </div>
          {/* Radio Button for difficulty : HARD */}
          <div className="flex gap-x-2 justify-center">
            <input
              disabled={isLoading || isFetching}
              type="radio"
              className="accent-cta w-5 cursor-pointer"
              name="difficulty"
              value={"hard"}
              checked={difficulty == "hard"}
              onChange={(e) => setDifficulty(e.target.value)}
            />{" "}
            Hard
          </div>
        </div>

        {/* File Select */}
        <div className="mt-5 flex w-full gap-4 items-center flex-col md:flex-row md:justify-between md:items-center">
          <PrimaryButton
            onClick={() => {
              setIsFileModalOpen(true);
            }}
            text="Select File"
          />

          {/* File display */}
          {file && (
            <div
              key={file?.assetId}
              className="bg-white relative gap-x-4 items-center overflow-hidden shadow-xl max-w-2xs w-full rounded-xl flex  dark:bg-white/5  px-5 py-5 transition-all"
            >
              <div className="flex   justify-center items-center">
                <BsFileEarmarkPdfFill className="text-2xl text-red-700" />
              </div>

              <div className="flex-1">
                <p className="text-lg mr-5 line-clamp-1 font-semibold">
                  {file?.fileName}
                </p>
              </div>

              <button
                onClick={() => setFile(null)}
                className="absolute top-1/2 -translate-y-1/2 right-2 bg-red-500 p-1 text-white rounded-md cursor-pointer hover:scale-110 transition-all"
              >
                <RxCross2 />
              </button>
            </div>
          )}

          {!file && <p>Optional : Select a file!</p>}
        </div>

        {/* Time warning */}
        {file && (
          <p className="text-center">
            Note : Requests with PDFs tend to take a lot longer!
            <br /> Prefer using Notes if possible!
          </p>
        )}

        {/* Note select */}
        <div className="mt-5 flex w-full gap-4 items-center flex-col md:flex-row md:justify-between md:items-center">
          <PrimaryButton
            onClick={() => {
              setIsNoteModalOpen(true);
            }}
            text="Select Note"
          />

          {/* Note display */}
          {note && (
            <div
              key={note?.noteId}
              className="bg-white relative gap-x-4 items-center overflow-hidden shadow-xl max-w-2xs w-full rounded-xl flex  dark:bg-white/5  px-5 py-5 transition-all"
            >
              <div className="flex   justify-center items-center">
                <NotebookText className="text-2xl text-cta dark:text-darkmodeCTA" />
              </div>
              <div className="flex-1">
                <p className="text-lg line-clamp-1 mr-5 font-semibold">
                  {note?.title}
                </p>
              </div>

              <button
                onClick={() => setNote(null)}
                className="absolute top-1/2 -translate-y-1/2 right-2 bg-red-500 p-1 text-white rounded-md cursor-pointer hover:scale-110 transition-all"
              >
                <RxCross2 />
              </button>
            </div>
          )}

          {!note && <p>Optional : Select a note!</p>}
        </div>

        {/* Button to fetch flashcards */}
        <div className="mt-5 flex justify-center">
          <PrimaryButton
            // className="shadow p-2 w-fit bg-white rounded px-5 hover:shadow-md transition-all"
            onClick={handleClick}
            disabled={searchTerm?.length == 0 || isLoading || isFetching}
            text={buttonText}
          ></PrimaryButton>
        </div>

        {/* Fetching */}
        {questions && questions?.length > 0 && !isLoading && (
          <div className="flex flex-col items-center gap-y-4 w-full mt-5">
            <p className="text-cta dark:text-darkmodetext font-medium animate-bounce flex gap-x-2 items-center">
              {!isFetching ? text : "Fetching new questions..."}
            </p>
            
            <button
              onClick={() => setIsSaveQuizModalOpen(true)}
              className="group flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <MdOutlineDataSaverOn className="text-2xl" />
              <span className="font-semibold tracking-wide">Secure and Save this Quiz</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputBox;
