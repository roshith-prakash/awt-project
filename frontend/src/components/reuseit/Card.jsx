const Card = ({ children, style, className, onClick }) => {
  return (
    <div
      className={`dark:bg-secondarydarkbg border-1 overflow-hidden rounded-xl bg-white shadow-lg  ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
