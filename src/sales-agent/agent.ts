/**
 * Sales Agent - Agente de vendas que usa LLM + MCP Tools
 *
 * Este agente:
 * - Recebe perguntas sobre vendas
 * - Usa LLM (Groq/Llama) para entender a pergunta
 * - Chama tools MCP quando necessário
 * - Retorna respostas em linguagem natural
 */

import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from "openai/resources/chat/completions";
import { MCPClient } from "../client.js";

export class SalesAgent {
  private openai: OpenAI;
  private mcpClient: MCPClient;
  private conversationHistory: ChatCompletionMessageParam[] = [];

  constructor() {
    this.mcpClient = new MCPClient();

    // [x] TODO: Configurar o cliente OpenAI para usar Groq
    //
    // Groq usa a mesma API da OpenAI, só muda a baseURL
    //
    this.openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

  }

  /**
   * Inicializa o agente conectando ao servidor MCP
   */
  async initialize(): Promise<void> {
    console.log("INICIALIZANDO SALES AGENT...");
    console.log("Conectando ao servidor MCP...");
    await this.mcpClient.connect();
    console.log("✓ Conectado ao servidor MCP\n");

    console.log("Carregando tools disponíveis...");
    const tools = await this.mcpClient.getToolsForOpenAI();

    console.log(`✓ ${tools.length} tool(s) carregada(s):\n`);
    tools.forEach((tool) => {
      if (tool.type === "function") {
        console.log(`  - ${tool.function.name}`);
        console.log(`    └─ ${tool.function.description}`);
      }
    });

    // System prompt define o comportamento do agente
    this.conversationHistory = [
      {
        role: "system",
        content: `Você é um assistente de vendas prestativo.
Você tem acesso a ferramentas para consultar dados de vendas.
IMPORTANTE: Só use ferramentas quando o usuário pedir dados específicos.
Responda sempre em português de forma clara e concisa.`,
      },
    ];

    console.log("✓ Agent inicializado e pronto!\n");
    console.log("─".repeat(43));
  }

  /**
   * Processa uma mensagem do usuário e retorna a resposta
   */
  async chat(userMessage: string): Promise<string> {
    // Adiciona mensagem do usuário ao histórico
    this.conversationHistory.push({
      role: "user",
      content: userMessage,
    });
    const tools = await this.mcpClient.getToolsForOpenAI();
    
    // [x] TODO: Enviar mensagem para o LLM com tools
    //
    // Dica: O modelo "llama-3.3-70b-versatile" tem bom suporte a tool calling
    // Alternativa: "mixtral-8x7b-32768"
    console.log("\nEnviando mensagem...");
    const response = await this.openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: this.conversationHistory,
      tools: tools.length > 0 ? tools : undefined,
    });

    const assistantMessage = response.choices[0].message;

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolCalls = assistantMessage.tool_calls.filter(t => t.type === "function");

      console.log(`\n🔧 LLM solicitou ${toolCalls.length} tool call(s):\n`);

      // Adiciona a mensagem do assistente (com tool_calls) ao histórico
      this.conversationHistory.push(assistantMessage);

      for (const toolCall of toolCalls) {
        const args = JSON.parse(toolCall.function.arguments);

        console.log(`  ┌─ TOOL CALL ──────────────────────────`);
        console.log(`  │ ID:   ${toolCall.id}`);
        console.log(`  │ Tool: ${toolCall.function.name}`);
        console.log(`  │ Args: ${JSON.stringify(args)}`);
        console.log(`  │`);
        console.log(`  │ ⏳ Executando...`);
        console.log(`  └───────────────────────────────────────\n`);

        const result = await this.mcpClient.callTool(
          toolCall.function.name,
          args
        );

        const toolMessage: ChatCompletionToolMessageParam = {
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        };
        this.conversationHistory.push(toolMessage);
      }

      console.log("🤖 Enviando resultados para LLM gerar resposta final...");
      const finalResponse = await this.openai.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: this.conversationHistory,
      });
      const finalMessage = finalResponse.choices[0].message;
      this.conversationHistory.push(finalMessage);
      return finalMessage.content || "Não consegui processar a resposta.";
    }

    // Se não há tool calls, retorna a resposta direta
    console.log("✓ Resposta direta (sem tool calls)\n");
    this.conversationHistory.push(assistantMessage);
    return assistantMessage.content || "Não consegui processar a resposta.";
  }

  /**
   * Encerra o agente
   */
  async shutdown(): Promise<void> {
    await this.mcpClient.disconnect();
  }
}
