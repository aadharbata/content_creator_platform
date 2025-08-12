"use client"
import { BookOpen, ChevronDown, Sun, Moon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/contexts/LanguageContext"
import { useDarkMode } from "@/lib/contexts/DarkModeContext"

interface HeaderProps {
  language: "en" | "hi"
  setLanguage: (language: "en" | "hi") => void
  translations: any
}

export default function Header({ language, setLanguage, translations }: HeaderProps) {
  const t = translations[language]
  const router = useRouter()
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo placeholder removed per request */}
        <div />

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#explore" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer">
            Explore Creators
          </a>
          <a href="#how-it-works" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer">
            How it works
          </a>
          <a href="#benefits" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer">
            Benefits
          </a>
        </nav>

        {/* Right side controls */}
        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <Select value={language} onValueChange={(value: "en" | "hi") => setLanguage(value)}>
            <SelectTrigger className="w-32 bg-transparent border-gray-300 dark:border-gray-600 cursor-pointer">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिंदी</SelectItem>
            </SelectContent>
          </Select>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Login Button */}
          <button
            onClick={() => router.push('/login')}
            className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer px-4 py-2 rounded-lg font-medium"
          >
            {language === 'hi' ? 'लॉगिन' : 'Login'}
          </button>

          {/* Sign Up Button */}
          <button
            onClick={() => router.push('/signup')}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 cursor-pointer"
          >
            <span>{language === 'hi' ? 'साइन अप' : 'Sign Up'}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
