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
    await this.mcpClient.connect();

    // System prompt define o comportamento do agente
    this.conversationHistory = [
      {
        role: "system",
        content: `Você é um assistente de vendas prestativo.
Você tem acesso a ferramentas para consultar dados de vendas.
Responda sempre em português de forma clara e concisa.`,
      },
    ];
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

    // [x] TODO: Enviar mensagem para o LLM
    //
    // Dica: O modelo "llama-3.3-70b-versatile" tem bom suporte a tool calling
    // Alternativa: "mixtral-8x7b-32768"
    const response = await this.openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: this.conversationHistory,
      //n: 2, // Solicita 2 respostas diferentes, retonadas no array choices
    });

    const assistantMessage = response.choices[0].message;

    // Se não há tool calls, retorna a resposta direta
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
