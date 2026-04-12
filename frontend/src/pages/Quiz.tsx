import {
  ErrorStatement,
  FlashCard,
  Input,
  MCQ,
  PrimaryButton,
  SecondaryButton,
} from "@/components";
import AlertModal from "@/components/reuseit/AlertModal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDBUser } from "@/context/UserContext";
import { axiosInstance } from "@/utils/axios";
import { PopoverClose } from "@radix-ui/react-popover";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaEye, FaTrash } from "react-icons/fa6";
import { useNavigate, useParams } from "react-router-dom";
import { SyncLoader } from "react-spinners";

const Quiz = () => {
  const [correctCount, setCorrectCount] = useState(0);
  const { dbUser } = useDBUser();
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quizTitle, setQuizTitle] = useState<string>("");
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [quizTitleError, setQuizTitleError] = useState<number>(0);

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["quiz", quizId, dbUser?.id],
    queryFn: () => {
      return axiosInstance.post("/user-quiz/get-quiz-by-id", {
        userId: dbUser?.id,
        quizId,
      });
    },
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (data?.data?.quiz?.questions) {
      setCorrectCount(0);
    }
  }, [data?.data]);

  // Delete the quiz
  const deleteQuiz = () => {
    setIsDisabled(true);
    axiosInstance
      ?.post("/user-quiz/delete-quiz", { quizId: quizId, userId: dbUser?.id })
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: ["quizzes", dbUser?.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["numberOfQuizzes", dbUser?.id],
        });
        navigate("/quizzes");
        setIsDisabled(false);
        toast("Deleted quiz.", { position: "bottom-right" });
        setIsDeleteModalOpen(false);
      })
      .catch((err) => {
        toast.error("Could not delete quiz.", { position: "bottom-right" });
        setIsDisabled(false);
        console.log(err);
      });
  };

  // Rename the quiz
  const renameQuiz = () => {
    setQuizTitleError(0);

    if (quizTitle == null || quizTitle == undefined || quizTitle.length <= 0) {
      setQuizTitleError(1);
      return;
    } else if (quizTitle?.length > 50) {
      setQuizTitleError(2);
      return;
    }

    setQuizTitleError(0);

    axiosInstance
      ?.post("/user-quiz/rename-quiz", {
        quizId: quizId,
        userId: dbUser?.id,
        name: quizTitle,
      })
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: ["quiz", quizId],
        });

        queryClient.invalidateQueries({
          queryKey: ["quizzes", dbUser?.id],
        });
        setIsDisabled(false);
        toast("Renamed quiz.", { position: "bottom-right" });
        setIsRenameModalOpen(false);
      })
      .catch((err) => {
        toast.error("Could not rename quiz.", { position: "bottom-right" });
        setIsDisabled(false);
        console.log(err);
      });
  };

  return (
    <div>
      {/* Delete Note Modal */}
      <AlertModal
        onClose={() => {
          setIsDeleteModalOpen(false);
        }}
        isOpen={isDeleteModalOpen}
      >
        <div className="flex flex-col gap-y-2">
          {/* Title */}
          <h1 className="dark:text-darkmodetext font-bold text-2xl">
            Are you sure you want to delete this quiz?
          </h1>

          {/* Subtitle */}
          <h2 className="dark:text-darkmodetext mt-1 text-base text-darkbg/80">
            This action cannot be reversed.
          </h2>

          {/* Buttons */}
          <div className="mt-5 flex gap-x-5 justify-end">
            <PrimaryButton
              disabled={isDisabled}
              disabledText="Please Wait..."
              className="text-sm bg-red-500 border-red-500 hover:bg-red-600 hover:border-red-600 dark:bg-red-500 dark:border-red-500 dark:hover:bg-red-600 dark:hover:border-red-600"
              onClick={deleteQuiz}
              text="Delete"
            />
            <SecondaryButton
              disabled={isDisabled}
              disabledText="Please Wait..."
              className="text-sm text-black border-black hover:bg-black hover:border-black"
              onClick={() => setIsDeleteModalOpen(false)}
              text="Cancel"
            />
          </div>
        </div>
      </AlertModal>

      {/* Rename Note Modal */}
      <AlertModal
        onClose={() => {
          setIsRenameModalOpen(false);
        }}
        isOpen={isRenameModalOpen}
      >
        <div className="flex flex-col gap-y-2">
          {/* Title */}
          <h1 className="dark:text-darkmodetext font-bold text-2xl">
            Rename this quiz
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Give your quiz a new name to help you find it later.
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
                setQuizTitleError(0);
              }
            }}
            onBlur={(e) => {
              if (
                e.target.value == null ||
                e.target.value == undefined ||
                e.target.value.length <= 0
              ) {
                setQuizTitleError(1);
                return;
              } else if (e.target.value?.length > 50) {
                setQuizTitleError(2);
                return;
              }
            }}
            placeholder="Add Note Title..."
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

          {/* Buttons */}
          <div className="mt-5 flex gap-x-5 justify-end">
            <PrimaryButton
              disabled={isDisabled}
              disabledText="Please Wait..."
              className="text-sm"
              onClick={renameQuiz}
              text="Rename"
            />
            <SecondaryButton
              disabled={isDisabled}
              disabledText="Please Wait..."
              className="text-sm text-black border-black hover:bg-black hover:border-black"
              onClick={() => setIsRenameModalOpen(false)}
              text="Cancel"
            />
          </div>
        </div>
      </AlertModal>

      {data?.data && (
        <div className="max-w-[95%] mx-auto flex flex-col">
          {/* Title */}
          <div className="relative w-full mb-10 md:max-w-5xl mx-auto mt-10 px-4 py-6 bg-white dark:bg-white/5 rounded-xl shadow-sm">
            <p className="text-3xl pr-12 font-semibold">
              {data?.data?.quiz?.name}
            </p>
            {/* Delete + Privacy Popover */}
            <div className="absolute top-5 right-5">
              <Popover>
                <PopoverTrigger className="flex items-center cursor-pointer">
                  <BsThreeDotsVertical className="text-2xl" />
                </PopoverTrigger>

                <PopoverContent className="dark:bg-darkgrey dark:border-2 w-auto mt-2 mr-4 py-0 px-1">
                  <div className="py-1 min-w-32 flex flex-col gap-y-1">
                    <PopoverClose>
                      <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="cursor-pointer w-full flex items-center gap-x-3 justify-center hover:text-red-500 dark:hover:text-red-400 hover:bg-grey/50 dark:hover:bg-grey/5 py-1.5 transition-all"
                      >
                        <FaTrash />
                        <span className="-translate-x-1">Delete</span>
                      </button>
                    </PopoverClose>
                    <PopoverClose>
                      <button
                        onClick={() => {
                          setQuizTitle(data?.data?.quiz?.name);
                          setIsRenameModalOpen(true);
                        }}
                        className="cursor-pointer hover:text-cta dark:hover:text-darkmodeCTA w-full flex items-center gap-x-2 justify-center hover:bg-grey/50 dark:hover:bg-grey/5 py-1.5 transition-all"
                      >
                        <FaEye />
                        Rename
                      </button>
                    </PopoverClose>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-wrap gap-5 justify-center py-10">
            {/* If quiz is of MCQ type */}
            {data?.data?.quiz?.questions?.length > 0 &&
              data?.data?.quiz?.quizType == "MCQ" &&
              data?.data?.quiz?.questions?.map(
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
                      options={item?.options}
                      reason={item?.reason}
                      setCount={setCorrectCount}
                    />
                  );
                }
              )}

            {/* If quiz is of flashcard type */}
            {data?.data?.quiz?.questions?.length > 0 &&
              data?.data?.quiz?.quizType == "Flashcard" &&
              data?.data?.quiz?.questions?.map(
                (item: { question: string; answer: string }) => {
                  return (
                    <FlashCard
                      key={item?.question}
                      question={item?.question}
                      answer={item?.answer}
                    />
                  );
                }
              )}
          </div>

          {/* Show Score */}
          {data?.data?.quiz?.questions?.length > 0 &&
            data?.data?.quiz?.quizType == "MCQ" && (
              <div className="flex justify-center">
                <p className="font-medium bg-white dark:bg-darkbg dark:border-2 dark:border-white w-[95%] rounded-xl text-center border-2 p-5 text-lg md:text-2xl flex justify-center items-center gap-x-5">
                  {correctCount == data?.data?.quiz?.questions?.length && (
                    <img
                      src={
                        "https://res.cloudinary.com/do8rpl9l4/image/upload/v1736427375/confetti_fmluma.gif"
                      }
                      className="w-10  [transform:rotateY(180deg)]"
                    />
                  )}
                  Your Score : <span>{correctCount}</span> /{" "}
                  {data?.data?.quiz?.questions?.length}
                  {correctCount == data?.data?.quiz?.questions?.length && (
                    <img
                      src={
                        "https://res.cloudinary.com/do8rpl9l4/image/upload/v1736427375/confetti_fmluma.gif"
                      }
                      className="w-10"
                    />
                  )}
                  {/* */}
                </p>
              </div>
            )}
        </div>
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
        <p className="text-center mt-14 font-medium text-xl px-5 drop-shadow-lg">
          Could not fetch quiz details. Please try again later.
        </p>
      )}
    </div>
  );
};

export default Quiz;
