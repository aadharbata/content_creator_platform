import PaymentForm from '@/components/PaymentForm';

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Buy a Course</h1>
            <p className="text-gray-600">Complete your purchase to access the course content</p>
          </div>
          <PaymentForm />
        </div>
      </div>
    </div>
  );
} 