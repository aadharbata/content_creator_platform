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

  // Fallback values for missing translations
  const searchPlaceholder = language === 'hi' 
    ? 'कोर्स, क्रिएटर, विषय खोजें...' 
    : 'Search courses, creators, topics...'
  
  const browseText = language === 'hi'
    ? 'या श्रेणियों के माध्यम से ब्राउज़ करें'
    : 'Or browse through categories'

  const allCategoriesText = language === 'hi' ? 'सभी श्रेणियां' : 'All Categories'

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Build URL with search parameters
      const params = new URLSearchParams()
      params.set('search', searchQuery.trim())
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory)
      }
      
      // Redirect to consumer channel with search results
      router.push(`/consumer-channel?${params.toString()}`)
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
    
    router.push(`/consumer-channel?${params.toString()}`)
  }

  return (
    <section className="relative py-16 bg-transparent">
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

          <p className="text-center text-gray-600 dark:text-gray-300 mt-4 text-lg">{browseText}</p>
        </div>
      </div>

      {/* Curved Gradient Background with Categories */}
      <div className="relative mt-12">
        {/* Colorful curved gradient background */}
        <div 
          className="w-full h-48 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-700 dark:via-purple-700 dark:to-pink-700"
          style={{
            borderRadius: "0 0 50% 50% / 0 0 100px 100px",
          }}
        ></div>
        
        {/* Categories positioned on top of gradient */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
              <Button
                variant={selectedCategory === "all" ? "secondary" : "outline"}
                onClick={() => handleCategorySearch("all")}
                className={`rounded-full border-2 ${
                  selectedCategory === "all" 
                    ? "bg-white text-gray-900 border-white hover:bg-gray-100" 
                    : "bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm"
                }`}
              >
                {allCategoriesText}
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.name}
                  variant={selectedCategory === category.name ? "secondary" : "outline"}
                  onClick={() => handleCategorySearch(category.name)}
                  className={`rounded-full border-2 ${
                    selectedCategory === category.name
                      ? "bg-white text-gray-900 border-white hover:bg-gray-100"
                      : "bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm"
                  }`}
                >
                  {category.icon && <category.icon className="w-4 h-4 mr-2" />}
                  {language === "en" ? category.name : (category.nameHi || category.name)}
                  {category.count && (
                    <Badge 
                      variant="secondary" 
                      className={`ml-2 ${
                        selectedCategory === category.name
                          ? "bg-gray-200 text-gray-700"
                          : "bg-white/20 text-white"
                      }`}
                    >
                      {category.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
