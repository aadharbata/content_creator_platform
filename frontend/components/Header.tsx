"use client"
import { BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

interface HeaderProps {
  language: "en" | "hi"
  setLanguage: (language: "en" | "hi") => void
  translations: any
}

export default function Header({ language, setLanguage, translations }: HeaderProps) {
  const t = translations[language]
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-white/20">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            LearnHub
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={language} onValueChange={(value: "en" | "hi") => setLanguage(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">🇺🇸 English</SelectItem>
              <SelectItem value="hi">🇮🇳 हिंदी</SelectItem>
            </SelectContent>
          </Select>

          <div
            className="px-6 py-3 bg-purple-500 text-white font-semibold rounded-lg shadow-md hover:bg-purple-600 transition-colors duration-300"
          >
            <span
              className="cursor-pointer hover:text-purple-200"
              onClick={() => router.push('/login')}
            >
              CREATOR LOGIN
            </span>
            <span className="mx-2">/</span>
            <span
              className="cursor-pointer hover:text-purple-200"
              onClick={() => router.push('/signup')}
            >
              SIGN UP
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
