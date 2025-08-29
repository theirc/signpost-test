import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Settings, Save } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConversationAnalysisConfig, ConversationAnalysisField } from "../types"
const analysisTemplates = [
  {
    name: "Conversation Quality Analysis",
    instructions: "Analyze the quality and effectiveness of this conversation. Consider user satisfaction, issue resolution, and agent performance.",
    fields: [
      {
        name: "sentiment",
        type: "enum" as const,
        prompt: "Overall sentiment of the conversation",
        enum: ["very_positive", "positive", "neutral", "negative", "very_negative"]
      },
      {
        name: "resolution_status", 
        type: "enum" as const,
        prompt: "Was the user's issue or question resolved?",
        enum: ["fully_resolved", "partially_resolved", "not_resolved", "unclear"]
      },
      {
        name: "quality_score",
        type: "number" as const,
        prompt: "Rate the conversation quality from 1-10 based on helpfulness, clarity, and professionalism"
      },
      {
        name: "user_satisfaction",
        type: "enum" as const,
        prompt: "Estimated user satisfaction level", 
        enum: ["very_satisfied", "satisfied", "neutral", "dissatisfied", "very_dissatisfied"]
      }
    ]
  }
]
import { AllAIModels } from "@/lib/agents/modellist"
import { ConversationAnalysisSchemChat } from "./conversation-analysis-schema-chat"

interface ConversationAnalysisConfigProps {
  config?: ConversationAnalysisConfig
  onSave: (config: ConversationAnalysisConfig) => void
  onCancel: () => void
}

const fieldTypes = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'True/False' },
  { value: 'enum', label: 'Multiple Choice' },
  { value: 'string[]', label: 'Text List' },
  { value: 'number[]', label: 'Number List' },
]

export function ConversationAnalysisConfigDialog({ config, onSave, onCancel }: ConversationAnalysisConfigProps) {
  const [showAIAssistant, setShowAIAssistant] = useState(!config) // Show AI assistant for new configs
  const [formData, setFormData] = useState<ConversationAnalysisConfig>(
    config || {
      id: '',
      name: '',
      model: 'openai/gpt-4.1-nano',
      instructions: '',
      fields: [],
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  )

  const addField = () => {
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, {
        name: '',
        type: 'string',
        prompt: '',
      }]
    }))
  }

  const updateField = (index: number, field: Partial<ConversationAnalysisField>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? { ...f, ...field } : f)
    }))
  }

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }))
  }

  const addEnumOption = (fieldIndex: number) => {
    const field = formData.fields[fieldIndex]
    if (field.type === 'enum') {
      updateField(fieldIndex, {
        enum: [...(field.enum || []), '']
      })
    }
  }

  const updateEnumOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const field = formData.fields[fieldIndex]
    if (field.type === 'enum' && field.enum) {
      const newEnum = [...field.enum]
      newEnum[optionIndex] = value
      updateField(fieldIndex, { enum: newEnum })
    }
  }

  const removeEnumOption = (fieldIndex: number, optionIndex: number) => {
    const field = formData.fields[fieldIndex]
    if (field.type === 'enum' && field.enum) {
      updateField(fieldIndex, {
        enum: field.enum.filter((_, i) => i !== optionIndex)
      })
    }
  }

  const applyTemplate = (template: Partial<ConversationAnalysisConfig>) => {
    setFormData(prev => ({
      ...prev,
      name: template.name || prev.name,
      instructions: template.instructions || prev.instructions,
      fields: template.fields || prev.fields,
    }))
  }

  const handleAISchemaGenerated = (schema: Partial<ConversationAnalysisConfig>) => {
    setFormData(prev => ({
      ...prev,
      name: schema.name || prev.name,
      instructions: schema.instructions || prev.instructions,
      fields: schema.fields || prev.fields,
    }))
    setShowAIAssistant(false)
  }

  const handleSave = () => {
    const configToSave: ConversationAnalysisConfig = {
      ...formData,
      id: formData.id || `analysis_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    }
    onSave(configToSave)
  }

  if (showAIAssistant) {
    return (
      <Dialog open onOpenChange={() => onCancel()}>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>AI Schema Assistant</DialogTitle>
          </DialogHeader>
          <ConversationAnalysisSchemChat
            onSchemaGenerated={handleAISchemaGenerated}
            onClose={() => setShowAIAssistant(false)}
          />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {config ? 'Edit Analysis Configuration' : 'Create Analysis Configuration'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Start Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {analysisTemplates.map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(template)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAIAssistant(true)}
                  className="w-full"
                >
                  🤖 Use AI Assistant to Define Schema
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Basic Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Basic Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Configuration Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Conversation Quality Analysis"
                />
              </div>

              <div>
                <Label htmlFor="model">AI Model</Label>
                <Select
                  value={formData.model}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, model: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AllAIModels.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="instructions">Analysis Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Describe what the AI should analyze and how..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fields Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                Analysis Fields
                <Button onClick={addField} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.fields.map((field, fieldIndex) => (
                <Card key={fieldIndex} className="border-dashed">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">Field {fieldIndex + 1}</Badge>
                        <Button
                          onClick={() => removeField(fieldIndex)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Field Name</Label>
                          <Input
                            value={field.name}
                            onChange={(e) => updateField(fieldIndex, { name: e.target.value })}
                            placeholder="e.g., sentiment"
                          />
                        </div>
                        <div>
                          <Label>Field Type</Label>
                          <Select
                            value={field.type}
                            onValueChange={(value) => updateField(fieldIndex, { 
                              type: value as ConversationAnalysisField['type'],
                              enum: value === 'enum' ? [''] : undefined
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Prompt/Description</Label>
                        <Textarea
                          value={field.prompt}
                          onChange={(e) => updateField(fieldIndex, { prompt: e.target.value })}
                          placeholder="Describe what this field should capture..."
                          rows={2}
                        />
                      </div>

                      {field.type === 'enum' && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Options</Label>
                            <Button
                              onClick={() => addEnumOption(fieldIndex)}
                              size="sm"
                              variant="outline"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Option
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {(field.enum || []).map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) => updateEnumOption(fieldIndex, optionIndex, e.target.value)}
                                  placeholder="Option value"
                                />
                                <Button
                                  onClick={() => removeEnumOption(fieldIndex, optionIndex)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {formData.fields.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No fields configured. Click "Add Field" to start defining what to analyze.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.name || formData.fields.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
