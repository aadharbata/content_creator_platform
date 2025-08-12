"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface SearchSectionProps {
  language: "en" | "hi"
  translations: any
  categories?: any[]
}

export default function SearchSection({ language, translations, categories = [] }: SearchSectionProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const router = useRouter()

  const searchPlaceholder = language === 'hi' 
    ? 'प्रोडक्ट्स खोजें...' 
    : 'Search products...'

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const params = new URLSearchParams()
      params.set('search', searchQuery.trim())
      if (selectedCategory !== 'all') {
        params.set('type', selectedCategory)
      }
      router.push(`/products-store?${params.toString()}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleCategorySearch = (categoryName: string) => {
    setSelectedCategory(categoryName)
    const params = new URLSearchParams()
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim())
    }
    if (categoryName !== 'all') {
      params.set('type', categoryName)
    }
    router.push(`/products-store?${params.toString()}`)
  }

  return (
    <section className="relative py-8 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-6 h-6" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-16 pr-6 py-6 text-lg rounded-2xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 shadow-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <Button 
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl"
            >
              {language === 'hi' ? 'खोजें' : 'Search'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
