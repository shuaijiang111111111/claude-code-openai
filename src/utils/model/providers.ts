import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from '../../services/analytics/index.js'
import { isEnvTruthy } from '../envUtils.js'

export type APIProvider = 'firstParty' | 'bedrock' | 'vertex' | 'foundry' | 'openai'
const OPENAI_BASE_URL_DEFAULT = 'https://api.openai.com/v1'
const OPENAI_MODEL_DEFAULT = 'gpt-4'
const OPENAI_CONTEXT_WINDOW_DEFAULT = 128_000
const OPENAI_MAX_OUTPUT_TOKENS_DEFAULT = 16_384

export function getAPIProvider(): APIProvider {
  return isEnvTruthy(process.env.CLAUDE_CODE_USE_BEDROCK)
    ? 'bedrock'
    : isEnvTruthy(process.env.CLAUDE_CODE_USE_VERTEX)
      ? 'vertex'
      : isEnvTruthy(process.env.CLAUDE_CODE_USE_FOUNDRY)
        ? 'foundry'
        : isEnvTruthy(process.env.CLAUDE_CODE_USE_OPENAI)
          ? 'openai'
          : 'firstParty'
}

/**
 * Get the OpenAI base URL from environment variable
 */
export function getOpenAIBaseURL(): string {
  const baseUrl = process.env.OPENAI_BASE_URL?.trim()
  if (!baseUrl) {
    return OPENAI_BASE_URL_DEFAULT
  }
  return baseUrl.replace(/\/+$/, '')
}

/**
 * Get the OpenAI API key from environment variable
 */
export function getOpenAIApiKey(): string | undefined {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  return apiKey || undefined
}

/**
 * Get the OpenAI model to use
 */
export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || OPENAI_MODEL_DEFAULT
}

/**
 * Get the OpenAI context window (tokens), falling back to the default when invalid.
 */
export function getOpenAIContextWindow(): number {
  return parseOpenAIPositiveInt(
    process.env.OPENAI_CONTEXT_WINDOW,
    OPENAI_CONTEXT_WINDOW_DEFAULT,
  )
}

/**
 * Get the OpenAI max output tokens, falling back to the default when invalid.
 */
export function getOpenAIMaxOutputTokens(): number {
  return parseOpenAIPositiveInt(
    process.env.OPENAI_MAX_OUTPUT_TOKENS,
    OPENAI_MAX_OUTPUT_TOKENS_DEFAULT,
  )
}

export function getAPIProviderForStatsig(): AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS {
  return getAPIProvider() as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
}

/**
 * Check if ANTHROPIC_BASE_URL is a first-party Anthropic API URL.
 * Returns true if not set (default API) or points to api.anthropic.com
 * (or api-staging.anthropic.com for ant users).
 */
export function isFirstPartyAnthropicBaseUrl(): boolean {
  const baseUrl = process.env.ANTHROPIC_BASE_URL
  if (!baseUrl) {
    return true
  }
  try {
    const host = new URL(baseUrl).host
    const allowedHosts = ['api.anthropic.com']
    if (process.env.USER_TYPE === 'ant') {
      allowedHosts.push('api-staging.anthropic.com')
    }
    return allowedHosts.includes(host)
  } catch {
    return false
  }
}

function parseOpenAIPositiveInt(value: string | undefined, fallback: number): number {
  const trimmed = value?.trim()
  if (!trimmed) {
    return fallback
  }
  const parsed = parseInt(trimmed, 10)
  if (isNaN(parsed) || parsed <= 0) {
    return fallback
  }
  return parsed
}
