"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Icon } from "@/components/icon";

type VenueGalleryProps = {
  images: string[];
  venueName: string;
};

export function VenueGallery({ images, venueName }: VenueGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (openIndex === null) return;
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight")
        setOpenIndex((i) => (i !== null ? (i + 1) % images.length : null));
      if (e.key === "ArrowLeft")
        setOpenIndex((i) =>
          i !== null ? (i - 1 + images.length) % images.length : null,
        );
    },
    [openIndex, images.length],
  );

  useEffect(() => {
    if (openIndex !== null) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [openIndex, handleKeyDown]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="relative aspect-[4/3] overflow-hidden rounded-lg bg-warm-300 transition-opacity hover:opacity-80"
          >
            <Image
              src={src}
              alt={`${venueName} ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 30vw, 150px"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpenIndex(null);
          }}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
          >
            <Icon name="X" size={20} />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setOpenIndex(
                    (openIndex - 1 + images.length) % images.length,
                  )
                }
                className="absolute left-3 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 md:left-6"
              >
                <Icon name="ChevronLeft" size={24} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setOpenIndex((openIndex + 1) % images.length)
                }
                className="absolute right-3 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 md:right-6"
              >
                <Icon name="ChevronRight" size={24} />
              </button>
            </>
          )}

          <div className="relative max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-black">
            <div className="relative aspect-[4/3]">
              <Image
                src={images[openIndex]}
                alt={`${venueName} ${openIndex + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </div>
          </div>

          <div className="absolute bottom-6 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setOpenIndex(i)}
                className={`size-2 rounded-full transition-colors ${
                  i === openIndex ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
