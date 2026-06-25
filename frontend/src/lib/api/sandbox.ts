class SandboxAPI {
  private sandboxId: string | null = null
  private baseUrl: string

  constructor() {
    this.baseUrl = '/api'
  }

  async create(language: string = 'typescript', envVars?: Record<string, string>): Promise<{ id: string; workdir?: string }> {
    const res = await fetch(`${this.baseUrl}/sandbox`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, envVars }),
    })
    if (!res.ok) throw new Error(`Failed to create sandbox: ${res.statusText}`)
    const data = await res.json()
    this.sandboxId = data.id
    return data
  }

  get id(): string | null {
    return this.sandboxId
  }

  private async request(path: string, options?: RequestInit): Promise<any> {
    if (!this.sandboxId) throw new Error('No sandbox created')
    const res = await fetch(`${this.baseUrl}/sandbox/${this.sandboxId}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error || `Request failed: ${res.statusText}`)
    }
    return res.json()
  }

  // --- Command Execution ---

  async exec(command: string): Promise<{ exitCode: number; result: string }> {
    return this.request('/exec', {
      method: 'POST',
      body: JSON.stringify({ command }),
    })
  }

  // --- Interactive Terminal (WebSocket PTY) ---

  connectPty(onData: (data: string) => void): WebSocket | null {
    if (!this.sandboxId) {
      console.error('[SandboxAPI] No sandbox ID for PTY connection')
      return null
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const wsUrl = `${protocol}//${host}/api/sandbox/${this.sandboxId}/pty`

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('[SandboxAPI] PTY WebSocket connected')
    }

    ws.onmessage = (event) => {
      if (event.data instanceof Blob) {
        event.data.arrayBuffer().then((buf) => {
          onData(new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ''))
        })
      } else if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'connected') return
          if (msg.type === 'error') {
            console.error('[SandboxAPI] PTY error:', msg.message)
            return
          }
        } catch { }
        onData(event.data)
      }
    }

    ws.onerror = (err) => {
      console.error('[SandboxAPI] PTY WebSocket error:', err)
    }

    ws.onclose = () => {
      console.log('[SandboxAPI] PTY WebSocket closed')
    }

    return ws
  }

  // --- File Operations ---

  async writeFile(filePath: string, content: string): Promise<void> {
    await this.request('/files/write', {
      method: 'POST',
      body: JSON.stringify({ filePath, content }),
    })
  }

  async readFile(filePath: string): Promise<string> {
    const data = await this.request('/files/read', {
      method: 'POST',
      body: JSON.stringify({ filePath }),
    })
    return data.content
  }

  async mkdir(folderPath: string): Promise<void> {
    await this.request('/files/mkdir', {
      method: 'POST',
      body: JSON.stringify({ folderPath }),
    })
  }

  async rm(filePath: string, recursive: boolean = false): Promise<void> {
    await this.request('/files/rm', {
      method: 'POST',
      body: JSON.stringify({ filePath, recursive }),
    })
  }

  async readDir(dirPath: string = '/'): Promise<any[]> {
    const data = await this.request(`/files/readdir?path=${encodeURIComponent(dirPath)}`)
    return data.contents
  }

  async getFileInfo(filePath: string): Promise<any> {
    return this.request(`/files/info?path=${encodeURIComponent(filePath)}`)
  }

  async moveFile(source: string, destination: string): Promise<void> {
    await this.request('/files/move', {
      method: 'POST',
      body: JSON.stringify({ source, destination }),
    })
  }

  async findInFiles(dirPath: string, pattern: string): Promise<any[]> {
    const data = await this.request('/files/find', {
      method: 'POST',
      body: JSON.stringify({ dirPath, pattern }),
    })
    return data.results
  }

  async searchFiles(dirPath: string, pattern: string): Promise<any> {
    return this.request('/files/search', {
      method: 'POST',
      body: JSON.stringify({ dirPath, pattern }),
    })
  }

  async replaceInFiles(files: string[], pattern: string, newValue: string): Promise<any[]> {
    const data = await this.request('/files/replace', {
      method: 'POST',
      body: JSON.stringify({ files, pattern, newValue }),
    })
    return data.results
  }

  async setFilePermissions(path: string, mode: string, recursive?: boolean): Promise<void> {
    await this.request('/files/permissions', {
      method: 'POST',
      body: JSON.stringify({ path, mode, recursive }),
    })
  }

  // --- Preview / Port Forwarding ---

  async getPreviewLink(port: number): Promise<{ url: string; token: string }> {
    return this.request(`/preview/${port}`)
  }

  async getSignedPreviewUrl(port: number, expiresIn: number = 3600): Promise<{ url: string; token: string }> {
    return this.request(`/preview/${port}/signed?expiresIn=${expiresIn}`)
  }

  // --- Sandbox Lifecycle ---

  async start(): Promise<void> {
    await this.request('/start', { method: 'POST' })
  }

  async stop(): Promise<void> {
    await this.request('/stop', { method: 'POST' })
  }

  async pause(): Promise<void> {
    await this.request('/pause', { method: 'POST' })
  }

  async refreshActivity(): Promise<void> {
    await this.request('/refresh', { method: 'POST' })
  }

  async destroy(): Promise<void> {
    if (!this.sandboxId) return
    try {
      await fetch(`${this.baseUrl}/sandbox/${this.sandboxId}`, { method: 'DELETE' })
    } finally {
      this.sandboxId = null
    }
  }
}

export const sandboxApi = new SandboxAPI()
export { SandboxAPI }
