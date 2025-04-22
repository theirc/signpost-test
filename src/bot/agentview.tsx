import ReactJson from 'react-json-view'
import { isImageUrl, parseMarkdownImage } from '../pages/chat' // Import helpers

export default function AgentJsonView({ data }) {
  // First, check if the raw data string contains a markdown image
  const { imageUrl, remainingText } = parseMarkdownImage(typeof data === 'string' ? data : null);

  if (imageUrl) {
    // If markdown image found, render it and the remaining text directly
    return (
      <div className="agent-message-content">
        <img 
          src={imageUrl} 
          alt="Agent image" 
          className="max-w-full h-auto rounded mb-1" 
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {remainingText && 
          <div 
            className="mt-1 text-sm whitespace-pre-wrap" 
            style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.5, fontSize: '0.925rem' }}
          >
            {remainingText}
          </div>
        } 
      </div>
    );
  }

  // If no markdown image, proceed with existing JSON parsing logic
  let jsonData = data
  if (typeof data === 'string') {
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      // Parsing failed, keep raw data (which we know isn't a markdown image at this point)
      jsonData = data 
    }
  }

  // Render using ReactJson if it's an object, otherwise render raw string
  if (typeof jsonData !== 'object' || jsonData === null) {
    // It's a string, but not a markdown image (checked above)
    return (
        <div 
            className="whitespace-pre-wrap" 
            style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.5, fontSize: '0.925rem' }}
        >
            {data}
        </div>
    );
  }
  
  return (
    <ReactJson
      src={jsonData} // It's a valid JSON object
      collapsed={1}
      enableClipboard={true}
      displayObjectSize={true}
      name={null}
    />
  )
}