import { useNavigate, useParams } from "react-router-dom";
import { SecondaryButton } from "../components";
import { useDBUser } from "../context/UserContext.jsx";
import dayjs from "dayjs";
import { TfiWrite } from "react-icons/tfi";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../utils/axios.js";
import Profile from "./Profile.jsx";
import { useEffect } from "react";

import banner from "@/assets/profileBackground2.png";

const User = () => {
  const { username } = useParams();
  const { dbUser } = useDBUser();
  const navigate = useNavigate();

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ["userProfile", username, dbUser?.id],
    queryFn: async () => {
      return axiosInstance.post("/user/get-user-info", {
        userId: dbUser?.id,
        username: username,
      });
    },
  });

  useEffect(() => {
    if (user) {
      document.title = `${user?.data?.user?.name} | HootLearn`;
    } else {
      document.title = `${username} | HootLearn`;
    }
  }, [user, username]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (username == dbUser?.username) {
    return <Profile />;
  }

  return (
    <>
      {}
      {loadingUser && (
        <div className="lg:min-h-screen bg-bgwhite dark:bg-darkbg dark:text-darkmodetext w-full pb-20">
          {}
          <div className="bg-secondarydarkbg  border-b-4 border-black h-48"></div>

          {}
          <div className="bg-white dark:bg-secondarydarkbg dark:border-white/25 shadow-xl -translate-y-14 border-2 min-h-52 pt-20 pb-10 rounded-lg mx-5 md:mx-10 lg:mx-20">
            {}
            <div className="absolute w-full -top-16 flex justify-center">
              <div
                className={`bg-gray-500  rounded-full h-32 w-32 border-8 `}
              />
            </div>

            <div className="px-2">
              {}
              <p className="h-6 w-48 bg-gray-500 animate-pulse rounded mx-auto"></p>
              {}
              <p className="mt-2 h-4 w-48 bg-gray-500 animate-pulse rounded mx-auto "></p>
            </div>

            <hr className="my-5 mx-2 dark:border-white/25" />

            {}
            <div className="mt-5 text-greyText h-4 w-56 bg-gray-500 animate-pulse rounded mx-auto"></div>
          </div>
        </div>
      )}

      {}
      {user && (
        <div className="lg:min-h-screen bg-bgwhite dark:bg-darkbg dark:text-darkmodetext w-full pb-20">
          {}
          <div className="bg-secondarydarkbg overflow-hidden dark:bg-darkgrey border-b-4 border-black h-48 dark:border-white/10">
            <img src={banner} className="object-cover" />
          </div>

          {}
          <div className="bg-white dark:bg-secondarydarkbg dark:border-white/25 shadow-xl -translate-y-14 border-2 min-h-52 pt-20 pb-10 rounded-lg mx-5 md:mx-10 lg:mx-20">
            {}
            <div className="absolute w-full -top-18 flex justify-center">
              {user?.data?.user?.photoURL ? (
                <img
                  src={
                    user?.data?.user?.photoURL
                      ? user?.data?.user?.photoURL
                      : "https://res.cloudinary.com/do8rpl9l4/image/upload/v1736740649/account_glotqh.png"
                  }
                  className={`bg-white rounded-full h-36 w-36 border-8 border-white dark:border-secondarydarkbg dark:border-darkgrey `}
                />
              ) : (
                <img
                  src={
                    user?.data?.user?.photoURL
                      ? user?.data?.user?.photoURL
                      : "https://res.cloudinary.com/do8rpl9l4/image/upload/v1740987081/accountcircle_axsjlm.png"
                  }
                  onClick={() => {
                    if (user?.data?.user?.photoURL) {
                      window.open(user?.data?.user?.photoURL);
                    }
                  }}
                  className={`bg-secondarydarkbg rounded-full h-36 w-36 border-8 border-white dark:border-secondarydarkbg ${
                    user?.data?.user?.photoURL && "cursor-pointer"
                  } `}
                />
              )}
            </div>

            <div className="px-2">
              {}
              <p className="text-center text-3xl font-bold">
                {user?.data?.user?.name}
              </p>
              {}
              <p className="mt-2 text-center text-xl font-medium">
                @{user?.data?.user.username}
              </p>
              {}
              {user?.data?.user?.bio && (
                <p className="px-4 my-10 text-md text-center">
                  {user?.data?.user?.bio}
                </p>
              )}
            </div>

            <hr className="my-5 mx-2 dark:border-white/25" />

            {}
            <div className="mt-5 text-greyText flex justify-center items-center gap-x-2">
              <TfiWrite /> Became a Quizzer on{" "}
              {dayjs(new Date(user?.data?.user?.createdAt)).format(
                "MMM DD, YYYY",
              )}
            </div>
          </div>
        </div>
      )}

      {}
      {!loadingUser && !user && (
        <div className="min-h-[70vh] md:min-h-[80vh] lg:min-h-[60vh] flex justify-center items-center pb-48">
          <div>
            {}
            <p className="text-3xl lg:text-4xl px-5 text-center mt-14">
              Uh oh. We couldn&apos;t find that user. Go Back?
            </p>
            <div className="mt-10 flex flex-col gap-10 justify-center items-center">
              {}
              <img
                src={
                  "https://res.cloudinary.com/do8rpl9l4/image/upload/v1736742020/user_nbfigi.svg"
                }
                className="max-w-[70%] lg:max-w-[60%] pointer-events-none"
              />

              {}
              <div>
                <SecondaryButton
                  onClick={() => navigate("/")}
                  text="Go Back Home"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default User;
