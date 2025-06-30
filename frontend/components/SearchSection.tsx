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
  categories: any[]
}

export default function SearchSection({ language, translations, categories }: SearchSectionProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const t = translations[language]
  const router = useRouter()

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Build URL with search parameters
      const params = new URLSearchParams()
      params.set('search', searchQuery.trim())
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory)
      }
      
      // Redirect to home page with search results
      router.push(`/home?${params.toString()}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleCategorySearch = (categoryName: string) => {
    setSelectedCategory(categoryName)
    
    // Immediate search when category is selected
    const params = new URLSearchParams()
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim())
    }
    if (categoryName !== 'all') {
      params.set('category', categoryName)
    }
    
    router.push(`/home?${params.toString()}`)
  }

  return (
    <section className="py-16 bg-white/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
            <Input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-16 pr-6 py-6 text-lg rounded-2xl border-2 border-gray-200 focus:border-blue-500 shadow-lg"
            />
            <Button 
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl"
            >
              Search
            </Button>
          </div>

          <p className="text-center text-gray-600 mt-4 text-lg">{t.browseText}</p>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => handleCategorySearch("all")}
              className="rounded-full"
            >
              {t.allCategories}
            </Button>
            {categories.map((category) => (
              <Button
                key={category.name}
                variant={selectedCategory === category.name ? "default" : "outline"}
                onClick={() => handleCategorySearch(category.name)}
                className="rounded-full"
              >
                <category.icon className="w-4 h-4 mr-2" />
                {language === "en" ? category.name : category.nameHi}
                <Badge variant="secondary" className="ml-2">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
