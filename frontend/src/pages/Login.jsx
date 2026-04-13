import { useEffect, useState } from "react";
import {
  ErrorStatement,
  Input,
  PrimaryButton,
  PasswordInput,
} from "@/components";
import { auth } from "@/firebase/firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { isValidEmail, isValidPassword } from "@/utils/regexFunctions";
import toast from "react-hot-toast";
import { axiosInstance } from "@/utils/axios";
import { FaGoogle } from "react-icons/fa6";
import { useDBUser } from "@/context/UserContext";

import doodle from "@/assets/MessyDoodle.svg";

import doodleDark from "@/assets/MessyDoodleDark.svg";
import { useDarkMode } from "@/context/DarkModeContext";

const provider = new GoogleAuthProvider();

const Login = () => {
  const navigate = useNavigate();
  const [disabled, setDisabled] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState({
    email: 0,
    pw: 0,
  });

  const { dbUser } = useDBUser();
  const { isDarkMode } = useDarkMode();

  if (dbUser) {
    navigate("/");
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    document.title = "Sign in | HootLearn";
  }, []);

  const handleLogin = () => {
    setError({
      email: 0,
      pw: 0,
    });

    if (email == null || email == undefined || email.length == 0) {
      setError((prev) => ({ ...prev, email: 1 }));
      return;
    } else if (!isValidEmail(email)) {
      setError((prev) => ({ ...prev, email: 2 }));
      return;
    } else if (
      password == null ||
      password == undefined ||
      password.length == 0
    ) {
      setError((prev) => ({ ...prev, pw: 1 }));
      return;
    } else if (!isValidPassword(password)) {
      setError((prev) => ({ ...prev, pw: 2 }));
      return;
    }

    setDisabled(true);

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        axiosInstance
          .post("/user/get-current-user", { user: user })
          .then((res) => {
            if (res?.data?.user) {
              setDisabled(false);
              navigate("/");
            }
          })
          .catch((err) => {
            console.log(err);
            setDisabled(false);
            if (err?.response?.data?.data == "User does not exist.") {
              navigate("/onboarding");
            }
          });
      })
      .catch((error) => {
        const errorMessage = error.message;
        console.log(errorMessage);
        setDisabled(false);

        if (String(errorMessage).includes("(auth/invalid-credential)")) {
          toast.error("Invalid Credentials.");
        } else {
          toast.error("Something went wrong.");
        }
      });
  };

  const handleGoogleLogin = () => {
    setDisabled(true);
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;

        axiosInstance
          .post("/user/get-current-user", { user: user })
          .then((res) => {
            if (res?.data?.user) {
              setDisabled(false);
              navigate("/");
            }
          })
          .catch((err) => {
            console.log(err);
            setDisabled(false);
            if (err?.response?.data?.data == "User does not exist.") {
              navigate("/onboarding");
            }
          });
      })
      .catch((error) => {
        setDisabled(false);

        const errorMessage = error.message;

        console.log(errorMessage);
      });
  };

  return (
    <>
      <div className="lg:min-h-[89vh] px-4 lg:px-8 flex gap-x-8 w-full">
        {}
        <div className="hidden lg:flex lg:flex-1 items-center justify-center">
          <img src={isDarkMode ? doodleDark : doodle} className="max-w-[70%]" />
        </div>

        {}
        <div className="min-h-[95vh] mt-5 lg:mt-0 lg:h-full lg:min-h-[88vh] pb-10 flex-1 flex justify-center items-center">
          {}
          <div className="bg-white dark:bg-white/5 max-w-xl dark:bg-darkgrey dark:text-darkmodetext px-8 lg:max-w-lg mt-5 p-5 md:px-10 shadow-lg rounded-2xl pb-10">
            {}
            <h1 className="dark:text-darkmodetext pt-5 font-bold text-2xl text-center">
              Sign in to HootLearn
            </h1>

            {}
            <h2 className="dark:text-darkmodetext mt-1 text-sm text-darkbg/70 text-center">
              Welcome back! Please sign in to continue.
            </h2>

            {}
            <div className="flex justify-center">
              <button
                disabled={disabled}
                onClick={handleGoogleLogin}
                className="mt-8 dark:hover:border-white cursor-pointer hover:border-darkbg border-darkbg/25 dark:border-white/25 border-1 flex  gap-x-2 py-2 justify-center items-center px-14 shadow rounded-lg font-medium active:shadow transition-all"
              >
                {disabled ? <p>Please Wait...</p> : <p>Sign in with Google</p>}
                <FaGoogle className="text-xl translate-y-0.5" />
              </button>
            </div>

            {}
            <div className="flex mt-10 mb-5 items-center">
              <div className="flex-1 h-0 border-1 border-darkbg/25 dark:border-white/25"></div>
              <p className="text-center px-2 font-semibold text-darkbg/50 dark:text-white/25">
                OR
              </p>
              <div className="flex-1 h-0 border-1 border-darkbg/25 dark:border-white/25"></div>
            </div>

            {}
            <>
              {}
              <div className="mt-4 px-2">
                <p className="font-medium">Email</p>
                <Input
                  value={email}
                  className="focus:border-darkbg dark:focus:border-white transition-all"
                  onChange={(e) => {
                    setEmail(e.target.value);

                    if (
                      e.target.value != null &&
                      e.target.value != undefined &&
                      e.target.value.length != 0 &&
                      isValidEmail(e.target.value)
                    ) {
                      setError((prev) => ({ ...prev, email: 0 }));
                    }
                  }}
                  onBlur={() => {
                    if (
                      email == null ||
                      email == undefined ||
                      email.length == 0
                    ) {
                      setError((prev) => ({ ...prev, email: 1 }));
                      return;
                    } else if (!isValidEmail(email)) {
                      setError((prev) => ({ ...prev, email: 2 }));
                      return;
                    } else {
                      setError((prev) => ({ ...prev, email: 0 }));
                    }
                  }}
                  placeholder={"Enter your email address"}
                />

                <ErrorStatement
                  isOpen={error.email == 1}
                  text={"Please enter your email."}
                />

                <ErrorStatement
                  isOpen={error.email == 2}
                  text={"Please enter a valid email address."}
                />
              </div>

              {}
              <div className="mt-4 px-2">
                <p className="font-medium">Password</p>
                <PasswordInput
                  value={password}
                  className="focus:border-darkbg dark:focus:border-white transition-all"
                  onChange={(e) => {
                    setPassword(e.target.value);

                    if (
                      e.target.value != null &&
                      e.target.value != undefined &&
                      e.target.value.length != 0 &&
                      isValidPassword(e.target.value)
                    ) {
                      setError((prev) => ({ ...prev, pw: 0 }));
                    }
                  }}
                  onBlur={() => {
                    if (
                      password == null ||
                      password == undefined ||
                      password.length == 0
                    ) {
                      setError((prev) => ({ ...prev, pw: 1 }));
                      return;
                    } else if (!isValidPassword(password)) {
                      setError((prev) => ({ ...prev, pw: 2 }));
                      return;
                    } else {
                      setError((prev) => ({ ...prev, pw: 0 }));
                    }
                  }}
                  placeholder={"Enter your password"}
                />

                <ErrorStatement
                  isOpen={error.pw == 1}
                  text={"Please enter a password."}
                />

                <ErrorStatement
                  isOpen={error.pw == 2}
                  text={
                    "Password must be 8 characters long and must contain an uppercase letter, lowercase letter, number and special character."
                  }
                />
              </div>

              <Link
                className="ml-4 text-sm text-cta dark:text-darkmodeCTA font-medium"
                to="/forgot-password"
              >
                Forgot your password?
              </Link>

              {}
              <div className="mt-8">
                <PrimaryButton
                  disabled={disabled}
                  disabledText="Please Wait..."
                  onClick={handleLogin}
                  text={"Sign in"}
                  className="w-full text-md rounded-xl"
                />
              </div>
            </>

            {}
            <div className="flex mt-10 mb-5 items-center">
              <div className="flex-1 h-0 border-1 border-darkbg/25 dark:border-white/25"></div>
            </div>

            {}
            <div className="text-center text-darkbg/80 dark:text-white/80 pt-2">
              Don't have an account?{" "}
              <Link
                className="text-blue-600 dark:text-blue-400 font-medium"
                to="/signup"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
