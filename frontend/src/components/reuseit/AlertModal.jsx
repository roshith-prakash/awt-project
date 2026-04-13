import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const AlertModal = ({ isOpen, onClose, children, className }) => {
  const [isClosing, setIsClosing] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      setIsClosing(false);
    } else if (isMounted) {
      setIsClosing(true);
      setTimeout(() => {
        setIsMounted(false);
        setIsClosing(false);
        onClose();
      }, 300);
    }
  }, [isOpen, isMounted, onClose]);

  if (!isMounted) return null;

  return (
    <div
      className={`bg-darkbg/80 fixed inset-0 z-50 flex items-center justify-center transition-opacity ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className={cn(
          `dark:bg-secondarydarkbg scroller ${
            isClosing ? "animate-fadeOut" : "animate-fadeIn"
          } relative max-h-[90%] w-auto max-w-[95%] min-w-xs overflow-y-auto rounded-xl bg-white p-6 shadow-xl md:min-w-sm dark:border-3 dark:border-white/25 ${
            className
          }`,
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default AlertModal;
