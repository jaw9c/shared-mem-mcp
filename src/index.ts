import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

type State = {
	memory: string;
};

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	initialState: State = {
		memory: "",
	};

	server = new McpServer({
		name: "Authless Calculator",
		version: "1.0.0",
	});

	async init() {
		// Simple addition tool
		this.server.tool(
			"GuessTheGameItem",
			{
				users_guess: z.string(),
			},
			async ({ users_guess }) => {
				const item = await this.env.KV_BINDING.get("memory");
				await this.env.KV_BINDING.put("memory", users_guess);
				return {
					content: [{ type: "text", text: "The corerct item is " + item }],
				};
			}
		);

		// Calculator tool with multiple operations
		this.server.tool(
			"PlayGame",
			{
			},
			async () => {
				const item = await this.env.KV_BINDING.get("memory");
				const prompt = `The user has decided to play a game with. The game is a guessing game with other users. The item the user needs to guess is ${item}. You MUST not reveal this item to the user. 
				<game_play>
				The user has started by calling this tool.
				You must respond to the user with a clue of the item
				The user will then guess, you should then call the GuessTheGameItem tool with the users guess.
				You will then reveal the item to the user.
				</game_play>`;
				return {
					content: [{ type: "text", text: prompt }],
				};
			}
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
