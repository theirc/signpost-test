import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search, ChevronDown, Pencil, Trash, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { agents } from "@/lib/data"
import { useState, useEffect } from "react"
import { useSupabase } from "@/hooks/use-supabase"

interface Agent {
  id: string
  name: string
  creator?: string
  created_at: string
  updated_at: string
  status?: string
}

export function AgentList() {
  const supabase = useSupabase()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [agentList, setAgentList] = useState<Agent[]>([])

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setAgentList(data || [])
      } catch (error) {
        console.error('Error fetching agents:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [supabase])

  // Filter agents based on search query
  const filteredAgents = agentList.filter(agent => 
    agent.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pageCount = Math.ceil(filteredAgents.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentAgents = filteredAgents.slice(startIndex, endIndex)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAgents(currentAgents.map(agent => agent.id))
    } else {
      setSelectedAgents([])
    }
  }

  const handleSelectAgent = (agentId: string, checked: boolean) => {
    if (checked) {
      setSelectedAgents([...selectedAgents, agentId])
    } else {
      setSelectedAgents(selectedAgents.filter(id => id !== agentId))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id)

      if (error) throw error
      setAgentList(prev => prev.filter(agent => agent.id !== id))
      setSelectedAgents(prev => prev.filter(selectedId => selectedId !== id))
    } catch (error) {
      console.error('Error deleting agent:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
          <div className="flex space-x-2">
            <Button variant="primary">New Agent</Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search Agent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Agent Name
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Sort A-Z</DropdownMenuItem>
                <DropdownMenuItem>Sort Z-A</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {loading ? (
            <div className="w-full h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
      <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedAgents.length === currentAgents.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Date Created</TableHead>
                    <TableHead>Date Updated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedAgents.includes(agent.id)}
                          onCheckedChange={(checked) => handleSelectAgent(agent.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>{agent.id}</TableCell>
                      <TableCell>{agent.name}</TableCell>
                      <TableCell>{agent.creator || "System"}</TableCell>
                      <TableCell>{new Date(agent.created_at).toLocaleString()}</TableCell>
                      <TableCell>{new Date(agent.updated_at).toLocaleString()}</TableCell>
                      <TableCell>{agent.status || "Active"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/agent/${agent.id}`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(agent.id)}
                              className="text-red-500 focus:text-red-500"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  {selectedAgents.length} of {filteredAgents.length} row(s) selected
                </div>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Rows per page</span>
                    <select 
                      value={rowsPerPage}
                      onChange={(e) => setRowsPerPage(Number(e.target.value))}
                      className="border rounded p-1"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {pageCount}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(pageCount, prev + 1))}
                      disabled={currentPage === pageCount}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(pageCount)}
                      disabled={currentPage === pageCount}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

