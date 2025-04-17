import { ScoresTable } from "@/components/scores-table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { deleteBotScore, fetchBotScores } from "@/lib/data/supabaseFunctions"
import { Plus } from "lucide-react"
import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"


export function BotScoresTable() {
    const navigate = useNavigate()
    const [scores, setScores] = useState([])
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [scoreToDelete, setScoreToDelete] = useState<string | null>(null)
    const [selectedScores, setSelectedScores] = React.useState<string[]>([])

    const fetchScores = async () => {
        const { data, error } = await fetchBotScores()
        if (error) {
            console.error('Error fetching bot logs:', error)
        }
        const formattedScores = data.map(score => ({
            ...score,
            created_at: score.created_at || new Date().toISOString()
        }))
        setScores(formattedScores)
    }

    const handleDelete = async (id: string) => {
        setScoreToDelete(id)
        setIsDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!scoreToDelete) return

        const { error } = await deleteBotScore(scoreToDelete)
        if (error) {
            console.error('Error deleting log:', error)
        } else {
            await fetchScores()
        }
        setIsDeleteDialogOpen(false)
        setScoreToDelete(null)
    }

    const handleEdit = (id: string) => {
        navigate(`/scores/${id}`)
    }

    const handleToggleSelect = (id: string) => {
        setSelectedScores(prev =>
            prev.includes(id)
                ? prev.filter(scoreId => scoreId !== id)
                : [...prev, id]
        )
    }

    const handleSelectAll = () => {
        setSelectedScores(prev => prev.length === scores.length ? [] : scores.map(score => score.id))
    }

    useEffect(() => {
        fetchScores()
    }, [])

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Scores</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            View and manage your bot evaluation scores.
                        </p>
                    </div>
                    <Button onClick={() => navigate("/scores/new")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Score
                    </Button>
                </div>

                <div className="space-y-4">
                    <ScoresTable
                        scores={scores}
                        selectedScores={selectedScores}
                        onToggleSelect={handleToggleSelect}
                        onSelectAll={handleSelectAll}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                    />
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                            {selectedScores.length} scores selected
                        </div>
                    </div>
                </div>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action is irreversible. This will permanently delete the score.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
} 