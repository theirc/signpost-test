import { useState, useEffect, useRef } from "react"
import { Input } from "../ui/input"
import { app } from "@/lib/app"
import { toast } from "sonner"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { LoaderCircle, Sparkles } from "lucide-react"
import { ToMarkdown } from "../ui/tomarkdown"

export function ChatFlow() {

  const [history, setHistory] = useState<ChatHistory>([])
  const [input, setInput] = useState("")
  const [executing, setExecuting] = useState(false)
  const { selectedTeam } = useTeamStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const stateRef = useRef({})

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    if (inputRef.current) inputRef.current.focus()
  }, [history, executing])

  async function execute() {
    if (!input || !input.trim()) return
    const message = input.trim()
    const { agent } = app


    const apikeys = await app.fetchAPIkeys(selectedTeam?.id)
    const state: any = stateRef.current

    // console.log(`Executing agent with state:`, state)


    const p: AgentParameters = {
      debug: true,
      input: {
        message,
        history,
      },
      apiKeys: apikeys,
      state
    }

    await agent.execute(p)

    // console.log(`Agent return state:`, p.state)

    stateRef.current = p.state

    if (p.error) {
      toast("Error", {
        description: <div className="text-red-500 font-semibold">{p.error}</div>,
        action: {
          label: "Ok",
          onClick: () => console.log("Ok"),
        },
      })
    }


    return p.output.response

  }

  async function onPressEnter(e: React.KeyboardEvent<HTMLInputElement>) {

    if (!input || !input.trim()) return

    if (e.key === "Enter") {
      const content = input.trim()
      setHistory(h => [...h, { role: "user", content },])
      setInput("")
      setExecuting(true)
      const response = await execute()
      if (response) {
        setHistory(h => [...h, { role: "assistant", content: response }])
      }
      setExecuting(false)
    }
  }

  return <div className='w-[30%] border-l border-r border-gray-200 flex flex-col resize-x'>
    <div className='grid grid-rows-[1fr_auto] flex-grow h-0 min-h-0'>
      <div ref={scrollRef} className="overflow-y-auto p-2 space-y-1 text-sm">
        {history.map((message, index) => {
          if (message.role === "user") return <div key={index} className="p-2 bg-slate-50 rounded  text-right">
            {message.content}
          </div>
          return <div key={index} className="p-2">
            <div className="flex">
              <div>
                <Sparkles className="inline mr-1 mt-3 text-blue-500" size={16} />
              </div>
              <div>
                <ToMarkdown>{message.content}</ToMarkdown>
              </div>
            </div>
            {/* {message.content} */}
          </div>
        })}
      </div>
      {!executing && <div className='p-1'>
        <Input autoFocus value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onPressEnter} placeholder="Type a message..." type="text" ref={inputRef} />
      </div>}
      {executing && <div className='flex items-center justify-center p-2 mb-2'>
        <LoaderCircle size={18} className="animate-spin" />
      </div>}
    </div>
  </div>
}
