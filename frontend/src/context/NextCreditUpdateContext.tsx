import {
  useContext,
  useState,
  useEffect,
  createContext,
  ReactNode,
} from "react";
import { axiosInstance } from "@/utils/axios";
import { useQuery } from "@tanstack/react-query";

// Define Limit Type
type NextCreditUpdateType = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Allow additional properties
};

// Define Context Type
type NextCreditUpdateContextType = {
  nextCreditUpdate: NextCreditUpdateType | null;
  setNextCreditUpdate: React.Dispatch<
    React.SetStateAction<NextCreditUpdateType | null>
  >;
};

// Creating Context with a default null value
const NextCreditUpdateContext =
  createContext<NextCreditUpdateContextType | null>(null);

// Hook to consume the context
// eslint-disable-next-line react-refresh/only-export-components
export function useNextCreditUpdate() {
  const context = useContext(NextCreditUpdateContext);
  if (!context) {
    throw new Error(
      "useNextCreditUpdate must be used within a NextCreditUpdateProvider"
    );
  }
  return context;
}

// Limit Update Provider Component
export function NextCreditUpdateProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [nextCreditUpdate, setNextCreditUpdate] =
    useState<NextCreditUpdateType | null>(null);

  // Limit update
  // Update the daily limit if not updated
  const { data } = useQuery({
    queryKey: ["credit-update"],
    queryFn: () => {
      return axiosInstance.get("/update-limit");
    },
    staleTime: Infinity,
    retry: 10,
  });

  // Set the state value
  useEffect(() => {
    if (data?.data?.data) {
      setNextCreditUpdate(data?.data?.nextUpdate);
    } else {
      setNextCreditUpdate(null);
    }
  }, [data]);

  // Value object to be passed in context
  const value: NextCreditUpdateContextType = {
    nextCreditUpdate,
    setNextCreditUpdate,
  };

  return (
    // Context Provider
    <NextCreditUpdateContext.Provider value={value}>
      {children}
    </NextCreditUpdateContext.Provider>
  );
}
