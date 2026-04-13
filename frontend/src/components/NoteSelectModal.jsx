import { useEffect, useState } from "react";
import useDebounce from "../utils/useDebounce.jsx";
import { Input } from "../components";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../utils/axios.js";
import { useDBUser } from "@/context/UserContext";
import AlertModal from "@/components/reuseit/AlertModal";
import { maxNumberOfNotes } from "@/constants/constants";
import { IoIosSearch } from "react-icons/io";
import { Check } from "lucide-react";
import { RxCross2 } from "react-icons/rx";

const NoteSelectModal = ({ selectedNote, isOpen, onClose, onSelect }) => {
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search);

  const { dbUser } = useDBUser();

  const { ref, inView } = useInView();

  useEffect(() => {
    document.title = "Your Notes | HootLearn";
  }, []);

  const { data: numberOfNotes } = useQuery({
    queryKey: ["numberOfNotes", dbUser?.id],
    queryFn: () => {
      return axiosInstance.post("/note/get-number-of-notes", {
        userId: dbUser?.id,
      });
    },
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const {
    data: notes,
    isLoading: loadingNotes,

    fetchNextPage: fetchNextNotes,
  } = useInfiniteQuery({
    queryKey: ["notes", dbUser?.id, debouncedSearch],
    queryFn: ({ pageParam }) => {
      return axiosInstance.post("/note/get-notes-for-user", {
        searchTerm: debouncedSearch,
        page: pageParam,
        userId: dbUser?.id,
      });
    },
    getNextPageParam: (lastPage) => {
      return lastPage?.data?.nextPage;
    },
    initialPageParam: 0,
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (inView) {
      fetchNextNotes();
    }
  }, [inView, fetchNextNotes, notes?.pages?.length]);

  return (
    <AlertModal className="w-full" isOpen={isOpen} onClose={onClose}>
      <button
        onClick={() => onClose()}
        className="p-2 absolute top-7 right-5 rounded-lg bg-black/25 dark:bg-white/25 cursor-pointer"
      >
        <RxCross2 className="text-xl" />
      </button>

      <div className="flex flex-col justify-between flex-wrap gap-4">
        {}
        <h1 className="text-hovercta font-title dark:text-darkmodeCTA text-3xl md:text-4xl font-medium">
          Notes
        </h1>

        <p className="font-body w-fit bg-cta text-white px-4 py-1 rounded-full">
          {numberOfNotes?.data?.noteCount}/{maxNumberOfNotes} Notes
        </p>
      </div>

      {}
      <div className="flex flex-col items-center">
        <div className="relative my-10 mt-14 w-full max-w-3xl flex justify-center">
          <IoIosSearch className="absolute left-2 top-5 mt-0.5 text-greyText text-xl" />
          <Input
            value={search}
            className="pl-10 border-t-0 border-l-0 border-r-0 rounded-none border-b-2"
            placeholder={"Search and find a note!"}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {}
      {debouncedSearch && (
        <p className="font-medium py-5">
          Showing search results for &quot;{debouncedSearch}&quot;
        </p>
      )}

      {}
      {notes && notes?.pages?.[0]?.data?.notes.length > 0 && (
        <div className="py-10 lg:px-5 flex justify-center flex-wrap gap-8">
          {notes &&
            notes?.pages?.map((page) => {
              return page?.data.notes?.map((note) => {
                if (note?.title) {
                  return (
                    <div
                      key={note?.noteId}
                      onClick={() => {
                        if (selectedNote?.noteId == note?.noteId) {
                          onSelect(null);
                        } else {
                          onSelect(note);
                        }
                      }}
                      className=" bg-white relative overflow-hidden shadow-xl max-w-xs w-full rounded-xl flex flex-col dark:bg-white/5  px-5 py-5 transition-all cursor-pointer hover:scale-105 duration-150"
                    >
                      {selectedNote?.noteId == note?.noteId && (
                        <div className="absolute top-4 right-4 ">
                          <Check className="text-white bg-cta dark:bg-darkmodeCTA  rounded-full  p-1" />
                        </div>
                      )}

                      <div className="flex-1">
                        <p className="text-xl mb-4 mr-6 lg:mr-0 lg:pr-6 truncate font-semibold">
                          {note?.title}
                        </p>
                        <p className="text-md text-justify line-clamp-6 break-words dark:text-white/80 text-darkbg/70">
                          {note?.content}
                        </p>
                      </div>
                    </div>
                  );
                }
              });
            })}
        </div>
      )}

      {}
      {loadingNotes && (
        <div className="py-10 lg:px-5 flex justify-center flex-wrap gap-8">
          {Array(4)
            ?.fill(null)
            ?.map((_, index) => {
              return (
                <div
                  key={index}
                  className=" bg-[#e1e1e1]/25 max-w-3xs w-full rounded-xl flex flex-col dark:bg-white/5  px-5 py-5 transition-all hover:shadow-md hover:bg-white/10"
                >
                  <div className="flex-1">
                    <p className="px-0.5 h-4 w-48 bg-gray-500 rounded animate-pulse mb-4 "></p>
                    <p className="px-0.5 h-4 w-48 bg-gray-500 rounded animate-pulse mb-4 "></p>
                    <p className="px-0.5 h-4 w-48 bg-gray-500 rounded animate-pulse mb-4 "></p>
                  </div>

                  {}
                  <div className="mt-5 flex gap-x-3 items-center w-fit">
                    {}
                    <div className="px-0.5 h-10 w-10 rounded-full bg-gray-500  animate-pulse mb-4 " />
                    {}
                    <div>
                      <p className="px-0.5 h-4 w-32 bg-gray-500 rounded animate-pulse mb-4 "></p>
                      <p className="px-0.5 h-4 w-32 bg-gray-500 rounded animate-pulse mb-4 "></p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {}
      {notes && notes?.pages?.[0]?.data?.notes.length == 0 && (
        <div className="flex flex-col justify-center pt-10">
          <div className="flex justify-center">
            <img
              src={
                "https://res.cloudinary.com/dvwdsxirc/image/upload/v1742462679/Starman-bro_rgnlwy.svg"
              }
              className="max-w-[30%]"
            />
          </div>
          <p className="text-center mt-5 text-2xl font-medium">
            Uh oh! Couldn&apos;t find any notes.
          </p>
        </div>
      )}

      <div ref={ref}></div>
    </AlertModal>
  );
};

export default NoteSelectModal;
