"use client"

import Link from "next/link"

export function Logo() {
  return (
    <Link href="/dashboard" className="block">
      <div className="flex flex-col items-center justify-center p-0 w-full cursor-pointer hover:opacity-80 transition-opacity">
        <div className="w-full max-w-[220px] h-auto relative">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/d564ec13239d5c1799531ef1848996b662872d49114546a263e9d37f15ecffce.PNG-r7C430MzLG3SlbUQqG3Z2LeeKTNFbU.png"
            alt="Homeschool Hub Logo"
            className="w-full h-auto object-contain"
          />
        </div>
      </div>
    </Link>
  )
}
