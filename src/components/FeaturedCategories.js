'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const imageList = category => {
  const images = Array.isArray(category.images) ? category.images : [];
  return [...new Set([...images, category.icon].filter(Boolean))];
};

export default function FeaturedCategories() {
  const [categories, setCategories] = useState([]);
  const [sortMode, setSortMode] = useState('recent');
  const [visibleCount, setVisibleCount] = useState(8);
  const [loading, setLoading] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [activeImages, setActiveImages] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(response => response.json()),
      fetch('/api/settings').then(response => response.json()).catch(() => null)
    ]).then(([categoryResult, settingsResult]) => {
      if (categoryResult?.success) {
        const featured = categoryResult.data.filter(category => category.isFeatured);
        setCategories(featured.length ? featured : categoryResult.data);
      }
      if (settingsResult?.success) setSortMode(settingsResult.data?.categorySortMode || 'recent');
    }).catch(error => console.error('Error fetching featured categories:', error))
      .finally(() => setLoading(false));
  }, []);

  const sortedCategories = useMemo(() => {
    const filtered = categories.filter(category =>
      category.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (sortMode === 'alphabetical') {
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortMode === 'custom') {
      const hasCustomOrder = filtered.some(category => category.sortOrder !== null && category.sortOrder !== undefined && category.sortOrder !== '');
      if (hasCustomOrder) {
        return filtered.sort((a, b) => {
          const aOrder = Number.isFinite(Number(a.sortOrder)) && a.sortOrder !== null && a.sortOrder !== '' ? Number(a.sortOrder) : Number.MAX_SAFE_INTEGER;
          const bOrder = Number.isFinite(Number(b.sortOrder)) && b.sortOrder !== null && b.sortOrder !== '' ? Number(b.sortOrder) : Number.MAX_SAFE_INTEGER;
          return aOrder - bOrder || new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
      }
    }
    return filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [categories, searchQuery, sortMode]);

  const onCardHover = category => {
    setHoveredCategory(category._id);
    const images = imageList(category);
    if (images.length > 1) {
      const current = activeImages[category._id] ?? 0;
      let next = Math.floor(Math.random() * images.length);
      if (images.length > 1 && next === current) next = (next + 1 + Math.floor(Math.random() * (images.length - 1))) % images.length;
      setActiveImages(previous => ({ ...previous, [category._id]: next }));
    }
  };

  const shownCategories = sortedCategories.slice(0, visibleCount);
  const hasMore = visibleCount < sortedCategories.length;

  return (
    <section className="featured-categories-section" id="featured-categories">
      <div className="featured-categories-container">
        <div className="featured-categories-heading">
          <div>
            <p className="featured-eyebrow">SHOP BY COLLECTION</p>
            <h2>Featured Categories</h2>
          </div>
          <input
            type="search"
            className="featured-category-search"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={event => { setSearchQuery(event.target.value); setVisibleCount(8); }}
            aria-label="Search categories"
          />
        </div>

        {loading ? <p className="featured-category-message">Loading categories...</p> :
          shownCategories.length === 0 ? <p className="featured-category-message">No categories found.</p> : (
            <div className="featured-category-grid">
              {shownCategories.map(category => {
                const images = imageList(category);
                const currentIndex = Math.min(activeImages[category._id] ?? 0, Math.max(0, images.length - 1));
                const currentImage = images[currentIndex] || '/assets/images/default-icon.png';
                return (
                  <article
                    key={category._id}
                    className={`featured-category-card ${hoveredCategory === category._id ? 'is-flipped' : ''}`}
                    onMouseEnter={() => onCardHover(category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onFocus={() => onCardHover(category)}
                    onBlur={() => setHoveredCategory(null)}
                  >
                    <div className="featured-card-scene">
                      <div className="featured-card-rotator">
                        
                        {/* Front Face */}
                        <div className="featured-card-face featured-card-front">
                          <Link href={`/categories/${category.slug}`} tabIndex={-1} className="featured-card-image-wrap">
                            <img src={images[0] || currentImage} alt={category.name} loading="lazy" />
                          </Link>
                          <h3>{category.name}</h3>
                          {/* Hide description on front to ensure title + button fits perfectly */}
                          <div className="spacer"></div> 
                          <Link href={`/categories/${category.slug}`} className="featured-explore-link front-link">
                            Explore Products <span aria-hidden="true">↗</span>
                          </Link>
                        </div>

                        {/* Back Face (Visible on Hover/Flip) */}
                        <div className="featured-card-face featured-card-back" aria-hidden="true">
                          <Link href={`/categories/${category.slug}`} tabIndex={-1} className="featured-card-image-wrap">
                            <img src={currentImage} alt="" loading="lazy" />
                          </Link>
                          <h3>{category.name}</h3>
                          <p className="card-description">{category.description || 'Explore our available parts'}</p>
                          <Link tabIndex={-1} href={`/categories/${category.slug}`} className="featured-explore-link back-link">
                            Explore Products <span aria-hidden="true">↗</span>
                          </Link>
                        </div>
                        
                      </div>
                    </div>
                    {images.length > 1 && (
                      <div className="featured-image-dots" aria-label={`${images.length} category images`}>
                        {images.map((image, index) => (
                          <button
                            type="button"
                            key={`${image}-${index}`}
                            aria-label={`Show category image ${index + 1}`}
                            aria-current={currentIndex === index ? 'true' : undefined}
                            className={currentIndex === index ? 'active' : ''}
                            onMouseEnter={() => setActiveImages(previous => ({ ...previous, [category._id]: index }))}
                            onClick={() => setActiveImages(previous => ({ ...previous, [category._id]: index }))}
                          />
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

        {hasMore && !loading && (
          <div className="featured-load-more-wrap">
            <button type="button" className="featured-load-more" onClick={() => setVisibleCount(count => count + 8)}>
              Load More Categories <span aria-hidden="true">↓</span>
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .featured-categories-section { padding: clamp(42px, 6vw, 76px) 0; background: #f5f6f7; overflow: hidden; }
        .featured-categories-container { width: min(1320px, calc(100% - 36px)); margin: 0 auto; }
        .featured-categories-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 30px; }
        .featured-eyebrow { margin: 0 0 6px; color: #bd5e22; font-size: 11px; letter-spacing: .18em; font-weight: 800; }
        .featured-categories-heading h2 { margin: 0; color: #20252a; font-size: clamp(24px, 3vw, 34px); line-height: 1.15; font-weight: 850; }
        .featured-category-search { width: min(300px, 100%); border: 1px solid #d9dde1; background: white; border-radius: 10px; padding: 12px 14px; outline: none; }
        .featured-category-search:focus { border-color: #bd5e22; box-shadow: 0 0 0 3px #bd5e2220; }
        .featured-category-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px 20px; perspective: 1400px; }
        .featured-category-card { min-width: 0; cursor: pointer; }
        
        /* INCREASED HEIGHT so titles and buttons don't get cut off */
        .featured-card-scene { height: 380px; perspective: 1200px; }
        .featured-card-rotator { height: 100%; width: 100%; position: relative; transform-style: preserve-3d; transition: transform .72s cubic-bezier(.2,.75,.25,1); }
        .featured-category-card.is-flipped .featured-card-rotator { transform: rotateY(180deg); }
        
        .featured-card-face { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; padding: 20px 16px 18px; border: 1px solid #e6e8eb; border-radius: 16px; background: linear-gradient(145deg,#fff,#fafafa); box-shadow: 0 8px 22px #17212b0b; backface-visibility: hidden; -webkit-backface-visibility: hidden; text-align: center; overflow: hidden; }
        .featured-card-back { transform: rotateY(180deg); background: linear-gradient(145deg,#fff,#f4f5f6); }
        
        .featured-card-image-wrap { width: 100%; height: 190px; display: flex; align-items: center; justify-content: center; padding: 16px; outline: none; }
        .featured-card-image-wrap img { width: 100%; height: 100%; object-fit: contain; transition: transform .4s ease; mix-blend-mode: multiply; }
        .featured-category-card:hover .featured-card-image-wrap img { transform: scale(1.045); }
        
        /* Spacer pushes the button to the bottom if there is no description */
        .spacer { flex-grow: 1; }
        
        .featured-card-face h3 { margin: 8px 0; color: #20252a; font-size: 16px; line-height: 1.35; font-weight: 800; width: 100%; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .card-description { margin: 0 0 12px; color: #6b7280; font-size: 12px; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; flex-grow: 1; }
        
        /* Base button styles */
        .featured-explore-link { margin-top: auto; display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; border-radius: 8px; padding: 12px; background: #bd5e22; color: #fff; font-size: 13px; font-weight: 750; text-decoration: none; transition: background .2s, transform .2s, opacity .3s ease; flex-shrink: 0; }
        .featured-explore-link:hover { background: #924414; transform: translateY(-1px); }
        
        /* Front link fades OUT on hover */
        .front-link { opacity: 1; }
        .featured-category-card.is-flipped .front-link { opacity: 0; pointer-events: none; }
        
        /* Back link fades IN on hover */
        .back-link { opacity: 0; transform: translateY(10px); transition: opacity 0.4s ease, transform 0.4s ease, background 0.2s; }
        .featured-category-card.is-flipped .back-link { opacity: 1; transform: translateY(0); transition-delay: 0.15s; }
        
        .featured-image-dots { display: flex; justify-content: center; align-items: center; gap: 6px; padding-top: 14px; min-height: 25px; }
        .featured-image-dots button { border: 0; width: 6px; height: 6px; padding: 0; border-radius: 99px; background: #c5c9ce; cursor: pointer; transition: all .2s ease; }
        .featured-image-dots button.active { width: 19px; background: #bd5e22; }
        .featured-load-more-wrap { display: flex; justify-content: center; margin-top: 34px; }
        .featured-load-more { border: 1px solid #bd5e22; background: transparent; color: #9e4b18; border-radius: 999px; padding: 12px 24px; font-weight: 800; cursor: pointer; transition: all .2s; }
        .featured-load-more:hover { color: white; background: #bd5e22; box-shadow: 0 8px 20px #bd5e2228; }
        .featured-category-message { text-align: center; padding: 42px 0; color: #6b7280; }
        
        @media (max-width: 1000px) { .featured-category-grid { grid-template-columns: repeat(3,minmax(0,1fr)); } }
        @media (max-width: 700px) { .featured-categories-heading { align-items: stretch; flex-direction: column; } .featured-category-search { width: 100%; } .featured-category-grid { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px 12px; } .featured-card-scene { height: 350px; } .featured-card-face { padding: 12px 10px; } .featured-card-image-wrap { height: 160px; padding: 12px; } .featured-card-face h3 { font-size: 14px; } }
        @media (max-width: 380px) { .featured-categories-container { width: calc(100% - 24px); } .featured-card-scene { height: 330px; } .featured-card-image-wrap { height: 140px; } }
        @media (prefers-reduced-motion: reduce) { .featured-card-rotator, .featured-card-image-wrap img { transition: none; } }
      `}</style>
    </section>
  );
}