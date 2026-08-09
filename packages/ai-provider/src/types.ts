import type { AgentMessage, AgentToolCall, AgentToolDef } from '@genoffice/agent-core'

/**
 * AI is bring-your-own-key: a preset provider (Anthropic / Gemini / DeepSeek /
 * OpenAI) or a free-form OpenAI-compatible endpoint (`custom`) whose model id /
 * base URL are user-supplied — Ollama, OpenRouter, Groq, LM Studio and similar
 * all work through `custom`.
 */
export type AiProviderId = 'anthropic' | 'gemini' | 'deepseek' | 'openai' | 'custom'

export interface AiProviderConfig {
  apiKey: string
  model: string
  /** only used by the custom (OpenAI-compatible) provider */
  baseUrl?: string | undefined
}

export interface AiProviderMeta {
  id: AiProviderId
  label: string
  models: string[]
  defaultModel: string
  keyPlaceholder: string
  needsBaseUrl?: boolean
}

export interface AiSettings {
  provider: AiProviderId
  providers: Record<AiProviderId, AiProviderConfig>
}

/** pre-provider settings shape (single OpenAI-compatible endpoint); migrated into "custom" */
export interface LegacyAiSettings {
  baseUrl?: string
  apiKey?: string
  model?: string
}

export interface AiChatRequest {
  settings: AiSettings
  system: string
  user: string
}

export interface AiChatResponse {
  ok: boolean
  content?: string
  error?: string
}

export interface AiStreamRequest {
  requestId: string
  settings: AiSettings
  system: string
  messages: AgentMessage[]
  tools?: AgentToolDef[]
  maxTokens?: number
}

export interface AiStreamChunk {
  requestId: string
  /** 'ping' = wire-level keepalive so the renderer can tell a live stream from a dead one */
  type: 'delta' | 'tool-call' | 'done' | 'error' | 'ping'
  text?: string
  /** complete parsed tool call (emitted once its arguments finish streaming) */
  toolCall?: AgentToolCall
  error?: string
    /** machine-readable error cause (currently only 'timeout'); lets the renderer localize the message */
  errorCode?: 'timeout'
  /** normalized stop reason carried on 'done' ('max_tokens' = output cut off by the token limit) */
  stopReason?: string
}
