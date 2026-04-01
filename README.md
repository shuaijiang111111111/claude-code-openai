# Claude Code (Restored & Enhanced)

[中文说明 / Chinese README](./README.zh-CN.md)

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

#### 1. Install Bun

macOS / Linux:

```bash
curl -fsSL https://bun.com/install | bash
bun --version
```

Windows PowerShell:

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
bun --version
```

Windows CMD:

```bat
powershell -c "irm bun.sh/install.ps1 | iex"
bun --version
```

#### 2. Clone the repo and install dependencies

```bash
git clone https://github.com/shuaijiang111111111/claude-code-openai.git   
cd claude-code-openai
bun install
```

### Run with Anthropic API (Default)

macOS / Linux:

```bash
export ANTHROPIC_API_KEY="your-anthropic-key"
bun run dev
```

Windows PowerShell:

```powershell
$env:ANTHROPIC_API_KEY="your-anthropic-key"
bun run dev
```

Windows CMD:

```bat
set ANTHROPIC_API_KEY=your-anthropic-key
bun run dev
```

### Run with OpenAI-Compatible API

macOS / Linux:

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

Windows PowerShell:

```powershell
# Enable OpenAI mode
$env:CLAUDE_CODE_USE_OPENAI="1"
$env:OPENAI_BASE_URL="https://api.openai.com/v1"  # or your custom endpoint
$env:OPENAI_API_KEY="your-api-key"
$env:OPENAI_MODEL="gpt-4"

# Optional: Configure context window
$env:OPENAI_CONTEXT_WINDOW="128000"
$env:OPENAI_MAX_OUTPUT_TOKENS="16384"

bun run dev
```

Windows CMD:

```bat
REM Enable OpenAI mode
set CLAUDE_CODE_USE_OPENAI=1
set OPENAI_BASE_URL=https://api.openai.com/v1
set OPENAI_API_KEY=your-api-key
set OPENAI_MODEL=gpt-4

REM Optional: Configure context window
set OPENAI_CONTEXT_WINDOW=128000
set OPENAI_MAX_OUTPUT_TOKENS=16384

bun run dev
```

These examples set environment variables for the current terminal session only.

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
