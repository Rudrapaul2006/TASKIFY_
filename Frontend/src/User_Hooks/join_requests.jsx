import { set_user_join_request_loading, set_user_join_requests } from '@/Redux_Store/workspaceSlice'
import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const join_requests = (activityPage) => {
  let dispatch = useDispatch()
  let { search_user_join_request, sort_user_join_request } = useSelector(state => state.workspace)

  useEffect(() => {
    if (activityPage) return

    let fetch_user_join_requests = async () => {
      try {
        dispatch(set_user_join_request_loading(true))
        let res = await axios.get(`${import.meta.env.VITE_workspace_endpoint}/sended_join_request?query=${search_user_join_request}&sort=${sort_user_join_request}`, { withCredentials: true })

        if (res.data.success) {
          dispatch(set_user_join_requests(res.data.sentRequests || []))
        }
      } catch (error) {
        console.log(error)
        dispatch(set_user_join_requests([]))
      } finally {
        dispatch(set_user_join_request_loading(false))
      }
    }

    fetch_user_join_requests()

  }, [dispatch, search_user_join_request, sort_user_join_request, activityPage])
}

export default join_requests
