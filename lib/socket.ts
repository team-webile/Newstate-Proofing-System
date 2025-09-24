import { Server as NetServer } from 'http'
import { NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export class SocketManager {
  static getIO(): SocketIOServer {
    // Use the global Socket.IO instance from server.js
    if (typeof global !== 'undefined' && (global as any).io) {
      return (global as any).io
    }
    throw new Error('Socket.IO not initialized')
  }

  // Emit comment events
  static emitNewComment(projectId: string, elementId: string, comment: any) {
    const io = this.getIO()
    io.to(`project-${projectId}`).emit('new-comment', {
      elementId,
      comment
    })
    io.to(`element-${elementId}`).emit('new-comment', {
      elementId,
      comment
    })
  }

  static emitNewReply(projectId: string, elementId: string, reply: any) {
    const io = this.getIO()
    io.to(`project-${projectId}`).emit('new-reply', {
      elementId,
      reply
    })
    io.to(`element-${elementId}`).emit('new-reply', {
      elementId,
      reply
    })
  }

  static emitCommentUpdate(projectId: string, elementId: string, comment: any) {
    const io = this.getIO()
    io.to(`project-${projectId}`).emit('comment-updated', {
      elementId,
      comment
    })
    io.to(`element-${elementId}`).emit('comment-updated', {
      elementId,
      comment
    })
  }

  static emitCommentDelete(projectId: string, elementId: string, commentId: string) {
    const io = this.getIO()
    io.to(`project-${projectId}`).emit('comment-deleted', {
      elementId,
      commentId
    })
    io.to(`element-${elementId}`).emit('comment-deleted', {
      elementId,
      commentId
    })
  }

  // Emit approval events
  static emitApprovalUpdate(projectId: string, elementId: string, approval: any) {
    const io = this.getIO()
    io.to(`project-${projectId}`).emit('approval-updated', {
      elementId,
      approval
    })
    io.to(`element-${elementId}`).emit('approval-updated', {
      elementId,
      approval
    })
  }

  // Emit element status updates
  static emitElementStatusUpdate(projectId: string, elementId: string, status: string) {
    const io = this.getIO()
    io.to(`project-${projectId}`).emit('element-status-updated', {
      elementId,
      status
    })
    io.to(`element-${elementId}`).emit('element-status-updated', {
      elementId,
      status
    })
  }
}
