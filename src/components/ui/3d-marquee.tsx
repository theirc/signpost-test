"use client";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import React from "react";

export type ThreeDMarqueeProps = {
  images: string[];
  className?: string;
};

// Create a sequence that guarantees all 19 unique images are displayed first
const createImageSequence = (images: string[]) => {
  // First, shuffle all 19 images to create initial sequence
  const shuffledImages = [...images].sort(() => Math.random() - 0.5);
  
  // Create a sequence that prioritizes showing all 19 unique images
  const sequence = [];
  
  // First 19 slots: each unique image appears once (this ensures all images are included)
  sequence.push(...shuffledImages);
  
  // Next 5 slots: fill remaining slots with random images from the pool
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * shuffledImages.length);
    sequence.push(shuffledImages[randomIndex]);
  }
  
  return sequence;
};

// Create a memoized image distribution that won't change on re-renders
const createImageDistribution = (images: string[]) => {
  const imageSequence = createImageSequence(images);
  
  // Split the sequence into 4 columns of 6 images each
  // Ensure all 19 unique images are distributed evenly
  const chunks = Array.from({ length: 4 }, (_, colIndex) => {
    let columnImages;
    
    if (colIndex === 0) {
      // Column 1: Gets first 6 images (all unique)
      columnImages = imageSequence.slice(0, 6);
    } else if (colIndex === 1) {
      // Column 2: Gets next 6 images (all unique)
      columnImages = imageSequence.slice(6, 12);
    } else if (colIndex === 2) {
      // Column 3: Gets next 6 images (all unique)
      columnImages = imageSequence.slice(12, 18);
    } else {
      // Column 4: Gets the last unique image + 5 random ones to fill 6 slots
      const lastUniqueImage = imageSequence[18]; // The 19th unique image
      const randomImages = [];
      for (let i = 0; i < 5; i++) {
        const randomIndex = Math.floor(Math.random() * 19); // Use first 19 (unique) images
        randomImages.push(imageSequence[randomIndex]);
      }
      columnImages = [lastUniqueImage, ...randomImages];
    }
    
    // Ensure no adjacent images are the same within the column
    const finalImages = [];
    for (let i = 0; i < columnImages.length; i++) {
      if (i === 0 || finalImages[i - 1] !== columnImages[i]) {
        finalImages.push(columnImages[i]);
      } else {
        // Find a different image from the remaining sequence
        let differentImage = columnImages[i];
        let attempts = 0;
        while (differentImage === finalImages[i - 1] && attempts < 10) {
          const newIndex = Math.floor(Math.random() * imageSequence.length);
          differentImage = imageSequence[newIndex];
          attempts++;
        }
        finalImages.push(differentImage);
      }
    }
    
    return finalImages;
  });
  
  return chunks;
};

export const ThreeDMarquee = ({ images, className }: ThreeDMarqueeProps) => {
  // Debug: Log the incoming images
  console.log('=== 3D MARQUEE DEBUG ===');
  console.log('Total images passed to component:', images.length);
  console.log('All image paths:', images);
  
  // Generate the image distribution once and memoize it
  const chunks = React.useMemo(() => createImageDistribution(images), [images]);
  
  // Debug: Log the image distribution
  console.log('Image distribution chunks:', chunks);
  
  // Verify all 19 unique images are included
  const allImagesInChunks = chunks.flat();
  const uniqueImagesInChunks = [...new Set(allImagesInChunks)];
  console.log('Total images in chunks:', allImagesInChunks.length);
  console.log('Unique images in chunks:', uniqueImagesInChunks.length);
  console.log('All 19 images should be included:', uniqueImagesInChunks.length === 19);
  
  if (uniqueImagesInChunks.length < 19) {
    console.warn('⚠️ Not all 19 images are included in the chunks!');
    console.warn('Missing images:', images.filter(img => !uniqueImagesInChunks.includes(img)));
  }
  
  console.log('========================');

  return (
    <div
      className={cn(
        "mx-auto block h-full overflow-hidden rounded-2xl",
        className,
      )}
      style={{ pointerEvents: 'auto' }}
    >
      <div className="flex size-full items-center justify-center">
        <div className="size-[1400px] shrink-0 scale-50 sm:scale-75 lg:scale-100">
          <div
            style={{
              transform: "rotateX(45deg) rotateY(0deg) rotateZ(-40deg)",
            }}
            className="relative top-0 left-0 grid size-full origin-center grid-cols-4 gap-8 transform-3d"
          >
            {chunks.map((subarray, colIndex) => (
              <motion.div
                animate={{ y: colIndex % 2 === 0 ? 100 : -100 }}
                transition={{
                  duration: colIndex % 2 === 0 ? 10 : 15,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                key={colIndex + "marquee"}
                className="flex flex-col items-start gap-4 leading-none"
              >
                <GridLineVertical className="-left-4" offset="60px" />
                {subarray.map((image, imageIndex) => (
                  <div className="relative m-0 p-0 leading-none" key={imageIndex + image}>
                    <GridLineHorizontal className="-top-2" offset="20px" />
                    <img
                      key={imageIndex + image}
                      src={image}
                      alt={`Image ${imageIndex + 1} - ${image}`}
                      className="aspect-[500/400] object-cover m-0 p-0 block leading-none align-top rounded-lg cursor-pointer hover:scale-105 hover:shadow-lg hover:bg-blue-100 transition-all duration-300"
                      width={500}
                      height={400}
                      onError={(e) => {
                        console.error(`❌ Failed to load image: ${image}`, e);
                        console.error(`Image path: ${image}`);
                        console.error(`Error details:`, e);
                        // Show a placeholder for failed images
                        e.currentTarget.style.backgroundColor = '#ff0000';
                        e.currentTarget.style.border = '2px solid red';
                      }}
                      onLoad={(e) => {
                        console.log(`✅ Successfully loaded image: ${image}`);
                        console.log(`Image dimensions: ${e.currentTarget.naturalWidth}x${e.currentTarget.naturalHeight}`);
                      }}
                    />
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export type GridLineHorizontalProps = {
  className?: string;
  offset?: string;
};

const GridLineHorizontal = ({ className, offset }: GridLineHorizontalProps) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(0, 0, 0, 0.2)",
          "--height": "1px",
          "--width": "5px",
          "--fade-stop": "90%",
          "--offset": offset || "200px", //-100px if you want to keep the line inside
          "--color-dark": "rgba(255, 255, 255, 0.2)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute left-[calc(var(--offset)/2*-1)] h-[var(--height)] w-[calc(100%+var(--offset))]",
        "bg-[linear-gradient(to_right,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_left,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_right,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        "dark:bg-[linear-gradient(to_right,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className,
      )}
    ></div>
  );
};

export type GridLineVerticalProps = {
  className?: string;
  offset?: string;
};

const GridLineVertical = ({ className, offset }: GridLineVerticalProps) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(0, 0, 0, 0.2)",
          "--height": "5px",
          "--width": "1px",
          "--fade-stop": "90%",
          "--offset": offset || "150px", //-100px if you want to keep the line inside
          "--color-dark": "rgba(255, 255, 255, 0.2)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute top-[calc(var(--offset)/2*-1)] h-[calc(100%+var(--offset))] w-[var(--width)]",
        "bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        "dark:bg-[linear-gradient(to_bottom,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className,
      )}
    ></div>
  );
};

export { GridLineHorizontal, GridLineVertical }; 