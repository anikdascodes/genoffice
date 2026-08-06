import { useEffect, useState } from 'react'
import { AI_PROVIDERS } from '@genoffice/ai-provider'
import type { AiProviderId, AiSettings } from '@genoffice/ai-provider'

/**
 * Bring-your-own-key provider configuration dialog, shared by every app.
 * The host app supplies get/set functions (wired to its `ai:get-settings` /
 * `ai:set-settings` IPC). API keys are stored in the app's own settings file
 * on this device — nothing is sent to a third-party service.
 */

export interface AiSettingsApi {
  getSettings: () => Promise<AiSettings>
  setSettings: (settings: AiSettings) => Promise<void>
}

const LABELS = {
  title: 'AI Settings',
  subtitle: 'Bring your own API key — works with any provider.',
  provider: 'Provider',
  model: 'Model',
  apiKey: 'API Key',
  baseUrl: 'Base URL',
  save: 'Save',
  cancel: 'Cancel',
  keyHint: 'Stored locally on this device.',
  modelHint:
    'For Custom providers, type any model id your endpoint supports (e.g. a local Ollama model or any OpenAI-compatible model).',
  error: 'Failed to load settings.',
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as const,
  card: {
    background: '#ffffff',
    color: '#1a1a1a',
    borderRadius: '12px',
    padding: '20px 22px',
    width: 'min(420px, 92vw)',
    boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
    fontFamily: 'system-ui, sans-serif',
  } as const,
  title: { margin: 0, fontSize: '16px', fontWeight: 600 } as const,
  subtitle: { margin: '4px 0 16px', fontSize: '12px', color: '#666' } as const,
  field: { marginBottom: '14px' } as const,
  label: { display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' } as const,
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 10px',
    fontSize: '13px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    background: '#fff',
    color: '#1a1a1a',
  } as const,
  hint: { marginTop: '4px', fontSize: '11px', color: '#888' } as const,
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '18px',
  } as const,
  button: {
    padding: '7px 16px',
    fontSize: '13px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    background: '#fff',
    color: '#1a1a1a',
    cursor: 'pointer',
  } as const,
  buttonPrimary: {
    padding: '7px 16px',
    fontSize: '13px',
    borderRadius: '8px',
    border: 'none',
    background: '#2f6fed',
    color: '#fff',
    cursor: 'pointer',
  } as const,
}

export function AiSettingsDialog({
  open,
  api,
  onClose,
}: {
  readonly open: boolean
  readonly api: AiSettingsApi
  readonly onClose: () => void
}) {
  const [loaded, setLoaded] = useState<AiSettings | null>(null)
  const [provider, setProvider] = useState<AiProviderId>('anthropic')
  const [model, setModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!open) return
    let alive = true
    setFailed(false)
    void api
      .getSettings()
      .then((settings) => {
        if (!alive) return
        setLoaded(settings)
        const active = settings.provider && settings.providers?.[settings.provider]
        if (active) {
          setProvider(settings.provider)
          setModel(active.model ?? '')
          setApiKey(active.apiKey ?? '')
          setBaseUrl(active.baseUrl ?? '')
        }
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [open, api])

  if (!open) return null

  const meta = AI_PROVIDERS.find((p) => p.id === provider) ?? AI_PROVIDERS[0]
  const hasModelList = (meta?.models.length ?? 0) > 0

  const changeProvider = (id: AiProviderId) => {
    const next = AI_PROVIDERS.find((p) => p.id === id)
    setProvider(id)
    if (next && next.models.length > 0) setModel(next.defaultModel)
  }

  const save = async () => {
    if (!loaded) return
    const next: AiSettings = {
      provider,
      providers: {
        ...loaded.providers,
        [provider]: {
          apiKey: apiKey.trim(),
          model: model.trim(),
          baseUrl: provider === 'custom' ? baseUrl.trim() : undefined,
        },
      },
    }
    await api.setSettings(next)
    onClose()
  }

  return (
    <div style={s.overlay} role="dialog" aria-modal="true" aria-label={LABELS.title}>
      <div style={s.card}>
        <h2 style={s.title}>{LABELS.title}</h2>
        <p style={s.subtitle}>{LABELS.subtitle}</p>

        {failed ? (
          <p style={{ ...s.hint, color: '#c33' }}>{LABELS.error}</p>
        ) : !loaded ? (
          <p style={s.hint}>Loading…</p>
        ) : (
          <>
            <div style={s.field}>
              <label style={s.label} htmlFor="ai-settings-provider">
                {LABELS.provider}
              </label>
              <select
                id="ai-settings-provider"
                style={s.input}
                value={provider}
                onChange={(e) => changeProvider(e.target.value as AiProviderId)}
              >
                {AI_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={s.field}>
              <label style={s.label} htmlFor="ai-settings-model">
                {LABELS.model}
              </label>
              {hasModelList ? (
                <select
                  id="ai-settings-model"
                  style={s.input}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  {(meta?.models ?? []).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="ai-settings-model"
                  style={s.input}
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. your-custom-model"
                />
              )}
              {!hasModelList && <div style={s.hint}>{LABELS.modelHint}</div>}
            </div>

            <div style={s.field}>
              <label style={s.label} htmlFor="ai-settings-key">
                {LABELS.apiKey}
              </label>
              <input
                id="ai-settings-key"
                style={s.input}
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={meta?.keyPlaceholder}
                autoComplete="off"
                spellCheck={false}
              />
              <div style={s.hint}>{LABELS.keyHint}</div>
            </div>

            {provider === 'custom' && (
              <div style={s.field}>
                <label style={s.label} htmlFor="ai-settings-baseurl">
                  {LABELS.baseUrl}
                </label>
                <input
                  id="ai-settings-baseurl"
                  style={s.input}
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  spellCheck={false}
                />
              </div>
            )}
          </>
        )}

        <div style={s.footer}>
          <button style={s.button} onClick={onClose}>
            {LABELS.cancel}
          </button>
          {loaded && (
            <button style={s.buttonPrimary} onClick={() => void save()}>
              {LABELS.save}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
