"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Smartphone, 
  Mail, 
  Shield, 
  Download, 
  AlertTriangle,
  CheckCircle,
  X
} from "lucide-react"
import { isHighlyShareable, canBeDeliveredExternally, getDeliveryMethods } from "@/lib/content-delivery"

interface CourseContent {
  id: string
  title: string
  type: string
  size: number // in MB
  description: string
}

interface DeliveryOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  courseTitle: string
  courseContents: CourseContent[]
  onDeliverySelect: (method: 'WHATSAPP' | 'EMAIL' | 'APP_ONLY', contact?: string) => void
}

export default function DeliveryOptionsModal({
  isOpen,
  onClose,
  courseTitle,
  courseContents,
  onDeliverySelect
}: DeliveryOptionsModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'WHATSAPP' | 'EMAIL' | 'APP_ONLY'>('APP_ONLY')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  // Categorize content
  const protectedContent = courseContents.filter(content => isHighlyShareable(content.type))
  const deliverableContent = courseContents.filter(content => canBeDeliveredExternally(content.type))

  const handleSendOTP = async () => {
    if (!phoneNumber) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/delivery/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, purpose: 'COURSE_DELIVERY' })
      })
      
      if (response.ok) {
        setOtpSent(true)
      }
    } catch (error) {
      console.error('Failed to send OTP:', error)
    }
    setIsLoading(false)
  }

  const handleVerifyOTP = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/delivery/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, otp, purpose: 'COURSE_DELIVERY' })
      })
      
      if (response.ok) {
        onDeliverySelect('WHATSAPP', phoneNumber)
      }
    } catch (error) {
      console.error('Failed to verify OTP:', error)
    }
    setIsLoading(false)
  }

  const handleEmailDelivery = () => {
    if (!email || !password) return
    onDeliverySelect('EMAIL', email)
  }

  const handleAppOnlyDelivery = () => {
    onDeliverySelect('APP_ONLY')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Choose Delivery Method
              </CardTitle>
              <CardDescription>
                How would you like to receive "{courseTitle}"?
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Content Summary */}
          <div className="space-y-4">
            <h3 className="font-semibold">Your Course Content:</h3>
            
            {protectedContent.length > 0 && (
              <div className="p-4 border rounded-lg bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Protected Content (App Only)</span>
                </div>
                <div className="space-y-1 text-sm text-blue-700">
                  {protectedContent.map(content => (
                    <div key={content.id} className="flex items-center justify-between">
                      <span>{content.title}</span>
                      <Badge variant="secondary">{content.type}</Badge>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  These files will always be available in your MyCourses section to prevent unauthorized sharing.
                </p>
              </div>
            )}

            {deliverableContent.length > 0 && (
              <div className="p-4 border rounded-lg bg-green-50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">Deliverable Content</span>
                </div>
                <div className="space-y-1 text-sm text-green-700">
                  {deliverableContent.map(content => (
                    <div key={content.id} className="flex items-center justify-between">
                      <span>{content.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{content.type}</Badge>
                        <span className="text-xs">({content.size}MB)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Delivery Options */}
          <div className="space-y-4">
            <h3 className="font-semibold">Choose Delivery Method:</h3>

            {/* WhatsApp Option */}
            {deliverableContent.length > 0 && (
              <Card className={`cursor-pointer transition-colors ${
                selectedMethod === 'WHATSAPP' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`} onClick={() => setSelectedMethod('WHATSAPP')}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">WhatsApp Delivery</h4>
                        <p className="text-sm text-gray-600">Get files sent directly to your WhatsApp</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500">Recommended</Badge>
                  </div>
                  
                  {selectedMethod === 'WHATSAPP' && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
                        <Input
                          type="tel"
                          placeholder="9876543210"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          disabled={otpSent}
                        />
                      </div>
                      
                      {!otpSent ? (
                        <Button 
                          onClick={handleSendOTP} 
                          disabled={!phoneNumber || isLoading}
                          className="w-full"
                        >
                          {isLoading ? 'Sending...' : 'Send OTP'}
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Enter OTP</label>
                            <Input
                              type="text"
                              placeholder="123456"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              maxLength={6}
                            />
                          </div>
                          <Button 
                            onClick={handleVerifyOTP} 
                            disabled={!otp || isLoading}
                            className="w-full"
                          >
                            {isLoading ? 'Verifying...' : 'Verify & Continue'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Email Option */}
            {deliverableContent.length > 0 && (
              <Card className={`cursor-pointer transition-colors ${
                selectedMethod === 'EMAIL' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`} onClick={() => setSelectedMethod('EMAIL')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Email Delivery</h4>
                      <p className="text-sm text-gray-600">Receive download links via email</p>
                    </div>
                  </div>
                  
                  {selectedMethod === 'EMAIL' && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Email Address</label>
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Create Password</label>
                        <Input
                          type="password"
                          placeholder="Create a secure password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      <Button 
                        onClick={handleEmailDelivery} 
                        disabled={!email || !password}
                        className="w-full"
                      >
                        Confirm Email Delivery
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* App Only Option */}
            <Card className={`cursor-pointer transition-colors ${
              selectedMethod === 'APP_ONLY' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`} onClick={() => setSelectedMethod('APP_ONLY')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <div>
                      <h4 className="font-medium">App Access Only</h4>
                      <p className="text-sm text-gray-600">Access all content within the app</p>
                    </div>
                  </div>
                  {protectedContent.length > 0 && (
                    <Badge variant="outline">Most Secure</Badge>
                  )}
                </div>
                
                {selectedMethod === 'APP_ONLY' && (
                  <div className="mt-4">
                    <Button onClick={handleAppOnlyDelivery} className="w-full">
                      Continue with App Access
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>

        <CardFooter className="text-sm text-gray-600">
          <div className="w-full">
            <p className="mb-2">📱 <strong>WhatsApp users (90% in India):</strong> Get instant access to your files</p>
            <p className="mb-2">📧 <strong>Email users:</strong> Receive secure download links</p>
            <p>🔒 <strong>App access:</strong> Highest security, prevents unauthorized sharing</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 