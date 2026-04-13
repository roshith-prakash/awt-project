import { useEffect, useRef, useState } from "react";
import useDebounce from "../utils/useDebounce.jsx";
import { Input, PrimaryButton, SecondaryButton } from "../components";
import { useInView } from "react-intersection-observer";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { axiosInstance } from "../utils/axios.js";
import { useDBUser } from "@/context/UserContext";
import AlertModal from "@/components/reuseit/AlertModal";
import { MAX_FILE_SIZE, maxNumberOfFiles } from "@/constants/constants";
import { IoIosSearch, IoMdAddCircleOutline } from "react-icons/io";
import { BsFileEarmarkPdfFill } from "react-icons/bs";
import dayjs from "dayjs";
import { Check, Trash2 } from "lucide-react";
import { IoCloudUploadOutline } from "react-icons/io5";
import toast from "react-hot-toast";

import { RxCross2 } from "react-icons/rx";

const FileSelectModal = ({ selectedFile, isOpen, onClose, onSelect }) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search);

  const [files, setFiles] = useState([]);

  const { dbUser } = useDBUser();

  const queryClient = useQueryClient();

  const fileRef = useRef(null);

  const { ref, inView } = useInView();

  useEffect(() => {
    document.title = "Your Files | HootLearn";
  }, []);

  const { data: numberOfFiles } = useQuery({
    queryKey: ["numberOfFiles", dbUser?.id],
    queryFn: () => {
      return axiosInstance.post("/file/get-number-of-files", {
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
    data: dbFiles,
    isLoading: loadingFiles,

    fetchNextPage: fetchNextFiles,
  } = useInfiniteQuery({
    queryKey: ["files", dbUser?.id, debouncedSearch],
    queryFn: ({ pageParam }) => {
      return axiosInstance.post("/file/get-files-for-user", {
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
      fetchNextFiles();
    }
  }, [inView, fetchNextFiles, dbFiles?.pages?.length]);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;

    setFiles((prevFiles) => {
      const existing = new Set(
        prevFiles.map(
          (file) => `${file.name}-${file.size}-${file.lastModified}`,
        ),
      );

      const filteredNewFiles = newFiles.filter((file) => {
        const uniqueKey = `${file.name}-${file.size}-${file.lastModified}`;
        const isDuplicate = existing.has(uniqueKey);
        const isTooLarge = file.size > MAX_FILE_SIZE;

        if (isTooLarge) {
          toast.error("Max size of file can be 5MB.");
        }

        return !isDuplicate && !isTooLarge;
      });

      return [...prevFiles, ...filteredNewFiles];
    });

    if (fileRef?.current) {
      fileRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (files?.length + numberOfFiles?.data?.fileCount > maxNumberOfFiles) {
      toast.error("File limit exceeded.", { position: "bottom-right" });
      return;
    }

    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("userId", dbUser?.id);

    setIsUploading(true);

    const uploadPromise = axiosInstance.post("/file/upload-files", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    await toast.promise(
      uploadPromise,
      {
        loading: "Uploading...",
        success: (res) => {
          queryClient.invalidateQueries({
            queryKey: ["files", dbUser?.id],
          });

          queryClient.invalidateQueries({
            queryKey: ["numberOfFiles", dbUser?.id],
          });

          setFiles([]);
          setIsUploading(false);
          console.log("Upload successful", res.data);
          return "Upload successful";
        },
        error: (err) => {
          setIsUploading(false);
          console.error("Upload failed", err);
          return "Upload failed";
        },
      },
      {
        position: "bottom-right",
      },
    );
  };

  const removeFile = (fileToRemove) => {
    setFiles((prevFiles) =>
      prevFiles.filter((file) => file.name !== fileToRemove.name),
    );
  };

  return (
    <>
      <AlertModal className="w-full" isOpen={isOpen} onClose={onClose}>
        <AlertModal
          onClose={() => {
            setIsUploadModalOpen(false);
          }}
          className="p-0"
          isOpen={isUploadModalOpen}
        >
          <div className="flex flex-col gap-6 p-6 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-white/10 rounded-lg">
                <IoCloudUploadOutline className="w-5 h-5 text-cta" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Upload Files
              </h1>
            </div>

            <input
              ref={fileRef}
              onChange={handleFileChange}
              type="file"
              className="hidden"
              multiple
              accept="application/pdf"
            />

            <div className="relative">
              <button
                disabled={isUploading}
                onClick={() => {
                  if (fileRef?.current) fileRef.current.click();
                }}
                className="w-full group relative overflow-hidden rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-cta dark:hover:border-darkmodeCTA transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="p-3 bg-gray-50 dark:bg-white/10 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-white/15 transition-colors duration-200 mb-4">
                    <IoCloudUploadOutline className="w-8 h-8 text-gray-400 group-hover:text-cta dark:group-hover:text-darkmodeCTA transition-colors duration-200" />
                  </div>
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isUploading ? "Uploading..." : "Click to upload files"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    PDF files only • Multiple files supported
                  </p>
                </div>
              </button>
            </div>

            {files && files.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selected Files ({files.length})
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto scroller pr-2">
                  {files.map((file, index) => {
                    const sizeInMB = file?.size / (1024 * 1024);
                    const displaySize =
                      sizeInMB > 0 && sizeInMB < 0.01
                        ? "0.01"
                        : sizeInMB.toFixed(2);

                    return (
                      <div
                        key={index}
                        className="flex relative items-center gap-3 p-3 bg-gray-50 dark:bg-white/10 rounded-lg border border-gray-200 dark:border-white/10"
                      >
                        <div className="p-1.5 bg-red-100 dark:bg-red-900/20 rounded">
                          <svg
                            className="w-4 h-4 text-red-600 dark:text-red-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1 max-w-xs text-gray-900 dark:text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {displaySize} MB
                          </p>
                        </div>

                        <button
                          onClick={() => removeFile(file)}
                          className="absolute right-2 p-2 bg-red-700 hover:scale-110 transition-all text-white dark:bg-red-800 cursor-pointer rounded"
                        >
                          <Trash2 className="h-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <PrimaryButton
                disabled={isUploading}
                disabledText="Uploading..."
                className="flex-1 justify-center"
                onClick={() => {
                  handleUpload();
                  setIsUploadModalOpen(false);
                }}
                text="Upload Files"
              />

              <SecondaryButton
                disabled={isUploading}
                disabledText="Please Wait..."
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setFiles([]);
                }}
                text="Cancel"
              />
            </div>
          </div>
        </AlertModal>

        <button
          onClick={() => onClose()}
          className="p-2 absolute top-7 right-5 rounded-lg bg-black/25 dark:bg-white/25 cursor-pointer"
        >
          <RxCross2 className="text-xl" />
        </button>

        <div className=" flex flex-col justify-between gap-4 ">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-hovercta font-title dark:text-darkmodeCTA text-3xl md:text-4xl font-medium">
              Files
            </h1>

            <p className="font-body bg-cta text-white px-4 py-1 rounded-full">
              {numberOfFiles?.data?.fileCount}/{maxNumberOfFiles} Files
            </p>
          </div>

          <SecondaryButton
            className="border-transparent dark:hover:!text-cta dark:disabled:hover:!text-gray-400 shadow-md"
            disabled={
              isUploading || numberOfFiles?.data?.fileCount == maxNumberOfFiles
            }
            text={
              <div className="flex gap-x-2 items-center">
                <IoMdAddCircleOutline className="text-2xl" />
                <span className="text-nowrap">Upload File</span>
              </div>
            }
            onClick={() => {
              if (numberOfFiles?.data?.fileCount >= maxNumberOfFiles) {
                toast.error("Max file limit reached!", {
                  position: "bottom-right",
                });
                return;
              }
              setIsUploadModalOpen(true);
            }}
          ></SecondaryButton>
        </div>

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

        {debouncedSearch && (
          <p className="font-medium py-5">
            Showing search results for &quot;{debouncedSearch}&quot;
          </p>
        )}

        {dbFiles && dbFiles?.pages?.[0]?.data?.files.length > 0 && (
          <div className="py-10 lg:px-5 flex justify-center flex-wrap gap-8">
            {dbFiles &&
              dbFiles?.pages?.map((page) => {
                return page?.data.files?.map((file) => {
                  if (file?.fileName) {
                    return (
                      <div
                        key={file?.assetId}
                        className=" bg-white relative overflow-hidden shadow-xl max-w-xs w-full rounded-xl flex flex-col dark:bg-white/5  px-5 py-5 transition-all cursor-pointer"
                        onClick={() => {
                          if (selectedFile?.assetId == file?.assetId) {
                            onSelect(null);
                          } else {
                            onSelect(file);
                          }
                        }}
                      >
                        <div className="flex pt-5 pb-10 justify-center items-center">
                          <BsFileEarmarkPdfFill className="text-6xl text-red-700" />
                        </div>
                        {selectedFile?.assetId == file?.assetId && (
                          <div className="absolute top-4 right-4 ">
                            <Check className="text-white bg-cta dark:bg-darkmodeCTA rounded-full  p-1" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-xl mb-4 mr-6 lg:mr-0 lg:pr-6 truncate font-semibold">
                            {file?.fileName}
                          </p>
                          <p className="text-md text-justify line-clamp-1 break-words dark:text-white/80 text-darkbg/70">
                            Uploaded on{" "}
                            {dayjs(new Date(file?.createdAt)).format(
                              "MMM DD, YYYY",
                            )}
                            .
                          </p>
                        </div>
                      </div>
                    );
                  }
                });
              })}
          </div>
        )}

        {loadingFiles && (
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

                    <div className="mt-5 flex gap-x-3 items-center w-fit">
                      <div className="px-0.5 h-10 w-10 rounded-full bg-gray-500  animate-pulse mb-4 " />

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

        {dbFiles && dbFiles?.pages?.[0]?.data?.files.length == 0 && (
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
    </>
  );
};

export default FileSelectModal;
