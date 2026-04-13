import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DarkModeProvider } from "./context/DarkModeContext.jsx";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { UserProvider } from "./context/UserContext.jsx";
import { NextCreditUpdateProvider } from "./context/NextCreditUpdateContext.jsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {}
    <DarkModeProvider>
      {}
      <QueryClientProvider client={queryClient}>
        {}
        <AuthProvider>
          {}
          <UserProvider>
            <NextCreditUpdateProvider>
              <Toaster />
              <App />
            </NextCreditUpdateProvider>
          </UserProvider>
        </AuthProvider>
      </QueryClientProvider>
    </DarkModeProvider>
  </StrictMode>,
);
