import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Auth_Navbar from '@/Authenticated_Components/Auth_Navbar'
import { getSocket } from '@/SocketConnection/socket'
import getAllWorkspace from '@/Workspace_Hooks/getAllWorkspace'
import Sidebar from '@/Components/Sidebar'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import WorkspaceMembers from './WorkspaceMembers'
import WorkspaceHome from './WorkspaceHome'
import WorkspaceActivity from './WorkspaceActivity'
import { Briefcase, UserPlus, Building2, KanbanSquare, ArrowRight, ArrowDown } from "lucide-react"
import No_workspace_home from './No_workspace_home'


const AuthenticatedHome = () => {
  // Hooks 
  getAllWorkspace() // get each user's workspaces

  // Get socket
  let socket = getSocket()

  let { theme } = useSelector((state) => state.theme)
  let { workspace, workspaceLoading, hasFetchedWorkspaces } = useSelector((state) => state.workspace)

  let dispatch = useDispatch()
  let navigate = useNavigate()

  // Route & search parameters
  let { id } = useParams()
  let location = useLocation()
  let queryParams = new URLSearchParams(location.search)
  let activeWorkspaceId = id || queryParams.get('activeWorkspaceId')

  let isMembersPage = location.pathname.startsWith('/workspace/members')
  let isActivityPage = location.pathname.startsWith('/workspace/activity')


  let hasWorkspaces = Boolean(workspace && workspace.length > 0)


  // Redirection handling:
  // If user has workspaces, redirect to workspace home page
  // If user does not have workspaces, stay on blank page (/authenticatedhome)
  useEffect(() => {
    if (!hasFetchedWorkspaces) return

    if (hasWorkspaces) {
      let savedWsId = typeof window !== "undefined" ? window.localStorage.getItem("selectedWorkspaceId") : null

      let matchedWs = workspace.find((ws) => {
        let wsData = ws?.workspace || ws
        let wsId = wsData?._id || ws?._id
        return wsId === savedWsId
      }) || workspace[0]

      let matchedWsData = matchedWs?.workspace || matchedWs
      let targetWsId = matchedWsData?._id || matchedWs?._id

      if (targetWsId) {
        if (location.pathname === '/authenticatedhome') {
          navigate(`/workspace/home/${targetWsId}`, { replace: true })
        }
      }
    } else {
      // User has no workspaces: if on a workspace-specific route, redirect to blank /authenticatedhome
      if (location.pathname.startsWith('/workspace/')) {
        navigate('/authenticatedhome', { replace: true })
      }
    }
  }, [hasFetchedWorkspaces, workspace, location.pathname, navigate])

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${theme === 'dark' ? 'bg-[#1a1a1b] text-slate-100' : 'bg-gray-50 text-slate-900'}`}>

      <Auth_Navbar />


      <div className="flex-1 flex overflow-hidden relative min-h-0">

        <Sidebar />


        {/* Main Content Area */}
        <main className={`flex-1 transition-all duration-300 ${theme === 'dark' ? 'bg-[#1a1a1b]' : 'bg-gray-50'} ${hasWorkspaces ? 'p-8' : ''} ${isMembersPage ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>

          {workspaceLoading && !hasFetchedWorkspaces ? (

            <div className={`h-full flex items-center justify-center ${theme === 'dark' ? 'bg-[#1a1a1be8]' : 'bg-gray-100'}`}>
                <div className={`h-10 w-10 animate-spin rounded-full border-4 border-t-transparent ${theme === 'dark' ? 'border-blue-400' : 'border-blue-600'}`}></div>
                <div className="text-center">
                  <p className="font-semibold">Getting your workspace ready</p>
                  <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Loading your Taskify spaces…</p>
                </div>
            </div>

          ) : !hasWorkspaces ? (

            <No_workspace_home />

          ) : isMembersPage ? (

            <WorkspaceMembers />

          ) : isActivityPage ? (

            <WorkspaceActivity activeWorkspaceId={activeWorkspaceId} />

          ) : (

            <WorkspaceHome />

          )}
        </main>

      </div>
    </div>
  )
}

export default AuthenticatedHome
