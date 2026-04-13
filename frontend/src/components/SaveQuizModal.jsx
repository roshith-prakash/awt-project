import { useState, useEffect } from "react";
import { axiosInstance } from "@/utils/axios";
import { useDBUser } from "@/context/UserContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Globe, Lock, AlertCircle } from "lucide-react";
import {
  PrimaryButton,
  SecondaryButton,
  Input,
  ErrorStatement,
} from "@/components";
import AlertModal from "./reuseit/AlertModal.jsx";
import { maxNumberOfQuizzes } from "@/constants/constants";

const SaveQuizModal = ({
  isOpen,
  onClose,
  questions,
  quizType,
  defaultTitle = "",
  sourceTitle = "",
}) => {
  const [quizTitle, setQuizTitle] = useState(defaultTitle);
  const [isPublic, setIsPublic] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [quizTitleError, setQuizTitleError] = useState(0);

  const { dbUser } = useDBUser();
  const navigate = useNavigate();

  const { data: quizCountData, refetch: refetchCount } = useQuery({
    queryKey: ["numberOfQuizzes"],
    queryFn: () =>
      axiosInstance.post("/user-quiz/get-number-of-quizzes", {
        userId: dbUser?.id,
      }),
    enabled: !!dbUser?.id && isOpen,
  });

  const quizCount = quizCountData?.data?.quizCount || 0;
  const isLimitReached = quizCount >= maxNumberOfQuizzes;

  useEffect(() => {
    if (isOpen) {
      setQuizTitle(defaultTitle);
      refetchCount();
    }
  }, [isOpen, defaultTitle, refetchCount]);

  const saveQuiz = async () => {
    setQuizTitleError(0);

    if (!quizTitle || quizTitle.trim().length === 0) {
      setQuizTitleError(1);
      return;
    } else if (quizTitle.length > 50) {
      setQuizTitleError(2);
      return;
    }

    if (isLimitReached) {
      toast.error("Maximum saved quiz limit reached.");
      return;
    }

    setIsDisabled(true);
    try {
      const finalQuizType =
        sourceTitle === "Fact Or Not" ? "Fact or Not" : quizType;

      await axiosInstance.post("/user-quiz/create-quiz", {
        name: quizTitle,
        userId: dbUser?.id,
        quizType: finalQuizType,
        isPublic: isPublic,
        questions: questions,
      });

      toast.success("Quiz saved successfully!");
      onClose();
      navigate("/quizzes");
    } catch (err) {
      if (err?.response?.status === 403) {
        toast.error("Maximum saved quiz limit reached.");
      } else {
        toast.error("Failed to save the quiz.");
      }
      console.error(err);
    } finally {
      setIsDisabled(false);
    }
  };

  return (
    <AlertModal onClose={onClose} isOpen={isOpen}>
      <div className="flex flex-col gap-y-4">
        <div>
          <h1 className="dark:text-white font-bold text-2xl mb-1">
            Save this quiz
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLimitReached ? (
              <span className="text-red-500 flex items-center gap-1 font-medium">
                <AlertCircle size={14} /> Limit reached: {quizCount}/
                {maxNumberOfQuizzes} quizzes
              </span>
            ) : (
              `Give your quiz a name to help you find it later (${quizCount}/${maxNumberOfQuizzes})`
            )}
          </p>
        </div>

        <div className="space-y-2">
          <Input
            value={quizTitle}
            onChange={(e) => {
              setQuizTitle(e.target.value);
              setQuizTitleError(0);
            }}
            placeholder="Add Quiz Title..."
            disabled={isLimitReached}
          />

          <div className="flex justify-between items-start">
            <div>
              <ErrorStatement
                isOpen={quizTitleError === 1}
                text="Please enter a quiz title."
              />

              <ErrorStatement
                isOpen={quizTitleError === 2}
                text="Title cannot exceed 50 characters."
              />
            </div>
            <p
              className={`text-xs ${quizTitle.length > 50 ? "text-red-500" : "text-gray-400"}`}
            >
              {quizTitle.length}/50
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => !isLimitReached && setIsPublic(true)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              isPublic
                ? "border-cta bg-cta/5 dark:bg-cta/20"
                : "border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10"
            } ${
              isLimitReached
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-3 mb-1">
              <Globe
                size={18}
                className={isPublic ? "text-cta" : "text-gray-400"}
              />
              <span
                className={`font-semibold ${isPublic ? "text-cta" : "dark:text-white"}`}
              >
                Public
              </span>
            </div>
            <p className="text-xs text-gray-500">Visible to everyone</p>
          </button>

          <button
            onClick={() => !isLimitReached && setIsPublic(false)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              !isPublic
                ? "border-cta bg-cta/5 dark:bg-cta/20"
                : "border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10"
            } ${
              isLimitReached
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-3 mb-1">
              <Lock
                size={18}
                className={!isPublic ? "text-cta" : "text-gray-400"}
              />
              <span
                className={`font-semibold ${!isPublic ? "text-cta" : "dark:text-white"}`}
              >
                Private
              </span>
            </div>
            <p className="text-xs text-gray-500">Only visible to you</p>
          </button>
        </div>

        {isLimitReached && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-red-500 mt-0.5" size={16} />
            <p className="text-sm text-red-700 dark:text-red-400">
              You've reached your limit of {maxNumberOfQuizzes} quizzes. Delete
              some existing quizzes to save new ones.
            </p>
          </div>
        )}

        <div className="flex gap-4 justify-end mt-2">
          <SecondaryButton onClick={onClose} text="Cancel" />
          <PrimaryButton
            onClick={saveQuiz}
            disabled={isDisabled || isLimitReached}
            text={isDisabled ? "Saving..." : "Save Quiz"}
          />
        </div>
      </div>
    </AlertModal>
  );
};

export default SaveQuizModal;
