import { useState } from "react";
import { FaArrowsRotate } from "react-icons/fa6";

const FlashCard = ({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) => {
  // State to check whether the card was flipped to view the answer.
  const [flipped, setFlipped] = useState(false);

  return (
    // Main container
    <div className="relative font-body h-80 w-80 rounded-xl">
      {/* The rotate icon on the top right of the card. */}
      <FaArrowsRotate
        onClick={() => setFlipped((prev) => !prev)}
        className="absolute text-cta dark:text-darkmodeCTA z-10 top-5 right-5 cursor-pointer"
      />

      <div className="absolute text-xl text-cta dark:text-darkmodeCTA z-10 font-semibold  top-3.5 left-5">
        {flipped ? "A." : "Q."}
      </div>

      {/* The Flip Card which can be rotated. */}
      <div
        onClick={() => setFlipped((prev) => !prev)}
        className={`relative z-1 bg-white dark:bg-white/5 h-80 w-80 shadow-lg rounded-xl cursor-pointer transition-all duration-300 [transform-style:preserve-3d] ${
          flipped && "[transform:rotateY(180deg)]"
        } `}
      >
        {/* The Front face of the card - displays the question. */}
        <div className="absolute top-0 h-full w-full p-5 text-center flex justify-center items-center">
          {!flipped && <p className="text-xl">{question}</p>}
        </div>

        {/* The Back face of the card - displays the answer. */}
        <div className="absolute top-0 h-full w-full p-5 text-center flex justify-center items-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
          {flipped && <p className="font-medium text-xl">{answer}</p>}
        </div>
      </div>
    </div>
  );
};

export default FlashCard;
