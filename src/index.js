import dotenv from "dotenv";
dotenv.config();

import connectDB from "./db.js";
import express from "express";
import { Contact } from "./models/Contact.js";
import { Demo } from "./models/Demo.js";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const uri =
  process.env.NODE_ENV === "production"
    ? process.env.PROD_DB_URI
    : "mongodb://localhost:27017/meetai_db";

// Initialize the database connection
connectDB(uri);

// Initialize the database connection
const app = express();

// Middleware to parse JSON data from requests
app.use(express.json());

// API route for handling the queryBot answers
app.post("/api/queryBot", async (req, res) => {
  try {
    const { query } = req.body;

    // Initialize the LLM with the provided API key and model
    const llm = new ChatGroq({
      model: "llama3-70b-8192",
      temperature: 0,
      apiKey: process.env.GROQ_API_KEY, // Default value.
      temperature: 0,
    });

    const systemPrompt =
      "You are a project manager and marketing agent of Meetaicoders, a software company specializing in technology solutions. You will answer general questions only about technology within your expertise. For irrelevant or out-of-scope questions, politely excuse yourself by stating you do not have an answer, and follow up with a related question about Meetaicoders' services or expertise. Keep responses short, concise and focused. Donot generate lengthy responses. Strictly follow the guidelines";

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      ["human", "{input}"],
    ]);

    const chain = prompt.pipe(llm);

    const chainResponse = await chain.invoke({
      input: query,
    });
    return res.status(200).json({ AiResponse: chainResponse.content });
  } catch (error) {
    // Handle errors gracefully
    console.error("Error occurred:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing the request." });
  }
});

// API route for handling the contact form data
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const contact = new Contact({ name: name, email: email, message: message });

    await contact.save();

    return res.status(200).json({
      success: true,
      message: "Request Processed Successfully",
    });
  } catch (error) {
    // Handle errors gracefully
    console.error("Error occurred:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing the request." });
  }
});

// API route for handling the demo form data
app.post("/api/demo", async (req, res) => {
  try {
    const {
      fname,
      lname,
      email,
      company,
      categories,
      country,
      phone_number,
      message,
    } = req.body;

    const demo = new Demo({
      fname: fname,
      lname: lname,
      email: email,
      company: company,
      categories: categories,
      country: country,
      phone_number: phone_number,
      message: message,
    });

    await demo.save();

    return res.status(200).json({
      message: "Request Processed Successfully",
    });
  } catch (error) {
    // Handle errors gracefully
    console.error("Error occurred:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing the request." });
  }
});

// Initialize the port for application
const port = 3000;
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
