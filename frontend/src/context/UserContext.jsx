import { useContext, useState, useEffect, createContext } from "react";
import { useAuth } from "./AuthContext.jsx";
import { axiosInstance } from "../utils/axiosInstance.js";
import { useQuery } from "@tanstack/react-query";

const UserContext = createContext(null);

export function useDBUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useDBUser must be used within a UserProvider");
  }
  return context;
}

export function UserProvider({ children }) {
  const [dbUser, setDbUser] = useState(null);
  const { currentUser } = useAuth();

  const { data, refetch: fetchUser } = useQuery({
    queryKey: ["dbUser", currentUser],
    queryFn: async () => {
      return axiosInstance.post("/user/get-current-user", {
        user: currentUser,
      });
    },
    refetchInterval: 300 * 1000,
    enabled: !!currentUser,
  });

  useEffect(() => {
    if (data?.data?.user) {
      setDbUser(data?.data?.user);
    } else {
      setDbUser(null);
    }
  }, [currentUser?.email, data]);

  const value = {
    dbUser,
    setDbUser,
    fetchUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
