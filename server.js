import express from "express";
import OpenAI from "openai";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: "SUA_API_KEY_AQUI"
});

app.post("/explicar-remedio", async (req, res) => {
  try {
    const { nome } = req.body;

    const response = await openai.responses.create({
      model: "gpt-5.3",
      input: `Explique de forma simples para que serve o remédio ${nome}`
    });

    res.json({
      texto: response.output[0].content[0].text
    });

  } catch (error) {
    res.status(500).json({ erro: "Erro na IA" });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});