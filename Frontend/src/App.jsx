import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";
import getCurrentUser from "./User_Hooks/getCurrentUser";

import Home from "./Pages/Home";
import AuthenticatedHome from "./Authenticated_Pages/AuthenticatedHome";
import SignIn from "./Authentication/SignIn";
import SignUp from "./Authentication/SignUp";
import useConnectWithSocket from "./SocketConnection/connectWithSocket";
import UserProfile from "./Authenticated_Pages/UserProfile";
import Members_Profile from "./Authenticated_Pages/Members_Profile";
import FindWorkspaceAndSendReq from "./Authenticated_Pages/FindWorkspaceAndSendReq";
import Workspace_Details from "./Authenticated_Pages/Workspace_Details";

const App = () => {
  // Get logged in user  
  getCurrentUser()

  // Get Current user data from redux :
  let { user, userLoading } = useSelector((state) => state.user)
  let {theme} = useSelector(state => state.theme)

  //Connect with socketIo (frontend to backend) :
  useConnectWithSocket()
  
  if (userLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-[#1f1f21]" : "bg-white"}`}>
        <Toaster position="top-center" />
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Toaster position="bottom-left" reverseOrder={false} />

      <Routes>
        {/* Unauthenticated routes */}
        <Route path="/" element={user ? <Navigate to="/authenticatedhome" replace /> : <Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected routes */}
        <Route path="/authenticatedhome" element={user ? <AuthenticatedHome /> : <Navigate to="/" replace />} />
        <Route path="/home" element={user ? <AuthenticatedHome /> : <Navigate to="/" replace />} />
        <Route path={`/user_profile`} element={user ? <UserProfile /> : <Navigate to="/" replace />} />

        {/* Workspace routes */}
        <Route path={`/workspace/home/:id`} element={user ? <AuthenticatedHome /> : <Navigate to="/" replace />} />
        <Route path={`/workspace/activity/:id`} element={user ? <AuthenticatedHome /> : <Navigate to="/" replace />} />
        <Route path={`/workspace/members/:id`} element={user ? <AuthenticatedHome /> : <Navigate to="/" replace />} />
        <Route path={`/workspace/member_profile/:workspaceid/:userid`} element={user ? <Members_Profile /> : <Navigate to="/" replace />} />
        <Route path={`/workspace/join/:userid`} element={user ? <FindWorkspaceAndSendReq /> : <Navigate to="/" replace />} />
        <Route path={`/workspace/details/:id`} element={user ? <Workspace_Details /> : <Navigate to="/" replace />} />   {/* id - workspace_id */}

        {/* Organization routes */}
        <Route path={`/organization/home/:id`} element={user ? <AuthenticatedHome /> : <Navigate to="/" replace />} />
        <Route path={`/organization/members/:id`} element={user ? <AuthenticatedHome /> : <Navigate to="/" replace />} />
        <Route path={`/organization/activity/:id`} element={user ? <AuthenticatedHome /> : <Navigate to="/" replace />} />
        <Route path={`/organization/boards/:id`} element={user ? <AuthenticatedHome /> : <Navigate to="/" replace />} />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to={user ? "/authenticatedhome" : "/"} replace />} />
      </Routes>
    </>
  )
}

export default App;