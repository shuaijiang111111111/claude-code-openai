/**
 * OpenAI API Adapter for Claude Code
 *
 * This adapter translates between Anthropic SDK format and OpenAI API format,
 * allowing Claude Code to work with OpenAI-compatible endpoints.
 */

import type Anthropic from '@anthropic-ai/sdk'
import type { ClientOptions } from '@anthropic-ai/sdk'
import type {
  BetaContentBlock,
  BetaMessage,
  BetaMessageStreamParams,
  BetaRawMessageStreamEvent,
  BetaToolUnion,
  BetaUsage,
} from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import { getOpenAIApiKey, getOpenAIBaseURL, getOpenAIModel } from '../../utils/model/providers.js'
import { isEnvTruthy } from '../../utils/envUtils.js'

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | OpenAIContentPart[]
  name?: string
  tool_calls?: OpenAIToolCall[]
  tool_call_id?: string
}

interface OpenAIContentPart {
  type: 'text' | 'image_url'
  text?: string
  image_url?: {
    url: string
    detail?: 'auto' | 'low' | 'high'
  }
}

interface OpenAIToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

interface OpenAITool {
  type: 'function'
  function: {
    name: string
    description?: string
    parameters?: Record<string, unknown>
  }
}

interface OpenAIChatCompletionRequest {
  model: string
  messages: OpenAIMessage[]
  tools?: OpenAITool[]
  tool_choice?: 'none' | 'auto' | { type: 'function'; function: { name: string } }
  max_tokens?: number
  temperature?: number
  top_p?: number
  stream?: boolean
  stop?: string[]
}

