import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { axiosInstance } from "../utils/axios.js";
import { MCQ } from "@/components";
import { SyncLoader } from "react-spinners";
import { GoUpButton, InputBox } from "../components";
import { useDarkMode } from "../context/DarkModeContext.jsx";
import { useDBUser } from "@/context/UserContext";
import toast from "react-hot-toast";
import SaveQuizModal from "@/components/SaveQuizModal";
import { Save } from "lucide-react";

const MCQQuiz = () => {
  const { isDarkMode } = useDarkMode();

  const [searchTerm, setSearchTerm] = useState("");

  const [difficulty, setDifficulty] = useState("easy");

  const [questions, setQuestions] = useState([]);

  const [correctCount, setCorrectCount] = useState(0);

  const [inputError, setInputError] = useState(0);

  const [note, setNote] = useState();

  const [file, setFile] = useState();

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const { dbUser, fetchUser } = useDBUser();

  const [answeredCount, setAnsweredCount] = useState(0);
  const attemptSaved = useRef(false);

  const { mutate: saveAttempt } = useMutation({
    mutationFn: (score) => {
      return axiosInstance.post("/user-quiz/save-attempt", {
        userId: dbUser?.id,
        quizType: "MCQ",
        score: score,
        totalQuestions: questions.length,
      });
    },
    onSuccess: () => {
      attemptSaved.current = true;
    },
  });

  useEffect(() => {
    if (
      questions.length > 0 &&
      answeredCount === questions.length &&
      !attemptSaved.current
    ) {
      saveAttempt(correctCount);
    }
  }, [answeredCount, questions.length, correctCount, saveAttempt]);

  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ["getMCQQuestions", searchTerm, difficulty],
    queryFn: () => {
      return axiosInstance.post("/quiz/get-mcqs", {
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

  useEffect(() => {
    if (data?.data?.questions?.length > 0) {
      setCorrectCount(0);
      setAnsweredCount(0);
      attemptSaved.current = false;
      setQuestions(data?.data?.questions);
      fetchUser();
    } else if (error?.response?.status === 403) {
      toast.error("Insufficient credits to generate flashcards.");
    }
  }, [data?.data, error, fetchUser]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    document.title = `MCQ | HootLearn`;
  }, []);

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
      {}
      <InputBox
        buttonText={"Generate MCQs"}
        difficulty={difficulty}
        handleClick={handleClick}
        inputError={inputError}
        isFetching={isFetching}
        isLoading={isLoading}
        questions={questions}
        searchTerm={searchTerm}
        setDifficulty={setDifficulty}
        setSearchTerm={setSearchTerm}
        title={"MCQ Quiz"}
        text={"Your MCQs are ready!"}
        file={file}
        setFile={setFile}
        note={note}
        setNote={setNote}
      />

      {}
      {!isLoading && questions?.length > 0 && (
        <>
          <p className="text-center mt-10  px-2">
            Note : Questions & answers are created using AI and may be
            incorrect.
          </p>

          <div className="flex flex-wrap gap-5 justify-center py-10">
            {questions?.map((item) => {
              return (
                <MCQ
                  key={item?.question}
                  question={item?.question}
                  answer={item?.answer}
                  options={item?.options}
                  setCount={(updater) => {
                    if (typeof updater === "function") {
                      setCorrectCount(updater);
                    } else {
                      setCorrectCount(updater);
                    }
                    setAnsweredCount((prev) => prev + 1);
                  }}
                />
              );
            })}
          </div>
        </>
      )}

      {}
      {(error || data?.data?.questions.length == 0) && (
        <p className="text-center font-medium text-xl  drop-shadow-lg">
          Uh oh! Couldn't create questions about "{searchTerm}". Maybe try a
          different topic?
        </p>
      )}

      {}
      {isLoading && (
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

      {}
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
            <span className="text-xl font-bold tracking-wide">
              Save this Quiz to Library
            </span>
          </button>
        </div>
      )}

      <SaveQuizModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        questions={questions}
        quizType="MCQ"
      />

      {}
      {!isLoading && questions?.length > 0 && <GoUpButton />}
    </div>
  );
};

export default MCQQuiz;
