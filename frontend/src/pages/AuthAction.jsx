import ResetPassword from "./ResetPassword.jsx";
import VerifyEmail from "./VerifyEmail.jsx";

export default function AuthAction() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");

  if (mode === "resetPassword") {
    return <ResetPassword />;
  }

  if (mode === "verifyEmail") {
    return <VerifyEmail />;
  }

  return <p>Invalid or unsupported action.</p>;
}
