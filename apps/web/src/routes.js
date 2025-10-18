// Material Dashboard 2 React layouts
import Dashboard from "layouts/dashboard";
import Tables from "layouts/tables";
import Billing from "layouts/billing";
import RTL from "layouts/rtl";
import Notifications from "layouts/notifications";
import Profile from "layouts/profile";
import SignIn from "layouts/authentication/sign-in";
import SignUp from "layouts/authentication/sign-up";
import SignOut from "layouts/authentication/sign-out";

// @mui icons
import Icon from "@mui/material/Icon";

// Import ProtectedRoute
import ProtectedRoute from "components/ProtectedRoute";

const routes = [
  {
    type: "collapse",
    name: "Gerenciar Usuários",
    key: "dashboard",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "/dashboard",
    component: <ProtectedRoute component={<Dashboard />} />,
  },
  {
    type: "collapse",
    name: "Pagamentos",
    key: "billing",
    icon: <Icon fontSize="small">payment</Icon>,
    route: "/billing",
    component: <ProtectedRoute component={<Billing />} />,
  },
  {
    type: "collapse",
    name: "Configurações",
    key: "profile",
    icon: <Icon fontSize="small">person</Icon>,
    route: "/profile",
    component: <ProtectedRoute component={<Profile />} />,
  },
  {
    route: "/authentication/sign-in",
    component: <SignIn />,
  },
  {
    route: "/authentication/sign-up",
    component: <SignUp />,
  },
  {
    type: "collapse",
    name: "Sair",
    key: "sign-out",
    icon: <Icon fontSize="small">assignment</Icon>,
    route: "/authentication/sign-out",
    component: <SignOut />,
  },
];

export default routes;
