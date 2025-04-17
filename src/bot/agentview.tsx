import ReactJson from 'react-json-view'

export default function AgentJsonView({ data }) {
  let jsonData = data
  
  if (typeof data === 'string') {
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      jsonData = data
    }
  }
  if (typeof jsonData !== 'object' || jsonData === null) {
    return <div className="whitespace-pre-wrap">{data}</div>
  }
  return (
    <ReactJson
      src={jsonData}
      collapsed={1}
      enableClipboard={true}
      displayObjectSize={true}
      name={null}
    />
  )
}