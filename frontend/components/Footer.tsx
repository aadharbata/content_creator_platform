"use client"

import { BookOpen } from "lucide-react"

interface FooterProps {
  language: "en" | "hi"
}

export default function Footer({ language }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">LearnHub</span>
            </div>
            <p className="text-gray-400 mb-4">
              {language === "en"
                ? "Empowering creators and learners worldwide with premium digital content."
                : "प्रीमियम डिजिटल कंटेंट के साथ दुनियाभर के क्रिएटर्स और शिक्षार्थियों को सशक्त बनाना।"}
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4">{language === "en" ? "For Learners" : "शिक्षार्थियों के लिए"}</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Browse Courses
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Categories
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Free Resources
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Mobile App
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">{language === "en" ? "For Creators" : "क्रिएटर्स के लिए"}</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Start Selling
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Creator Tools
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Analytics
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Success Stories
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">{language === "en" ? "Support" : "सहायता"}</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Community
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; 2024 LearnHub. {language === "en" ? "All rights reserved." : "सभी अधिकार सुरक्षित।"}</p>
        </div>
      </div>
    </footer>
  )
}
