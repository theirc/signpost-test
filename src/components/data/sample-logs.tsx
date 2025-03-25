import { Log } from "@/components/logs-table"

const sampleLogs: Log[] = [
  {
    id: "1",
    bot: "Weaviate",
    userMessage: "What is malaria?",
    answer:
      "Malaria is a disease caused by the parasite Plasmodium falciparum. It is transmitted by mosquitoes and can be fatal if left untreated.",
    detectedLanguage: "English",
    detectedLocation: "Unknown",
    searchTerm: "What is malaria?",
    category: "Health",
    date_created: "2024-01-15",
  },
  {
    id: "2",
    bot: "Signpost Help Helper",
    userMessage:
      "I'm a single mother with three kids, one of them need medical support. where can I go to get support?",
    answer:
      "To receive support as a single mother with three kids, including one needing medical assistance, you can apply for social benefits in Georgia...",
    detectedLanguage: "English",
    detectedLocation: "Unknown",
    searchTerm:
      "I'm a single mother with three kids, one of them need medical support. where can I go to get support?",
    category: "Support",
    date_created: "2024-02-20",
  },
  {
    id: "3",
    bot: "Zendesk GPT (Julisha)",
    userMessage: "Explain the theory of relativity.",
    answer:
      "The theory of relativity, developed by Albert Einstein, encompasses two interrelated theories: special relativity and general relativity...",
    detectedLanguage: "English",
    detectedLocation: "Unknown",
    searchTerm: "Explain the theory of relativity.",
    category: "Science",
    date_created: "2024-03-10",
  },
  {
    id: "4",
    bot: "Directus Claude (Julisha)",
    userMessage: "What are the main causes of climate change?",
    answer:
      "The main causes of climate change are human activities that release greenhouse gases into the atmosphere...",
    detectedLanguage: "English",
    detectedLocation: "Unknown",
    searchTerm: "What are the main causes of climate change?",
    category: "Environment",
    date_created: "2024-04-05",
  },
  {
    id: "5",
    bot: "Directus GPT (Greece)",
    userMessage: "Write a short poem about the ocean.",
    answer:
      "Vast ocean, deep and blue,\nWaves crashing, ever new.\nSecrets hidden, mysteries untold,\nA world of wonder, brave and bold.",
    detectedLanguage: "English",
    detectedLocation: "Unknown",
    searchTerm: "Write a short poem about the ocean.",
    category: "Arts",
    date_created: "2024-05-12",
  },
  {
    id: "6",
    bot: "Weaviate",
    userMessage: "What is the capital of France?",
    answer: "The capital of France is Paris.",
    detectedLanguage: "English",
    detectedLocation: "Unknown",
    searchTerm: "What is the capital of France?",
    category: "Geography",
    date_created: "2024-06-01",
  },
  {
    id: "7",
    bot: "Signpost Help Helper",
    userMessage:
      "I need help finding affordable housing in New York City. Where can I start?",
    answer:
      "To find affordable housing in New York City, you can start by contacting the NYC Department of Housing Preservation and Development...",
    detectedLanguage: "English",
    detectedLocation: "New York, USA",
    searchTerm:
      "I need help finding affordable housing in New York City. Where can I start?",
    category: "Social Services",
    date_created: "2024-07-18",
  },
  {
    id: "8",
    bot: "Zendesk GPT (Julisha)",
    userMessage: "Summarize the plot of Hamlet.",
    answer:
      "Hamlet is a tragedy by William Shakespeare. The play follows Prince Hamlet as he seeks revenge on his uncle Claudius...",
    detectedLanguage: "English",
    detectedLocation: "Unknown",
    searchTerm: "Summarize the plot of Hamlet.",
    category: "Arts",
    date_created: "2024-08-25",
  },
  {
    id: "9",
    bot: "Directus Claude (Julisha)",
    userMessage: "What are the benefits of exercise?",
    answer:
      "The benefits of exercise include improved cardiovascular health, increased strength and endurance, weight management...",
    detectedLanguage: "English",
    detectedLocation: "Unknown",
    searchTerm: "What are the benefits of exercise?",
    category: "Health",
    date_created: "2024-09-08",
  },
  {
    id: "10",
    bot: "Directus GPT (Greece)",
    userMessage: "Translate 'Hello, world!' into Spanish.",
    answer: "The translation of 'Hello, world!' into Spanish is '¡Hola, mundo!'",
    detectedLanguage: "English",
    detectedLocation: "Unknown",
    searchTerm: "Translate 'Hello, world!' into Spanish.",
    category: "Language",
    date_created: "2024-10-02",
  },
  {
    id: "11",
    bot: "Weaviate",
    userMessage: "What is the chemical symbol for gold?",
    answer: "The chemical symbol for gold is Au.",
    detectedLanguage: "English",
    detectedLocation: "Unknown",
    searchTerm: "What is the chemical symbol for gold?",
    category: "Science",
    date_created: "2024-11-30",
  },
]

export default sampleLogs
