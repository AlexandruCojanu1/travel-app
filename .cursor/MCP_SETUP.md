# MCP Supabase Configuration

## Setup Instructions

1. **Create Personal Access Token in Supabase:**
   - Go to Supabase Dashboard → Settings → Access Tokens
   - Create a new Personal Access Token
   - Copy the token

2. **Update `.cursor/mcp.json`:**
   - Replace empty `SUPABASE_ACCESS_TOKEN` with your token
   - Or use the hosted MCP server (no token needed)

3. **Restart Cursor** to detect MCP tools

## Alternative: Use Hosted MCP Server

If you prefer the hosted server (simpler, no token needed), update `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
```

## Current Configuration

- Project Ref: `accisrnendkywetmlqhn`
- Using: Local MCP server (`@supabase/mcp-server-supabase`)
- Status: ⏳ Waiting for Personal Access Token
