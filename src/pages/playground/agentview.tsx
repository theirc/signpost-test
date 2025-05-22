import ReactJson from 'react-json-view';

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

interface AgentJsonViewProps {
  data: any;
}

export default function AgentJsonView({ data }: AgentJsonViewProps) {
  const dataString = typeof data === 'string' ? data : ensureString(data);

  if (typeof data === 'object' && data !== null) {
    return (
      <ReactJson
        src={data}
        collapsed={1}
        enableClipboard={true}
        displayObjectSize={true}
        name={null}
        theme="rjv-default"
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.875rem',
          backgroundColor: 'transparent'
        }}
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
          theme="rjv-default"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.875rem',
            backgroundColor: 'transparent'
          }}
        />
      );
    } catch (e) {
      return (
        <div
          className="whitespace-pre-wrap"
          style={{ 
            fontFamily: 'Inter, sans-serif', 
            lineHeight: 1.5, 
            fontSize: '0.925rem' 
          }}
        >
          {data}
        </div>
      );
    }
  }

return (
    <div
      className="whitespace-pre-wrap"
      style={{ 
        fontFamily: 'Inter, sans-serif', 
        lineHeight: 1.5, 
        fontSize: '0.925rem' 
      }}
    >
      {ensureString(data)}
    </div>
  )
}