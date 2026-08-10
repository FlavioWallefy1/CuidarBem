const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const OpenAI = require("openai");

setGlobalOptions({maxInstances: 10});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.explicarRemedio = onRequest(async (req, res) => {
  try {
    const {nome} = req.body;

    if (!nome) {
      return res.status(400).json({
        erro: "Nome do remédio é obrigatório",
      });
    }

    const response = await openai.responses.create({
      model: "gpt-5.3",
      input: `
Você é um farmacêutico.

Explique de forma simples:
- Para que serve o remédio ${nome}
- Responda em uma frase curta
- Em português
- Sem dar diagnóstico médico
`,
    });

    const texto = response.output[0].content[0].text;

    res.json({texto});
  } catch (error) {
    console.error("Erro na IA:", error);
    res.status(500).json({
      erro: "Erro ao consultar IA",
    });
  }
});
