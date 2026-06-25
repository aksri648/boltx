import { Router, Request, Response } from 'express'
import type { IncomingMessage } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { SandboxManager } from '../lib/sandbox/sandbox-manager'

const router = Router()
const sandboxManager = SandboxManager.getInstance()

// --- Sandbox Lifecycle ---

router.post('/sandbox', async (req: Request, res: Response) => {
  try {
    const { language = 'typescript', envVars } = req.body
    const session = await sandboxManager.createSandbox(language, envVars)
    res.json({
      id: session.id,
      language: session.language,
      workdir: session.workdir,
      createdAt: session.createdAt,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/sandbox/:id/exec', async (req: Request, res: Response) => {
  try {
    const { command } = req.body
    const result = await sandboxManager.executeCommand(req.params.id, command)
    res.json(result)
  } catch (err: any) {
    res.status(404).json({ error: err.message })
  }
})

router.delete('/sandbox/:id', async (req: Request, res: Response) => {
  try {
    await sandboxManager.destroySandbox(req.params.id)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/sandbox/:id/start', async (req: Request, res: Response) => {
  try {
    await sandboxManager.startSandbox(req.params.id)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/sandbox/:id/stop', async (req: Request, res: Response) => {
  try {
    await sandboxManager.stopSandbox(req.params.id)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/sandbox/:id/pause', async (req: Request, res: Response) => {
  try {
    await sandboxManager.pauseSandbox(req.params.id)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/sandbox/:id/refresh', async (req: Request, res: Response) => {
  try {
    await sandboxManager.refreshActivity(req.params.id)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// --- File Operations ---

router.post('/sandbox/:id/files/write', async (req: Request, res: Response) => {
  try {
    const { filePath, content } = req.body
    await sandboxManager.writeFile(req.params.id, filePath, content)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/sandbox/:id/files/read', async (req: Request, res: Response) => {
  try {
    const { filePath } = req.body
    const content = await sandboxManager.readFile(req.params.id, filePath)
    res.json({ content })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/sandbox/:id/files/mkdir', async (req: Request, res: Response) => {
  try {
    const { folderPath } = req.body
    await sandboxManager.mkdir(req.params.id, folderPath)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/sandbox/:id/files/rm', async (req: Request, res: Response) => {
  try {
    const { filePath, recursive } = req.body
    await sandboxManager.rm(req.params.id, filePath, recursive)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/sandbox/:id/files/readdir', async (req: Request, res: Response) => {
  try {
    const dirPath = req.query.path as string || '/'
    const contents = await sandboxManager.readDir(req.params.id, dirPath)
    res.json({ contents })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/sandbox/:id/files/info', async (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string
    if (!filePath) return res.status(400).json({ error: 'filePath required' })
    const info = await sandboxManager.getFileInfo(req.params.id, filePath)
    res.json(info)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/sandbox/:id/files/move', async (req: Request, res: Response) => {
  try {
    const { source, destination } = req.body
    await sandboxManager.moveFile(req.params.id, source, destination)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/sandbox/:id/files/find', async (req: Request, res: Response) => {
  try {
    const { dirPath, pattern } = req.body
    const results = await sandboxManager.findInFiles(req.params.id, dirPath, pattern)
    res.json({ results })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/sandbox/:id/files/search', async (req: Request, res: Response) => {
  try {
    const { dirPath, pattern } = req.body
    const results = await sandboxManager.searchFiles(req.params.id, dirPath, pattern)
    res.json(results)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/sandbox/:id/files/replace', async (req: Request, res: Response) => {
  try {
    const { files, pattern, newValue } = req.body
    const results = await sandboxManager.replaceInFiles(req.params.id, files, pattern, newValue)
    res.json({ results })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/sandbox/:id/files/permissions', async (req: Request, res: Response) => {
  try {
    const { path: filePath, mode, recursive } = req.body
    await sandboxManager.setFilePermissions(req.params.id, filePath, { mode, recursive })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// --- Preview / Port Forwarding ---

router.get('/sandbox/:id/preview/:port', async (req: Request, res: Response) => {
  try {
    const port = parseInt(req.params.port, 10)
    const preview = await sandboxManager.getPreviewLink(req.params.id, port)
    res.json(preview)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/sandbox/:id/preview/:port/signed', async (req: Request, res: Response) => {
  try {
    const port = parseInt(req.params.port, 10)
    const expiresIn = parseInt(req.query.expiresIn as string || '3600', 10)
    const preview = await sandboxManager.getSignedPreviewUrl(req.params.id, port, expiresIn)
    res.json(preview)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// --- WebSocket PTY Terminal ---

export function setupSandboxWebSocket(wss: WebSocketServer) {
  wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    const url = req.url || ''
    const match = url.match(/^\/api\/sandbox\/([^/]+)\/pty$/i)

    if (!match) {
      ws.close(4001, 'Invalid path')
      return
    }

    const sandboxId = match[1]
    const terminalId = `${sandboxId}-pty-${Date.now()}`
    let ptyHandle: any = null
    let pingInterval: NodeJS.Timeout | null = null

    try {
      ptyHandle = await sandboxManager.createPtyTerminal(sandboxId, terminalId, 120, 30)

      ws.send(JSON.stringify({ type: 'connected', terminalId }))

      ptyHandle.onData = (data: Uint8Array) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data)
        }
      }

      ws.on('message', async (raw: Buffer) => {
        try {
          const text = raw.toString()

          if (text.startsWith('{')) {
            const msg = JSON.parse(text)
            if (msg.type === 'resize' && msg.cols && msg.rows) {
              await sandboxManager.resizePtyTerminal(terminalId, msg.cols, msg.rows)
              return
            }
          }
        } catch { }

        try {
          await sandboxManager.sendPtyInput(terminalId, raw.toString())
        } catch (err: unknown) {
          process.stderr.write(`[PTY] sendInput error: ${err}\n`)
        }
      })

      ws.on('close', async () => {
        if (pingInterval) clearInterval(pingInterval)
        await sandboxManager.disconnectPtyTerminal(terminalId)
      })

      ws.on('error', async () => {
        if (pingInterval) clearInterval(pingInterval)
        await sandboxManager.disconnectPtyTerminal(terminalId)
      })

      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping()
        }
      }, 30000)

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      process.stderr.write(`[PTY] Connection error: ${message}\n`)
      ws.send(JSON.stringify({ type: 'error', message }))
      ws.close(4002, message)
    }
  })
}

export default router
