"use client"

import { BookOpen } from "lucide-react"

interface FooterProps {
  language: "en" | "hi"
  translations: any
}

export default function Footer({ language, translations }: FooterProps) {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">LearnHub</span>
            </div>
            <p className="text-gray-400 dark:text-gray-300 mb-4">
              {language === "en"
                ? "Empowering creators and learners worldwide with premium digital content."
                : "प्रीमियम डिजिटल कंटेंट के साथ दुनियाभर के क्रिएटर्स और शिक्षार्थियों को सशक्त बनाना।"}
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-white">{language === "en" ? "For Learners" : "शिक्षार्थियों के लिए"}</h4>
            <ul className="space-y-2 text-gray-400 dark:text-gray-300">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {language === "en" ? "Browse Courses" : "कोर्स ब्राउज़ करें"}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {language === "en" ? "Categories" : "श्रेणियां"}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {language === "en" ? "Free Resources" : "मुफ्त संसाधन"}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {language === "en" ? "Mobile App" : "मोबाइल ऐप"}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-white">{language === "en" ? "For Creators" : "क्रिएटर्स के लिए"}</h4>
            <ul className="space-y-2 text-gray-400 dark:text-gray-300">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {language === "en" ? "Start Selling" : "बेचना शुरू करें"}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {language === "en" ? "Creator Tools" : "क्रिएटर टूल्स"}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {language === "en" ? "Analytics" : "एनालिटिक्स"}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {language === "en" ? "Success Stories" : "सफलता की कहानियां"}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-white">{language === "en" ? "Support" : "सहायता"}</h4>
            <ul className="space-y-2 text-gray-400 dark:text-gray-300">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {language === "en" ? "Help Center" : "सहायता केंद्र"}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {language === "en" ? "Contact Us" : "संपर्क करें"}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {language === "en" ? "Community" : "समुदाय"}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {language === "en" ? "Blog" : "ब्लॉग"}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 dark:border-gray-700 mt-12 pt-8 text-center text-gray-400 dark:text-gray-300">
          <p>&copy; 2024 LearnHub. {language === "en" ? "All rights reserved." : "सभी अधिकार सुरक्षित।"}</p>
        </div>
      </div>
    </footer>
  )
}
