import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { axiosInstance } from "@/utils/axios";
import { useDBUser } from "@/context/UserContext";
import { PrimaryButton, Input } from "@/components";
import { Trash2, Plus, Globe, Lock, ChevronLeft, Save } from "lucide-react";
import { SyncLoader } from "react-spinners";

import { maxQuestionsPerQuiz } from "@/constants/constants";

const QuizEditor = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { dbUser } = useDBUser();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [quizType, setQuizType] = useState("MCQ");
  const [isPublic, setIsPublic] = useState(false);
  const [questions, setQuestions] = useState([
    { question: "", answer: "", options: ["", "", "", ""], reason: "" },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isEditMode = !!quizId;

  const { data: quizData, isLoading: isFetching } = useQuery({
    queryKey: ["quiz-edit", quizId],
    queryFn: () =>
      axiosInstance.post("/user-quiz/get-quiz-by-id", {
        quizId,
        userId: dbUser?.id,
      }),
    enabled: isEditMode && !!dbUser?.id,
  });

  useEffect(() => {
    if (quizData?.data?.quiz) {
      const { name, quizType, questions, isPublic } = quizData.data.quiz;
      setName(name);
      setQuizType(quizType);
      setQuestions(questions);
      setIsPublic(isPublic);
    }
  }, [quizData]);

  useEffect(() => {
    if (isEditMode) return;

    setQuestions((prev) =>
      prev.map((q) => {
        if (quizType === "MCQ") {
          return {
            ...q,
            options:
              q.options && q.options.length === 4
                ? q.options
                : ["", "", "", ""],
          };
        } else if (quizType === "Fact or Not") {
          return {
            ...q,
            answer:
              q.answer === "True" || q.answer === "False" ? q.answer : "True",
            options: ["True", "False"],
          };
        } else {
          return { ...q, options: undefined };
        }
      }),
    );
  }, [quizType, isEditMode]);

  const addQuestion = () => {
    if (questions.length >= maxQuestionsPerQuiz) {
      toast.error(`Maximum limit of ${maxQuestionsPerQuiz} questions reached.`);
      return;
    }
    const newQuestion =
      quizType === "MCQ"
        ? { question: "", answer: "", options: ["", "", "", ""], reason: "" }
        : quizType === "Fact or Not"
          ? {
              question: "",
              answer: "True",
              options: ["True", "False"],
              reason: "",
            }
          : { question: "", answer: "" };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options[optionIndex] = value;
      setQuestions(updatedQuestions);
    }
  };

  const validateQuiz = () => {
    if (!name.trim()) {
      toast.error("Please enter a quiz name.");
      return false;
    }
    if (questions.some((q) => !q.question.trim() || !q.answer.trim())) {
      toast.error("All questions and answers must be filled.");
      return false;
    }
    if (
      quizType === "MCQ" &&
      questions.some((q) => q.options?.some((opt) => !opt.trim()))
    ) {
      toast.error("All options must be filled for MCQ quizzes.");
      return false;
    }
    return true;
  };

  const saveQuiz = async () => {
    if (!validateQuiz()) return;

    setIsSaving(true);
    try {
      if (isEditMode) {
        await axiosInstance.post("/user-quiz/update-quiz", {
          quizId,
          name,
          userId: dbUser?.id,
          quizType,
          questions,
          isPublic,
        });
        toast.success("Quiz updated!");
      } else {
        await axiosInstance.post("/user-quiz/create-quiz", {
          name,
          userId: dbUser?.id,
          quizType,
          questions,
          isPublic,
        });
        toast.success("Quiz created!");
      }
      queryClient.invalidateQueries({ queryKey: ["quizzes", dbUser?.id] });
      navigate("/quizzes");
    } catch (err) {
      toast.error(err.response?.data?.data || "Failed to save quiz.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <SyncLoader color="#9b0ced" size={20} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-4 md:px-10 py-10">
      <div className="max-w-4xl mx-auto">
        {}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-cta transition-colors"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <div className="flex gap-4">
            <PrimaryButton
              onClick={saveQuiz}
              disabled={isSaving}
              text={
                <div className="flex items-center gap-2">
                  <Save size={18} />
                  {isSaving ? "Saving..." : "Save Quiz"}
                </div>
              }
            />
          </div>
        </div>

        {}
        <div className="bg-white dark:bg-white/5 rounded-2xl shadow-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-gray-500">
                Quiz Name
              </label>
              <Input
                placeholder="Enter quiz name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-gray-500">
                Quiz Type
              </label>
              <select
                disabled={isEditMode}
                value={quizType}
                onChange={(e) => setQuizType(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent outline-none focus:border-cta transition-all"
              >
                <option value="MCQ">Multiple Choice (MCQ)</option>
                <option value="Flashcard">Flashcards</option>
                <option value="Fact or Not">Fact or Not (T/F)</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-6">
            <label className="block text-sm font-medium uppercase tracking-wider text-gray-500">
              Privacy
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setIsPublic(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                  !isPublic
                    ? "border-cta bg-cta/10 text-cta"
                    : "border-gray-200 dark:border-white/10 text-gray-500"
                }`}
              >
                <Lock size={16} /> Private
              </button>
              <button
                onClick={() => setIsPublic(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                  isPublic
                    ? "border-cta bg-cta/10 text-cta"
                    : "border-gray-200 dark:border-white/10 text-gray-500"
                }`}
              >
                <Globe size={16} /> Public
              </button>
            </div>
          </div>
        </div>

        {}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-title">Questions</h2>
            <button
              onClick={addQuestion}
              disabled={questions.length >= maxQuestionsPerQuiz}
              className={`flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg transition-all ${
                questions.length >= maxQuestionsPerQuiz
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:shadow-lg"
              }`}
            >
              <Plus size={18} /> Add Question
            </button>
          </div>

          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="bg-white dark:bg-white/5 rounded-2xl shadow-lg p-6 relative group border border-transparent hover:border-cta/20 transition-all"
            >
              <button
                onClick={() => removeQuestion(qIndex)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove Question"
              >
                <Trash2 size={20} />
              </button>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Question {qIndex + 1}
                </label>
                <textarea
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent outline-none focus:border-cta transition-all resize-none h-20"
                  placeholder="Enter your question here..."
                  value={q.question}
                  onChange={(e) =>
                    handleQuestionChange(qIndex, "question", e.target.value)
                  }
                />
              </div>

              {quizType === "MCQ" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {q.options?.map((opt, oIndex) => (
                    <div key={oIndex} className="relative">
                      <input
                        type="text"
                        className={`w-full p-2.5 pl-10 rounded-lg border ${
                          q.answer === opt
                            ? "border-green-500 bg-green-50/50 dark:bg-green-500/10"
                            : "border-gray-200 dark:border-white/10 bg-transparent"
                        } outline-none focus:border-cta transition-all`}
                        placeholder={`Option ${oIndex + 1}`}
                        value={opt}
                        onChange={(e) =>
                          handleOptionChange(qIndex, oIndex, e.target.value)
                        }
                      />

                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={q.answer === opt && opt !== ""}
                        onChange={() =>
                          handleQuestionChange(qIndex, "answer", opt)
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 accent-green-500 cursor-pointer"
                        title="Mark as correct"
                      />
                    </div>
                  ))}
                </div>
              )}

              {quizType === "Flashcard" && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                    Answer
                  </label>
                  <textarea
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent outline-none focus:border-cta transition-all resize-none h-20"
                    placeholder="Enter the answer..."
                    value={q.answer}
                    onChange={(e) =>
                      handleQuestionChange(qIndex, "answer", e.target.value)
                    }
                  />
                </div>
              )}

              {quizType === "Fact or Not" && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                    Correct Answer
                  </label>
                  <div className="flex gap-4">
                    {["True", "False"].map((val) => (
                      <button
                        key={val}
                        onClick={() => {
                          const updated = [...questions];
                          updated[qIndex] = {
                            ...updated[qIndex],
                            answer: val,
                            options: ["True", "False"],
                          };
                          setQuestions(updated);
                        }}
                        className={`flex-1 py-2 rounded-lg border-2 transition-all ${
                          q.answer === val
                            ? "border-green-500 bg-green-50/50 text-green-700 dark:text-green-400"
                            : "border-gray-200 dark:border-white/10 text-gray-500"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {quizType !== "Flashcard" && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                    Explanation (Optional)
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent outline-none focus:border-cta transition-all"
                    placeholder="Explain why this is correct..."
                    value={q.reason || ""}
                    onChange={(e) =>
                      handleQuestionChange(qIndex, "reason", e.target.value)
                    }
                  />
                </div>
              )}
            </div>
          ))}

          <button
            onClick={addQuestion}
            disabled={questions.length >= maxQuestionsPerQuiz}
            className={`w-full py-6 border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center gap-2 ${
              questions.length >= maxQuestionsPerQuiz
                ? "border-gray-200 dark:border-white/5 text-gray-300 cursor-not-allowed"
                : "border-gray-300 dark:border-white/10 text-gray-400 hover:text-cta hover:border-cta hover:bg-cta/5"
            }`}
          >
            <Plus size={32} />
            <span className="font-semibold">
              {questions.length >= maxQuestionsPerQuiz
                ? "Question Limit Reached"
                : "Add Another Question"}
            </span>
          </button>
          {questions.length >= maxQuestionsPerQuiz && (
            <p className="text-center text-sm text-red-400 mt-2">
              You have reached the maximum limit of {maxQuestionsPerQuiz}{" "}
              questions per quiz.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizEditor;
