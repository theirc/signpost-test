import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Loader2, MoreHorizontal, Pencil, Play, Trash } from "lucide-react"
import { Bot } from "@/lib/data/supabaseFunctions"

interface BotTableProps {
    bots: Bot[]
    loading: boolean
    onDelete: (id: string) => void
    onEdit: (bot: Bot) => void
    onTest: (bot: Bot) => void
    getModelName: (modelId: string) => string
    getCollectionName: (collectionId: string | undefined) => string
    testLoading: boolean
    currentTestBot: Bot | null
}

export default function BotTable({
    bots,
    loading,
    onDelete,
    onEdit,
    onTest,
    getModelName,
    getCollectionName,
    testLoading,
    currentTestBot
}: BotTableProps) {
    if (loading) {
        return (
            <div className="w-full h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Knowledge Base</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {bots.map((bot) => (
                    <TableRow key={bot.id}>
                        <TableCell>{bot.name}</TableCell>
                        <TableCell>{bot.id}</TableCell>
                        <TableCell>{getCollectionName(bot.collection)}</TableCell>
                        <TableCell>{getModelName(bot.model)}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end items-center space-x-1">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => onTest(bot)}
                                    disabled={testLoading && currentTestBot?.id === bot.id}
                                >
                                    {testLoading && currentTestBot?.id === bot.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Play className="h-4 w-4" />
                                    )}
                                    <span className="ml-1">Test</span>
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit(bot)}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            onClick={() => onDelete(bot.id)}
                                            className="text-red-500 focus:text-red-500"
                                        >
                                            <Trash className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
} 