interface OpenAIChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: 'assistant'
      content: string | null
      tool_calls?: OpenAIToolCall[]
    }
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface OpenAIStreamChunk {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    delta: {
      role?: 'assistant'
      content?: string | null
      tool_calls?: {
        index: number
        id?: string
        type?: 'function'
        function?: {
          name?: string
          arguments?: string
        }
      }[]
    }
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

function buildOpenAIRequestError(
  error: unknown,
  config: { baseURL: string; model: string },
): Error {
  if (error instanceof Error) {
    if (error.message.startsWith('OpenAI API error:') || isAbortError(error)) {
      return error
    }
    return new Error(
      `OpenAI request failed for model "${config.model}" at "${config.baseURL}": ${error.message}. Check OPENAI_BASE_URL, OPENAI_API_KEY, and OPENAI_MODEL.`,
    )
  }
  return new Error(
    `OpenAI request failed for model "${config.model}" at "${config.baseURL}". Check OPENAI_BASE_URL, OPENAI_API_KEY, and OPENAI_MODEL.`,
  )
}

function getOpenAICompletionsUrl(baseURL: string): string {
  return `${baseURL.replace(/\/+$/, '')}/chat/completions`
}

/**
 * Convert Anthropic message format to OpenAI format
 */
function convertAnthropicToOpenAIMessages(
  systemPrompt: string | Array<{ type: string; text: string }>,
  messages: Array<{ role: string; content: unknown }>
): OpenAIMessage[] {
  const openaiMessages: OpenAIMessage[] = []

  // Add system message
  if (systemPrompt) {
    const systemText = Array.isArray(systemPrompt)
      ? systemPrompt.map(block => block.text).join('\n')
      : systemPrompt
    openaiMessages.push({
      role: 'system',
      content: systemText,
    })
  }

  // Convert each message
  for (const msg of messages) {
    if (msg.role === 'user') {
      const content = msg.content
      if (typeof content === 'string') {
        openaiMessages.push({ role: 'user', content })
      } else if (Array.isArray(content)) {
        const parts: OpenAIContentPart[] = []
        const toolResults: { tool_call_id: string; content: string }[] = []

        for (const block of content as Array<Record<string, unknown>>) {
          if (block.type === 'text') {
            parts.push({ type: 'text', text: block.text as string })
          } else if (block.type === 'image') {
            const source = block.source as { type: string; media_type: string; data: string }
            if (source?.type === 'base64') {
              parts.push({
                type: 'image_url',
                image_url: {
                  url: `data:${source.media_type};base64,${source.data}`,
                },
              })
            }
          } else if (block.type === 'tool_result') {
            // Handle tool results separately
            const toolContent = block.content
            let resultText = ''
            if (typeof toolContent === 'string') {
              resultText = toolContent
            } else if (Array.isArray(toolContent)) {
              resultText = (toolContent as Array<{ type: string; text?: string }>)
                .filter(b => b.type === 'text')
                .map(b => b.text)
                .join('\n')
            }
            toolResults.push({
              tool_call_id: block.tool_use_id as string,
              content: resultText,
            })
          }
        }

        // Add text/image content as user message
        if (parts.length > 0) {
          openaiMessages.push({ role: 'user', content: parts })
        }

        // Add tool results as separate messages
        for (const result of toolResults) {
          openaiMessages.push({
            role: 'tool',
            tool_call_id: result.tool_call_id,
            content: result.content,
          })
        }
      }
    } else if (msg.role === 'assistant') {
      const content = msg.content
      if (typeof content === 'string') {
        openaiMessages.push({ role: 'assistant', content })
      } else if (Array.isArray(content)) {
        let textContent = ''
        const toolCalls: OpenAIToolCall[] = []

        for (const block of content as Array<Record<string, unknown>>) {
          if (block.type === 'text') {
            textContent += (textContent ? '\n' : '') + (block.text as string)
          } else if (block.type === 'tool_use') {
            toolCalls.push({
              id: block.id as string,
              type: 'function',
              function: {
                name: block.name as string,
                arguments: JSON.stringify(block.input),
              },
            })
          }
        }

        const assistantMsg: OpenAIMessage = {
          role: 'assistant',
          content: textContent || null,
        }
        if (toolCalls.length > 0) {
          assistantMsg.tool_calls = toolCalls
        }
        openaiMessages.push(assistantMsg)
      }
    }
  }

  return openaiMessages
}

/**
 * Convert Anthropic tools to OpenAI format
 */
function convertAnthropicToOpenAITools(tools: BetaToolUnion[]): OpenAITool[] {
  return tools
    .filter(tool => tool.type !== 'computer_20241022' && tool.type !== 'bash_20241022' && tool.type !== 'text_editor_20241022')
    .map(tool => {
      if (tool.type === 'custom' || !tool.type) {
        const customTool = tool as { name: string; description?: string; input_schema?: Record<string, unknown> }
        return {
          type: 'function' as const,
          function: {
            name: customTool.name,
            description: customTool.description,
            parameters: customTool.input_schema,
          },
        }
      }
      return null
    })
    .filter((tool): tool is OpenAITool => tool !== null)
}

/**
 * Convert OpenAI response to Anthropic BetaMessage format
 */
function convertOpenAIToAnthropicMessage(response: OpenAIChatCompletionResponse): BetaMessage {
  const choice = response.choices[0]
  if (!choice) {
    throw new Error('No choices in OpenAI response')
  }

  const content: BetaContentBlock[] = []

  // Add text content if present
  if (choice.message.content) {
    content.push({
      type: 'text',
      text: choice.message.content,
    })
  }

  // Add tool use blocks if present
  if (choice.message.tool_calls) {
    for (const toolCall of choice.message.tool_calls) {
      content.push({
        type: 'tool_use',
        id: toolCall.id,
        name: toolCall.function.name,
        input: JSON.parse(toolCall.function.arguments || '{}'),
      })
    }
  }

  // Map finish reason
  let stopReason: BetaMessage['stop_reason'] = null
  switch (choice.finish_reason) {
    case 'stop':
      stopReason = 'end_turn'
      break
    case 'length':
      stopReason = 'max_tokens'
      break
    case 'tool_calls':
      stopReason = 'tool_use'
      break
    case 'content_filter':
      stopReason = 'end_turn'
      break
  }

  const usage: BetaUsage = {
    input_tokens: response.usage?.prompt_tokens ?? 0,
    output_tokens: response.usage?.completion_tokens ?? 0,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0,
  }

  return {
    id: response.id,
    type: 'message',
    role: 'assistant',
    content,
    model: response.model,
    stop_reason: stopReason,
    stop_sequence: null,
    usage,
  }
}

/**
 * Wrapper that adds .withResponse() support to a promise
 */
class StreamWithResponse<T> {
  private streamPromise: Promise<T>
  private requestId: string

  constructor(streamPromise: Promise<T>, requestId: string) {
    this.streamPromise = streamPromise
    this.requestId = requestId
  }

  async withResponse(): Promise<{ data: T; request_id: string; response: Response }> {
    const data = await this.streamPromise
    return {
      data,
      request_id: this.requestId,
      response: new Response(null, { status: 200 }),
    }
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.streamPromise.then(onfulfilled, onrejected)
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
  ): Promise<T | TResult> {
    return this.streamPromise.catch(onrejected)
  }
}

/**
 * OpenAI Adapter Client that mimics the Anthropic SDK interface
 */
export class OpenAIAdapterClient {
  private baseURL: string
  private apiKey: string
  private model: string
  private defaultHeaders: Record<string, string>
  private timeout: number

  constructor(options: {
    baseURL?: string
    apiKey?: string
    model?: string
    defaultHeaders?: Record<string, string>
    timeout?: number
  } = {}) {
    this.baseURL = options.baseURL || getOpenAIBaseURL()
    this.apiKey = options.apiKey || getOpenAIApiKey() || ''
    this.model = options.model || getOpenAIModel()
    this.defaultHeaders = options.defaultHeaders || {}
    this.timeout = options.timeout || 600000
  }

  get beta() {
    const self = this
    return {
      messages: {
        create(
          params: BetaMessageStreamParams & { stream?: boolean },
          options?: { signal?: AbortSignal; headers?: Record<string, string> }
        ): StreamWithResponse<OpenAIStreamAdapter> | Promise<BetaMessage> {
          // Check if this is a streaming request
          if (params.stream === true) {
            const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2)}`
            const streamAdapter = self.streamMessage(params, options)
            return new StreamWithResponse(Promise.resolve(streamAdapter), requestId)
          }
          // Non-streaming request
          return self.createMessage(params, options)
        },
        stream: self.streamMessage.bind(self),
      },
    }
  }

  async createMessage(
    params: BetaMessageStreamParams,
    options?: { signal?: AbortSignal; timeout?: number }
  ): Promise<BetaMessage> {
    const openaiMessages = convertAnthropicToOpenAIMessages(
      params.system as string | Array<{ type: string; text: string }>,
      params.messages as Array<{ role: string; content: unknown }>
    )

    const openaiTools = params.tools
      ? convertAnthropicToOpenAITools(params.tools)
      : undefined

    const requestBody: OpenAIChatCompletionRequest = {
      model: this.model,
      messages: openaiMessages,
      max_tokens: params.max_tokens,
      temperature: params.temperature,
      top_p: params.top_p,
      stream: false,
    }

    if (openaiTools && openaiTools.length > 0) {
      requestBody.tools = openaiTools
      requestBody.tool_choice = 'auto'
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), options?.timeout || this.timeout)

    if (options?.signal) {
      options.signal.addEventListener('abort', () => controller.abort())
    }

    try {
      const response = await fetch(getOpenAICompletionsUrl(this.baseURL), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...this.defaultHeaders,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
      }

      const data = await response.json() as OpenAIChatCompletionResponse
      return convertOpenAIToAnthropicMessage(data)
    } catch (error) {
      throw buildOpenAIRequestError(error, {
        baseURL: this.baseURL,
        model: this.model,
      })
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private streamMessage(
    params: BetaMessageStreamParams,
    options?: { signal?: AbortSignal; headers?: Record<string, string> }
  ): OpenAIStreamAdapter {
    return new OpenAIStreamAdapter(this, params, options, {
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      model: this.model,
      defaultHeaders: this.defaultHeaders,
      timeout: this.timeout,
    })
  }
}

/**
 * Stream adapter that converts OpenAI streaming to Anthropic-compatible events
 */
class OpenAIStreamAdapter {
  private client: OpenAIAdapterClient
  private params: BetaMessageStreamParams
  private options?: { signal?: AbortSignal; headers?: Record<string, string> }
  private config: {
    baseURL: string
    apiKey: string
    model: string
    defaultHeaders: Record<string, string>
    timeout: number
  }
  private abortController: AbortController
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  private finalMessage: BetaMessage | null = null

  // Required by Anthropic SDK interface - signals this is a stream
  public controller: AbortController

  constructor(
    client: OpenAIAdapterClient,
    params: BetaMessageStreamParams,
    options: { signal?: AbortSignal; headers?: Record<string, string> } | undefined,
    config: {
      baseURL: string
      apiKey: string
      model: string
      defaultHeaders: Record<string, string>
      timeout: number
    }
  ) {
    this.client = client
    this.params = params
    this.options = options
    this.config = config
    this.abortController = new AbortController()
    this.controller = this.abortController

    if (options?.signal) {
      options.signal.addEventListener('abort', () => this.abortController.abort())
    }
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<BetaRawMessageStreamEvent> {
    const openaiMessages = convertAnthropicToOpenAIMessages(
      this.params.system as string | Array<{ type: string; text: string }>,
      this.params.messages as Array<{ role: string; content: unknown }>
    )

    const openaiTools = this.params.tools
      ? convertAnthropicToOpenAITools(this.params.tools)
      : undefined

    const requestBody: OpenAIChatCompletionRequest = {
      model: this.config.model,
      messages: openaiMessages,
      max_tokens: this.params.max_tokens,
      temperature: this.params.temperature,
      top_p: this.params.top_p,
      stream: true,
    }

    if (openaiTools && openaiTools.length > 0) {
      requestBody.tools = openaiTools
      requestBody.tool_choice = 'auto'
    }

    let response: Response
    try {
      response = await fetch(getOpenAICompletionsUrl(this.config.baseURL), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...this.config.defaultHeaders,
        },
        body: JSON.stringify(requestBody),
        signal: this.abortController.signal,
      })
    } catch (error) {
      throw buildOpenAIRequestError(error, {
        baseURL: this.config.baseURL,
        model: this.config.model,
      })
    }

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
    }

    if (!response.body) {
      throw new Error('No response body')
    }

    this.reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let messageId = ''
    let model = this.config.model
    let inputTokens = 0
    let outputTokens = 0
    let contentBlockIndex = 0
    let currentText = ''
    const toolCalls: Map<number, { id: string; name: string; arguments: string }> = new Map()

    // Emit message_start event
    yield {
      type: 'message_start',
      message: {
        id: `msg_${Date.now()}`,
        type: 'message',
        role: 'assistant',
        content: [],
        model: this.config.model,
        stop_reason: null,
        stop_sequence: null,
        usage: {
          input_tokens: 0,
          output_tokens: 0,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
      },
    } as BetaRawMessageStreamEvent

    let hasEmittedTextBlock = false

    try {
      while (true) {
        const { done, value } = await this.reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          try {
            const chunk = JSON.parse(data) as OpenAIStreamChunk
            messageId = chunk.id
            model = chunk.model

            if (chunk.usage) {
              inputTokens = chunk.usage.prompt_tokens
              outputTokens = chunk.usage.completion_tokens
            }

            const choice = chunk.choices[0]
            if (!choice) continue

            // Handle text content
            if (choice.delta.content) {
              if (!hasEmittedTextBlock) {
                yield {
                  type: 'content_block_start',
                  index: contentBlockIndex,
                  content_block: { type: 'text', text: '' },
                } as BetaRawMessageStreamEvent
                hasEmittedTextBlock = true
              }

              currentText += choice.delta.content
              yield {
                type: 'content_block_delta',
                index: contentBlockIndex,
                delta: { type: 'text_delta', text: choice.delta.content },
              } as BetaRawMessageStreamEvent
            }

            // Handle tool calls
            if (choice.delta.tool_calls) {
              for (const tc of choice.delta.tool_calls) {
                const existing = toolCalls.get(tc.index)
                if (!existing) {
                  // Close text block if open
                  if (hasEmittedTextBlock) {
                    yield {
                      type: 'content_block_stop',
                      index: contentBlockIndex,
                    } as BetaRawMessageStreamEvent
                    contentBlockIndex++
                    hasEmittedTextBlock = false
                  }

                  // New tool call
                  const newToolCall = {
                    id: tc.id || `call_${Date.now()}_${tc.index}`,
                    name: tc.function?.name || '',
                    arguments: tc.function?.arguments || '',
                  }
                  toolCalls.set(tc.index, newToolCall)

                  yield {
                    type: 'content_block_start',
                    index: contentBlockIndex,
                    content_block: {
                      type: 'tool_use',
                      id: newToolCall.id,
                      name: newToolCall.name,
                      input: {},
                    },
                  } as BetaRawMessageStreamEvent
                } else {
                  // Update existing tool call
                  if (tc.function?.name) {
                    existing.name += tc.function.name
                  }
                  if (tc.function?.arguments) {
                    existing.arguments += tc.function.arguments
                    yield {
                      type: 'content_block_delta',
                      index: contentBlockIndex,
                      delta: {
                        type: 'input_json_delta',
                        partial_json: tc.function.arguments,
                      },
                    } as BetaRawMessageStreamEvent
                  }
                }
              }
            }

            // Handle finish
            if (choice.finish_reason) {
              // Close any open block
              if (hasEmittedTextBlock || toolCalls.size > 0) {
                yield {
                  type: 'content_block_stop',
                  index: contentBlockIndex,
                } as BetaRawMessageStreamEvent
              }

              let stopReason: BetaMessage['stop_reason'] = null
              switch (choice.finish_reason) {
                case 'stop':
                  stopReason = 'end_turn'
                  break
                case 'length':
                  stopReason = 'max_tokens'
                  break
                case 'tool_calls':
                  stopReason = 'tool_use'
                  break
              }

              // Build final content
              const finalContent: BetaContentBlock[] = []
              if (currentText) {
                finalContent.push({ type: 'text', text: currentText })
              }
              for (const [, tc] of toolCalls) {
                try {
                  finalContent.push({
                    type: 'tool_use',
                    id: tc.id,
                    name: tc.name,
                    input: JSON.parse(tc.arguments || '{}'),
                  })
                } catch {
                  finalContent.push({
                    type: 'tool_use',
                    id: tc.id,
                    name: tc.name,
                    input: {},
                  })
                }
              }

              this.finalMessage = {
                id: messageId,
                type: 'message',
                role: 'assistant',
                content: finalContent,
                model,
                stop_reason: stopReason,
                stop_sequence: null,
                usage: {
                  input_tokens: inputTokens,
                  output_tokens: outputTokens,
                  cache_read_input_tokens: 0,
                  cache_creation_input_tokens: 0,
                },
              }

              yield {
                type: 'message_delta',
                delta: { stop_reason: stopReason, stop_sequence: null },
                usage: {
                  input_tokens: inputTokens,
                  output_tokens: outputTokens,
                  cache_read_input_tokens: 0,
                  cache_creation_input_tokens: 0,
                },
              } as BetaRawMessageStreamEvent

              yield {
                type: 'message_stop',
              } as BetaRawMessageStreamEvent
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      // Ensure we always emit final events if stream ended without finish_reason
      if (!this.finalMessage) {
        // Close any open block
        if (hasEmittedTextBlock || toolCalls.size > 0) {
          yield {
            type: 'content_block_stop',
            index: contentBlockIndex,
          } as BetaRawMessageStreamEvent
        }

        // Build final content
        const finalContent: BetaContentBlock[] = []
        if (currentText) {
          finalContent.push({ type: 'text', text: currentText })
        }
        for (const [, tc] of toolCalls) {
          try {
            finalContent.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: JSON.parse(tc.arguments || '{}'),
            })
          } catch {
            finalContent.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: {},
            })
          }
        }

        this.finalMessage = {
          id: messageId || `msg_${Date.now()}`,
          type: 'message',
          role: 'assistant',
          content: finalContent,
          model,
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: {
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            cache_read_input_tokens: 0,
            cache_creation_input_tokens: 0,
          },
        }

        yield {
          type: 'message_delta',
          delta: { stop_reason: 'end_turn', stop_sequence: null },
          usage: {
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            cache_read_input_tokens: 0,
            cache_creation_input_tokens: 0,
          },
        } as BetaRawMessageStreamEvent

        yield {
          type: 'message_stop',
        } as BetaRawMessageStreamEvent
      }
    } finally {
      this.reader?.releaseLock()
    }
  }

  async finalMessage(): Promise<BetaMessage> {
    // Consume the stream if not already done
    if (!this.finalMessage) {
      for await (const _ of this) {
        // Just consume
      }
    }
    if (!this.finalMessage) {
      throw new Error('No final message available')
    }
    return this.finalMessage
  }

  abort() {
    this.abortController.abort()
  }

  get controller() {
    return this.abortController
  }
}

/**
 * Create an OpenAI adapter client that can be used in place of the Anthropic client
 */
export function createOpenAIAdapterClient(options: {
  defaultHeaders?: Record<string, string>
  maxRetries?: number
  timeout?: number
  model?: string
}): OpenAIAdapterClient {
  return new OpenAIAdapterClient({
    defaultHeaders: options.defaultHeaders,
    timeout: options.timeout,
    model: options.model,
  })
}
