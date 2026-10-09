import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const FeaturedCategories = () => {
  const [allCategories, setAllCategories] = useState([]);
  const [displayedCategories, setDisplayedCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 8;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const result = await response.json();
        
        if (result.success) {
          // Prioritize featured categories, fallback to all if none are featured
          const featured = result.data.filter(cat => cat.isFeatured);
          const categoriesToUse = featured.length > 0 ? featured : result.data;
          setAllCategories(categoriesToUse);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    // Handle Search and Pagination locally
    const filtered = allCategories.filter(cat => 
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setDisplayedCategories(filtered.slice(0, page * limit));
  }, [allCategories, searchQuery, page]);

  const hasMore = displayedCategories.length < allCategories.filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase())).length;

  return (
    <section className="py-12 bg-gray-50" id="featured-categories">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Featured Categories</h2>
          
          <div className="relative mt-4 md:mt-0 w-full md:w-72">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
               <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input
              type="text"
              className="block w-full p-3 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-[#BD5E22] focus:border-[#BD5E22]"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading categories...</div>
        ) : displayedCategories.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No categories found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedCategories.map((category, index) => (
              <div 
                key={category._id} 
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-500 ease-out transform hover:-translate-y-1 flex flex-col animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-6 flex flex-col items-center justify-center text-center flex-grow">
                  <img 
                    src={category.icon || '/assets/images/default-icon.png'} 
                    alt={category.name} 
                    className="w-40 h-40 mb-6 object-contain"
                  />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{category.name}</h3>
                   
                </div>
                <div className="p-4 border-t border-gray-100 mt-auto">
                  <Link 
                    href={`/categories/${category.slug}`}
                    className="block w-full text-center py-2 px-4 bg-[#BD5E22] hover:bg-[#924414] text-white rounded-lg font-medium transition-colors"
                  >
                    Explore Products
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div className="flex justify-center mt-10">
            <button 
              onClick={() => setPage(prev => prev + 1)}
              className="px-8 py-3 bg-[#BD5E22] text-white rounded-full font-medium hover:bg-[#BD5E22] transition-colors shadow-md"
            >
              Load More Categories
            </button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
          opacity: 0;
        }
      `}} />
    </section>
  );
};

export default FeaturedCategories;