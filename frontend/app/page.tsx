'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FiUploadCloud, FiCheck, FiAlertTriangle, FiFileText, FiDollarSign, FiShield } from 'react-icons/fi'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    status: string
    green_points: string[]
    red_points: string[]
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8000/api/analyze-invoice', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Error analyzing invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiShield className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">InvoiceShield</h1>
            </div>
            <div className="text-sm text-gray-500">Powered by AI</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Features Section */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-4">
              <FiFileText className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Smart Analysis</h3>
            </div>
            <p className="text-gray-600 text-sm">Advanced AI-powered invoice verification system</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-4">
              <FiDollarSign className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Fraud Prevention</h3>
            </div>
            <p className="text-gray-600 text-sm">Protect your business from invoice fraud</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-4">
              <FiCheck className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Instant Results</h3>
            </div>
            <p className="text-gray-600 text-sm">Get verification results in seconds</p>
          </div>
        </div>

        {/* Main Upload Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-center text-gray-900 mb-6">
              Invoice Verification System
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 transition-colors hover:border-blue-400">
                <div className="space-y-4 text-center">
                  <FiUploadCloud className="w-12 h-12 mx-auto text-blue-500" />
                  <div>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf"
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
                    >
                      Select Invoice
                    </label>
                  </div>
                  <p className="text-sm text-gray-500">
                    Upload your invoice in PDF format
                  </p>
                  {file && (
                    <p className="text-sm text-blue-600">
                      Selected file: {file.name}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={!file || loading}
                className={`w-full py-3 px-6 rounded-lg text-white text-sm font-medium transition-colors
                  ${!file || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Invoice...
                  </span>
                ) : (
                  'Analyze Invoice'
                )}
              </button>
            </form>
          </div>

          {/* Results Section */}
          {results && (
            <div className="border-t border-gray-200 bg-gray-50 p-8">
              <div className={`flex items-center justify-center space-x-2 mb-6
                ${results.status === 'real' ? 'text-green-600' : 'text-red-600'}`}
              >
                {results.status === 'real' ? (
                  <FiCheck className="w-8 h-8" />
                ) : (
                  <FiAlertTriangle className="w-8 h-8" />
                )}
                <h3 className="text-2xl font-bold">
                  {results.status === 'real' ? 'Valid Invoice' : 'Fraudulent Invoice'}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {results.green_points && results.green_points.length > 0 && (
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-green-100">
                    <h4 className="font-semibold text-green-600 mb-4 flex items-center">
                      <FiCheck className="w-5 h-5 mr-2" />
                      Valid Elements
                    </h4>
                    <ul className="space-y-2">
                      {results.green_points.map((point, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.red_points && results.red_points.length > 0 && (
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-red-100">
                    <h4 className="font-semibold text-red-600 mb-4 flex items-center">
                      <FiAlertTriangle className="w-5 h-5 mr-2" />
                      Suspicious Elements
                    </h4>
                    <ul className="space-y-2">
                      {results.red_points.map((point, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="text-red-500 mr-2">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            © 2024 InvoiceShield. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
