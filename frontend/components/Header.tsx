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

          <Button variant="outline" className="hidden md:flex" onClick={() => router.push('/login')}>
            Sign In
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" onClick={() => router.push('/signup')}>
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  )
}
