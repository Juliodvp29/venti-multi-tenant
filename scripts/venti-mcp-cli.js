#!/usr/bin/env node
/**
 * Venti MCP STDIO Bridge
 * Connects Claude Desktop / Cursor (stdio transport) to Venti Multi-Tenant Remote MCP Server.
 *
 * Usage:
 *   node venti-mcp-cli.js --key <YOUR_MCP_KEY> [--url <MCP_ENDPOINT_URL>]
 *   or set environment variable VENTI_MCP_KEY=<YOUR_MCP_KEY>
 */

const readline = require('readline');

// Parse CLI arguments
const args = process.argv.slice(2);
let apiKey = process.env.VENTI_MCP_KEY || null;
let mcpUrl =
  process.env.VENTI_MCP_URL || 'https://msjkjymlvjaliaztlbls.supabase.co/functions/v1/mcp';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--key' && args[i + 1]) {
    apiKey = args[i + 1];
    i++;
  } else if (args[i] === '--url' && args[i + 1]) {
    mcpUrl = args[i + 1];
    i++;
  }
}

if (!apiKey) {
  process.stderr.write(
    '[Venti MCP] Error: Se requiere una clave MCP válida.\n' +
      'Usa: node venti-mcp-cli.js --key vnt_mcp_live_... o define la variable VENTI_MCP_KEY\n',
  );
  process.exit(1);
}

// Track pending async requests
let activeRequests = 0;
let isClosed = false;

// Set up line-by-line JSON-RPC reader on stdin (DO NOT pass output: process.stdout to prevent echoing stdin!)
const rl = readline.createInterface({
  input: process.stdin,
  terminal: false,
});

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  activeRequests++;
  try {
    const payload = JSON.parse(trimmed);

    // Forward JSON-RPC payload to Venti Edge Function
    const response = await fetch(mcpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        parsedError = null;
      }

      const rpcError = parsedError?.error
        ? parsedError
        : {
            jsonrpc: '2.0',
            id: payload.id || null,
            error: {
              code: -32000,
              message: `HTTP Error ${response.status}: ${errorText}`,
            },
          };
      process.stdout.write(JSON.stringify(rpcError) + '\n');
      return;
    }

    const jsonResult = await response.json();
    process.stdout.write(JSON.stringify(jsonResult) + '\n');
  } catch (err) {
    const errorResponse = {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: err.message || 'Internal Bridge Error',
      },
    };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
  } finally {
    activeRequests--;
    if (isClosed && activeRequests === 0) {
      process.exit(0);
    }
  }
});

rl.on('close', () => {
  isClosed = true;
  if (activeRequests === 0) {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  process.exit(0);
});
