// src/utils/auth.ts
import { useNavigate } from "react-router-dom";

export const SignOut = () => {
  const navigate = useNavigate();

  const signOut = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    navigate("/", { replace: true });
  };

  return signOut;
};
