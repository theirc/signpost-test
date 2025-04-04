
export const app = {
  agent: null as Agent,

  getAPIkeys() {
    const apiKeys = JSON.parse(localStorage.getItem("apikeys") || "{}") as APIKeys
    return apiKeys
  },
  saveAPIkeys(apiKeys: APIKeys) {
    localStorage.setItem("apikeys", JSON.stringify(apiKeys || {}))
  }
}

