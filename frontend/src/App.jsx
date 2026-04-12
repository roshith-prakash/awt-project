import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  EditProfile,
  Landing,
  Login,
  Onboarding,
  Signout,
  Signup,
  Profile,
  User,
  NotFound,
  ForgotPassword,
  AuthAction,
} from "@/pages";
import { Footer, Navbar, Protector } from "./components";
function App() {


  return (
    <div className="min-h-screen font-f1 flex flex-col dark:bg-darkbg dark:text-darkmodetext">
      <BrowserRouter>
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signin" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/signout" element={<Signout />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth-action" element={<AuthAction />} />
            <Route path="/faq" element={<div>FAQ</div>} />
            <Route path="/notices" element={<div>Notices</div>} />
            <Route path="/contact" element={<div>Contact</div>} />

            {/* Protected routes - Logged In User required. */}
            <Route
              path="/leaderboard"
              element={
                <Protector>
                  <div>Leaderboard</div>
                </Protector>
              }
            />

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

            {/* Create a new league */}
            <Route
              path="/create-league"
              element={
                <Protector>
                  <div>Create League</div>
                </Protector>
              }
            />

            {/* View all public leagues */}
            <Route
              path="/leagues"
              element={
                <Protector>
                  <div>Public Leagues</div>
                </Protector>
              }
            />

            {/* View a specific league */}
            <Route
              path="/leagues/:leagueId"
              element={
                <Protector>
                  <div>League</div>
                </Protector>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;
