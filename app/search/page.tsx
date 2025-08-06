"use client";
import React, { useState } from 'react';

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  url?: string;
  price: number;
  type: string;
  thumbnail?: string;
  creatorName: string;
  status: string;
}

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const productTypes = [
    'COURSE',
    'TEMPLATE', 
    'IMAGE',
    'AUDIO',
    'SOFTWARE',
    'EBOOK',
    'VIDEO'
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      let url = `/api/search?q=${encodeURIComponent(query)}`;
      if (selectedTypes.length > 0) {
        url += `&types=${selectedTypes.join(',')}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch results');
      const data = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="max-w-4xl mx-auto my-10 p-8 bg-white rounded-2xl shadow-lg">
      <h1 className="text-4xl font-bold mb-6 text-gray-800 text-center">Search Products</h1>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3 mb-4">
          <input
            className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-lg outline-none focus:border-indigo-500 transition-colors"
            type="text"
            placeholder="Search for courses, templates, images..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button 
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        {/* Type Filters */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by Type:</h3>
          <div className="flex flex-wrap gap-3">
            {productTypes.map(type => (
              <label key={type} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => handleTypeChange(type)}
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">{type}</span>
              </label>
            ))}
          </div>
          {selectedTypes.length > 0 && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setSelectedTypes([])}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </form>
      
      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg mb-5 text-center">
          {error}
        </div>
      )}
      
      <div className="mt-3">
        {results.length === 0 && !loading && !error && (
          <div className="text-gray-500 text-center py-8">
            No results yet. Try searching for something!
          </div>
        )}
        {results.map(result => (
          <div key={result.id} className="bg-gray-50 rounded-xl p-5 mb-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-semibold text-gray-700 flex-1">{result.title}</h2>
              <span className="bg-indigo-500 text-white px-2 py-1 rounded text-xs font-medium uppercase ml-3">
                {result.type}
              </span>
            </div>
            <p className="text-gray-600 mb-3 leading-relaxed">{result.snippet}</p>
            <div className="flex justify-between items-center mb-3 text-sm">
              <span className="text-gray-500 italic">By: {result.creatorName}</span>
              <span className="text-green-600 font-semibold text-lg">${result.price}</span>
            </div>
            {result.url && (
              <a 
                className="text-indigo-500 font-medium hover:text-indigo-700 transition-colors" 
                href={result.url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                View Product →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchPage;
