import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import getCurrentUser from "./User_Hooks/getCurrentUser";

import Home from "./Pages/Home";
import AuthenticatedHome from "./Authenticated_Pages/AuthenticatedHome";
import SignIn from "./Authentication/SignIn";
import SignUp from "./Authentication/SignUp";
import useConnectWithSocket from "./SocketConnection/connectWithSocket";

const App = () => {
  // Get logged in user  
  getCurrentUser()

  // Get Current user data from redux :
  let { user, userLoading } = useSelector((state) => state.user)
  
  //Connect with socketIo (frontend to backend) :
  useConnectWithSocket()

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Unauthenticated routes */}
      <Route path="/" element={user ? <Navigate to="/authenticatedhome" replace /> : <Home />} /> 
      <Route path="/signin"  element={user ? <Navigate to="/authenticatedhome" replace /> : <SignIn />} />
      <Route path="/signup" element={user ? <Navigate to="/authenticatedhome" replace /> : <SignUp />} />

      {/* Protected routes */}
      <Route path="/authenticatedhome" element={user ? <AuthenticatedHome /> : <Navigate to="/" replace />} />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to={user ? "/authenticatedhome" : "/"} replace />} />
    </Routes>
  )
}

export default App;