import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { axiosInstance } from "../utils/axios";
import { MCQ } from "@/components";
import { SyncLoader } from "react-spinners";
import { GoUpButton, InputBox } from "../components";
import { ContextValue, useDarkMode } from "../context/DarkModeContext";
import { useDBUser } from "@/context/UserContext";
import toast from "react-hot-toast";
import SaveQuizModal from "@/components/SaveQuizModal";
import { Save } from "lucide-react";

const FactOrNot = () => {
  const { isDarkMode } = useDarkMode() as ContextValue;

  // The topic for which flashcards need to be created
  const [searchTerm, setSearchTerm] = useState("");

  // The difficulty for the questions
  const [difficulty, setDifficulty] = useState("easy");

  // The questions array that is mapped for the flashcards
  const [questions, setQuestions] = useState([]);

  // State to maintain how many questions were "correct"
  const [correctCount, setCorrectCount] = useState(0);

  const [inputError, setInputError] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [note, setNote] = useState<any>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [file, setFile] = useState<any>();
 
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const { dbUser, fetchUser } = useDBUser();

  const [answeredCount, setAnsweredCount] = useState(0);
  const attemptSaved = useRef(false);

  // Save the attempt to the DB
  const { mutate: saveAttempt } = useMutation({
    mutationFn: (score: number) => {
      return axiosInstance.post("/user-quiz/save-attempt", {
        userId: dbUser?.id,
        quizType: "Fact or Not",
        score: score,
        totalQuestions: questions.length,
      });
    },
    onSuccess: () => {
      attemptSaved.current = true;
    },
  });

  // Effect to save attempt when all questions are answered
  useEffect(() => {
    if (
      questions.length > 0 &&
      answeredCount === questions.length &&
      !attemptSaved.current
    ) {
      saveAttempt(correctCount);
    }
  }, [answeredCount, questions.length, correctCount, saveAttempt]);

  // Fetch Questions from the API
  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ["getFactOrNot", searchTerm, difficulty],
    queryFn: () => {
      return axiosInstance.post("/quiz/get-fact-or-not", {
        topic: searchTerm,
        difficulty: difficulty,
        fileId: file?.assetId,
        noteId: note?.noteId,
        userId: dbUser?.id,
      });
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: 60 * 1000 * 10,
    enabled: false,
  });

  // Set questions only if new ones are fetched - stops blank screen when parameters are changed
  useEffect(() => {
    if (data?.data?.questions?.length > 0) {
      setCorrectCount(0);
      setAnsweredCount(0);
      attemptSaved.current = false;
      setQuestions(data?.data?.questions);
      fetchUser();
      //@ts-expect-error Axios error
    } else if (error?.response?.status === 403) {
      toast.error("Insufficient credits to generate flashcards.");
    }
  }, [data?.data, error, fetchUser]);

  //   Scroll to top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, []);

  // Set window title.
  useEffect(() => {
    document.title = `Fact or Not | HootLearn`;
  }, []);

  // Fetch data on click of the button
  const handleClick = () => {
    setInputError(0);
    const search = searchTerm?.replaceAll(" ", "");

    if (search?.length == 0) {
      setInputError(1);
      return;
    } else if (searchTerm?.length > 50) {
      setInputError(2);
      return;
    }

    refetch();
  };

  return (
    <div
      className={`${
        isDarkMode ? "bg-animatedWaveDark" : "bg-animatedWave"
      } bg-no-repeat bg-cover font-body min-h-screen`}
    >
      {/* Input for parameters */}
      <InputBox
        buttonText={"Generate Questions"}
        difficulty={difficulty}
        handleClick={handleClick}
        inputError={inputError}
        isFetching={isFetching}
        isLoading={isLoading}
        questions={questions}
        searchTerm={searchTerm}
        setDifficulty={setDifficulty}
        setSearchTerm={setSearchTerm}
        title={"Fact Or Not"}
        text={"Your questions are ready!"}
        file={file}
        setFile={setFile}
        note={note}
        setNote={setNote}
      />

      {/* Div for questions */}
      {!isLoading && questions?.length > 0 && (
        <>
          <p className="text-center mt-10  px-2">
            Note : Questions & answers are created using AI and may be
            incorrect.
          </p>

          <div className="flex flex-wrap gap-5 justify-center py-10">
            {questions?.map(
              (item: {
                question: string;
                answer: string;
                options: string[];
                reason: string;
              }) => {
                return (
                  <MCQ
                    key={item?.question}
                    question={item?.question}
                    answer={item?.answer}
                    options={["True", "False"]}
                    setCount={(updater: any) => {
                      if (typeof updater === "function") {
                        setCorrectCount(updater);
                      } else {
                        setCorrectCount(updater);
                      }
                      setAnsweredCount((prev) => prev + 1);
                    }}
                  />
                );
              }
            )}
          </div>
        </>
      )}

      {/* Error statement */}
      {error && (
        <p className="text-center font-medium text-xl  drop-shadow-lg">
          Uh oh! Couldn't create questions about "{searchTerm}". Maybe try a
          different topic?
        </p>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        // Loading indicator for questions
        <div className="mt-12 flex justify-center items-center">
          <SyncLoader
            color={"#9b0ced"}
            loading={isLoading}
            size={60}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        </div>
      )}

      {/* Show Score & Save Button */}
      {!isLoading && questions?.length > 0 && (
        <div className="flex flex-col items-center gap-y-6 pb-20">
          <div className="flex justify-center w-full">
            <p className="font-medium bg-white dark:bg-darkbg dark:border-2 dark:border-white w-[95%] rounded-xl text-center border-2 p-5 text-lg md:text-2xl flex justify-center items-center gap-x-5 shadow-lg">
              {correctCount == questions?.length && (
                <img
                  src={
                    "https://res.cloudinary.com/do8rpl9l4/image/upload/v1736427375/confetti_fmluma.gif"
                  }
                  className="w-10  [transform:rotateY(180deg)]"
                />
              )}
              Your Score : <span>{correctCount}</span> / {questions?.length}
              {correctCount == questions?.length && (
                <img
                  src={
                    "https://res.cloudinary.com/do8rpl9l4/image/upload/v1736427375/confetti_fmluma.gif"
                  }
                  className="w-10"
                />
              )}
            </p>
          </div>

          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="group flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-5 duration-700"
          >
            <Save className="text-2xl" />
            <span className="text-xl font-bold tracking-wide">Save this Quiz to Library</span>
          </button>
        </div>
      )}

      <SaveQuizModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        questions={questions}
        quizType="Fact or Not"
        sourceTitle="Fact Or Not"
      />

      {/* Button to go back to top */}
      {!isLoading && questions?.length > 0 && (
        // Button to go back to the input Div
        <GoUpButton />
      )}
    </div>
  );
};

export default FactOrNot;
