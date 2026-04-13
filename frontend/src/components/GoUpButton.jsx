const GoUpButton = () => {
  return (
    <div className="pt-8 pb-12 flex justify-center">
      <button
        className="cursor-pointer bg-white shadow-xl dark:bg-secondarydarkbg dark:border-2 dark:border-darkmodetext dark:hover:bg-darkmodetext dark:hover:text-darkbg text-cta hover:text-hovercta dark:text-darkmodetext p-2 px-4 rounded-lg transition-all  hover:scale-105"
        onClick={() => {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth",
          });
        }}
      >
        Go Back Up?
      </button>
    </div>
  );
};

export default GoUpButton;
