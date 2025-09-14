"use client";

import Link from 'next/link'
import { Button } from './ui/button'
import { createClient } from '../../supabase/client'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import UserProfile from './user-profile'
import { Phone, Zap } from 'lucide-react'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <nav className="w-full border-b border-gray-200 bg-white py-4 shadow-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-4 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" prefetch className="flex items-center space-x-2 group">
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Zap className="w-2 h-2 text-white" />
            </div>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Numsphere
          </span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link href="#features" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
            Features
          </Link>
          <Link href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
            Pricing
          </Link>
          <Link href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
            Contact
          </Link>
        </div>

        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all">
                  Dashboard
                </Button>
              </Link>
              <UserProfile />
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600 hover:bg-blue-50">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}