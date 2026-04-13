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
import { axiosInstance } from "./utils/axios.js";
import { SyncLoader } from "react-spinners";
import { Navbar, Footer } from "./components";
import { Toaster } from "react-hot-toast";
import { useDarkMode } from "./context/DarkModeContext.jsx";
import Protector from "./components/Protector.jsx";

function App() {
  const { isDarkMode } = useDarkMode();

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
      <Toaster
        toastOptions={{
          style: {
            background: isDarkMode ? "#333" : "#fff",
            color: isDarkMode ? "#fff" : "#000",
          },
        }}
      />

      {isLoading && (
        <div className="min-h-screen w-full flex flex-col gap-y-10 justify-center items-center">
          <img
            src="https://res.cloudinary.com/do8rpl9l4/image/upload/v1724056376/sleep_hyhact.webp"
            className="w-52 pointer-events-none"
          />

          <SyncLoader
            color={"#9b0ced"}
            loading={isLoading}
            size={65}
            aria-label="Loading Spinner"
            data-testid="loader"
          />

          <p className="text-center px-5 max-w-2xl lml-3 font-medium mb-10 text-xl">
            Quizzer might take a minute or two to load because the server's
            powered by broke dreams. Go grab a snack - you've got more resources
            than this server. We'll be here... eventually.
          </p>
        </div>
      )}

      {data?.data && (
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />

                <Route path="/signup" element={<Signup />} />
                <Route path="/signin" element={<Login />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/signout" element={<Signout />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth-action" element={<AuthAction />} />

                <Route path="/faq" element={<FAQ />} />

                <Route
                  path="/edit-profile"
                  element={
                    <Protector>
                      <EditProfile />
                    </Protector>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <Protector>
                      <Profile />
                    </Protector>
                  }
                />

                <Route
                  path="/user/:username"
                  element={
                    <Protector>
                      <User />
                    </Protector>
                  }
                />

                <Route
                  path="/notes"
                  element={
                    <Protector>
                      <Notes />
                    </Protector>
                  }
                />

                <Route
                  path="/notes/:noteId"
                  element={
                    <Protector>
                      <Note />
                    </Protector>
                  }
                />

                <Route
                  path="/files"
                  element={
                    <Protector>
                      <Files />
                    </Protector>
                  }
                />

                <Route
                  path="/files/:fileId"
                  element={
                    <Protector>
                      <File />
                    </Protector>
                  }
                />

                <Route
                  path="/flashcard"
                  element={
                    <Protector>
                      <FlashCardQuiz />
                    </Protector>
                  }
                />

                <Route
                  path="/mcq"
                  element={
                    <Protector>
                      <MCQQuiz />
                    </Protector>
                  }
                />

                <Route
                  path="/fact-or-not"
                  element={
                    <Protector>
                      <FactOrNot />
                    </Protector>
                  }
                />

                <Route
                  path="/quizzes"
                  element={
                    <Protector>
                      <Quizzes />
                    </Protector>
                  }
                />

                <Route
                  path="/quizzes/:quizId"
                  element={
                    <Protector>
                      <Quiz />
                    </Protector>
                  }
                />

                <Route
                  path="/quizzes/create"
                  element={
                    <Protector>
                      <QuizEditor />
                    </Protector>
                  }
                />

                <Route
                  path="/quizzes/edit/:quizId"
                  element={
                    <Protector>
                      <QuizEditor />
                    </Protector>
                  }
                />

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
