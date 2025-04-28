import { Card, CardContent } from '@/components/ui/card'
import React, { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { fetchBotScores, fetchBotLogs } from '@/lib/data/supabaseFunctions'
import CustomTable from '@/components/ui/custom-table'
import { ColumnDef } from '@tanstack/react-table'
import SearchFilter from '@/components/ui/search-filter'
import DateFilter from '@/components/ui/date-filter'
import SelectFilter from '@/components/ui/select-filter'
import { useTeamStore } from '@/lib/hooks/useTeam'

export function CustomView() {
    const { selectedTeam } = useTeamStore()
    const [selectedScoreFields, setSelectedScoreFields] = useState<string[]>(() => {
        const saved = localStorage.getItem('customViewScoreFields')
        return saved ? JSON.parse(saved) : []
    })
    const [selectedLogFields, setSelectedLogFields] = useState<string[]>(() => {
        const saved = localStorage.getItem('customViewLogFields')
        return saved ? JSON.parse(saved) : []
    })
    const [isCreated, setIsCreated] = useState<boolean>(() => {
        const saved = localStorage.getItem('customViewIsCreated')
        return saved ? JSON.parse(saved) : false
    })
    const [scores, setScores] = useState([])
    const [logs, setLogs] = useState([])
    const [previewData, setPreviewData] = useState<any[]>([])
    const [columns, setColumns] = useState<ColumnDef<any>[]>(() => {
        const saved = localStorage.getItem('customViewColumns')
        return saved ? JSON.parse(saved) : []
    })

    useEffect(() => {
        const loadData = async () => {
            const [{ data: scoresData }, { data: logsData }] = await Promise.all([
                fetchBotScores(),
                fetchBotLogs()
            ])
            setScores(scoresData)
            setLogs(logsData)
        }
        loadData()
    }, [selectedTeam])

    useEffect(() => {
        if (isCreated && scores.length > 0 && logs.length > 0) {
            generatePreview()
        }
    }, [isCreated, scores, logs])

    useEffect(() => {
        localStorage.setItem('customViewScoreFields', JSON.stringify(selectedScoreFields))
    }, [selectedScoreFields])

    useEffect(() => {
        localStorage.setItem('customViewLogFields', JSON.stringify(selectedLogFields))
    }, [selectedLogFields])

    useEffect(() => {
        localStorage.setItem('customViewColumns', JSON.stringify(columns))
    }, [columns])

    useEffect(() => {
        localStorage.setItem('customViewIsCreated', JSON.stringify(isCreated))
    }, [isCreated])

    const handleScoreFieldChange = (field: string, checked: boolean) => {
        setSelectedScoreFields(prev =>
            checked ? [...prev, field] : prev.filter(f => f !== field)
        )
    }

    const handleLogFieldChange = (field: string, checked: boolean) => {
        setSelectedLogFields(prev =>
            checked ? [...prev, field] : prev.filter(f => f !== field)
        )
    }

    const handleEdit = () => {
        setIsCreated(false)
        setPreviewData([])
        setColumns([])
    }

    const generatePreview = () => {
        const newColumns: ColumnDef<any>[] = []

        selectedScoreFields.forEach(field => {
            newColumns.push({
                id: `score-${field}`,
                accessorKey: field,
                header: field.replace('_', ' ').toUpperCase(),
                enableResizing: true,
                enableHiding: true,
                enableSorting: true,
            })
        })

        selectedLogFields.forEach(field => {
            newColumns.push({
                id: `log-${field}`,
                accessorKey: field,
                header: field.replace('_', ' ').toUpperCase(),
                enableResizing: true,
                enableHiding: true,
                enableSorting: true,
            })
        })

        setColumns(newColumns)

        const joinedData = scores.map(score => {
            const log = logs.find(log => log.id === score.log_id)
            const row: any = {}

            selectedScoreFields.forEach(field => {
                row[field] = score[field]
            })

            selectedLogFields.forEach(field => {
                row[field] = log ? log[field] : null
            })

            return row
        })

        setPreviewData(joinedData)
    }

    const filters = [
        {
            id: "search",
            label: "Search",
            component: SearchFilter,
            props: { filterKey: "search", placeholder: "Search..." },
        },
        {
            id: "bot",
            label: "Bot",
            component: SelectFilter,
            props: { filterKey: "bot_name", placeholder: "All bots" },
        },
        {
            id: "score",
            label: "Score",
            component: SelectFilter,
            props: { filterKey: "score", placeholder: "All Scores" },
        },
        {
            id: "category",
            label: "Category",
            component: SelectFilter,
            props: { filterKey: "category_name", placeholder: "All Categories" },
        },

        {
            id: "reporter",
            label: "Reporter",
            component: SelectFilter,
            props: { filterKey: "reporter", placeholder: "All Reporters" },
        },
        {
            id: "range",
            label: "Date Created",
            component: DateFilter,
            props: { filterKey: "created_at", placeholder: "Pick a date" },
        },
    ]

    const handleCreate = () => {
        setIsCreated(true)
        generatePreview()
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Custom View</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Design your own evaluation template by merging fields from both Scores and Logs.
                        </p>
                    </div>
                    {isCreated && (
                        <Button onClick={handleEdit} variant="outline">
                            Edit View
                        </Button>
                    )}
                </div>

                {!isCreated ? (
                    <div className='flex gap-6'>
                        <div className='flex-[2_1_0%]'>
                            <div className='flex justify-end'>
                                <div className='invisible p-4 px-8 flex justify-end gap-1 text-white'>
                                    ''
                                </div>
                            </div>
                            <Card className='flex-1 mr-10'>
                                <CardContent className='p-8'>
                                    <strong>Heads up!</strong>
                                    <p>
                                        Always start by selecting your fields from the scores view, as it contains the
                                        default data for evaluation. Log field(s) should be added as extra columns
                                        to capture relevant information that enhances your evaluation process and
                                        simplifies your export experience.
                                    </p>
                                    <ol className="list-[auto]">
                                        <li>Start by selecting from the Scores collection</li>
                                        <li>Then, choose from the Logs collection</li>
                                        <li>Once finished, click 'Preview' to review the selections before proceeding to 'Create'.</li>
                                    </ol>
                                    <p>You can <strong>'Preview'</strong> as many times as you want!</p>
                                </CardContent>
                            </Card>
                        </div>
                        <div className='flex-1'>
                            <div className='flex justify-end'>
                                <div className='border rounded-2xl p-4 px-8 flex justify-end gap-1 bg-[#ef4343] text-white'>
                                    <strong>Scores </strong> Selection
                                </div>
                            </div>
                            <Card className='h-[282px] overflow-y-auto'>
                                <CardContent className='pt-4'>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="score-id"
                                                    checked={selectedScoreFields.includes('id')}
                                                    onCheckedChange={(checked) => handleScoreFieldChange('id', checked as boolean)}
                                                />
                                                <label htmlFor="score-id">ID</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="score-created-at"
                                                    checked={selectedScoreFields.includes('created_at')}
                                                    onCheckedChange={(checked) => handleScoreFieldChange('created_at', checked as boolean)}
                                                />
                                                <label htmlFor="score-created-at">Created At</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="score-reporter"
                                                    checked={selectedScoreFields.includes('reporter')}
                                                    onCheckedChange={(checked) => handleScoreFieldChange('reporter', checked as boolean)}
                                                />
                                                <label htmlFor="score-reporter">Reporter</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="score-score"
                                                    checked={selectedScoreFields.includes('score')}
                                                    onCheckedChange={(checked) => handleScoreFieldChange('score', checked as boolean)}
                                                />
                                                <label htmlFor="score-score">Score</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="score-question"
                                                    checked={selectedScoreFields.includes('question')}
                                                    onCheckedChange={(checked) => handleScoreFieldChange('question', checked as boolean)}
                                                />
                                                <label htmlFor="score-question">Question</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="score-answer"
                                                    checked={selectedScoreFields.includes('answer')}
                                                    onCheckedChange={(checked) => handleScoreFieldChange('answer', checked as boolean)}
                                                />
                                                <label htmlFor="score-answer">Answer</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="score-bot-name"
                                                    checked={selectedScoreFields.includes('bot_name')}
                                                    onCheckedChange={(checked) => handleScoreFieldChange('bot_name', checked as boolean)}
                                                />
                                                <label htmlFor="score-bot-name">Bot</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="score-message"
                                                    checked={selectedScoreFields.includes('message')}
                                                    onCheckedChange={(checked) => handleScoreFieldChange('message', checked as boolean)}
                                                />
                                                <label htmlFor="score-message">Message</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="score-category-name"
                                                    checked={selectedScoreFields.includes('category_name')}
                                                    onCheckedChange={(checked) => handleScoreFieldChange('category_name', checked as boolean)}
                                                />
                                                <label htmlFor="score-category-name">Category</label>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className='flex-1'>
                            <div className='flex justify-end'>
                                <div className='border rounded-2xl p-4 px-8 flex justify-end gap-1 bg-[#ef4343] text-white'>
                                    <strong>Logs </strong> Selection
                                </div>
                            </div>
                            <Card className='h-[282px] overflow-y-auto'>
                                <CardContent className='pt-4'>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="log-id"
                                                    checked={selectedLogFields.includes('id')}
                                                    onCheckedChange={(checked) => handleLogFieldChange('id', checked as boolean)}
                                                />
                                                <label htmlFor="log-id">ID</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="log-bot-name"
                                                    checked={selectedLogFields.includes('bot_name')}
                                                    onCheckedChange={(checked) => handleLogFieldChange('bot_name', checked as boolean)}
                                                />
                                                <label htmlFor="log-bot-name">Bot</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="log-category-name"
                                                    checked={selectedLogFields.includes('category_name')}
                                                    onCheckedChange={(checked) => handleLogFieldChange('category_name', checked as boolean)}
                                                />
                                                <label htmlFor="log-category-name">Category</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="log-detected-language"
                                                    checked={selectedLogFields.includes('detected_language')}
                                                    onCheckedChange={(checked) => handleLogFieldChange('detected_language', checked as boolean)}
                                                />
                                                <label htmlFor="log-detected-language">Detected Language</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="log-detected-location"
                                                    checked={selectedLogFields.includes('detected_location')}
                                                    onCheckedChange={(checked) => handleLogFieldChange('detected_location', checked as boolean)}
                                                />
                                                <label htmlFor="log-detected-location">Detected Location</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="log-search-term"
                                                    checked={selectedLogFields.includes('search_term')}
                                                    onCheckedChange={(checked) => handleLogFieldChange('search_term', checked as boolean)}
                                                />
                                                <label htmlFor="log-search-term">Search Term</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="log-user-message"
                                                    checked={selectedLogFields.includes('user_message')}
                                                    onCheckedChange={(checked) => handleLogFieldChange('user_message', checked as boolean)}
                                                />
                                                <label htmlFor="log-user-message">User Message</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="log-answer"
                                                    checked={selectedLogFields.includes('answer')}
                                                    onCheckedChange={(checked) => handleLogFieldChange('answer', checked as boolean)}
                                                />
                                                <label htmlFor="log-answer">Answer</label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="log-created-at"
                                                    checked={selectedLogFields.includes('created_at')}
                                                    onCheckedChange={(checked) => handleLogFieldChange('created_at', checked as boolean)}
                                                />
                                                <label htmlFor="log-created-at">Created At</label>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : null}
                
                {!isCreated && (
                    <div className="flex justify-end gap-4">
                        <Button onClick={generatePreview}>
                            Preview
                        </Button>
                        <Button onClick={handleCreate} variant="outline">
                            Create
                        </Button>
                    </div>
                )}
                
                {columns.length > 0 && (
                    <div className="space-y-4">
                        <CustomTable
                            columns={columns as any}
                            data={previewData}
                            tableId="custom-view-table"
                            filters={filters}
                            selectedRows={[]}
                            onToggleSelect={() => {}}
                            onSelectAll={() => {}}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
