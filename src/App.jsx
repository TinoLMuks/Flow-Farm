import DashboardLayout from "./components/dashboard/DashboardLayout";
import { Routes, Route } from "react-router-dom";

import SignIn from "./components/auth/SignIn";
import SignUp from "./components/auth/SignUp";
import NewPassword from "./components/auth/NewPassword";
import ForgotPassword from "./components/auth/ForgotPassword";
import CheckEmail from "./components/auth/CheckEmail";

import Analytics from "./components/dashboard/analytics";
import Overview from "./components/dashboard/Overview";
import ThresholdSettings from "./components/dashboard/ThresholdSettings";
import Messages from "./components/dashboard/Messages";
function App() {
  return (
    <Routes>

      {/* Auth Pages */}
      <Route path="/" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/newpassword" element={<NewPassword />} />
      <Route path="/forgotpassword" element={<ForgotPassword />} />
      <Route path="/checkemail" element={<CheckEmail />} />

      {/* Dashboard Layout */}
      <Route path="/dashboard" element={<DashboardLayout />}>

        <Route index element={<Overview/>} />
        <Route path="overview" element={<Overview />} /> 
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<ThresholdSettings />} />
        <Route path="messages" element={<Messages />} />
            
      </Route>

    </Routes>
  );
}

export default App;
