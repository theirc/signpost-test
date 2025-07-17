import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { Loader2 } from "lucide-react"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { supabase } from "@/lib/agents/db"
export interface ApiKey {
    id: string
    key?: string
    type?: string
    team_id?: string
    created_at?: string
    description?: string
  }

export function ApiKeysSettings() {
    const navigate = useNavigate()
    const { selectedTeam } = useTeamStore()
    const { canCreate, canUpdate } = usePermissions()
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchApiKey = async () => {
        setIsLoading(true)
        const { data, error } = await supabase.from("api_keys").select("*").eq("team_id", selectedTeam?.id)
        if (error) {
            console.error('Error fetching api keys:', error)
        }

        const formattedApiKeys = data.map(apikey => ({
            ...apikey,
            created_at: apikey.created_at || new Date().toISOString()
        }))
        setApiKeys(formattedApiKeys)
        setIsLoading(false)
    }

    const handleEdit = (id: string) => {
        navigate(`/settings/apikeys/${id}`)
    }

    const columns: ColumnDef<any>[] = [
        { id: "description", accessorKey: "description", header: "Description", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => info.getValue() },
        { id: "type", accessorKey: "type", header: "Type", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => info.getValue() },
        { id: "key", enableResizing: true, enableHiding: true, accessorKey: "key", header: "Key", enableSorting: true, cell: (info) => info.getValue() },
        { id: "created_at", enableResizing: true, enableHiding: true, accessorKey: "created_at", header: "Created", enableSorting: false, cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy") },
    ]

    useEffect(() => {
        fetchApiKey()
    }, [selectedTeam])

    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Api Keys</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage your organization's Api Keys
                    </p>
                </div>
                {canCreate("apikeys") && (
                    <Button onClick={() => navigate("/settings/apikeys/new")}>Create Api Key</Button>
                )}
            </div>
            {isLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <EnhancedDataTable
                    columns={columns as any}
                    data={apiKeys}
                    onRowClick={(row) => {
                        canUpdate("users") ? handleEdit(row.id) : undefined
                    }}
                    placeholder="No keys found" />
            )}
        </div>
    )
} 