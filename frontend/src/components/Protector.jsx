import { useAuth } from "../context/AuthContext.jsx";
import { useDBUser } from "../context/UserContext.jsx";
import { SecondaryButton } from "@/components";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase/firebase.js";
import { useEffect, useState } from "react";
import { PacmanLoader } from "react-spinners";

const Protector = ({ children }) => {
  const navigate = useNavigate();

  const { currentUser } = useAuth();

  const { dbUser } = useDBUser();

  const [loading, setLoading] = useState(dbUser ? false : true);

  useEffect(() => {
    if (!dbUser) {
      setTimeout(() => {
        setLoading(false);
      }, 3000);
    } else {
      setLoading(false);
    }
  }, [dbUser]);

  const sendVerification = () => {
    const user = auth.currentUser;
    if (user) {
      sendEmailVerification(user)
        .then(() => {
          toast("Email Verification Link sent.");
        })
        .catch(() => {
          toast.error("Something went wrong.");
        });
    }
  };

  if (loading) {
    return (
      <div className="dark:bg-darkbg dark:text-darkmodetext h-screen flex flex-col gap-y-4 justify-center items-center">
        <PacmanLoader color={"#9b0ced"} size={50} />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="dark:bg-darkbg dark:text-darkmodetext h-screen">
        <div className="min-h-[70vh] md:min-h-[65vh] dark:bg-darkbg dark:text-darkmodetext lg:min-h-[60vh] flex items-center justify-center pt-12 pb-32">
          <div>
            <p className="text-3xl lg:text-4xl px-5 text-center mt-14">
              You have not signed in!
            </p>
            <div className="mt-10 flex flex-col gap-10 justify-center items-center">
              <img
                src={
                  "https://res.cloudinary.com/do8rpl9l4/image/upload/v1736738810/notfound_eqfykw.svg"
                }
                className="max-w-[50%] lg:max-w-[40%] pointer-events-none"
              />

              <div>
                <SecondaryButton
                  onClick={() => navigate("/signup")}
                  text="Sign up"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser?.emailVerified) {
    return (
      <div className="dark:bg-darkbg dark:text-darkmodetext h-screen">
        <Toaster />
        <div className="min-h-[70vh] md:min-h-[65vh] dark:bg-darkbg dark:text-darkmodetext lg:min-h-[60vh] flex items-center justify-center pt-12 pb-32">
          <div>
            <p className="text-3xl lg:text-4xl px-5 text-center mt-14">
              Verify your email!
            </p>
            <p className="text-xl lg:text-xl px-5 text-center mt-3">
              Click the link in your email to verify your email.
            </p>
            <div className="mt-10 flex flex-col gap-10 justify-center items-center">
              <img
                src={
                  "https://res.cloudinary.com/do8rpl9l4/image/upload/v1736738810/notfound_eqfykw.svg"
                }
                className="max-w-[50%] lg:max-w-[40%] pointer-events-none"
              />

              <div>
                <SecondaryButton
                  onClick={sendVerification}
                  text="Resend Verification Link"
                />
              </div>
              <div>
                <SecondaryButton
                  className="w-full"
                  onClick={() => window.location.reload()}
                  text={
                    <div className="flex flex-col px-8">
                      <p>Already verified?</p>
                      <p> Reload the page</p>
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentUser && !dbUser) {
    return (
      <div className="dark:bg-darkbg dark:text-darkmodetext h-screen">
        <div className="min-h-[70vh] md:min-h-[65vh] dark:bg-darkbg dark:text-darkmodetext lg:min-h-[60vh] flex items-center justify-center pt-12 pb-32">
          <div>
            <p className="text-3xl lg:text-4xl px-5 text-center mt-14">
              You have not finished creating your account!
            </p>
            <div className="mt-10 flex flex-col gap-10 justify-center items-center">
              <img
                src={
                  "https://res.cloudinary.com/do8rpl9l4/image/upload/v1736738810/notfound_eqfykw.svg"
                }
                className="max-w-[50%] lg:max-w-[40%] pointer-events-none"
              />

              <div>
                <SecondaryButton
                  onClick={() => navigate("/onboarding")}
                  text="Complete your Profile"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (dbUser) {
    return <>{!loading && children}</>;
  }
};

export default Protector;
