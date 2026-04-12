import {
  Home,
  NotFound,
  FlashCardQuiz,
  MCQQuiz,
  FactOrNot,
  FAQ,
  Signup,
  Login,
  Onboarding,
  Signout,
  User,
  Profile,
  EditProfile,
  Notes,
  Note,
  Files,
  File,
  ForgotPassword,
  AuthAction,
  Quizzes,
  Quiz,
  QuizEditor,
} from "./pages";
import { useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { axiosInstance } from "./utils/axios";
import { SyncLoader } from "react-spinners";
import { Navbar, Footer } from "./components";
import { Toaster } from "react-hot-toast";
import { ContextValue, useDarkMode } from "./context/DarkModeContext";
import Protector from "./components/Protector";

function App() {
  const { isDarkMode } = useDarkMode() as ContextValue;

  // Check if server is active / keep server active
  const { data, isLoading } = useQuery({
    queryKey: ["check"],
    queryFn: () => {
      return axiosInstance.get("/");
    },
    refetchInterval: 60000,
    refetchIntervalInBackground: true,
    retry: 10,
  });

  return (
    <div
      className={`bg-whitebg dark:bg-darkbg font-body dark:text-darkmodetext dark:placeholder:text-darkmodetext`}
    >
      {/* Toaster for toasts */}
      <Toaster
        toastOptions={{
          style: {
            background: isDarkMode ? "#333" : "#fff",
            color: isDarkMode ? "#fff" : "#000",
          },
        }}
      />

      {/* If server isn't ready for use, show a loading indicator */}
      {isLoading && (
        <div className="min-h-screen w-full flex flex-col gap-y-10 justify-center items-center">
          <img
            src="https://res.cloudinary.com/do8rpl9l4/image/upload/v1724056376/sleep_hyhact.webp"
            className="w-52 pointer-events-none"
          />
          {/* Three dots loading indicator */}
          <SyncLoader
            color={"#9b0ced"}
            loading={isLoading}
            size={65}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
          {/* Typewriter effect to show 4 different texts. Gradient text */}
          <p className="text-center px-5 max-w-2xl lml-3 font-medium mb-10 text-xl">
            Quizzer might take a minute or two to load because the server's
            powered by broke dreams. Go grab a snack - you've got more resources
            than this server. We'll be here... eventually.
          </p>
        </div>
      )}

      {/* When server responds, allow the user to use the app */}
      {data?.data && (
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Home Page */}
                <Route path="/" element={<Home />} />

                {/* Auth Routes */}
                <Route path="/signup" element={<Signup />} />
                <Route path="/signin" element={<Login />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/signout" element={<Signout />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth-action" element={<AuthAction />} />

                {/* FAQ Page */}
                <Route path="/faq" element={<FAQ />} />

                {/* Protected routes - Logged In User required. */}

                <Route
                  path="/edit-profile"
                  element={
                    <Protector>
                      <EditProfile />
                    </Protector>
                  }
                />

                {/* View your profile */}
                <Route
                  path="/profile"
                  element={
                    <Protector>
                      <Profile />
                    </Protector>
                  }
                />

                {/* View a User's Profile (Non Current user) */}
                <Route
                  path="/user/:username"
                  element={
                    <Protector>
                      <User />
                    </Protector>
                  }
                />

                {/* ----------------------- NOTES ------------------------- */}

                {/* View all your notes */}
                <Route
                  path="/notes"
                  element={
                    <Protector>
                      <Notes />
                    </Protector>
                  }
                />

                {/* Displays a note (Allows to edit if you're the note owner) */}
                <Route
                  path="/notes/:noteId"
                  element={
                    <Protector>
                      <Note />
                    </Protector>
                  }
                />

                {/* ----------------------- FILES ------------------------- */}

                {/* View all your files */}
                <Route
                  path="/files"
                  element={
                    <Protector>
                      <Files />
                    </Protector>
                  }
                />

                {/* Displays a file */}
                <Route
                  path="/files/:fileId"
                  element={
                    <Protector>
                      <File />
                    </Protector>
                  }
                />

                {/* ----------------------- QUIZ ------------------------- */}

                {/* FlashCard Quiz Page */}
                <Route
                  path="/flashcard"
                  element={
                    <Protector>
                      <FlashCardQuiz />
                    </Protector>
                  }
                />

                {/* MCQ Quiz Page */}
                <Route
                  path="/mcq"
                  element={
                    <Protector>
                      <MCQQuiz />
                    </Protector>
                  }
                />

                {/* Fact or Not Page */}
                <Route
                  path="/fact-or-not"
                  element={
                    <Protector>
                      <FactOrNot />
                    </Protector>
                  }
                />

                {/* View all your Quizzes */}
                <Route
                  path="/quizzes"
                  element={
                    <Protector>
                      <Quizzes />
                    </Protector>
                  }
                />

                {/* Displays a quiz */}
                <Route
                  path="/quizzes/:quizId"
                  element={
                    <Protector>
                      <Quiz />
                    </Protector>
                  }
                />
 
                {/* Create a new quiz */}
                <Route
                  path="/quizzes/create"
                  element={
                    <Protector>
                      <QuizEditor />
                    </Protector>
                  }
                />
 
                {/* Edit an existing quiz */}
                <Route
                  path="/quizzes/edit/:quizId"
                  element={
                    <Protector>
                      <QuizEditor />
                    </Protector>
                  }
                />

                {/* Multiplayer quiz */}
                {/* <Route path="/multiplayer" element={<SocketPage />} /> */}

                {/* 404 error page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      )}
    </div>
  );
}

export default App;
