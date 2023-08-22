'use client'

import { ButtonHTMLAttributes, FC, useState } from 'react'
import Button from './ui/Button'
import { signOut } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { Loader2, LogOutIcon } from 'lucide-react'

interface SignOutbuttonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

const SignOutbutton: FC<SignOutbuttonProps> = ({...props}) => {

  const [isSigningOut, setIsSigningOut] = useState<boolean>(false)
  return <Button {...props} variant='ghost' onClick={async () => {
    setIsSigningOut(true)
    try {
        await signOut()
    } catch (error) {
        toast.error("Failed to sign out")
    }
    finally {
        setIsSigningOut(false)
    }
  }}>
    {isSigningOut ? (
        <Loader2 className='animate-spin h-4 w-4'/>
    ):(
        <LogOutIcon className='h-4 w-4'/>
    )}
  </Button>
}

export default SignOutbutton