import toast from 'react-hot-toast'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { setUser } from '../Redux_Store/userSlice'
import { useNavigate } from 'react-router-dom'
import Auth_Navbar from '@/Authenticated_Components/Auth_Navbar'

const AuthenticatedHome = () => {
  let dispatch = useDispatch()
  let navigate = useNavigate()


  return (
    <>
      <div> <Auth_Navbar /> </div>

    </>
  )
}

export default AuthenticatedHome
