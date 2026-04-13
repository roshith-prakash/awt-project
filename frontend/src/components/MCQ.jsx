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
}) => {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!allowReSelection && selected == String(answer)) {
      setCount((prev) => prev + 1);
    }
  }, [selected, answer, allowReSelection, setCount]);

  return (
    <div className="font-body max-w-[95%] md:max-w-3xl w-full  p-4 shadow-xl rounded-lg bg-white dark:bg-white/5">
      <p className="font-medium text-lg">
        <span className="font-bold">Q . </span>
        {question}
      </p>

      <div className="flex flex-col gap-y-3 mt-5">
        {options?.map((option, index) => {
          return (
            <button
              key={option}
              disabled={!allowReSelection && selected != null}
              onClick={() => {
                setSelected(String(option));
              }}
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
                {!selected ? (
                  index + 1 + "."
                ) : showAnswer && answer == option ? (
                  <SiTicktick className="text-green-500" />
                ) : (
                  showAnswer && <ImCross className="text-red-500" />
                )}
                {!showAnswer && selected && index + 1 + "."}
              </p>

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
