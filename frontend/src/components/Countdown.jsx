import { useState, useEffect } from "react";

const Countdown = ({ targetDate }) => {
  const calculateTimeLeft = () => {
    const now = new Date();
    const difference = new Date(targetDate).getTime() - now.getTime();

    if (difference <= 0) {
      return {
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    return {
      hours,
      minutes,
      seconds,
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      const updatedTimeLeft = calculateTimeLeft();
      if (updatedTimeLeft) {
        setTimeLeft(updatedTimeLeft);
      } else {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <>
      {timeLeft && (
        <div className="flex flex-col items-center p-4">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl md:text-6xl font-semibold">
                {timeLeft.hours}
              </p>
              <p className="text-sm md:text-lg">Hours</p>
            </div>
            <div>
              <p className="text-4xl md:text-6xl font-semibold">
                {timeLeft.minutes}
              </p>
              <p className="text-sm md:text-lg">Minutes</p>
            </div>
            <div>
              <p className="text-4xl md:text-6xl font-semibold">
                {timeLeft.seconds}
              </p>
              <p className="text-sm md:text-lg">Seconds</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Countdown;
