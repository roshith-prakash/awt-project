import { useEffect, useState } from "react";
import useDebounce from "../utils/useDebounce";
import {
  ErrorStatement,
  Input,
  PrimaryButton,
  SecondaryButton,
} from "../components";
import { IoIosSearch, IoMdAddCircleOutline } from "react-icons/io";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../utils/axios";
import { useNavigate } from "react-router-dom";
import { useDBUser } from "@/context/UserContext";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PopoverClose } from "@radix-ui/react-popover";
import { FaEye, FaTrash } from "react-icons/fa6";
import toast from "react-hot-toast";
import AlertModal from "@/components/reuseit/AlertModal";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { maxNumberOfNotes } from "@/constants/constants";

const Notes = () => {
  const [noteId, setNoteId] = useState<string>("");
  const [noteTitle, setNoteTitle] = useState<string>("");
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);

  // State for user input - passed to debouncer
  const [search, setSearch] = useState("");
  // Debouncing the input of the user
  const debouncedSearch = useDebounce(search);
  // Note title errors
  const [noteTitleError, setNoteTitleError] = useState<number>(0);

  const { dbUser } = useDBUser();
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  // Intersection observer to fetch new leagues
  const { ref, inView } = useInView();

  //  Page Title
  useEffect(() => {
    document.title = "Your Notes | HootLearn";
  }, []);

  // Get number of files
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

  // Fetching searched notes
  const {
    data: notes,
    isLoading: loadingNotes,
    // error: notesError,
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

  // Fetching more notes
  useEffect(() => {
    if (inView) {
      fetchNextNotes();
    }
  }, [inView, fetchNextNotes, notes?.pages?.length]);

  // Create a new note
  const createNote = () => {
    axiosInstance
      ?.post("/note/create-note", { userId: dbUser?.id })
      .then((res) => {
        queryClient.invalidateQueries({
          queryKey: ["notes", dbUser?.id, debouncedSearch],
        });
        queryClient.invalidateQueries({
          queryKey: ["numberOfNotes", dbUser?.id],
        });
        navigate(`/notes/${res?.data?.note?.noteId}`);
      })
      .catch((err: AxiosError) => {
        console.log(err);
        if (err?.response?.status == 403) {
          toast.error(
            "Note limit exceeded. Please delete existing notes to add new ones."
          );
        } else {
          toast.error("Could not create note!");
        }
      });
  };

  // Delete the note
  const deleteNote = () => {
    setIsDisabled(true);
    axiosInstance
      ?.post("/note/delete-note", { noteId, userId: dbUser?.id })
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: ["notes", dbUser?.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["numberOfNotes", dbUser?.id],
        });
        setIsDisabled(false);
        toast("Deleted note.");
        setIsDeleteModalOpen(false);
      })
      .catch((err) => {
        toast.error("Could not delete note.");
        setIsDisabled(false);
        console.log(err);
      });
  };

  // Rename the note
  const renameNote = () => {
    setNoteTitleError(0);

    if (noteTitle == null || noteTitle == undefined || noteTitle.length <= 0) {
      setNoteTitleError(1);
      return;
    } else if (noteTitle?.length > 50) {
      setNoteTitleError(2);
      return;
    }

    setNoteTitleError(0);

    axiosInstance
      ?.post("/note/rename-note", {
        noteId,
        userId: dbUser?.id,
        title: noteTitle,
      })
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: ["notes", dbUser?.id, debouncedSearch],
        });
        setIsDisabled(false);
        toast("Renamed note.");
        setIsRenameModalOpen(false);
      })
      .catch((err) => {
        toast.error("Could not rename note.");
        setIsDisabled(false);
        console.log(err);
      });
  };

  return (
    <>
      {/* Delete Note Modal */}
      <AlertModal
        onClose={() => {
          setIsDeleteModalOpen(false);
        }}
        isOpen={isDeleteModalOpen}
      >
        <div className="flex flex-col gap-y-2">
          {/* Title */}
          <h1 className="dark:text-darkmodetext font-bold text-2xl">
            Are you sure you want to delete this note?
          </h1>

          {/* Subtitle */}
          <h2 className="dark:text-darkmodetext mt-1 text-base text-darkbg/80">
            This action cannot be reversed.
          </h2>

          {/* Buttons */}
          <div className="mt-5 flex gap-x-5 justify-end">
            <PrimaryButton
              disabled={isDisabled}
              disabledText="Please Wait..."
              className="text-sm bg-red-500 border-red-500 hover:bg-red-600 hover:border-red-600 dark:bg-red-500 dark:border-red-500 dark:hover:bg-red-600 dark:hover:border-red-600"
              onClick={deleteNote}
              text="Delete"
            />
            <SecondaryButton
              disabled={isDisabled}
              disabledText="Please Wait..."
              className="text-sm text-black border-black hover:bg-black hover:border-black"
              onClick={() => setIsDeleteModalOpen(false)}
              text="Cancel"
            />
          </div>
        </div>
      </AlertModal>

      {/* Rename Note Modal */}
      <AlertModal
        onClose={() => {
          setIsRenameModalOpen(false);
        }}
        isOpen={isRenameModalOpen}
      >
        <div className="flex flex-col gap-y-2">
          {/* Title */}
          <h1 className="dark:text-darkmodetext font-bold text-2xl">
            Rename this note
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Give your note a new name to help you find it later.
          </p>

          <Input
            value={noteTitle}
            onChange={(e) => {
              setNoteTitle(e.target.value);

              if (
                e.target.value != null &&
                e.target.value != undefined &&
                e.target.value.length > 0 &&
                e.target.value?.length < 50
              ) {
                setNoteTitleError(0);
              }
            }}
            onBlur={(e) => {
              if (
                e.target.value == null ||
                e.target.value == undefined ||
                e.target.value.length <= 0
              ) {
                setNoteTitleError(1);
                return;
              } else if (e.target.value?.length > 50) {
                setNoteTitleError(2);
                return;
              }
            }}
            placeholder="Add Note Title..."
          />

          {/* Error + Length */}
          <div className="flex w-full justify-between">
            <div>
              <ErrorStatement
                isOpen={noteTitleError == 1}
                text={"Please enter note title."}
              />

              <ErrorStatement
                isOpen={noteTitleError == 2}
                text={"Note Title cannot exceed 50 characters."}
              />
            </div>
            <p
              className={`text-right mt-0.5 mr-0.5 ${
                noteTitle?.length > 50 && "text-red-500"
              }`}
            >
              {noteTitle?.length}/50
            </p>
          </div>

          {/* Buttons */}
          <div className="mt-5 flex gap-x-5 justify-end">
            <PrimaryButton
              disabled={isDisabled}
              disabledText="Please Wait..."
              className="text-sm"
              onClick={renameNote}
              text="Rename"
            />
            <SecondaryButton
              disabled={isDisabled}
              disabledText="Please Wait..."
              className="text-sm text-black border-black hover:bg-black hover:border-black"
              onClick={() => setIsRenameModalOpen(false)}
              text="Cancel"
            />
          </div>
        </div>
      </AlertModal>

      <div className="min-h-[70vh] dark:bg-darkbg dark:text-darkmodetext md:min-h-[65vh] lg:min-h-[60vh] px-8 lg:px-10 py-10">
        <div>
          {/* Header */}
          <div className="flex justify-between gap-x-4 items-center">
            <div className="flex items-center flex-wrap gap-4">
              {/* Title */}
              <h1 className="text-hovercta font-title dark:text-darkmodeCTA text-3xl md:text-4xl font-medium">
                Notes
              </h1>

              <p className="font-body bg-cta text-white px-4 py-1 rounded-full">
                {numberOfNotes?.data?.noteCount}/{maxNumberOfNotes} Notes
              </p>
            </div>

            {/* Create a new note */}
            <SecondaryButton
              disabled={numberOfNotes?.data?.noteCount == maxNumberOfNotes}
              className="border-transparent dark:hover:!text-cta dark:disabled:hover:!text-gray-400 shadow-md"
              text={
                <div className="flex gap-x-2 items-center">
                  <IoMdAddCircleOutline className="text-2xl" />
                  <span className="text-nowrap">New Note</span>
                </div>
              }
              onClick={createNote}
            ></SecondaryButton>
          </div>

          {/* Input box */}
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

          {/* Showing the input entered by the user */}
          {debouncedSearch && (
            <p className="font-medium py-5">
              Showing search results for &quot;{debouncedSearch}&quot;
            </p>
          )}

          {/* Map notes if notes are found */}
          {notes && notes?.pages?.[0]?.data?.notes.length > 0 && (
            <div className="py-10 lg:px-5 flex justify-center flex-wrap gap-8">
              {notes &&
                notes?.pages?.map((page) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  return page?.data.notes?.map((note: any) => {
                    if (note?.title) {
                      return (
                        <div
                          key={note?.noteId}
                          className="group bg-white relative overflow-hidden shadow-xl max-w-xs w-full rounded-xl flex flex-col dark:bg-white/5  px-5 py-5 transition-all cursor-pointer hover:scale-105 duration-150"
                          onClick={() => navigate(`/notes/${note?.noteId}`)}
                        >
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="absolute top-4 right-4 "
                          >
                            <Popover>
                              <PopoverTrigger className="flex items-center cursor-pointer">
                                <BsThreeDotsVertical className="text-2xl" />
                              </PopoverTrigger>

                              <PopoverContent className="dark:bg-darkgrey dark:border-2 w-auto mt-2 mr-4 py-0 px-1">
                                <div className="py-1 min-w-32 flex flex-col gap-y-1">
                                  <PopoverClose>
                                    <button
                                      onClick={() => {
                                        setNoteId(note?.noteId);
                                        setIsDeleteModalOpen(true);
                                      }}
                                      className="cursor-pointer w-full flex items-center gap-x-3 justify-center hover:text-red-500 dark:hover:text-red-400 hover:bg-grey/50 dark:hover:bg-grey/5 py-1.5 transition-all"
                                    >
                                      <FaTrash />
                                      <span className="-translate-x-1">
                                        Delete
                                      </span>
                                    </button>
                                  </PopoverClose>
                                  <PopoverClose>
                                    <button
                                      onClick={() => {
                                        setNoteId(note?.noteId);
                                        setNoteTitle(note?.title);
                                        setIsRenameModalOpen(true);
                                      }}
                                      className="cursor-pointer hover:text-cta dark:hover:text-darkmodeCTA w-full flex items-center gap-x-2 justify-center hover:bg-grey/50 dark:hover:bg-grey/5 py-1.5 transition-all"
                                    >
                                      <FaEye />
                                      Rename
                                    </button>
                                  </PopoverClose>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="flex-1">
                            <p className="text-xl mb-4 mr-6 lg:mr-0 lg:pr-6 truncate font-semibold">
                              {note?.title}
                            </p>
                            <p className="text-md text-left line-clamp-6 break-words dark:text-white/80 text-darkbg/70">
                              {note?.content}
                            </p>
                          </div>

                          {/* Animated Footer Bar */}
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cta via-pink-400 to-purple-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
                        </div>
                      );
                    }
                  });
                })}
            </div>
          )}

          {/* Notes Loader */}
          {loadingNotes && (
            <div className="py-10 lg:px-5 flex justify-center flex-wrap gap-8">
              {Array(4)
                ?.fill(null)
                ?.map((_, index) => {
                  return (
                    <div
                      key={index}
                      className=" bg-[#e1e1e1]/25 max-w-xs w-full rounded-xl flex flex-col dark:bg-white/5  px-5 py-5 transition-all hover:shadow-md hover:bg-white/10"
                    >
                      <div className="flex-1">
                        <p className="px-0.5 h-4 w-48 bg-gray-500 rounded animate-pulse mb-4 "></p>
                        <p className="px-0.5 h-4 w-48 bg-gray-500 rounded animate-pulse mb-4 "></p>
                        <p className="px-0.5 h-4 w-48 bg-gray-500 rounded animate-pulse mb-4 "></p>
                      </div>

                      {/* League creator section - link to user's page. */}
                      <div className="mt-5 flex gap-x-3 items-center w-fit">
                        {/* User's profile picture or avatar on left */}
                        <div className="px-0.5 h-10 w-10 rounded-full bg-gray-500  animate-pulse mb-4 " />
                        {/* User's name & username on the right */}
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

          {/* If no notes are found */}
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
        </div>
      </div>
    </>
  );
};

export default Notes;
