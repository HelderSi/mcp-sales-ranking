/**
 * Ponto de entrada CLI para o Sales Agent
 *
 * Execute com: npm run agent
 * Requer: GROQ_API_KEY definida no .env ou ambiente
 */

import "dotenv/config";
import * as readline from "readline";
import { SalesAgent } from "./agent.js";

async function main() {
  // Verifica se a API key está configurada
  if (!process.env.GROQ_API_KEY) {
    console.error("Erro: GROQ_API_KEY não está definida");
    console.error("Obtenha sua key em: https://console.groq.com/keys");
    console.error("Execute: GROQ_API_KEY=sua_key npm run agent");
    process.exit(1);
  }

  const agent = new SalesAgent();

  try {
    await agent.initialize();
    console.log("Sales Agent pronto!");
    console.log('Digite suas perguntas sobre vendas (ou "sair" para encerrar)\n');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Loop de conversa
    const askQuestion = () => {
      rl.question("Você: ", async (input) => {
        const question = input.trim();

        if (question.toLowerCase() === "sair") {
          console.log("\nEncerrando...");
          await agent.shutdown();
          rl.close();
          process.exit(0);
        }

        if (!question) {
          askQuestion();
          return;
        }

        try {
          const response = await agent.chat(question);
          console.log(`\nAgente: ${response}\n`);
        } catch (error) {
          console.error("\nErro ao processar:", error);
        }

        askQuestion();
      });
    };

    askQuestion();
  } catch (error) {
    console.error("Erro ao inicializar o agente:", error);
    process.exit(1);
  }
}

main();
