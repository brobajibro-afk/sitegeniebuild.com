from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import os
from dotenv import load_dotenv
from crewai import Agent, Task, Crew
from langchain_openai import ChatOpenAI

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenRouter LLM setup
llm = ChatOpenAI(
    model="anthropic/claude-sonnet-4-5",
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
    temperature=0.7,
)

# Define Agents
planner_agent = Agent(
    role="Project Planner",
    goal="Break down user requirements into clear tasks",
    backstory="Expert at planning web projects",
    llm=llm,
    verbose=True,
)

frontend_agent = Agent(
    role="Frontend Developer",
    goal="Generate beautiful React/TypeScript code with Tailwind CSS",
    backstory="Expert React developer who writes production-ready code",
    llm=llm,
    verbose=True,
)

fixer_agent = Agent(
    role="Code Fixer",
    goal="Fix any errors and optimize the generated code",
    backstory="Expert at debugging and fixing code issues",
    llm=llm,
    verbose=True,
)

@app.websocket("/ws/generate")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_text()
        request = json.loads(data)
        prompt = request.get("prompt", "")
        
        # Task 1: Planning
        await websocket.send_json({
            "agent": "planner",
            "status": "Planning your application...",
            "progress": 0
        })
        
        plan_task = Task(
            description=f"Plan a web application for: {prompt}. Break it down into components and features needed.",
            agent=planner_agent,
            expected_output="A detailed plan with components and features"
        )
        
        # Task 2: Frontend Generation
        await websocket.send_json({
            "agent": "frontend",
            "status": "Generating React components...",
            "progress": 33
        })
        
        frontend_task = Task(
            description=f"Generate beautiful React/TypeScript code for: {prompt}. Use Tailwind CSS and lucide-react icons. Return valid JSON with file paths as keys and code as values.",
            agent=frontend_agent,
            expected_output="JSON with React component files"
        )
        
        # Task 3: Fix and Optimize
        await websocket.send_json({
            "agent": "fixer",
            "status": "Fixing and optimizing code...",
            "progress": 66
        })
        
        fix_task = Task(
            description="Review the generated code for errors and optimize it. Ensure all imports are correct.",
            agent=fixer_agent,
            expected_output="Optimized and error-free code"
        )
        
        # Run Crew
        crew = Crew(
            agents=[planner_agent, frontend_agent, fixer_agent],
            tasks=[plan_task, frontend_task, fix_task],
            verbose=True
        )
        
        result = crew.kickoff()
        
        # Send completion
        await websocket.send_json({
            "agent": "complete",
            "status": "Generation complete!",
            "progress": 100,
            "result": str(result)
        })
        
    except Exception as e:
        await websocket.send_json({
            "error": str(e),
            "agent": "error"
        })
    finally:
        await websocket.close()

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)