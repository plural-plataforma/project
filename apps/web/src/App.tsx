import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoutes from "./components/ProtectedRoutes";
import ChangePassword from "./pages/User/ChangePassword"; 
import Register from "./pages/User/Register";
import SkillsList from "./pages/Skills/SkillsList";
import SkillsEdit from "./pages/Skills/EditSkill";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />
        <Route path="/dashboard"        element={<ProtectedRoutes><Dashboard /></ProtectedRoutes>}  />
        <Route path="/skills"           element={<ProtectedRoutes><SkillsList /></ProtectedRoutes>} />
        <Route path="/skills/edit"  element={<ProtectedRoutes><SkillsEdit /></ProtectedRoutes>} />
        <Route path="/change-password"  element={<ProtectedRoutes><ChangePassword /></ProtectedRoutes>}/>
        <Route path="/register"         element={<Register />}/>
      
      </Routes>
    </BrowserRouter>
  );
}

export default App;
