import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../utils/axios.js";
import { FlashCard } from "@/components";
import { SyncLoader } from "react-spinners";
import { GoUpButton, InputBox } from "../components";
import { useDarkMode } from "../context/DarkModeContext.jsx";
import { useDBUser } from "@/context/UserContext";
import toast from "react-hot-toast";
import SaveQuizModal from "@/components/SaveQuizModal";
import { Save } from "lucide-react";

const FlashCardQuiz = () => {
  const { isDarkMode } = useDarkMode();

  const [searchTerm, setSearchTerm] = useState("");

  const [difficulty, setDifficulty] = useState("easy");

  const [questions, setQuestions] = useState([]);

  const [note, setNote] = useState();

  const [file, setFile] = useState();

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const [inputError, setInputError] = useState(0);

  const { dbUser, fetchUser } = useDBUser();

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["getFlashcards", searchTerm, difficulty],
    queryFn: () => {
      return axiosInstance.post("/quiz/get-flashcards", {
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
      setQuestions(data?.data?.questions);
      fetchUser();
    } else if (error?.response?.status === 403) {
      toast.error("Insufficient credits to generate flashcards.");
    } else if (error?.response?.status === 503) {
      toast.error("Facing issues with Quizzer's AI. Please try later.");
    }
  }, [data?.data, error, fetchUser]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    document.title = `FlashCards | HootLearn`;
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

  console.log(error);

  return (
    <>
      <div
        className={`${
          isDarkMode ? "bg-animatedWaveDark" : "bg-animatedWave"
        } bg-no-repeat bg-cover font-body min-h-screen`}
      >
        {}
        <InputBox
          buttonText={"Generate FlashCards"}
          difficulty={difficulty}
          handleClick={handleClick}
          inputError={inputError}
          isFetching={isFetching}
          isLoading={isLoading}
          questions={questions}
          searchTerm={searchTerm}
          setDifficulty={setDifficulty}
          setSearchTerm={setSearchTerm}
          title={"FlashCards"}
          text={"Your Flashcards are ready!"}
          file={file}
          setFile={setFile}
          note={note}
          setNote={setNote}
        />

        {}
        {!isLoading && questions?.length > 0 && (
          <>
            <p className="text-center mt-10  px-2 text-darkbg/70 dark:text-white/70">
              Note : Questions & answers are created using AI and may be
              incorrect.
            </p>
            <div className="flex flex-wrap justify-evenly gap-6 py-10 px-5">
              {questions?.length > 0 &&
                questions?.map((item) => {
                  return (
                    <FlashCard
                      key={item?.question}
                      question={item?.question}
                      answer={item?.answer}
                    />
                  );
                })}
            </div>

            <div className="flex flex-col items-center gap-y-6 pb-24">
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
          </>
        )}

        <SaveQuizModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          questions={questions}
          quizType="Flashcard"
        />

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
        {error && (
          <p className="text-center font-medium text-xl px-5 drop-shadow-lg">
            Uh oh! Couldn't create flashcards about "{searchTerm}". Maybe try a
            different topic?
          </p>
        )}

        {}
        {questions?.length > 0 && !isLoading && <GoUpButton />}
      </div>
    </>
  );
};

export default FlashCardQuiz;
