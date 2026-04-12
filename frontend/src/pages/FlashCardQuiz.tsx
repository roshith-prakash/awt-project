import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../utils/axios";
import { FlashCard } from "@/components";
import { SyncLoader } from "react-spinners";
import { GoUpButton, InputBox } from "../components";
import { ContextValue, useDarkMode } from "../context/DarkModeContext";
import { useDBUser } from "@/context/UserContext";
import toast from "react-hot-toast";

const FlashCardQuiz = () => {
  const { isDarkMode } = useDarkMode() as ContextValue;

  // The topic for which flashcards need to be created
  const [searchTerm, setSearchTerm] = useState("");
  // The difficulty for the questions
  const [difficulty, setDifficulty] = useState("easy");
  // The questions array that is mapped for the flashcards
  const [questions, setQuestions] = useState([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [note, setNote] = useState<any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [file, setFile] = useState<any>();

  // Error state
  const [inputError, setInputError] = useState(0);

  const { dbUser, fetchUser } = useDBUser();

  // Fetch Questions from the API
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

  // Set questions only if new ones are fetched - stops blank screen when parameters are changed
  useEffect(() => {
    if (data?.data?.questions?.length > 0) {
      setQuestions(data?.data?.questions);
      fetchUser();
      //@ts-expect-error Axios error
    } else if (error?.response?.status === 403) {
      toast.error("Insufficient credits to generate flashcards.");
    } //@ts-expect-error Axios error
    else if (error?.response?.status === 503) {
      toast.error("Facing issues with Quizzer's AI. Please try later.");
    }
  }, [data?.data, error, fetchUser]);

  //   Scroll to top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, []);

  // Title
  useEffect(() => {
    document.title = `FlashCards | Quizzer AI`;
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

  console.log(error);

  return (
    <>
      <div
        className={`${
          isDarkMode ? "bg-animatedWaveDark" : "bg-animatedWave"
        } bg-no-repeat bg-cover font-body min-h-screen`}
      >
        {/* Input for parameters */}
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

        {/* Mapping flashcards */}
        {!isLoading && questions?.length > 0 && (
          <>
            <p className="text-center mt-10  px-2">
              Note : Questions & answers are created using AI and may be
              incorrect.
            </p>
            <div className="flex flex-wrap justify-evenly gap-6 py-10 px-5">
              {questions?.length > 0 &&
                questions?.map((item: { question: string; answer: string }) => {
                  return (
                    <FlashCard
                      key={item?.question}
                      question={item?.question}
                      answer={item?.answer}
                    />
                  );
                })}
            </div>
          </>
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

        {/* Error statement */}
        {error && (
          <p className="text-center font-medium text-xl px-5 drop-shadow-lg">
            Uh oh! Couldn't create flashcards about "{searchTerm}". Maybe try a
            different topic?
          </p>
        )}

        {/* Button to go back to top */}
        {questions?.length > 0 && !isLoading && (
          // Button to go back to the input Div
          <GoUpButton />
        )}
      </div>
    </>
  );
};

export default FlashCardQuiz;
