import { Daytona, Sandbox } from '@daytona/sdk'
import type { PtyCreateOptions, PtyConnectOptions } from '@daytona/sdk'
import type { FileInfo } from '@daytona/toolbox-api-client'

export interface SandboxSession {
  id: string
  sandbox: Sandbox
  createdAt: Date
  lastActivity: Date
  language: string
  workdir?: string
}

export interface PtySession {
  handle: any
  terminalId: string
  createdAt: Date
}

class SandboxManager {
  private static instance: SandboxManager
  private daytona: Daytona
  private sessions: Map<string, SandboxSession> = new Map()
  private ptySessions: Map<string, PtySession> = new Map()
  private readonly SESSION_TTL_MS = 30 * 60 * 1000

  private constructor() {
    this.daytona = new Daytona({
      apiKey: process.env.DAYTONA_API_KEY || '',
      apiUrl: process.env.DAYTONA_API_URL || 'https://app.daytona.io/api',
      target: process.env.DAYTONA_TARGET || 'us',
    })
  }

  static getInstance(): SandboxManager {
    if (!SandboxManager.instance) {
      SandboxManager.instance = new SandboxManager()
    }
    return SandboxManager.instance
  }

  async createSandbox(language: string = 'typescript', envVars?: Record<string, string>): Promise<SandboxSession> {
    const sandbox = await this.daytona.create({
      language,
      public: true,
      envVars: envVars || { NODE_ENV: 'development' },
    })
    const id = sandbox.id || `sandbox-${Date.now()}`
    const workdir = await sandbox.getWorkDir() || '/home/user'
    const session: SandboxSession = {
      id,
      sandbox,
      createdAt: new Date(),
      lastActivity: new Date(),
      language,
      workdir,
    }
    this.sessions.set(id, session)
    this.startCleanupTimer(id)
    return session
  }

  async getSandbox(id: string): Promise<Sandbox | null> {
    const session = this.sessions.get(id)
    if (!session) return null
    session.lastActivity = new Date()
    return session.sandbox
  }

  async getSession(id: string): Promise<SandboxSession | null> {
    const session = this.sessions.get(id)
    if (!session) return null
    session.lastActivity = new Date()
    return session
  }

  async executeCommand(sandboxId: string, command: string): Promise<{ exitCode: number; result: string }> {
    const sandbox = await this.getSandbox(sandboxId)
    if (!sandbox) throw new Error(`Sandbox ${sandboxId} not found`)

    const response = await sandbox.process.executeCommand(command)
    return {
      exitCode: response.exitCode,
      result: response.result,
    }
  }

  // --- Interactive PTY Terminal ---

  async createPtyTerminal(sandboxId: string, terminalId: string, cols: number = 120, rows: number = 30): Promise<any> {
    const sandbox = await this.getSandbox(sandboxId)
    if (!sandbox) throw new Error(`Sandbox ${sandboxId} not found`)

    const ptyHandle = await sandbox.process.createPty({
      id: terminalId,
      cols,
      rows,
      envs: { TERM: 'xterm-256color' },
      onData: () => {},
    })

    await ptyHandle.waitForConnection()

    const ptySession: PtySession = {
      handle: ptyHandle,
      terminalId,
      createdAt: new Date(),
    }
    this.ptySessions.set(terminalId, ptySession)
    return ptyHandle
  }

  async sendPtyInput(terminalId: string, data: string): Promise<void> {
    const session = this.ptySessions.get(terminalId)
    if (!session) throw new Error(`PTY session ${terminalId} not found`)
    await session.handle.sendInput(data)
  }

  async resizePtyTerminal(terminalId: string, cols: number, rows: number): Promise<void> {
    const session = this.ptySessions.get(terminalId)
    if (!session) throw new Error(`PTY session ${terminalId} not found`)
    await session.handle.resize(cols, rows)
  }

  async disconnectPtyTerminal(terminalId: string): Promise<void> {
    const session = this.ptySessions.get(terminalId)
    if (!session) return
    try {
      await session.handle.disconnect()
    } catch { }
    this.ptySessions.delete(terminalId)
  }

  // --- Preview / Port Forwarding ---

  async getPreviewLink(sandboxId: string, port: number): Promise<{ url: string; token: string }> {
    const sandbox = await this.getSandbox(sandboxId)
    if (!sandbox) throw new Error(`Sandbox ${sandboxId} not found`)

    const result = await sandbox.getPreviewLink(port)
    return {
      url: result.url,
      token: result.token,
    }
  }

  async getSignedPreviewUrl(sandboxId: string, port: number, expiresIn?: number): Promise<{ url: string; token: string }> {
    const sandbox = await this.getSandbox(sandboxId)
    if (!sandbox) throw new Error(`Sandbox ${sandboxId} not found`)

    const result = await sandbox.getSignedPreviewUrl(port, expiresIn || 3600)
    return {
      url: result.url,
      token: result.token,
    }
  }

  // --- File Operations ---

  async writeFile(sandboxId: string, filePath: string, content: string): Promise<void> {
    const sandbox = await this.getSandbox(sandboxId)
    if (!sandbox) throw new Error(`Sandbox ${sandboxId} not found`)

    const dir = filePath.substring(0, filePath.lastIndexOf('/'))
    if (dir) {
      try {
        await sandbox.fs.createFolder(dir, '755')
      } catch { }
    }

    await sandbox.fs.uploadFile(Buffer.from(content), filePath)
  }

