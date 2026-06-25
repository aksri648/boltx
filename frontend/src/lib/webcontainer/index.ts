import { sandboxApi } from '../api/sandbox'

interface SandboxContext {
  loaded: boolean
  sandboxId?: string
  workdir?: string
}

export const sandboxContext: SandboxContext = import.meta.hot?.data.sandboxContext ?? {
  loaded: false,
}

if (import.meta.hot) {
  import.meta.hot.data.sandboxContext = sandboxContext
}

async function initializeSandbox(language: string = 'typescript'): Promise<string> {
  const { id, workdir } = await sandboxApi.create(language)
  sandboxContext.loaded = true
  sandboxContext.sandboxId = id
  sandboxContext.workdir = workdir || '/home/user'
  return id
}

async function getPreviewUrl(port: number): Promise<string | null> {
  try {
    const preview = await sandboxApi.getPreviewLink(port)
    return preview.url
  } catch {
    return null
  }
}

async function getSignedPreviewUrl(port: number, expiresIn: number = 3600): Promise<string | null> {
  try {
    const preview = await sandboxApi.getSignedPreviewUrl(port, expiresIn)
    const token = preview.token
    return `${preview.url}?DAYTONA_SANDBOX_AUTH_KEY=${token}`
  } catch {
    return null
  }
}

export { initializeSandbox, getPreviewUrl, getSignedPreviewUrl }
