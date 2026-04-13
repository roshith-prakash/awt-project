import { useEffect, useRef, useState } from "react";
import useDebounce from "../utils/useDebounce.jsx";
import {
  ErrorStatement,
  Input,
  PrimaryButton,
  SecondaryButton,
} from "../components";
import { IoIosSearch, IoMdAddCircleOutline } from "react-icons/io";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../utils/axios.js";
import { useNavigate } from "react-router-dom";
import { useDBUser } from "@/context/UserContext";
import { BsFileEarmarkPdfFill, BsThreeDotsVertical } from "react-icons/bs";
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
import { IoCloudUploadOutline } from "react-icons/io5";
import dayjs from "dayjs";

import { Trash2 } from "lucide-react";
import { MAX_FILE_SIZE, maxNumberOfFiles } from "@/constants/constants";
import { cn } from "@/lib/utils";

const Files = () => {
  const [fileId, setFileId] = useState("");
  const [fileName, setFileName] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search);

  const [fileNameError, setFileNameError] = useState(0);

  const [files, setFiles] = useState([]);

  const { dbUser } = useDBUser();
  const navigate = useNavigate();

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
          toast.error("Max size of file can be 5MB.", {
            position: "bottom-right",
          });
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

  const deleteFile = () => {
    setIsDisabled(true);
    axiosInstance
      ?.post("/file/delete-file", { fileId: fileId, userId: dbUser?.id })
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: ["files", dbUser?.id],
        });

        queryClient.invalidateQueries({
          queryKey: ["numberOfFiles", dbUser?.id],
        });

        setIsDisabled(false);
        toast.success("Deleted file.", { position: "bottom-right" });
        setIsDeleteModalOpen(false);
      })
      .catch((err) => {
        toast.error("Could not delete file.", { position: "bottom-right" });
        setIsDisabled(false);
        console.log(err);
      });
  };

  const renameFile = () => {
    setFileNameError(0);

    if (fileName == null || fileName == undefined || fileName.length <= 0) {
      setFileNameError(1);
      return;
    } else if (fileName?.length > 50) {
      setFileNameError(2);
      return;
    }

    setFileNameError(0);

    axiosInstance
      ?.post("/file/update-file-name", {
        fileId: fileId,
        userId: dbUser?.id,
        fileName: fileName,
      })
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: ["files", dbUser?.id, debouncedSearch],
        });
        setIsDisabled(false);
        toast("Renamed file.", { position: "bottom-right" });
        setIsRenameModalOpen(false);
      })
      .catch((err) => {
        toast.error("Could not rename file.", { position: "bottom-right" });
        setIsDisabled(false);
        console.log(err);
      });
  };

  const removeFile = (fileToRemove) => {
    setFiles((prevFiles) =>
      prevFiles.filter((file) => file.name !== fileToRemove.name),
    );
  };

  return (
    <>
      {}
      <AlertModal
        onClose={() => {
          setIsDeleteModalOpen(false);
        }}
        isOpen={isDeleteModalOpen}
      >
        <div className="flex flex-col gap-y-2">
          {}
          <h1 className="dark:text-darkmodetext font-bold text-2xl">
            Are you sure you want to delete this file?
          </h1>

          {}
          <h2 className="dark:text-darkmodetext mt-1 text-base text-darkbg/80">
            This action cannot be reversed.
          </h2>

          {}
          <div className="mt-5 flex gap-x-5 justify-end">
            <PrimaryButton
              disabled={isDisabled}
              disabledText="Please Wait..."
              className="text-sm bg-red-500 border-red-500 hover:bg-red-600 hover:border-red-600 dark:bg-red-500 dark:border-red-500 dark:hover:bg-red-600 dark:hover:border-red-600"
              onClick={deleteFile}
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

      {}
      <AlertModal
        onClose={() => {
          setIsUploadModalOpen(false);
        }}
        className="p-0"
        isOpen={isUploadModalOpen}
      >
        <div className="flex flex-col gap-6 p-6 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          {}
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

          {}
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

          {}
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

          {}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <PrimaryButton
              disabled={isDisabled}
              disabledText="Uploading..."
              className="flex-1 justify-center"
              onClick={() => {
                handleUpload();
                setIsUploadModalOpen(false);
              }}
              text="Upload Files"
            />

            <SecondaryButton
              disabled={isDisabled}
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

      {}
      <AlertModal
        onClose={() => {
          setIsRenameModalOpen(false);
        }}
        isOpen={isRenameModalOpen}
      >
        <div className="flex flex-col gap-y-2">
          {}
          <h1 className="dark:text-darkmodetext font-bold text-2xl">
            Rename this file
          </h1>

          {}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Give your file a new name to help you find it later.
          </p>

          <Input
            value={fileName}
            onChange={(e) => {
              setFileName(e.target.value);

              if (
                e.target.value != null &&
                e.target.value != undefined &&
                e.target.value.length > 0 &&
                e.target.value?.length < 50
              ) {
                setFileNameError(0);
              }
            }}
            onBlur={(e) => {
              if (
                e.target.value == null ||
                e.target.value == undefined ||
                e.target.value.length <= 0
              ) {
                setFileNameError(1);
                return;
              } else if (e.target.value?.length > 50) {
                setFileNameError(2);
                return;
              }
            }}
            placeholder="Add Filename..."
          />

          {}
          <div className="flex w-full justify-between">
            <div>
              <ErrorStatement
                isOpen={fileNameError == 1}
                text={"Please enter filename."}
              />

              <ErrorStatement
                isOpen={fileNameError == 2}
                text={"Filename cannot exceed 50 characters."}
              />
            </div>
            <p
              className={`text-right mt-0.5 mr-0.5 ${
                fileName?.length > 50 && "text-red-500"
              }`}
            >
              {fileName?.length}/50
            </p>
          </div>

          {}
          <div className="mt-5 flex gap-x-5 justify-end">
            <PrimaryButton
              disabled={isDisabled}
              disabledText="Please Wait..."
              className="text-sm"
              onClick={renameFile}
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-y-4 md:gap-x-6 mb-6">
            {}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
              <h1 className="text-3xl md:text-4xl font-semibold font-title text-hovercta dark:text-darkmodeCTA">
                Files
              </h1>

              <div className="flex items-center gap-2 text-sm">
                <div className="bg-cta text-white dark:text-white px-4 py-1 rounded-full font-medium">
                  {numberOfFiles?.data?.fileCount}/{maxNumberOfFiles} Files
                </div>
              </div>
            </div>

            {}
            <SecondaryButton
              className={cn(
                "border-transparent shadow-md transition-all",
                "dark:hover:!text-cta dark:disabled:hover:!text-gray-400",
              )}
              disabled={
                isUploading ||
                numberOfFiles?.data?.fileCount === maxNumberOfFiles
              }
              text={
                <div className="flex items-center gap-2">
                  <IoMdAddCircleOutline className="text-2xl" />
                  <span>Upload File</span>
                </div>
              }
              onClick={() => {
                if (numberOfFiles?.data?.fileCount >= maxNumberOfFiles) {
                  toast.error("Max file limit reached!");
                  return;
                }
                setIsUploadModalOpen(true);
              }}
            />
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
          {dbFiles && dbFiles?.pages?.[0]?.data?.files.length > 0 && (
            <div className="py-10 lg:px-5 flex justify-center flex-wrap gap-8">
              {dbFiles &&
                dbFiles?.pages?.map((page) => {
                  return page?.data.files?.map((file) => {
                    if (file?.fileName) {
                      return (
                        <div
                          key={file?.assetId}
                          className="group bg-white relative overflow-hidden shadow-xl max-w-xs w-full rounded-xl flex flex-col dark:bg-white/5 hover:scale-105 duration-150  px-5 py-5 transition-all cursor-pointer"
                          onClick={() => navigate(`/files/${file?.assetId}`)}
                        >
                          <div className="flex pt-5 pb-10 justify-center items-center">
                            <BsFileEarmarkPdfFill className="text-6xl text-red-700" />
                          </div>
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
                                        setFileId(file?.assetId);
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
                                        setFileId(file?.assetId);
                                        setFileName(file?.fileName);
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
                          {}
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cta via-pink-400 to-purple-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
                        </div>
                      );
                    }
                  });
                })}
            </div>
          )}

          {}
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
        </div>
      </div>
    </>
  );
};

export default Files;
