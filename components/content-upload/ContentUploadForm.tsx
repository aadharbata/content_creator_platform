'use client';

import React, { useState } from 'react';
import { Upload, FileText, DollarSign, Tag, Globe, Link, BookOpen, Video, Info, XCircle, LayoutGrid } from 'lucide-react';

interface ContentUploadFormProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

const contentForOptions = [
  { value: "licensing", label: "Licensing" },
  { value: "payperview", label: "Pay-per-View" },
  { value: "paidproduct", label: "Paid Product" },
  { value: "freepost", label: "Free Post" },
];

const licensingTypes = [
  { value: "royaltyfree-exclusive", label: "Royalty Free Exclusive Licensing (One Brand Only)" },
  { value: "royaltyfree-nonexclusive", label: "Royalty Free Non-Exclusive Licensing (Multiple Brands)" },
];

const contentTypes = [
  { value: "course", label: "Course" },
  { value: "template", label: "Template (Canva, Figma, etc.)" },
  { value: "software", label: "Software/Tool" },
  { value: "ebook", label: "E-Book/PDF" },
  { value: "video", label: "Video Content" },
  { value: "audio", label: "Audio/Podcast" },
  { value: "image", label: "Image/Artwork" },
  { value: "other", label: "Other" },
];

const languages = [
  { value: "hindi", label: "Hindi" },
  { value: "english", label: "English" },
  { value: "both", label: "Both" },
];

export default function ContentUploadForm({ onSubmit, onCancel }: ContentUploadFormProps) {
  const [contentFor, setContentFor] = useState("");
  const [contentType, setContentType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles(prevFiles => [...prevFiles, ...Array.from(files)]);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setResult(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Add files to formData
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const res = await fetch("/api/content/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setResult("Upload successful! Your content has been uploaded.");
        form.reset();
        setContentFor("");
        setContentType("");
        setSelectedFiles([]);
        onSubmit?.(data);
      } else {
        const error = await res.json();
        setResult(`Upload failed: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      setResult("There was an error uploading your content. Please try again.");
    }
    
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mx-auto mb-6 inline-block rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 p-4 shadow-lg">
              <Upload className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight sm:text-5xl">Upload Your Content</h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">Share your knowledge, templates, and creations with the world</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FileText className="inline w-4 h-4 mr-2 text-blue-500" />
                  Content Title *
                </label>
                <input 
                  name="title" 
                  required 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter a title for your content"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Video className="inline w-4 h-4 mr-2 text-indigo-500" />
                  Content Type *
                </label>
                <select
                  name="contentType"
                  required
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="" disabled>Select content type</option>
                  {contentTypes.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <BookOpen className="inline w-4 h-4 mr-2 text-green-500" />
                Detailed Description *
              </label>
              <textarea
                name="description"
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-vertical"
                placeholder="Describe your content in detail. What's included? Who is it for? What problems does it solve? Include instructions, features, and benefits."
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Upload className="inline w-4 h-4 mr-2 text-purple-500" />
                Upload Files *
              </label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 bg-white hover:border-indigo-600 transition-all duration-300 ease-in-out">
                <label htmlFor="file-upload" className="text-center cursor-pointer w-full">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Upload className="h-10 w-10 text-white" aria-hidden="true" />
                  </div>
                  <div className="mt-4 flex justify-center text-sm leading-6 text-gray-600">
                      <p className="font-semibold text-indigo-600 hover:text-indigo-500">
                        Click to upload
                      </p>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-600">Any file type accepted (PDF, images, templates, software, etc.)</p>
                  <input
                    id="file-upload"
                    name="files"
                    type="file"
                    multiple
                    required
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-800">Selected files:</h3>
                  <ul className="mt-2 divide-y divide-gray-200">
                    {selectedFiles.map((file, index) => (
                      <li key={index} className="flex items-center justify-between py-2 text-sm text-gray-700">
                        <span className="truncate pr-2">{file.name}</span>
                        <div className="flex items-center flex-shrink-0">
                          <span className="text-gray-500 mr-4">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            aria-label="Remove file"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Pricing and Business Model */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <DollarSign className="inline w-4 h-4 mr-2 text-green-500" />
                  Price (INR) *
                </label>
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0 for free content"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <LayoutGrid className="inline w-4 h-4 mr-2 text-yellow-500" />
                  Content Model *
                </label>
                <select
                  name="contentFor"
                  required
                  value={contentFor}
                  onChange={(e) => setContentFor(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="" disabled>Select model</option>
                  {contentForOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Globe className="inline w-4 h-4 mr-2 text-cyan-500" />
                  Language *
                </label>
                <select 
                  name="language" 
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="" disabled>Select language</option>
                  {languages.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Licensing Options */}
            {contentFor === "licensing" && (
              <div className="bg-indigo-50 p-6 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Licensing Type *
                </label>
                <select 
                  name="licensingType" 
                  required 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="" disabled>Select licensing type</option>
                  {licensingTypes.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Tag className="inline w-4 h-4 mr-2 text-sky-500" />
                  Tags (comma-separated)
                </label>
                <input
                  name="tags"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., figma, design, mobile, web"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Link className="inline w-4 h-4 mr-2 text-rose-500" />
                  Demo Link (optional)
                </label>
                <input
                  name="demoLink"
                  type="url"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://your-demo-link.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Info className="inline w-4 h-4 mr-2 text-gray-500" />
                Additional Notes
              </label>
              <textarea
                name="notes"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Any additional notes for the reviewer or buyer"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                className="px-8 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                onClick={onCancel}
              >
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading..." : "Upload Content"}
              </button>
            </div>
          </form>

          {result && (
            <div className={`mt-6 p-4 rounded-lg text-center font-semibold ${result.startsWith('Upload successful') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {result}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 