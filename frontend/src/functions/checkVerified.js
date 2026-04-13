import { useAuth } from "@/context/AuthContext";

export const checkVerified = () => {
  const { currentUser } = useAuth();
  return currentUser ? currentUser.emailVerified : null;
};
