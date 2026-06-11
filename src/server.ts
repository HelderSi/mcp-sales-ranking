import { McpServer, StdioServerTransport } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { getTopSellers } from "./tools/getTopSellers";

const server = new McpServer({
  version: "1.0.0",
  name: "SalesRanking",
  description: "Ranking of sellers"
});


server.registerTool("get_top_sellers",{
    title: "Get the top sellers by revenue",
    description: "Get the top sellers by revenue from the sales data",
    inputSchema: z.object({
        limit: z.number().optional().default(5)
    })
},
async ({ limit }) => {
    const result = await getTopSellers(limit);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(result, null, 2),
            }
        ]
    };
});


// Main function to start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
  
main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
});