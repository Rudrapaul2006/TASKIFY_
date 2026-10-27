import { setWorkspaceMembers, setWorkspaceMembersCount } from "@/Redux_Store/workspaceSlice"
import axios from "axios"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useParams } from "react-router-dom"


const WorkspaceHome = () => {

  let dispatch = useDispatch()

  let params = useParams()
  let workspace_id = params.id

  let { workspace, workspaceMembers, workspaceMembersCount } = useSelector(state => state.workspace)
  let { theme } = useSelector(state => state.theme)
  let dark = theme === "dark"

  // Get Members of each workspace :
  useEffect(() => {
    if (!workspace_id) return

    let getAllMembers = async () => {
      try {
        let res = await axios.get(`${import.meta.env.VITE_workspace_endpoint}/get_all_members/${workspace_id}`, { withCredentials: true })

        if (res.data.success) {
          dispatch(setWorkspaceMembers(res.data.allMembers))
          dispatch(setWorkspaceMembersCount(res.data.membersCount))
        }
      } catch (error) {
        console.log(error)
      }
    }

    getAllMembers()
  }, [dispatch, workspace_id])

  return (
    <div className="grid grid-cols-1  gap-4 lg:gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { content: "All Members", value: workspaceMembersCount },
        { content: "Total Organizations", value: '_' },
        { content: "Total Tasks", value: '_' },
        { content: "Completed Tasks", value: '_' }
      ].map(({ content, value }) => (

        <div
          key={content}
          className={`flex items-center justify-between rounded-xl border p-7 lg:p-5 shadow-sm ${dark ? "border-[#3A3A3D] bg-[#1F1F21]" : "border-[#E5E7EB] bg-white"}`}
        >
          <div>
            <p className={`text-[15px] font-bold lg:text-md  ${dark ? "text-slate-400" : "text-slate-500"}`}>{content}</p>
            <p className={`mt-2 text-3xl font-bold leading-none tracking-tight ${dark ? "text-slate-100" : "text-slate-800"}`}
            >
              {value}
            </p>
          </div>
        </div>

      ))}
    </div>
  )
}

export default WorkspaceHome
