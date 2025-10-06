// LocalStorage utility for comments and annotations

export interface StoredComment {
  id: number
  author: string
  content: string
  timestamp: string
  type: "comment" | "annotation"
  hasDrawing: boolean
  drawingData?: string
  reviewId: number
  fileId: number
}

const STORAGE_KEY = "client_proofing_comments"

export function saveComment(comment: StoredComment) {
  try {
    const existing = getAllComments()
    const updated = [...existing, comment]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return true
  } catch (error) {
    console.error("Error saving comment:", error)
    return false
  }
}

export function getAllComments(): StoredComment[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    return JSON.parse(data)
  } catch (error) {
    console.error("Error getting comments:", error)
    return []
  }
}

export function getCommentsByFile(reviewId: number, fileId: number): StoredComment[] {
  const allComments = getAllComments()
  return allComments.filter(
    (c) => c.reviewId === reviewId && c.fileId === fileId
  )
}

export function getCommentsByReview(reviewId: number): StoredComment[] {
  const allComments = getAllComments()
  return allComments.filter((c) => c.reviewId === reviewId)
}

export function deleteComment(commentId: number) {
  try {
    const existing = getAllComments()
    const updated = existing.filter((c) => c.id !== commentId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return true
  } catch (error) {
    console.error("Error deleting comment:", error)
    return false
  }
}

export function clearAllComments() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error("Error clearing comments:", error)
    return false
  }
}

export function clearCommentsByReview(reviewId: number) {
  try {
    const existing = getAllComments()
    const updated = existing.filter((c) => c.reviewId !== reviewId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return true
  } catch (error) {
    console.error("Error clearing review comments:", error)
    return false
  }
}

