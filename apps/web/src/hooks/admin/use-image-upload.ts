// Hook pour l'upload d'images vers Supabase Storage
// Bucket: products, dossier: products

import { useState } from 'react'
import { supabaseClient } from '@/lib/supabase'

const BUCKET_NAME = 'images'
const FOLDER_NAME = 'products'

interface UseImageUploadOptions {
  onSuccess?: (url: string) => void
  onError?: (error: string) => void
}

/**
 * Hook pour gerer l'upload d'images produits vers Supabase Storage
 */
export function useImageUpload(options: UseImageUploadOptions = {}) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  /**
   * Genere un nom de fichier unique
   */
  function generateFileName(originalName: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
    return `${FOLDER_NAME}/${timestamp}-${random}.${extension}`
  }

  /**
   * Upload une image vers Supabase Storage
   */
  async function uploadImage(file: File): Promise<string | null> {
    if (!file) return null

    // Validation du type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      options.onError?.('Format invalide. Utilisez JPG, PNG, WebP ou GIF.')
      return null
    }

    // Validation de la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      options.onError?.('Image trop volumineuse. Maximum 5 Mo.')
      return null
    }

    setUploading(true)

    try {
      const fileName = generateFileName(file.name)

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabaseClient.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // Recuperer l'URL publique
      const { data: urlData } = supabaseClient.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl
      setPreviewUrl(publicUrl)
      options.onSuccess?.(publicUrl)

      return publicUrl
    } catch (error) {
      console.error('Erreur upload:', error)
      options.onError?.('Erreur lors de l\'upload de l\'image.')
      return null
    } finally {
      setUploading(false)
    }
  }

  /**
   * Supprime une image du storage
   */
  async function deleteImage(url: string): Promise<boolean> {
    try {
      // Extraire le chemin du fichier depuis l'URL
      const urlParts = url.split(`${BUCKET_NAME}/`)
      if (urlParts.length < 2) return false

      const filePath = urlParts[1]

      const { error } = await supabaseClient.storage
        .from(BUCKET_NAME)
        .remove([filePath])

      if (error) throw error

      setPreviewUrl(null)
      return true
    } catch (error) {
      console.error('Erreur suppression:', error)
      return false
    }
  }

  /**
   * Definir l'URL de preview (pour l'edition)
   */
  function setInitialPreview(url: string | null) {
    setPreviewUrl(url)
  }

  return {
    uploading,
    previewUrl,
    uploadImage,
    deleteImage,
    setInitialPreview,
  }
}
