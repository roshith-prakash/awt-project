import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDBUser } from "@/context/UserContext";
import {
  PrimaryButton,
  ErrorStatement,
  Input,
  SecondaryButton,
} from "@/components";
import { useNavigate } from "react-router-dom";
import { sendEmailVerification } from "firebase/auth";
import { toast } from "react-hot-toast";
import { auth } from "../firebase/firebase.js";
import { IoCloudUploadOutline } from "react-icons/io5";
import { axiosInstance } from "@/utils/axios";
import { isValidUsername } from "@/utils/regexFunctions";
import { MdOutlineAccountCircle } from "react-icons/md";

import Cropper from "react-easy-crop";
import getCroppedImg from "../utils/cropImage.js";
import Modal from "@/components/reuseit/Modal";
import { compressImage } from "@/utils/compressImage";

const Onboarding = () => {
  const navigate = useNavigate();

  const { dbUser, fetchUser } = useDBUser();

  const { currentUser } = useAuth();

  const fileRef = useRef(null);

  const [name, setName] = useState("");

  const [image, setImage] = useState("");

  const [username, setUsername] = useState("");

  const [disabled, setDisabled] = useState(false);

  const [error, setError] = useState({
    name: 0,
    username: 0,
  });

  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    document.title = "Onboarding | HootLearn";
  }, []);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser?.displayName ? currentUser?.displayName : "");
      setImage(currentUser?.photoURL ? currentUser?.photoURL : "");
    }
  }, [currentUser]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setShowCropper(true);

    if (fileRef?.current) fileRef.current.value = null;
  };

  const sendVerification = () => {
    const user = auth.currentUser;
    sendEmailVerification(user)
      .then(() => {
        toast("Email Verification Link sent.");
      })
      .catch(() => {
        toast.error("Something went wrong.");
      });
  };

  const handleSubmit = () => {
    setError({
      name: 0,
      username: 0,
    });

    if (name == null || name == undefined || name.length <= 0) {
      setError((prev) => ({ ...prev, name: 1 }));
      return;
    } else if (name.length > 30) {
      setError((prev) => ({ ...prev, name: 2 }));
      return;
    } else if (
      username == null ||
      username == undefined ||
      username.length <= 0
    ) {
      setError((prev) => ({ ...prev, username: 1 }));
      return;
    } else if (username.length > 20) {
      setError((prev) => ({ ...prev, username: 3 }));
      return;
    } else if (!isValidUsername(username)) {
      setError((prev) => ({ ...prev, username: 4 }));
      return;
    }

    setDisabled(true);

    axiosInstance
      .post("/user/check-username", { username: username?.toLowerCase() })
      .then(async (res) => {
        if (res.data?.exists) {
          setDisabled(false);
          setError((prev) => ({ ...prev, username: 2 }));
          return;
        } else {
          const formData = new FormData();

          if (typeof image != "string") {
            const compressedFile = await compressImage(image);
            formData.append("file", compressedFile);
          }

          const obj = {
            ...currentUser,
            username: username?.toLowerCase(),
            name: name,
            image: typeof image == "string" ? image : null,
          };

          formData.append("user", JSON.stringify(obj));

          axiosInstance
            .post("/user/create-user", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            })
            .then(() => {
              setDisabled(false);
              fetchUser();
              navigate("/");
            })
            .catch(() => {
              toast.error("Something went wrong!");

              setDisabled(false);
            });
        }
      })
      .catch((err) => {
        setDisabled(false);
        toast.error("Something went wrong.");
        console.log(err);
        return;
      });
  };

  if (!currentUser) {
    return (
      <div>
        <div className="min-h-[70vh] md:min-h-[65vh] dark:bg-darkbg dark:text-darkmodetext lg:min-h-[60vh] flex items-center justify-center pt-12 pb-32">
          <div>
            {}
            <p className="text-3xl lg:text-4xl px-5 text-center mt-14">
              You have not signed in!
            </p>
            <div className="mt-10 flex flex-col gap-10 justify-center items-center">
              {}
              <img
                src={
                  "https://res.cloudinary.com/do8rpl9l4/image/upload/v1736738810/notfound_eqfykw.svg"
                }
                className="max-w-[50%] lg:max-w-[40%] pointer-events-none"
              />

              {}
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
      <div>
        <div className="min-h-[70vh] md:min-h-[65vh] dark:bg-darkbg dark:text-darkmodetext lg:min-h-[60vh] flex items-center justify-center pt-12 pb-32">
          <div>
            {}
            <p className="text-3xl lg:text-4xl px-5 text-center mt-14">
              Verify Email by clicking link in your mailbox!
            </p>
            <div className="mt-10 flex flex-col gap-10 justify-center items-center">
              {}
              <img
                src={
                  "https://res.cloudinary.com/do8rpl9l4/image/upload/v1736738810/notfound_eqfykw.svg"
                }
                className="max-w-[50%] lg:max-w-[40%] pointer-events-none"
              />

              {}
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
                      <p>Reload the page</p>
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

  if (dbUser) {
    return (
      <div>
        <div className="min-h-[70vh] dark:bg-darkbg dark:text-darkmodetext md:min-h-[65vh] lg:min-h-[60vh] flex items-center justify-center pt-12 pb-32">
          <div>
            {}
            <p className="text-3xl lg:text-4xl px-5 text-center mt-14">
              You have already created your profile!
            </p>
            <div className="mt-10 flex flex-col gap-10 justify-center items-center">
              {}
              <img
                src={
                  "https://res.cloudinary.com/do8rpl9l4/image/upload/v1736738810/notfound_eqfykw.svg"
                }
                className="max-w-[50%] lg:max-w-[40%] pointer-events-none"
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
      </div>
    );
  }

  return (
    <div>
      {showCropper && selectedFile && (
        <Modal
          className="px-0 py-0 pb-5"
          isOpen={showCropper}
          onClose={() => setShowCropper(false)}
        >
          <div className="relative w-full h-[400px] bg-black">
            <Cropper
              image={URL.createObjectURL(selectedFile)}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedAreaPixels) => {
                setCroppedAreaPixels(croppedAreaPixels);
              }}
            />
          </div>
          <div className="flex justify-end px-5 gap-4 mt-4">
            <PrimaryButton
              onClick={async () => {
                const croppedImage = await getCroppedImg(
                  URL.createObjectURL(selectedFile),
                  croppedAreaPixels,
                );
                setImage(croppedImage);
                setShowCropper(false);
              }}
              text="Crop & Use"
            ></PrimaryButton>
            <SecondaryButton
              text="Cancel"
              onClick={() => setShowCropper(false)}
            ></SecondaryButton>
          </div>
        </Modal>
      )}
      <div className=" min-h-[70vh] md:min-h-[65vh] lg:min-h-[60vh] flex items-center justify-center pt-12 pb-20">
        <div className="bg-white dark:bg-secondarydarkbg w-full dark:bg-darkgrey dark:text-darkmodetext border-[1px] max-w-[95%] md:max-w-3xl md:mt-5 lg:mt-5 p-5 md:px-20 shadow-xl rounded-xl pb-10">
          {}
          <h1 className="dark:text-darkmodetext pt-5 font-bold text-2xl text-center">
            Let's get to know you
          </h1>

          {}
          <h2 className="dark:text-darkmodetext mt-1 text-sm text-darkbg/70 text-center">
            Tell us your name and choose a username to get started.
          </h2>

          {}
          <div className="mt-10 flex flex-col items-center gap-y-5">
            <input
              className="hidden"
              type="file"
              ref={fileRef}
              accept="image/jpg, image/jpeg, image/png"
              onChange={handleFileChange}
            />

            <div className="flex justify-center">
              {image ? (
                <img
                  src={
                    typeof image == "string"
                      ? image
                      : URL.createObjectURL(image)
                  }
                  className="h-24 w-24 rounded-full"
                />
              ) : (
                <MdOutlineAccountCircle className="text-[8rem]" />
              )}
            </div>
            <button
              onClick={() => {
                if (fileRef?.current) fileRef.current.click();
              }}
              className="cursor-pointer hover:bg-hovercta dark:hover:bg-cta hover:border-hovercta hover:text-white dark:hover:border-cta border-darkbg/25 dark:border-white/25 border-1 flex  gap-x-2 py-2 justify-center items-center px-14 shadow rounded-lg font-medium active:shadow transition-all disabled:text-greyText"
            >
              Upload <IoCloudUploadOutline className="translate-y-0.5" />
            </button>
          </div>

          {}
          <div className="mt-14 flex flex-col gap-y-8 lg:gap-x-5">
            {}
            <div className="lg:flex-1 px-2">
              <p className="font-medium">Name</p>
              <Input
                value={name}
                className="focus:border-darkbg dark:focus:border-white transition-all"
                onChange={(e) => {
                  setName(e.target.value);
                  if (
                    e.target.value != null &&
                    e.target.value != undefined &&
                    e.target.value.length > 0 &&
                    e.target.value.length < 30
                  ) {
                    setError((prev) => ({ ...prev, name: 0 }));
                    return;
                  }
                }}
                onBlur={() => {
                  if (name == null || name == undefined || name.length <= 0) {
                    setError((prev) => ({ ...prev, name: 1 }));
                    return;
                  } else if (name.length > 30) {
                    setError((prev) => ({ ...prev, name: 2 }));
                    return;
                  } else {
                    setError((prev) => ({ ...prev, name: 0 }));
                  }
                }}
                placeholder={"Enter your name"}
              />

              <ErrorStatement
                isOpen={error.name == 1}
                text={"Please enter your name."}
              />

              <ErrorStatement
                isOpen={error.name == 2}
                text={"Name cannot exceed 30 characters."}
              />
            </div>

            {}
            <div className="lg:flex-1 px-2">
              <p className="font-medium">Username</p>
              <Input
                className="focus:border-darkbg dark:focus:border-white transition-all"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);

                  if (
                    e.target.value != null &&
                    e.target.value != undefined &&
                    e.target.value.length > 0 &&
                    username.length < 20 &&
                    isValidUsername(username)
                  ) {
                    setError((prev) => ({ ...prev, username: 0 }));
                    return;
                  }
                }}
                onBlur={() => {
                  if (
                    username == null ||
                    username == undefined ||
                    username.length <= 0
                  ) {
                    setError((prev) => ({ ...prev, username: 1 }));
                    return;
                  } else if (username.length > 20) {
                    setError((prev) => ({ ...prev, username: 3 }));
                    return;
                  } else if (!isValidUsername(username)) {
                    setError((prev) => ({ ...prev, username: 4 }));
                    return;
                  } else {
                    setError((prev) => ({ ...prev, username: 0 }));
                  }
                }}
                placeholder={"Enter a username"}
              />

              <ErrorStatement
                isOpen={error.username == 1}
                text={"Please enter a username."}
              />

              <ErrorStatement
                isOpen={error.username == 2}
                text={"Username already exists."}
              />

              <ErrorStatement
                isOpen={error.username == 3}
                text={"Username cannot exceed 20 characters."}
              />

              <ErrorStatement
                isOpen={error.username == 4}
                text={"Username can contain alphabets, numbers and underscore."}
              />
            </div>
          </div>

          {}
          <div className="mt-10 flex justify-center items-center">
            <PrimaryButton
              className="w-full max-w-md"
              onClick={handleSubmit}
              disabled={disabled}
              disabledText={"Please Wait..."}
              text={"Submit"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
