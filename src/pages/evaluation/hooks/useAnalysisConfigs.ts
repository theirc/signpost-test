import { useState, useEffect } from 'react'
import { ConversationAnalysisConfig } from '../types'
import { useTeamStore } from '@/lib/hooks/useTeam'

const STORAGE_KEY = 'conversation_analysis_configs'

export function useAnalysisConfigs() {
  const { selectedTeam } = useTeamStore()
  const [configs, setConfigs] = useState<ConversationAnalysisConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const getStorageKey = () => `${STORAGE_KEY}_${selectedTeam?.id || 'default'}`

  const loadConfigs = () => {
    try {
      const stored = localStorage.getItem(getStorageKey())
      if (stored) {
        const parsedConfigs = JSON.parse(stored)
        setConfigs(parsedConfigs)
      }
    } catch (error) {
      console.error('Failed to load analysis configs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfigs = (newConfigs: ConversationAnalysisConfig[]) => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(newConfigs))
      setConfigs(newConfigs)
    } catch (error) {
      console.error('Failed to save analysis configs:', error)
    }
  }

  useEffect(() => {
    if (selectedTeam?.id) {
      loadConfigs()
    }
  }, [selectedTeam?.id])

  const saveConfig = (config: ConversationAnalysisConfig) => {
    const existingIndex = configs.findIndex(c => c.id === config.id)
    let newConfigs: ConversationAnalysisConfig[]

    if (existingIndex >= 0) {
      newConfigs = configs.map((c, i) => i === existingIndex ? config : c)
    } else {
      newConfigs = [...configs, config]
    }

    saveConfigs(newConfigs)
  }

  const deleteConfig = (configId: string) => {
    const newConfigs = configs.filter(c => c.id !== configId)
    saveConfigs(newConfigs)
  }

  const getConfig = (configId: string) => {
    return configs.find(c => c.id === configId)
  }

  const exportConfigs = () => {
    const dataStr = JSON.stringify(configs, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analysis-configs-${selectedTeam?.name || 'default'}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importConfigs = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string)
          if (Array.isArray(imported)) {
            const processedConfigs = imported.map(config => ({
              ...config,
              id: config.id || `analysis_${Date.now()}_${Math.random()}`,
              createdAt: config.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }))
            saveConfigs([...configs, ...processedConfigs])
            resolve()
          } else {
            reject(new Error('Invalid file format'))
          }
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  return {
    configs,
    isLoading,
    saveConfig,
    deleteConfig,
    getConfig,
    exportConfigs,
    importConfigs,
    refresh: loadConfigs
  }
}