import { useContext, useState, useEffect, createContext } from "react";
import { axiosInstance } from "@/utils/axios";
import { useQuery } from "@tanstack/react-query";

const NextCreditUpdateContext = createContext(null);

export function useNextCreditUpdate() {
  const context = useContext(NextCreditUpdateContext);
  if (!context) {
    throw new Error(
      "useNextCreditUpdate must be used within a NextCreditUpdateProvider",
    );
  }
  return context;
}

export function NextCreditUpdateProvider({ children }) {
  const [nextCreditUpdate, setNextCreditUpdate] = useState(null);

  const { data } = useQuery({
    queryKey: ["credit-update"],
    queryFn: () => {
      return axiosInstance.get("/update-limit");
    },
    staleTime: Infinity,
    retry: 10,
  });

  useEffect(() => {
    if (data?.data?.data) {
      setNextCreditUpdate(data?.data?.nextUpdate);
    } else {
      setNextCreditUpdate(null);
    }
  }, [data]);

  const value = {
    nextCreditUpdate,
    setNextCreditUpdate,
  };

  return (
    <NextCreditUpdateContext.Provider value={value}>
      {children}
    </NextCreditUpdateContext.Provider>
  );
}
