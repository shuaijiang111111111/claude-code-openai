# Claude Code（恢复版与增强版）

[English README](./README.md)

一个基于 source map 恢复并增强的 Claude Code CLI，支持 **OpenAI 兼容 API**。

![Preview](preview.png)

## 功能特点

- **完整的 Claude Code CLI** - 从 source map 恢复，功能可用
- **OpenAI 兼容 API 支持** - 可接入 OpenAI 及其他兼容端点
- **灵活的模型配置** - 通过环境变量快速切换提供商和模型
- **大上下文窗口** - 支持最高 1M token 上下文

## 快速开始

### 环境要求

- Bun 1.3.5+
- Node.js 22+

### 安装方式

#### 方式一：通过 npm 安装（推荐）

```bash
npm install -g claude-openai-cli
```

安装后直接运行：

```bash
claude-openai
```

#### 方式二：从源码运行

##### 1. 安装 Bun

macOS / Linux：

```bash
curl -fsSL https://bun.com/install | bash
bun --version
```

Windows PowerShell：

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
bun --version
```

Windows CMD：

```bat
powershell -c "irm bun.sh/install.ps1 | iex"
bun --version
```

##### 2. 克隆仓库并安装依赖

```bash
git clone https://github.com/shuaijiang111111111/claude-code-openai.git
cd claude-code-openai
bun install
```

如果你在源码开发时也想要全局命令，可以执行：

```bash
npm link
claude-openai
```

#### 可选：把本地配置写进 `.env` 文件

如果你是从源码在本地运行，也可以把环境变量写在项目根目录的 `.env` 文件里，这样就不用每次手动导出。

示例：

```env
CLAUDE_CODE_USE_OPENAI=1
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-4
```

然后直接运行：

```bash
claude-openai
```

不要把包含密钥的 `.env` 文件提交到仓库。

### 启动方式

使用 Anthropic API（默认）：

macOS / Linux：

```bash
export ANTHROPIC_API_KEY="your-anthropic-key"
claude-openai
```

Windows PowerShell：

```powershell
$env:ANTHROPIC_API_KEY="your-anthropic-key"
claude-openai
```

Windows CMD：

```bat
set ANTHROPIC_API_KEY=your-anthropic-key
claude-openai
```

使用 OpenAI 兼容 API：

macOS / Linux：

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_BASE_URL="https://api.openai.com/v1"
export OPENAI_API_KEY="your-key"
export OPENAI_MODEL="gpt-4"

# 可选：配置上下文窗口与输出长度
export OPENAI_CONTEXT_WINDOW=128000
export OPENAI_MAX_OUTPUT_TOKENS=16384

claude-openai
```

Windows PowerShell：

```powershell
# 可以使用.env环境进行配置
$env:CLAUDE_CODE_USE_OPENAI="1"
$env:OPENAI_BASE_URL="https://api.openai.com/v1"
$env:OPENAI_API_KEY="your-key"
$env:OPENAI_MODEL="gpt-4"

# 可选：配置上下文窗口与输出长度
$env:OPENAI_CONTEXT_WINDOW="128000"
$env:OPENAI_MAX_OUTPUT_TOKENS="16384"

claude-openai
```

Windows CMD：

```bat
set CLAUDE_CODE_USE_OPENAI=1
set OPENAI_BASE_URL=https://api.openai.com/v1
set OPENAI_API_KEY=your-key
set OPENAI_MODEL=gpt-4

REM 可选：配置上下文窗口与输出长度
set OPENAI_CONTEXT_WINDOW=128000
set OPENAI_MAX_OUTPUT_TOKENS=16384

claude-openai
```

以上环境变量写法仅对当前终端会话生效。

## 环境变量

### OpenAI 配置

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `CLAUDE_CODE_USE_OPENAI` | 启用 OpenAI 兼容模式 | `false` |
| `OPENAI_BASE_URL` | API 基础地址 | `https://api.openai.com/v1` |
| `OPENAI_API_KEY` | 认证密钥 | - |
| `OPENAI_MODEL` | 使用的模型名称 | `gpt-4` |
| `OPENAI_CONTEXT_WINDOW` | 上下文窗口大小（token） | `128000` |
| `OPENAI_MAX_OUTPUT_TOKENS` | 最大输出 token 数 | `16384` |
| `OPENAI_SMALL_MODEL` | 子代理模型（可选） | 与 `OPENAI_MODEL` 相同 |

### Anthropic 配置

| 变量 | 说明 |
|------|------|
| `ANTHROPIC_API_KEY` | Anthropic API 密钥 |
| `ANTHROPIC_MODEL` | 覆盖默认模型 |
| `CLAUDE_CODE_USE_BEDROCK` | 使用 AWS Bedrock |
| `CLAUDE_CODE_USE_VERTEX` | 使用 Google Vertex AI |

## 常见用法

### 使用本地模型

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_BASE_URL="http://localhost:1234/v1"
export OPENAI_API_KEY="not-needed"
export OPENAI_MODEL="local-model"
claude-openai
```

### 使用自定义 OpenAI 代理

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_BASE_URL="https://your-proxy.com/v1"
export OPENAI_API_KEY="your-key"
export OPENAI_MODEL="gpt-4-turbo"
claude-openai
```

### 使用 Azure OpenAI

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_BASE_URL="https://your-resource.openai.azure.com/openai/deployments/your-deployment"
export OPENAI_API_KEY="your-azure-key"
export OPENAI_MODEL="gpt-4"
claude-openai
```

## 开发

```bash
bun install
bun run dev
bun run version
```

## 说明

这个仓库是一个 **恢复后的 Claude Code 源码树**，并不是上游的原始仓库。当前实现包含了一些兼容层和替代方案，因此在行为上可能和原版存在差异。

如果你想看更完整的英文说明，可以直接查看 [README.md](./README.md)。
