export const serveurl = "https://directus-qa-support.azurewebsites.net"

export async function getBots () {
  try {
    const url = `${serveurl}/bots`
    
    const response = await fetch(url)
    if(!response.ok) {
      throw new Error (`Server error: ${response.status} - ${response.statusText}`)
    }

    const text = await response.text()

    const bots = JSON.parse(text); 
    console.log("Bots Loaded:", bots);
    return bots
  } catch (error) {
    console.error("Error fetching bots:", error)
    return{}
  }
}