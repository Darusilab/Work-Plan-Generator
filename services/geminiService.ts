import { GoogleGenAI, Type } from "@google/genai";
import { type WorkPlan } from "../types";

const workPlanSchema = {
  type: Type.OBJECT,
  properties: {
    projectName: {
      type: Type.STRING,
      description: "A concise and descriptive name for the project, derived from the document's content.",
    },
    summary: {
      type: Type.STRING,
      description: "A brief, one-paragraph summary of the overall work plan and its objectives.",
    },
    tasks: {
      type: Type.ARRAY,
      description: "A list of all tasks required to address the pending issues.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER, description: "A unique integer identifier for the task, starting from 1." },
          name: { type: Type.STRING, description: "A short, clear name for the task." },
          description: { type: Type.STRING, description: "A detailed description of what the task involves." },
          assignee: { type: Type.STRING, description: "The person or team responsible for the task. Infer a suitable role if not specified (e.g., 'Project Manager', 'Dev Team')." },
          startDate: { type: Type.STRING, description: "The estimated start date for the task in YYYY-MM-DD format." },
          endDate: { type: Type.STRING, description: "The estimated end date for the task in YYYY-MM-DD format." },
          status: { type: Type.STRING, description: "The initial status of the task. Should be one of: 'Not Started', 'In Progress', 'Completed', 'On Hold'. Default to 'Not Started'." },
          reminder: { type: Type.STRING, description: "The initial reminder setting for the task. Should always be 'None' by default." },
          customReminderDate: { type: Type.STRING, description: "The specific date for a custom reminder in YYYY-MM-DD format. Only used when reminder is 'Custom'. Should be null or omitted by default." },
        },
        required: ["id", "name", "description", "assignee", "startDate", "endDate", "status", "reminder"],
      },
    },
  },
  required: ["projectName", "summary", "tasks"],
};

export const generateWorkPlan = async (documentText: string): Promise<WorkPlan> => {
  const API_KEY = process.env.API_KEY;

  if (!API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const today = new Date().toISOString().split('T')[0];

  const prompt = `
    Analyze the following document text. Identify all pending issues, action items, unresolved topics, and key deliverables. Based on this analysis, create a comprehensive and logical work plan and timeline to address and resolve everything.

    Key instructions:
    1.  The project name should be inferred from the document's main subject.
    2.  Provide a high-level summary of the work plan.
    3.  Break down the work into specific, actionable tasks.
    4.  For each task, provide a description, an inferred assignee/role, start date, end date, an initial status of 'Not Started', and a default reminder of 'None'.
    5.  The timeline should be logical, with sequential tasks having appropriate start and end dates.
    6.  Assume today's date is ${today} for creating the timeline. Dates must be in YYYY-MM-DD format.
    7.  Structure the output strictly as a JSON object matching the provided schema. Do not include any text or markdown formatting outside of the JSON object.

    Document Text:
    ---
    ${documentText.substring(0, 200000)}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: workPlanSchema,
      },
    });

    const jsonText = response.text.trim();
    
    if (!jsonText) {
        throw new Error("The AI model returned an empty response.");
    }

    const parsedPlan = JSON.parse(jsonText);
    
    // Validate tasks to ensure they are properly formed
    if (!parsedPlan.tasks || !Array.isArray(parsedPlan.tasks)) {
      throw new Error("Generated plan is missing a valid 'tasks' array.");
    }

    return parsedPlan as WorkPlan;

  } catch (error) {
    console.error("Error generating work plan from Gemini:", error);
    let detailedError = "An unknown error occurred while generating the work plan.";
    if (error instanceof Error) {
        detailedError = error.message;
        if (detailedError.includes('API key not valid')) {
            detailedError = "Your API Key is not valid. Please check your configuration.";
        } else if (detailedError.includes('xhr error') || detailedError.includes('500') || detailedError.includes('Rpc failed')) {
            detailedError = "A network or server error occurred while contacting the AI service. This could be due to a temporary issue or an invalid API key. Please try again later.";
        }
    }
    throw new Error(`Failed to generate a valid work plan. ${detailedError}`);
  }
};