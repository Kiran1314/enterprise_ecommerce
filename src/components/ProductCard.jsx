'use client';
import React, { useState, useEffect } from 'react';
import { useCart } from './Providers';
import { ShoppingCart, MessageCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import { getProductPricing } from '@/lib/productPricing';
import { getProductAvailableStock } from '@/lib/productAvailability';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [currency, setCurrency] = useState('$');
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [isImageHovered, setIsImageHovered] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(d => {
        if (d.success && d.data?.currencySymbol) {
          setCurrency(d.data.currencySymbol);
        }
      })
      .catch(() => {});
  }, []);

  const pricing = getProductPricing(product);
  const priceAvailable = pricing.price !== null;
  const hasOffer = pricing.hasOffer;
  const isQuoteOnly = !priceAvailable;
  const discountPercent = hasOffer ? Math.round(((pricing.price - pricing.offerPrice) / pricing.price) * 100) : 0;

  const sizeAttr = product.attributes?.find(a => a.key.toLowerCase().includes('size') || a.type === 'text' || a.type === 'button');
  const colorAttr = product.attributes?.find(a => a.type === 'image' || a.key.toLowerCase().includes('color'));

  // Calculate total stock across variations or direct stock
  const totalStock = getProductAvailableStock(product);
  let lowestStock = totalStock;
  product.attributes?.forEach(attr => {
    attr.options?.forEach(opt => {
      if (opt.stock !== undefined && opt.stock < lowestStock) {
        lowestStock = opt.stock;
      }
    });
  });

  // Robust display images fallback resolution: direct images -> variation images -> placeholder
  const firstColorVarImg = colorAttr?.options?.[0]?.variationImages?.[0];
  const displayImages = (product.images && product.images.length > 0 && product.images[0])
    ? product.images
    : (firstColorVarImg ? [firstColorVarImg] : ['https://via.placeholder.com/300']);

  return (
    <div className="group/card relative z-0 h-full overflow-visible rounded-md border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:z-20 hover:shadow-md flex flex-col">
      <div className="absolute top-2 left-2 z-20 flex flex-col gap-1 items-start pointer-events-none">
        {product.customTags?.map((tag, idx) => (
          <span key={idx} style={{ backgroundColor: tag.bgColor || '#d87532' }} className="text-white text-[10px] px-1.5 py-0.5 rounded font-black shadow-sm">
            {tag.label}
          </span>
        ))}
        {hasOffer && (
          <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-black font-mono shadow-sm">
            {discountPercent}% OFF
          </span>
        )}
      </div>

      <Link
        href={`/products/${product.slug || product._id}`}
        className="group/image relative aspect-square rounded-t-md bg-gray-50 overflow-hidden block"
        onMouseEnter={() => setIsImageHovered(true)}
        onMouseLeave={() => setIsImageHovered(false)}
        onFocus={() => setIsImageHovered(true)}
        onBlur={() => setIsImageHovered(false)}
      >
        <img src={displayImages[selectedImageIdx] || displayImages[0]} alt={product.title} className="object-cover w-full h-full group-hover/image:scale-105 transition duration-300" />
        
        {/* Fade-in Up Available Sizes on Card Hover */}
        {sizeAttr && sizeAttr.options?.length > 0 && (
          <div className="absolute inset-x-0 bottom-12 p-2 bg-linear-to-t from-black/80 via-black/40 to-transparent translate-y-full group-hover/image:translate-y-0 transition-all duration-300 ease-in-out flex flex-col items-center z-10">
            <span className="text-[10px] text-white font-semibold mb-1 uppercase tracking-wider">All Model Year Available</span>
            <div className="flex gap-1 flex-wrap justify-center">
              {sizeAttr.options.map((opt, sIdx) => (
                <span key={sIdx} className="bg-white/90 text-gray-900 text-[10px] px-1.5 py-0.5 rounded font-bold shadow">
                  {opt.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-2 bg-linear-to-t from-black/60 to-transparent translate-y-full group-hover/image:translate-y-0 transition-transform duration-300 ease-in-out flex gap-1.5 z-10">
          <div className="flex-1 flex items-center justify-center gap-1 bg-white text-gray-900 py-1.5 px-1 rounded font-bold text-[11px] shadow hover:bg-gray-50">
            <Eye className="w-3 h-3 text-[#d87532]" /> View
          </div>
        </div>
      </Link>

      <div className="p-2 min-h-[5.125rem] flex flex-col">
        <div>
          <span className="block h-3 truncate text-[10px] leading-3 text-[#d87532] font-semibold uppercase tracking-wider">{product.categories?.[0]}</span>
          <Link
            href={`/products/${product.slug || product._id}`}
            title={product.title}
            className="mt-0.5 block"
          >
            <h3 className="line-clamp-1 font-bold text-gray-800 text-sm leading-[1.125rem] whitespace-normal break-words group-hover/card:line-clamp-none hover:text-[#d87532] transition-colors">{product.title}</h3>
          </Link>
        </div>

        {/* Low Stock Warning Message */}
        {(lowestStock > 0 && lowestStock < 10) || (lowestStock === 0 && !isQuoteOnly) ? (
          <div className="mt-1 h-3 shrink-0">
            {lowestStock > 0 && lowestStock < 10 ? (
              <div className="text-[10px] leading-3 font-bold text-amber-600">
              Last {lowestStock} items left!
              </div>
            ) : (
              <div className="text-[10px] leading-3 font-bold text-red-600">Out of Stock</div>
            )}
          </div>
        ) : null}

        <div className="mt-auto flex flex-col">
          <div className="min-h-5 shrink-0 flex items-center gap-1.5">
            {!isQuoteOnly && (hasOffer ? (
              <>
                <span className="text-base font-black text-[#d87532]">{currency}{pricing.offerPrice.toFixed(2)}</span>
                <span className="text-xs text-gray-400 line-through">{currency}{pricing.price.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-base font-extrabold text-gray-900">{currency}{pricing.price.toFixed(2)}</span>
            ))}
          </div>
          <div className="mt-1.5 shrink-0 flex flex-col gap-1">
            {priceAvailable && !product.fitments?.length && (
              <button
                onClick={(e) => { e.preventDefault(); addToCart({ ...product, price: pricing.displayPrice }); }}
                className="h-7 shrink-0 w-full flex items-center justify-center gap-1.5 bg-[#c45724] text-white px-3 rounded-md text-xs font-bold hover:bg-[#a9431a] transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c45724]"
              >
                <ShoppingCart className="w-4 h-4 shrink-0" /> <span>Add to Cart</span>
              </button>
            )}
            {priceAvailable && product.fitments?.length > 0 && (
              <Link href={`/products/${product.slug || product._id}`} className="h-7 shrink-0 w-full flex items-center justify-center gap-1.5 bg-[#c45724] text-white px-3 rounded-md text-xs font-bold hover:bg-[#a9431a] transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c45724]">
                <Eye className="w-4 h-4 shrink-0" /> <span>Choose part</span>
              </Link>
            )}
            {(product.hasInquiry || !priceAvailable) && (
              <button onClick={(e) => { e.preventDefault(); window.open(`https://wa.me/${product.whatsappNumber || '1234567890'}?text=${encodeURIComponent(`Please quote ${product.title} (${product.sku})`)}`, '_blank'); }} className="group/enquiry relative isolate h-7 shrink-0 w-full overflow-hidden rounded-md border border-[#BD5E22] bg-white px-3 text-xs font-bold text-[#BD5E22] transition-colors duration-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BD5E22]">
                <span aria-hidden="true" className={`absolute inset-0 -z-10 translate-y-full bg-[#BD5E22] transition-transform duration-300 ease-out group-hover/enquiry:translate-y-0 group-focus-visible/enquiry:translate-y-0 ${isImageHovered ? 'translate-y-0' : ''}`} />
                <span className="relative flex items-center justify-center gap-1.5">
                  <MessageCircle className="w-4 h-4 shrink-0" /> Enquiry
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}