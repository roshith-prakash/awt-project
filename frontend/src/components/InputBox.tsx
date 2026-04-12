import { PrimaryButton } from "@/components";
import { NotebookText } from "lucide-react";
import { useEffect, useState } from "react";
import { BsFileEarmarkPdfFill, BsThreeDotsVertical } from "react-icons/bs";
import FileSelectModal from "./FileSelectModal";
import NoteSelectModal from "./NoteSelectModal";
import { RxCross2 } from "react-icons/rx";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { PopoverClose } from "@radix-ui/react-popover";
import { MdOutlineDataSaverOn } from "react-icons/md";
import SaveQuizModal from "./SaveQuizModal";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [questionsState, setQuestionsState] = useState<any[]>([]);

  useEffect(() => {
    if (questions) {
      setQuestionsState(questions);
    }
  }, [questions]);

  // Is save quiz modal open
  const [isSaveQuizModalOpen, setIsSaveQuizModalOpen] =
    useState<boolean>(false);

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

      <SaveQuizModal
        isOpen={isSaveQuizModalOpen}
        onClose={() => setIsSaveQuizModalOpen(false)}
        questions={questionsState}
        quizType={questionsState[0]?.options?.length > 0 ? "MCQ" : "Flashcard"}
        sourceTitle={title}
      />

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
