import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, Plus, Play, Edit, Trash2, Download, CheckCircle, AlertCircle, Upload, FileDown } from "lucide-react"
import { ConversationAnalysisConfig as AnalysisConfig, ConversationLog, ConversationAnalysisResult } from "../types"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { app } from "@/lib/app"
import { ConversationAnalysisConfigDialog as ConfigDialogComponent } from "./conversation-analysis-config"
import { ConversationAnalyzer } from "../conversation-analysis"
import { useAnalysisConfigs } from "../hooks/useAnalysisConfigs"
import { AnalysisResultExporter } from "../services/analysisResultExporter"
import { ConfirmDialog } from "./ui/ConfirmDialog"
import { ToastContainer } from "./ui/ToastContainer"
import { useToast } from "../hooks/useToast"

interface ConversationAnalysisManagerProps {
  conversations: ConversationLog[]
  onAnalysisComplete: (results: ConversationAnalysisResult[]) => void
}

export function ConversationAnalysisManager({ conversations, onAnalysisComplete }: ConversationAnalysisManagerProps) {
  const { selectedTeam } = useTeamStore()
  const { configs, isLoading, saveConfig, deleteConfig, exportConfigs, importConfigs } = useAnalysisConfigs()
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [editingConfig, setEditingConfig] = useState<AnalysisConfig | undefined>()
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState({ processed: 0, total: 0 })
  const [analysisResults, setAnalysisResults] = useState<ConversationAnalysisResult[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [configToDelete, setConfigToDelete] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const toast = useToast()

  const handleSaveConfig = (config: AnalysisConfig) => {
    saveConfig(config)
    setShowConfigDialog(false)
    setEditingConfig(undefined)
  }

  const handleDeleteConfig = (configId: string) => {
    setConfigToDelete(configId)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteConfig = () => {
    if (configToDelete) {
      deleteConfig(configToDelete)
      toast.success('Analysis configuration deleted successfully')
      setConfigToDelete(null)
    }
  }

  const handleImportConfigs = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      await importConfigs(file)
      toast.success('Analysis configurations imported successfully!')
    } catch (error) {
      console.error('Import failed:', error)
      toast.error('Failed to import configurations. Please check the file format.')
    } finally {
      e.target.value = ''
    }
  }

  const handleRunAnalysis = async (config: AnalysisConfig) => {
    if (!config.enabled || conversations.length === 0) return

    setAnalyzing(true)
    setAnalysisProgress({ processed: 0, total: conversations.length })

    try {
      const apiKeys = await app.fetchAPIkeys(selectedTeam?.id || '')
      
      if (!apiKeys.openai) {
        toast.error('OpenAI API key not found. Please configure your API key to run analysis.')
        setAnalyzing(false)
        return
      }
      
      const results = await ConversationAnalyzer.analyzeConversations(
        conversations,
        config,
        apiKeys,
        (processed, total) => {
          setAnalysisProgress({ processed, total })
        }
      )

      setAnalysisResults(results)
      onAnalysisComplete(results)
      toast.success(`Analysis completed for ${results.length} conversations`)
      
    } catch (error) {
      console.error('Analysis failed:', error)
      toast.error('Analysis failed. Please check your configuration and try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const exportAnalysisResults = () => {
    AnalysisResultExporter.exportAnalysisResults(analysisResults)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Conversation Analysis
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              onClick={exportConfigs}
              size="sm"
              variant="ghost"
              disabled={configs.length === 0}
              title="Export configurations"
            >
              <FileDown className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              variant="ghost"
              title="Import configurations"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => setShowConfigDialog(true)}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {conversations.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No conversations available for analysis. Switch to the Conversation tab and ensure there are conversations to analyze.
            </AlertDescription>
          </Alert>
        )}

        {analyzing && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div>Analyzing conversations... {analysisProgress.processed} of {analysisProgress.total} completed</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(analysisProgress.processed / analysisProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              Loading configurations...
            </div>
          </div>
        ) : configs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No analysis configurations created yet.</p>
            <p className="text-sm">Create your first analysis to extract insights from conversations.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {configs.map((config) => (
              <Card key={config.id} className="border-dashed">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{config.name}</h4>
                        <Badge variant={config.enabled ? "default" : "secondary"}>
                          {config.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                        <Badge variant="outline">{config.model}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{config.instructions}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {config.fields.length} field{config.fields.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">
                          Updated {new Date(config.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleRunAnalysis(config)}
                        disabled={!config.enabled || analyzing || conversations.length === 0}
                        size="sm"
                        variant="default"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Analyze
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingConfig(config)
                          setShowConfigDialog(true)
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteConfig(config.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {analysisResults.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Analysis Results ({analysisResults.length} conversations processed)
              </span>
              <Button onClick={exportAnalysisResults} size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              Results from the last analysis run. Use "Export Results" to download detailed CSV.
            </div>
          </div>
        )}

        {showConfigDialog && (
          <ConfigDialogComponent
            config={editingConfig}
            onSave={handleSaveConfig}
            onCancel={() => {
              setShowConfigDialog(false)
              setEditingConfig(undefined)
            }}
          />
        )}

        {/* Hidden file input for importing configs */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportConfigs}
          className="hidden"
        />

        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Delete Analysis Configuration"
          description="Are you sure you want to delete this analysis configuration? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDeleteConfig}
          variant="destructive"
        />

        <ToastContainer 
          toasts={toast.toasts} 
          onRemoveToast={toast.removeToast} 
        />
      </CardContent>
    </Card>
  )
}
