import { useEffect, useState, useRef } from "react";
import Markdown from "react-markdown";

interface TypewriterTextProps {
  text: string;
  className?: string;
  speed?: number; // Typing speed in milliseconds
}

/**
 * TypewriterText component that animates text word by word
 * 
 * @param {string} text - The text to animate
 * @param {string} className - Optional CSS class name
 * @param {number} speed - Optional typing speed in milliseconds (default: 30ms)
 */
export function TypewriterText({ text, className, speed = 30 }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const words = text.split(' ');
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Reset animation when text changes
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);
  
  useEffect(() => {
    if (currentIndex < words.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + (prev ? ' ' : '') + words[currentIndex]);
        setCurrentIndex(currentIndex + 1);
        
        // Scroll the container into view after text update
        if (containerRef.current) {
          containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, speed);
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, words, speed]);

  // Styling for different elements
  const a = (props: any) => {
    return (
      <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
        {props.children}
      </a>
    );
  };

  const p = (props: any) => {
    return (
      <p {...props} className="font-sans text-sm leading-relaxed text-gray-800" style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.5, fontSize: '0.925rem' }}>
        {props.children}
      </p>
    );
  };

  const ul = (props: any) => {
    return (
      <ul {...props} className="list-disc pl-5 my-2">
        {props.children}
      </ul>
    );
  };

  const li = (props: any) => {
    return (
      <li {...props} className="font-sans text-sm my-1" style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.5, fontSize: '0.925rem' }}>
        {props.children}
      </li>
    );
  };

  return (
    <div ref={containerRef} className={`font-sans ${className || ""}`}>
      <Markdown
        components={{
          a,
          p,
          ul,
          ol: ({ node, ...props }) => (
            <ol {...props} className="list-decimal pl-5 my-2">
              {props.children}
            </ol>
          ),
          li
        }}
      >
        {displayedText}
      </Markdown>
      {currentIndex < words.length && (
        <span className="inline-block w-1.5 h-4 bg-black ml-1 animate-pulse"></span>
      )}
    </div>
  );
} 