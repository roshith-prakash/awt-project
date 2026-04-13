import { PrimaryButton, SecondaryButton } from "@/components";
import { useDBUser } from "../context/UserContext.jsx";
import { BsFillTrash3Fill, BsPen } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { TfiWrite } from "react-icons/tfi";
import { axiosInstance } from "../utils/axios.js";
import { auth } from "../firebase/firebase.js";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import AlertModal from "@/components/reuseit/AlertModal";

dayjs.extend(relativeTime);
import { useQuery } from "@tanstack/react-query";
import {
  NotebookText,
  Brain,
  Files,
  ChevronRight,
  Trophy,
  Zap,
  Medal,
  Award,
} from "lucide-react";

import banner from "@/assets/profileBackground1.png";

const Profile = () => {
  const navigate = useNavigate();
  const { dbUser, setDbUser } = useDBUser();
  const [disabled, setDisabled] = useState(false);
  const [isDeleteProfileModalOpen, setIsDeleteProfileModalOpen] =
    useState(false);

  useEffect(() => {
    document.title = `${dbUser?.name} | HootLearn`;
  }, [dbUser]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const deleteUser = () => {
    setDisabled(true);
    const user = auth.currentUser;

    user
      ?.delete()
      ?.then(() => {
        axiosInstance
          .post("/user/delete-user", { userId: dbUser?.id })
          .then(() => {
            toast.success("User Deleted.");
            setDbUser(null);
            setDisabled(false);
            setIsDeleteProfileModalOpen(false);
            navigate("/");
          })
          .catch((err) => {
            setDisabled(false);
            setIsDeleteProfileModalOpen(false);
            console.log(err);
            toast.error("Something went wrong.");
          });
      })
      .catch((error) => {
        setDisabled(false);
        console.log(error);
        setIsDeleteProfileModalOpen(false);
        const errorMessage = error?.message;
        if (String(errorMessage).includes("auth/requires-recent-login")) {
          toast.error("Please login again before deleting your account.");
        } else {
          toast.error("Something went wrong.");
        }
      });
  };

  const { data: noteCountData } = useQuery({
    queryKey: ["noteCount", dbUser?.id],
    queryFn: () =>
      axiosInstance.post("/note/get-number-of-notes", { userId: dbUser?.id }),
    enabled: !!dbUser?.id,
  });

  const { data: quizCountData } = useQuery({
    queryKey: ["quizCount", dbUser?.id],
    queryFn: () =>
      axiosInstance.post("/user-quiz/get-number-of-quizzes", {
        userId: dbUser?.id,
      }),
    enabled: !!dbUser?.id,
  });

  const { data: fileCountData } = useQuery({
    queryKey: ["fileCount", dbUser?.id],
    queryFn: () =>
      axiosInstance.post("/file/get-number-of-files", { userId: dbUser?.id }),
    enabled: !!dbUser?.id,
  });

  const { data: dashboardData } = useQuery({
    queryKey: ["dashboardData", dbUser?.id],
    queryFn: () =>
      axiosInstance.post("/user/get-dashboard-data", { userId: dbUser?.id }),
    enabled: !!dbUser?.id,
  });

  const dashboardStats = dashboardData?.data?.stats;
  const activityFeed = dashboardData?.data?.activity || [];
  const recentItem = dashboardData?.data?.recentItem;

  const achievements = [
    {
      title: "Quiz Novice",
      criteria: "Complete 1 quiz",
      attained: dashboardStats?.totalQuizzes >= 1,
      icon: <Award className="w-8 h-8" />,
      color: "text-blue-500",
    },
    {
      title: "Active Learner",
      criteria: "Reach a 3-day streak",
      attained: dashboardStats?.streak >= 3,
      icon: <Zap className="w-8 h-8" />,
      color: "text-orange-500",
    },
    {
      title: "Expert",
      criteria: "Achieve 85%+ average score",
      attained: parseFloat(dashboardStats?.avgScore) >= 85,
      icon: <Medal className="w-8 h-8" />,
      color: "text-purple-500",
    },
    {
      title: "Master Collector",
      criteria: "Save 5 quizzes",
      attained: dashboardStats?.totalQuizzes >= 5,
      icon: <Trophy className="w-8 h-8" />,
      color: "text-yellow-500",
    },
  ];

  const stats = [
    {
      title: "Notes",
      count: noteCountData?.data?.noteCount || 0,
      icon: <NotebookText className="text-cta dark:text-darkmodeCTA" />,
      description: "Manage your study notes",
      link: "/notes",
      color: "from-blue-500/10 to-blue-600/10",
    },
    {
      title: "Quizzes",
      count: quizCountData?.data?.quizCount || 0,
      icon: <Brain className="text-purple-500" />,
      description: "Test your knowledge",
      link: "/quizzes",
      color: "from-purple-500/10 to-purple-600/10",
    },
    {
      title: "Files",
      count: fileCountData?.data?.fileCount || 0,
      icon: <Files className="text-emerald-500" />,
      description: "Browse uploaded documents",
      link: "/files",
      color: "from-emerald-500/10 to-emerald-600/10",
    },
  ];

  return (
    <>
      {}
      <AlertModal
        isOpen={isDeleteProfileModalOpen}
        className="max-w-xl"
        onClose={() => setIsDeleteProfileModalOpen(false)}
      >
        <div className="flex flex-col gap-y-2">
          {}
          <h1 className="dark:text-darkmodetext font-bold text-2xl">
            Are you sure you want to delete your account?
          </h1>

          {}
          <h2 className="dark:text-darkmodetext mt-1 text-sm text-darkbg/70">
            This action cannot be reversed. Deleting your account will remove
            all your teams and leagues.
          </h2>

          {}
          <div className="mt-5 flex gap-x-5 justify-end">
            <PrimaryButton
              className="text-sm bg-red-500 border-red-500 hover:bg-red-600 hover:border-red-600"
              onClick={deleteUser}
              disabled={disabled}
              disabledText="Please Wait..."
              text="Delete"
            />

            <SecondaryButton
              className="text-sm"
              disabled={disabled}
              disabledText="Please Wait..."
              onClick={() => setIsDeleteProfileModalOpen(false)}
              text="Cancel"
            />
          </div>
        </div>
      </AlertModal>

      {}
      <div className="lg:min-h-screen bg-bgwhite dark:bg-darkbg dark:text-darkmodetext w-full pb-20">
        {}
        <div className="bg-secondarydarkbg overflow-hidden dark:bg-darkgrey border-b-4 border-black h-48 dark:border-white/10">
          <img src={banner} className="object-cover" />
        </div>

        {}
        <div className="bg-white dark:bg-secondarydarkbg dark:border-white/25 shadow-xl -translate-y-14 border-2 min-h-52 pt-20 pb-10 rounded-lg mx-5 md:mx-10 lg:mx-20">
          {}
          <div className="absolute w-full -top-18 flex justify-center">
            {dbUser?.photoURL ? (
              <img
                src={dbUser?.photoURL}
                className="bg-white  rounded-full h-36 w-36 border-8 border-white dark:border-secondarydarkbg dark:border-darkgrey pointer-events-none"
              />
            ) : (
              <img
                src={
                  "https://res.cloudinary.com/do8rpl9l4/image/upload/v1740987081/accountcircle_axsjlm.png"
                }
                className="bg-secondarydarkbg rounded-full h-36 w-36 border-8 border-white dark:border-secondarydarkbg dark:border-darkgrey pointer-events-none"
              />
            )}
          </div>

          {}
          <div className="lg:hidden absolute flex gap-x-4 right-6 top-5">
            <BsPen
              className="text-xl hover:text-cta dark:hover:text-darkmodeCTA transition-all cursor-pointer"
              onClick={() => navigate("/edit-profile")}
            />

            <button
              onClick={() => setIsDeleteProfileModalOpen(true)}
              className="text-xl  cursor-pointer"
            >
              <BsFillTrash3Fill className=" cursor-pointer text-red-500" />
            </button>
          </div>

          {}
          <div className="hidden absolute lg:flex gap-x-4 right-6 top-5">
            <SecondaryButton
              text={
                <div className="flex items-center gap-x-2">
                  <BsPen />
                  <p>Edit</p>
                </div>
              }
              className="border-transparent dark:hover:!text-cta shadow-md"
              onClick={() => navigate("/edit-profile")}
            />

            <SecondaryButton
              text={
                <div className="flex justify-center items-center  gap-x-2">
                  <BsFillTrash3Fill className=" cursor-pointer " />
                  Delete
                </div>
              }
              onClick={() => setIsDeleteProfileModalOpen(true)}
              className="border-transparent dark:!border-2 shadow-md hover:bg-red-600 text-red-600 dark:text-white hover:!text-white dark:hover:!text-red-600"
            />
          </div>

          {}
          <div className="px-2 mb-10">
            <p className="text-center text-3xl font-bold">{dbUser?.name}</p>
            <p className="mt-2 text-center text-xl font-medium text-cta">
              @{dbUser?.username}
            </p>
            {dbUser?.bio && (
              <p className="px-4 mt-6 text-md text-center text-gray-600 dark:text-gray-400 italic">
                "{dbUser?.bio}"
              </p>
            )}
          </div>

          {}
          <div className="px-5 md:px-10 mt-12">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-8 bg-cta rounded-full" />
              My Learning Library
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat) => (
                <div
                  key={stat.title}
                  className={`group relative overflow-hidden bg-white dark:bg-white/5 p-6 rounded-2xl border-2 border-transparent hover:border-cta/20 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer`}
                  onClick={() => navigate(stat.link)}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity`}
                  />

                  <div className="relative flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-white dark:bg-darkgrey rounded-xl shadow-inner group-hover:scale-110 transition-transform">
                        {stat.icon}
                      </div>
                      <ChevronRight className="text-gray-300 dark:text-gray-600 group-hover:text-cta group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold dark:text-white">
                        {stat.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {stat.description}
                      </p>
                      <div className="flex items-baseline gap-1 mt-auto">
                        <span className="text-3xl font-black text-cta dark:text-darkmodeCTA">
                          {stat.count}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          items
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {}
          <hr className="my-5 mx-2 dark:border-white/25" />

          {}
          <div className="mt-5 text-gray-400 flex justify-center items-center gap-x-2 text-sm italic">
            <TfiWrite /> Became a Quizzer on{" "}
            {dayjs(new Date(dbUser?.createdAt)).format("MMM DD, YYYY")}.
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