  async readFile(sandboxId: string, filePath: string): Promise<string> {
    const sandbox = await this.getSandbox(sandboxId)
    if (!sandbox) throw new Error(`Sandbox ${sandboxId} not found`)

    const buffer = await sandbox.fs.downloadFile(filePath)
    return buffer.toString()
  }

  async mkdir(sandboxId: string, folderPath: string): Promise<void> {
    const sandbox = await this.getSandbox(sandboxId)
    if (!sandbox) throw new Error(`Sandbox ${sandboxId} not found`)

    try {
      await sandbox.fs.createFolder(folderPath, '755')
    } catch {
      await sandbox.process.executeCommand(`mkdir -p "${folderPath}"`)
    }
  }

  async rm(sandboxId: string, filePath: string, recursive: boolean = false): Promise<void> {
    const sandbox = await this.getSandbox(sandboxId)
    if (!sandbox) throw new Error(`Sandbox ${sandboxId} not found`)

    if (recursive) {
      await sandbox.fs.deleteFile(filePath, true)
    } else {
      await sandbox.fs.deleteFile(filePath, false)
    }
  }

  async readDir(sandboxId: string, dirPath: string): Promise<FileInfo[]> {
    const sandbox = await this.getSandbox(sandboxId)
    if (!sandbox) throw new Error(`Sandbox ${sandboxId} not found`)

    return sandbox.fs.listFiles(dirPath)
  }

  async getFileInfo(sandboxId: string, filePath: string): Promise<FileInfo> {
    const sandbox = await this.getSandbox(sandboxId)
    if (!sandbox) throw new Error(`Sandbox ${sandboxId} not found`)

    return sandbox.fs.getFileDetails(filePath)
  }

  async moveFile(sandboxId: string, source: string, destination: string): Promise<void> {
    const sandbox = await this.getSandbox(sandboxId)
    if (!sandbox) throw new Error(`Sandbox ${sandboxId} not found`)

    await sandbox.fs.moveFiles(source, destination)
  }

  async findInFiles(sandboxId: string, dirPath: string, pattern: string): Promise<any[]> {
    const sandbox = await this.getSandbox(sandboxId)
    if (!sandbox) throw new Error(`Sandbox ${sandboxId} not found`)

    return sandbox.fs.findFiles(dirPath, pattern)
  }

  async searchFiles(sandboxId: string, dirPath: string, pattern: string): Promise<any> {
    const sandbox = await this.getSandbox(sandboxId)
    if (!sandbox) throw new Error(`Sandbox ${sandboxId} not found`)

    return sandbox.fs.searchFiles(dirPath, pattern)
  }

  async replaceInFiles(sandboxId: string, files: string[], pattern: string, newValue: string): Promise<any[]> {
    const sandbox = await this.getSandbox(sandboxId)
    if (!sandbox) throw new Error(`Sandbox ${sandboxId} not found`)

    return sandbox.fs.replaceInFiles(files, pattern, newValue)
  }

  async setFilePermissions(sandboxId: string, path: string, permissions: { mode: string; recursive?: boolean }): Promise<void> {
    const sandbox = await this.getSandbox(sandboxId)
    if (!sandbox) throw new Error(`Sandbox ${sandboxId} not found`)

    await sandbox.fs.setFilePermissions(path, permissions)
  }

  async uploadFileStream(sandboxId: string, content: Buffer | string, remotePath: string): Promise<void> {
    const sandbox = await this.getSandbox(sandboxId)
    if (!sandbox) throw new Error(`Sandbox ${sandboxId} not found`)

    const dir = remotePath.substring(0, remotePath.lastIndexOf('/'))
    if (dir) {
      try {
        await sandbox.fs.createFolder(dir, '755')
      } catch { }
    }

    const buffer = typeof content === 'string' ? Buffer.from(content) : content
    await sandbox.fs.uploadFile(buffer, remotePath)
  }

  // --- Lifecycle ---

  async startSandbox(id: string): Promise<void> {
    const session = this.sessions.get(id)
    if (!session) throw new Error(`Sandbox ${id} not found`)
    await session.sandbox.start()
  }

  async stopSandbox(id: string): Promise<void> {
    const session = this.sessions.get(id)
    if (!session) throw new Error(`Sandbox ${id} not found`)
    await session.sandbox.stop()
  }

  async pauseSandbox(id: string): Promise<void> {
    const session = this.sessions.get(id)
    if (!session) throw new Error(`Sandbox ${id} not found`)
    await session.sandbox.pause()
  }

  async refreshActivity(id: string): Promise<void> {
    const session = this.sessions.get(id)
    if (!session) return
    await session.sandbox.refreshActivity()
  }

  async destroySandbox(id: string): Promise<void> {
    const session = this.sessions.get(id)
    if (!session) return

    for (const [termId, pty] of this.ptySessions) {
      if (pty.terminalId.startsWith(id)) {
        await this.disconnectPtyTerminal(termId)
      }
    }

    try {
      await session.sandbox.delete()
    } catch (err) {
      console.warn(`Failed to delete sandbox ${id}:`, err)
    }
    this.sessions.delete(id)
  }

  private startCleanupTimer(id: string): void {
    const interval = setInterval(() => {
      const session = this.sessions.get(id)
      if (!session) {
        clearInterval(interval)
        return
      }
      const elapsed = Date.now() - session.lastActivity.getTime()
      if (elapsed > this.SESSION_TTL_MS) {
        this.destroySandbox(id)
        clearInterval(interval)
      }
    }, 60_000)
  }

  async cleanup(): Promise<void> {
    for (const [id] of this.sessions) {
      await this.destroySandbox(id)
    }
  }
}

export { SandboxManager }
