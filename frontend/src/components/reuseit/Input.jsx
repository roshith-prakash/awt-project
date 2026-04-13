import { cn } from "@/lib/utils";

const Input = ({
  value,
  placeholder,
  onChange,
  className = "",
  disabled,
  ...rest
}) => {
  return (
    <input
      type="text"
      disabled={disabled}
      className={cn(
        `dark:placeholder:text-grey/50 placeholder:text-darkbg/50 text-md border-darkbg/50 mt-3 min-h-8 w-full rounded-lg border-2 bg-transparent px-4 py-2 placeholder:text-sm focus:outline-none dark:border-white/50 ${className}`,
      )}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      {...rest}
    />
  );
};

export default Input;
