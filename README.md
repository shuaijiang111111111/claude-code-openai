# Claude Code (Restored & Enhanced)

A restored and enhanced version of Claude Code CLI with **OpenAI-compatible API support**.

![Preview](preview.png)

## Features

- **Full Claude Code CLI** - Restored from source maps, fully functional
- **OpenAI-Compatible API Support** - Use any OpenAI-compatible endpoint (GPT-4, GPT-5, local models, etc.)
- **Flexible Model Configuration** - Easy environment variable configuration
- **Large Context Window** - Support for up to 1M token context

## Quick Start

### Requirements

- Bun 1.3.5+
- Node.js 24+

### Installation

```bash
git clone https://github.com/shuaijiang111111111/claude-code-openai.git   
cd claude-code-openai
bun install
```

### Run with Anthropic API (Default)

```bash
export ANTHROPIC_API_KEY="your-anthropic-key"
bun run dev
```

### Run with OpenAI-Compatible API

```bash
# Enable OpenAI mode
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_BASE_URL="https://api.openai.com/v1"  # or your custom endpoint
export OPENAI_API_KEY="your-api-key"
export OPENAI_MODEL="gpt-4"

# Optional: Configure context window
export OPENAI_CONTEXT_WINDOW=128000
export OPENAI_MAX_OUTPUT_TOKENS=16384

bun run dev
```

## Environment Variables

### OpenAI Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `CLAUDE_CODE_USE_OPENAI` | Enable OpenAI-compatible mode | `false` |
| `OPENAI_BASE_URL` | API base URL | `https://api.openai.com/v1` |
| `OPENAI_API_KEY` | API key for authentication | - |
| `OPENAI_MODEL` | Model name to use | `gpt-4` |
| `OPENAI_CONTEXT_WINDOW` | Context window size (tokens) | `128000` |
| `OPENAI_MAX_OUTPUT_TOKENS` | Max output tokens | `16384` |
| `OPENAI_SMALL_MODEL` | Model for sub-agents (optional) | Same as `OPENAI_MODEL` |

### Anthropic Configuration

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `ANTHROPIC_MODEL` | Override default model |
| `CLAUDE_CODE_USE_BEDROCK` | Use AWS Bedrock |
| `CLAUDE_CODE_USE_VERTEX` | Use Google Vertex AI |

## Supported Providers

| Provider | Status | Notes |
|----------|--------|-------|
| Anthropic (Direct) | ✅ Full | Default provider |
| OpenAI | ✅ Full | GPT-4, GPT-4o, etc. |
| OpenAI-Compatible | ✅ Full | Any compatible endpoint |
| AWS Bedrock | ✅ Full | Claude on AWS |
| Google Vertex AI | ✅ Full | Claude on GCP |
| Azure (Foundry) | ✅ Full | Claude on Azure |

## Use Cases

### Local LLM

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_BASE_URL="http://localhost:1234/v1"
export OPENAI_API_KEY="not-needed"
export OPENAI_MODEL="local-model"
bun run dev
```

### Custom OpenAI Proxy

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_BASE_URL="https://your-proxy.com/v1"
export OPENAI_API_KEY="your-key"
export OPENAI_MODEL="gpt-4-turbo"
bun run dev
```

### Azure OpenAI

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_BASE_URL="https://your-resource.openai.azure.com/openai/deployments/your-deployment"
export OPENAI_API_KEY="your-azure-key"
export OPENAI_MODEL="gpt-4"
bun run dev
```

## Project Structure

```
src/
├── services/api/
│   ├── client.ts          # API client factory
│   ├── openai-adapter.ts  # OpenAI compatibility layer
│   └── claude.ts          # Main query logic
├── utils/model/
│   ├── providers.ts       # Provider detection
│   ├── model.ts           # Model configuration
│   └── modelOptions.ts    # Model selection UI
└── constants/
    └── system.ts          # System prompts
```

## About This Project

This repository is a **restored Claude Code source tree** reconstructed from source maps, with additional enhancements:

- OpenAI-compatible API adapter
- Flexible provider configuration
- Extended model support

### Restored Components

- Full CLI bootstrap and command tree
- Tool execution framework
- MCP (Model Context Protocol) support
- Permission and authentication systems
- Skill and agent systems

### Known Limitations

- Some private/native integrations use compatibility shims
- Build-time generated content may differ from original
- OAuth flows require proper Anthropic credentials

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Check version
bun run version
```

## License

This project is for educational and research purposes. Please respect Anthropic's terms of service when using Claude Code.

## Acknowledgments

- [Anthropic](https://anthropic.com) - Original Claude Code
- Community contributors for restoration efforts

---

## Chinese / 中文说明

### 功能特点

- **完整的 Claude Code CLI** - 从 source map 恢复，功能完整
- **OpenAI 兼容 API 支持** - 支持任何 OpenAI 兼容的 API 端点
- **灵活的模型配置** - 简单的环境变量配置
- **大上下文窗口** - 支持最高 1M token 上下文

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/your-repo/claude-code-openai.git
cd claude-code-openai
bun install

# 使用 OpenAI 兼容 API 运行
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_BASE_URL="https://api.openai.com/v1"
export OPENAI_API_KEY="your-key"
export OPENAI_MODEL="gpt-4"
bun run dev
```

### 环境变量配置

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `CLAUDE_CODE_USE_OPENAI` | 启用 OpenAI 模式 | `false` |
| `OPENAI_BASE_URL` | API 地址 | `https://api.openai.com/v1` |
| `OPENAI_API_KEY` | API 密钥 | - |
| `OPENAI_MODEL` | 模型名称 | `gpt-4` |
| `OPENAI_CONTEXT_WINDOW` | 上下文窗口大小 | `128000` |

### 使用本地模型

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_BASE_URL="http://localhost:1234/v1"
export OPENAI_MODEL="local-model"
bun run dev
```
