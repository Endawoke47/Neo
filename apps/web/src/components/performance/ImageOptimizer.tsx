/**
 * Image Optimizer - A+++++ Performance Enhancement
 * Optimized image loading with your existing design
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  quality?: number;
  fill?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  placeholder = 'empty',
  quality = 75,
  fill = false,
  sizes,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Generate blur placeholder
  const blurDataURL = `data:image/svg+xml;base64,${Buffer.from(
    `<svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
    </svg>`
  ).toString('base64')}`;

  const imageProps = {
    src,
    alt,
    onLoad: handleLoad,
    onError: handleError,
    priority,
    quality,
    sizes,
    className: `transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${className}`,
    ...(placeholder === 'blur' && { 
      placeholder: 'blur' as const,
      blurDataURL 
    }),
    ...(fill ? { fill: true } : { width, height }),
  };

  if (hasError) {
    return (
      <div 
        className={`bg-neutral-100 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-center text-neutral-500">
          <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          <p className="text-xs">Image not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''}`}>
      {isLoading && (
        <div 
          className={`absolute inset-0 bg-neutral-100 animate-pulse flex items-center justify-center ${className}`}
          style={!fill ? { width, height } : undefined}
        >
          <div className="w-8 h-8 bg-neutral-200 rounded animate-pulse"></div>
        </div>
      )}
      <Image {...imageProps} />
    </div>
  );
}

// Lazy loading image with intersection observer
export function LazyImage(props: OptimizedImageProps) {
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={props.className}>
      {isInView ? (
        <OptimizedImage {...props} />
      ) : (
        <div 
          className="bg-neutral-100 animate-pulse"
          style={{ width: props.width, height: props.height }}
        />
      )}
    </div>
  );
}

// Progressive image loading
export function ProgressiveImage({
  lowQualitySrc,
  highQualitySrc,
  ...props
}: OptimizedImageProps & { lowQualitySrc: string; highQualitySrc: string }) {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      setCurrentSrc(highQualitySrc);
      setIsHighQualityLoaded(true);
    };
    img.src = highQualitySrc;
  }, [highQualitySrc]);

  return (
    <OptimizedImage
      {...props}
      src={currentSrc}
      className={`transition-all duration-500 ${
        isHighQualityLoaded ? 'filter-none' : 'filter blur-sm'
      } ${props.className || ''}`}
    />
  );
}