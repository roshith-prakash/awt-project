import "@/utils/pdfWorker";
import { TiArrowSortedUp } from "react-icons/ti";
import { Document, Page } from "react-pdf";
import { useEffect, useState } from "react";
import {
  ErrorStatement,
  Input,
  PrimaryButton,
  SecondaryButton,
} from "@/components";

import "react-pdf/dist/esm/Page/AnnotationLayer.css";

import "react-pdf/dist/esm/Page/TextLayer.css";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/utils/axios";
import { useDBUser } from "@/context/UserContext";
import { useNavigate, useParams } from "react-router-dom";
import AlertModal from "@/components/reuseit/AlertModal";
import toast from "react-hot-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BsThreeDotsVertical } from "react-icons/bs";
import { PopoverClose } from "@radix-ui/react-popover";
import { FaEye, FaTrash } from "react-icons/fa6";

function File() {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [inputPage, setInputPage] = useState("");

  const [fileName, setFileName] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

  const { fileId } = useParams();
  const { dbUser } = useDBUser();

  const [fileNameError, setFileNameError] = useState(0);

  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["file", fileId],
    queryFn: () => {
      return axiosInstance.post("/file/get-file-by-id", {
        fileId,
        userId: dbUser?.id,
      });
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: 60 * 1000 * 10,
    enabled: !!fileId,
  });

  useEffect(() => {
    if (data?.data?.file) {
      setFileName(data?.data?.file?.fileName);
    }
  }, [data?.data]);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  function nextPage() {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
  }

  function prevPage() {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  }

  function handleInputChange(e) {
    setInputPage(e.target.value);
  }

  function handlePageJump() {
    const targetPage = parseInt(inputPage);
    if (
      !isNaN(targetPage) &&
      targetPage >= 1 &&
      targetPage <= (numPages || 1)
    ) {
      setPageNumber(targetPage);
    }
    setInputPage("");
  }

  useEffect(() => {
    if (data?.data?.file?.fileName) {
      document.title = `${data?.data?.file?.fileName} | HootLearn`;
    } else document.title = `File | HootLearn`;
  }, [data?.data]);

  const deleteFile = () => {
    setIsDisabled(true);
    axiosInstance
      ?.post("/file/delete-file", {
        fileId: data?.data?.file?.assetId,
        userId: dbUser?.id,
      })
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: ["file", fileId],
        });
        queryClient.invalidateQueries({
          queryKey: ["numberOfFiles", dbUser?.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["files", dbUser?.id],
        });

        navigate("/files");
        setIsDisabled(false);
        toast("Deleted file.", { position: "bottom-right" });
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
        fileId: data?.data?.file?.assetId,
        userId: dbUser?.id,
        fileName: fileName,
      })
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: ["file", fileId],
        });
        queryClient.invalidateQueries({
          queryKey: ["files", dbUser?.id],
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

  return (
    <div className="min-h-screen mb-10">
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
          setIsRenameModalOpen(false);
        }}
        isOpen={isRenameModalOpen}
      >
        <div className="flex flex-col gap-y-2">
          {}
          <h1 className="dark:text-darkmodetext font-bold text-2xl">
            Rename this file
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Give your file a new name to help you find it later.
          </p>

          {}
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

      {data?.data && (
        <div className="max-w-[95%] md:max-w-3xl mx-auto flex flex-col">
          {}
          <div className="relative w-full mb-10 md:max-w-5xl mx-auto mt-10 px-4 py-6 bg-white dark:bg-white/5 rounded-xl shadow-sm">
            <p className="text-3xl pr-12 font-semibold">
              {data?.data?.file?.fileName}
            </p>
            {}
            <div className="absolute top-5 right-5">
              <Popover>
                <PopoverTrigger className="flex items-center cursor-pointer">
                  <BsThreeDotsVertical className="text-2xl" />
                </PopoverTrigger>

                <PopoverContent className="dark:bg-darkgrey dark:border-2 w-auto mt-2 mr-4 py-0 px-1">
                  <div className="py-1 min-w-32 flex flex-col gap-y-1">
                    <PopoverClose>
                      <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="cursor-pointer w-full flex items-center gap-x-3 justify-center hover:text-red-500 dark:hover:text-red-400 hover:bg-grey/50 dark:hover:bg-grey/5 py-1.5 transition-all"
                      >
                        <FaTrash />
                        <span className="-translate-x-1">Delete</span>
                      </button>
                    </PopoverClose>
                    <PopoverClose>
                      <button
                        onClick={() => setIsRenameModalOpen(true)}
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
          </div>

          {}
          <div className="w-fit mx-auto relative z-1 ">
            <Document
              file={data?.data?.file?.fileURL}
              onLoadSuccess={onDocumentLoadSuccess}
            >
              <div className="">
                <Page pageNumber={pageNumber} width={600} />
              </div>
            </Document>
          </div>

          {}
          <div className="flex flex-col items-center gap-2 py-4 px-4">
            <div className="flex items-center justify-between w-full max-w-md gap-4">
              {}
              <button
                onClick={prevPage}
                disabled={pageNumber <= 1}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-base transition 
        ${
          pageNumber <= 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white hover:bg-gray-50 border-gray-300 text-gray-700 dark:bg-secondary dark:text-white dark:hover:bg-white/15 dark:border-white/1 cursor-pointer"
        }`}
              >
                <TiArrowSortedUp className="rotate-[270deg]" />
                Prev
              </button>

              {}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={numPages || 1}
                  value={inputPage}
                  onChange={handleInputChange}
                  placeholder="Page"
                  className="w-20 px-2 py-1 border border-gray-300 rounded-md text-base"
                />

                <PrimaryButton
                  onClick={handlePageJump}
                  text="Go"
                  className="py-1 px-3 text-base"
                />
              </div>

              {}
              <button
                onClick={nextPage}
                disabled={pageNumber >= (numPages || 1)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-base transition 
        ${
          pageNumber >= (numPages || 1)
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white hover:bg-gray-50 border-gray-300 text-gray-700 dark:bg-secondary dark:text-white dark:hover:bg-white/15 dark:border-white/1 cursor-pointer"
        }`}
              >
                Next
                <TiArrowSortedUp className="rotate-90" />
              </button>
            </div>

            {}
            <p className="text-sm text-gray-600 dark:text-gray-200 mt-1">
              Page <span className="font-medium">{pageNumber}</span> of{" "}
              <span className="font-medium">{numPages}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default File;
