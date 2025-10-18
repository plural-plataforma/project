import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";

const ProtectedRoute = ({ component }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/authentication/sign-in" replace />;
  }

  return component;
};

ProtectedRoute.propTypes = {
  component: PropTypes.element.isRequired,
};

export default ProtectedRoute;
