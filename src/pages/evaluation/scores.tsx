import sampleScores from "@/components/data/sample-scores"
import { ScoresTable } from "@/components/scores-table"
import React, { useState } from "react"


export function BotScoresTable() {
    const [scores, setScores] = useState(sampleScores)
    const [selectedScores, setSelectedScores] = React.useState<string[]>([])

    const handleDelete = (id: string) => {
        const newScores = scores.filter(source => source.id !== id)
        setScores(newScores)
        setSelectedScores(selectedScores.filter(sourceId => sourceId !== id))
    }

    const handleToggleSelect = (id: string) => {
        setSelectedScores(prev =>
            prev.includes(id)
                ? prev.filter(scoreId => scoreId !== id)
                : [...prev, id]
        )
    }

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedScores(event.target.checked ? scores.map(score => score.id) : [])
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Scores</h2>
                    </div>
                </div>

                <div className="space-y-4">
                    <ScoresTable
                        scores={scores}
                        selectedScores={selectedScores}
                        onToggleSelect={handleToggleSelect}
                        onSelectAll={handleSelectAll}
                        onDelete={handleDelete}
                    />
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                            {selectedScores.length} scores selected
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 