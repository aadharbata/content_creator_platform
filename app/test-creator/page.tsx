'use client';

import { useState } from 'react';
import axios from 'axios';
import { useLanguage } from "@/lib/contexts/LanguageContext"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestCreatorPage() {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bankAccount: '',
    ifsc: '',
    upi: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data } = await axios.post('/api/creators', formData);
      setMessage(language === 'hi' 
        ? `क्रिएटर सफलतापूर्वक बनाया गया! ID: ${data.creator.id}` 
        : `Creator created successfully! ID: ${data.creator.id}`
      );
      setFormData({ name: '', email: '', bankAccount: '', ifsc: '', upi: '' });
    } catch (error) {
      console.error('Error creating creator:', error);
      setMessage(language === 'hi' 
        ? 'क्रिएटर बनाने में विफल। कृपया पुनः प्रयास करें।' 
        : 'Failed to create creator. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'hi' ? 'टेस्ट क्रिएटर बनाएं' : 'Create Test Creator'}
            </CardTitle>
            <CardDescription>
              {language === 'hi' 
                ? 'भुगतान प्रणाली के साथ उपयोग करने के लिए एक टेस्ट क्रिएटर बनाएं' 
                : 'Create a test creator to use with the payment system'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'hi' ? 'नाम' : 'Name'}
                </label>
                <Input
                  type="text"
                  placeholder={language === 'hi' ? 'क्रिएटर का नाम' : 'Creator name'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'hi' ? 'ईमेल' : 'Email'}
                </label>
                <Input
                  type="email"
                  placeholder="creator@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'hi' ? 'बैंक खाता संख्या' : 'Bank Account Number'}
                </label>
                <Input
                  type="text"
                  placeholder="1234567890"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'hi' ? 'IFSC कोड' : 'IFSC Code'}
                </label>
                <Input
                  type="text"
                  placeholder="SBIN0000001"
                  value={formData.ifsc}
                  onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'hi' ? 'UPI ID (वैकल्पिक)' : 'UPI ID (Optional)'}
                </label>
                <Input
                  type="text"
                  placeholder="creator@upi"
                  value={formData.upi}
                  onChange={(e) => setFormData({ ...formData, upi: e.target.value })}
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full"
              >
                {loading 
                  ? (language === 'hi' ? 'बना रहे हैं...' : 'Creating...') 
                  : (language === 'hi' ? 'क्रिएटर बनाएं' : 'Create Creator')
                }
              </Button>

              {message && (
                <div className={`p-3 rounded-md ${
                  message.includes('successfully') || message.includes('सफलतापूर्वक') 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {message}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 