import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function SignOut() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("token"); // Remove o token
    // Força o redirecionamento apenas uma vez
    navigate("/authentication/sign-in", { replace: true });
  }, [navigate]);

  return null; // Não renderiza nada
}

export default SignOut;
