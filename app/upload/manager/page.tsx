'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Edit, Trash2, DollarSign, Tag } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  contentType: string;
  price: number;
  language: string;
  tags: string[];
  files: Array<{
    name: string;
    size: number;
    path: string;
  }>;
  uploadedAt: string;
  status: string;
}

export default function ContentManager() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch content from API when database is connected
    // For now, we'll show a placeholder
    setLoading(false);
  }, []);

  const handleViewContent = (content: ContentItem) => {
    console.log('Viewing content:', content);
    // TODO: Implement content preview
  };

  const handleEditContent = (content: ContentItem) => {
    console.log('Editing content:', content);
    // TODO: Navigate to edit page
  };

  const handleDeleteContent = (content: ContentItem) => {
    if (confirm('Are you sure you want to delete this content?')) {
      console.log('Deleting content:', content);
      // TODO: Implement delete functionality
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Manager</h1>
          <p className="text-gray-600">Manage your uploaded content and track performance</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Content</p>
                <p className="text-2xl font-bold text-gray-900">{contents.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contents.filter(c => c.status === 'PUBLISHED').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{contents.reduce((sum, c) => sum + c.price, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Tag className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(contents.map(c => c.contentType)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Content</h2>
          </div>
          
          {contents.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
              <p className="text-gray-600 mb-4">Start by uploading your first piece of content</p>
              <a
                href="/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Upload Content
              </a>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {contents.map((content) => (
                <div key={content.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{content.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          content.status === 'PUBLISHED' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {content.status}
                        </span>
                      </div>
                      
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {content.description}
                      </p>
                      
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Tag className="h-4 w-4 mr-1" />
                          {content.contentType}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ₹{content.price}
                        </span>
                        <span>{content.language}</span>
                        <span>{new Date(content.uploadedAt).toLocaleDateString()}</span>
                      </div>
                      
                      {content.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {content.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {tag}
                            </span>
                          ))}
                          {content.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{content.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleViewContent(content)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="View content"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => handleEditContent(content)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit content"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteContent(content)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete content"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 