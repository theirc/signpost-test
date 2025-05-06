import ReactJson from 'react-json-view'
import { isImageUrl, parseMarkdownImage } from '../pages/chat' // Import helpers

const ensureString = (value: any): string => {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (e) {
      console.warn('Failed to stringify object:', e);
      return String(value);
    }
  }
  return String(value);
};

export default function AgentJsonView({ data }) {
  const dataString = typeof data === 'string' ? data : ensureString(data);
  
  const { imageUrl, remainingText } = parseMarkdownImage(dataString);

  if (imageUrl) {
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

  if (typeof data === 'object' && data !== null) {
    return (
      <ReactJson
        src={data}
        collapsed={1}
        enableClipboard={true}
        displayObjectSize={true}
        name={null}
      />
    );
  }

  if (typeof data === 'string') {
    try {
      const jsonData = JSON.parse(data);
      return (
        <ReactJson
          src={jsonData}
          collapsed={1}
          enableClipboard={true}
          displayObjectSize={true}
          name={null}
        />
      );
    } catch (e) {
      return (
        <div 
          className="whitespace-pre-wrap" 
          style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.5, fontSize: '0.925rem' }}
        >
          {data}
        </div>
      );
    }
  }
  
  return (
    <div 
      className="whitespace-pre-wrap" 
      style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.5, fontSize: '0.925rem' }}
    >
      {ensureString(data)}
    </div>
  );
}