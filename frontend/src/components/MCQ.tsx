import { useEffect, useState } from "react";
import { SiTicktick } from "react-icons/si";
import { ImCross } from "react-icons/im";

const MCQ = ({
  question,
  answer,
  options,
  setCount,
  reason,
  showAnswer = true,
  allowReSelection = false,
}: {
  question: string;
  answer: string;
  options: string[];
  setCount: React.Dispatch<React.SetStateAction<number>>;
  reason?: string;
  showAnswer?: boolean;
  allowReSelection?: boolean;
}) => {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!allowReSelection && selected == String(answer)) {
      setCount((prev: number) => prev + 1);
    }
  }, [selected, answer, allowReSelection, setCount]);

  return (
    <div className="font-body max-w-[95%] md:max-w-3xl w-full  p-4 shadow-xl rounded-lg bg-white dark:bg-white/5">
      {/* Display the question */}
      <p className="font-medium text-lg">
        <span className="font-bold">Q . </span>
        {question}
      </p>

      {/* Display the options */}
      <div className="flex flex-col gap-y-3 mt-5">
        {/* Map the options */}
        {options?.map((option: string, index: number) => {
          return (
            <button
              key={option}
              disabled={!allowReSelection && selected != null}
              onClick={() => {
                setSelected(String(option));
              }}
              // Highlight the option selected by CTA background
              // Highlight the correct answer by green background
              // Highlight the incorrect answer by red background
              className={`cursor-pointer tracking-wide w-full px-4 border-2 ${
                !selected && "dark:border-darkmodetext/40"
              } p-2 gap-3 flex items-center rounded text-left transition-all
                ${selected == option && "border-cta dark:text-white"} 
                ${
                  showAnswer &&
                  selected &&
                  (answer == option
                    ? "bg-green-200/90 dark:bg-green-500/30  dark:text-white"
                    : "bg-red-200/90 dark:bg-red-500/20  dark:text-white")
                }
                ${
                  showAnswer &&
                  selected &&
                  selected != option &&
                  (answer == option
                    ? "border-green-200/90 dark:border-green-500/50"
                    : "border-red-200/90 dark:border-red-500/20")
                }`}
            >
              <p>
                {/* When an option isn't selected, display index for options */}
                {/* When option is selected, display tick for correct answer / cross for incorrect answer */}
                {!selected ? (
                  index + 1 + "."
                ) : showAnswer && answer == option ? (
                  <SiTicktick className="text-green-500" />
                ) : (
                  showAnswer && <ImCross className="text-red-500" />
                )}
                {!showAnswer && selected && index + 1 + "."}
              </p>
              {/* Display option text */}
              <p>{String(option)}</p>
            </button>
          );
        })}
      </div>

      {reason && selected && <p className="mt-4 px-1">{reason}</p>}
    </div>
  );
};

export default MCQ;
