/**
 * Cliente MCP para conectar ao servidor de vendas
 *
 * Este arquivo é responsável por:
 * - Conectar ao servidor MCP via stdio (spawn process)
 */

import { Client, StdioClientTransport } from "@modelcontextprotocol/client";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

export class MCPClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;

  constructor() {
    this.client = new Client({
      name: "SalesRankingClient",
      version: "1.0.0",
    });
  }

  /**
   * Conecta ao servidor MCP via stdio
   * O servidor é iniciado como subprocess automaticamente
   */
  async connect(): Promise<void> {
    // [x] TODO: Criar o transport stdio
    // O transport spawna o servidor MCP como processo filho
    // TransportStdio: O cliente spawna o servidor como processo filho e se comunica via stdin/stdout.
    // O servidor não roda independentemente - ele é iniciado pelo cliente.
    // Só roda se o cliente estiver executando.
    //
    // ┌─────────┐  stdin/stdout  ┌─────────┐
    // │ Cliente │ ─────────────► │ Server  │
    // │         │ ◄───────────── │ (filho) │
    // └─────────┘                └─────────┘
    // └── spawna o server automaticamente
    //
    this.transport = new StdioClientTransport({
      command: "tsx",
      args: ["src/server.ts"], // O comando deve ser o mesmo usado em package.json "dev" script
    });
    //
    // [x] TODO: Conectar o cliente ao transport
    //
    console.log("Conectado ao servidor MCP");
    await this.client.connect(this.transport);
  }


  /**
   * Desconecta do servidor MCP
   */
  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
    }
  }
}
