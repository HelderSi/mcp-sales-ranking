/**
 * Cliente MCP para conectar ao servidor de vendas
 *
 * Este arquivo é responsável por:
 * - Conectar ao servidor MCP via stdio (spawn process)
 * - Listar as tools disponíveis
 * - Converter tools MCP para formato OpenAI
 * - Executar chamadas de tools
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
    await this.client.connect(this.transport);
  }

  /**
   * Lista as tools disponíveis no servidor MCP
   * e converte para o formato esperado pela OpenAI API
   */
  async getToolsForOpenAI(): Promise<ChatCompletionTool[]> {
    // [x] TODO: Listar as tools do servidor MCP
    //
    const { tools } = await this.client.listTools();
    //
    // Dica: tools é um array com { name, description, inputSchema }
    // [x] TODO: Converter as tools para formato OpenAI
    // A OpenAI espera tools no formato:
    // {
    //   type: "function",
    //   function: {
    //     name: string,
    //     description: string,
    //     parameters: object (JSON Schema)
    //   }
    // }
    //
    return tools.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description || "",
        parameters: tool.inputSchema as Record<string, unknown>,
      },
    }));
  }

  /**
   * Executa uma tool no servidor MCP
   * @param name Nome da tool a executar
   * @param args Argumentos para a tool
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<string> {
    // [x] TODO: Chamar a tool no servidor MCP
    //
    const result = await this.client.callTool({
      name,
      arguments: args,
    });
    // O resultado contém { content: [{ type, text }] }

    // [x] TODO: Extrair e retornar o texto do resultado
    //
    const textContent = result.content.find((c) => c.type === "text");

    return textContent?.text || "Sem resultado";
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
