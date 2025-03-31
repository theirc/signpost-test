/**
 * useFileStorage Hook
 * 
 * A hook to manage file uploads and storage in the application.
 * Provides functionality to upload, list, and delete files from the specified storage bucket.
 * 
 * @param {string} bucketName - The name of the storage bucket to use (defaults to 'documents')
 * 
 * @returns {Object} An object containing file storage operations:
 *   - uploading: Boolean indicating if a file is currently being uploaded
 *   - error: Any error that occurred during operations
 *   - uploadFile: Function to upload a file to storage
 *   - listFiles: Function to list files in a specific path
 *   - deleteFile: Function to delete a file from storage
 */
import { useState } from 'react'
import { useSupabase } from '@/hooks/use-supabase'

export function useFileStorage(bucketName: string = 'documents') {
  const supabase = useSupabase()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const uploadFile = async (file: File, path?: string) => {
    try {
      setUploading(true)
      setError(null)

      const filePath = path ? `${path}/${file.name}` : file.name
      
      const { data, error: uploadError } = await supabase
        .storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError
      
      // Get public URL
      const { data: urlData } = supabase
        .storage
        .from(bucketName)
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return null
    } finally {
      setUploading(false)
    }
  }

  const listFiles = async (path?: string) => {
    try {
      setError(null)
      const { data, error: listError } = await supabase
        .storage
        .from(bucketName)
        .list(path || '')

      if (listError) throw listError
      return data
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return []
    }
  }

  const deleteFile = async (path: string) => {
    try {
      setError(null)
      const { error: deleteError } = await supabase
        .storage
        .from(bucketName)
        .remove([path])

      if (deleteError) throw deleteError
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return false
    }
  }

  return { uploadFile, listFiles, deleteFile, uploading, error }
} 