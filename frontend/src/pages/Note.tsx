import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { axiosInstance } from "@/utils/axios";
import { useQuery } from "@tanstack/react-query";
import { useDBUser } from "@/context/UserContext";
import { SyncLoader } from "react-spinners";
import { ContextValue, useDarkMode } from "@/context/DarkModeContext";

import NoteEditor from "./NoteEditor";
import ReactQuill from "react-quill-new";
// Keep this for toolbar styles
import "react-quill-new/dist/quill.bubble.css";

import ReadingDoodle from "@/assets/ReadingDoodle.svg";
import ReadingDoodleDark from "@/assets/ReadingDoodleDark.svg";

const Note = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { noteId } = useParams();
  const { isDarkMode } = useDarkMode() as ContextValue;

  const { dbUser } = useDBUser();

  // Fetch note from DB
  const { data, isLoading, error } = useQuery({
    queryKey: ["note", noteId],
    queryFn: () => {
      return axiosInstance.post("/note/get-note-by-id", {
        noteId,
        userId: dbUser?.id,
      });
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: 60 * 1000 * 10,
    enabled: !!noteId,
  });

  // Set fetched note values into state
  useEffect(() => {
    if (data?.data) {
      setTitle(data?.data?.note?.title);
      setContent(data?.data?.note?.content);
    }
  }, [data?.data]);

  // Set window title.
  useEffect(() => {
    if (data?.data?.note?.title) {
      document.title = `${data?.data?.note?.title} | Quizzer AI`;
    } else document.title = `Note | Quizzer AI`;
  }, [data?.data]);

  // Loading Note
  if (isLoading) {
    return (
      <div className="relative max-w-[95%] md:max-w-5xl mx-auto mt-10 px-4 py-10 bg-white dark:bg-white/5 rounded-xl shadow-sm">
        <div className="flex flex-col items-center justify-center gap-5">
          <SyncLoader loading={isLoading} size={25} color="#b458ff" />

          <p className="text-2xl md:text-3xl font-semibold">Loading Note...</p>
        </div>
      </div>
    );
  }

  // Note not found / not accessible
  if (error) {
    return (
      <div className="relative max-w-[95%]  md:max-w-5xl mx-auto mt-10 px-4 py-10 bg-white dark:bg-white/5 rounded-xl shadow-sm">
        <div className="flex flex-col items-center justify-center gap-5">
          <img
            src={isDarkMode ? ReadingDoodleDark : ReadingDoodle}
            className="h-60"
          />
          <p className="text-2xl md:text-3xl font-semibold">
            Could not find that note!
          </p>
        </div>
      </div>
    );
  }

  // Note not found / not accessible
  if (!data?.data?.note) {
    return (
      <div className="relative max-w-[95%]  md:max-w-5xl mx-auto mt-10 px-4 py-10 bg-white dark:bg-white/5 rounded-xl shadow-sm">
        <div className="flex flex-col items-center justify-center gap-5">
          <img
            src={isDarkMode ? ReadingDoodleDark : ReadingDoodle}
            className="h-60"
          />
          <p className="text-2xl md:text-3xl font-semibold">
            Could not find that note!
          </p>
        </div>
      </div>
    );
  }

  if (data?.data?.note?.user?.id == dbUser?.id) {
    // If the profile is the current user's profile, show the profile component.
    return <NoteEditor />;
  }

  return (
    <div className="relative max-w-[95%] mb-20 md:max-w-5xl mx-auto mt-10 px-4 py-6 bg-white dark:bg-white/5 rounded-xl shadow-sm">
      {/* Display note title */}
      <input
        type="text"
        disabled={true}
        readOnly={true}
        value={title}
        placeholder="Untitled"
        className="w-full text-3xl font-semibold bg-transparent outline-none mb-6 placeholder-gray-400 dark:placeholder-white"
      />
      <hr className="border-t-2" />
      {/* Display note content */}
      <ReactQuill
        theme="bubble"
        value={content}
        readOnly={true}
        onChange={setContent}
        placeholder="Start typing..."
        className="min-h-[300px] custom-quill-editor" // Remove border here
      />
    </div>
  );
};

export default Note;
