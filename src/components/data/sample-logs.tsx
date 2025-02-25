import { Log } from "@/components/logs-table";

const sampleLogs: Log[] = [
  {
    id: "1",
    bot: "Weaviate",
    message: "What is malaria?",
    answer:
      "Malaria is a disease caused by the parasite Plasmodium falciparum. It is transmitted by mosquitoes and can be fatal if left untreated.",
    reporter: "Helen",
    score: "Pass",
    question: "What is malaria?",
    date_created: "2024-01-15",
  },
  {
    id: "2",
    bot: "Signpost Help Helper",
    message:
      "I'm a single mother with three kids, one of them need medical support. where can i go to get support?",
    answer:
      "To receive support as a single mother with three kids, including one needing medical assistance, you can apply for social benefits in Georgia. The criteria for receiving assistance include having a large family with three or more children under the age of 18. Additionally, being a single mother or father raising minor children on your own qualifies you for support. To access this assistance, you would need to fill out an application form to apply for the necessary help.",
    reporter: "Liam Nicoll",
    score: "Fail",
    question:
      "I'm a single mother with three kids, one of them need medical support. where can i go to get support?",
    date_created: "2024-02-20",
  },
  {
    id: "3",
    bot: "Zendesk GPT (Julisha)",
    message: "Explain the theory of relativity.",
    answer:
      "The theory of relativity, developed by Albert Einstein, encompasses two interrelated theories: special relativity and general relativity. Special relativity deals with the relationship between space and time for objects moving at constant speeds, while general relativity describes gravity as the curvature of spacetime caused by mass and energy.",
    reporter: "Helen",
    score: "Fail",
    question: "Explain the theory of relativity.",
    date_created: "2024-03-10",
  },
  {
    id: "4",
    bot: "Directus Claude (Julisha)",
    message: "What are the main causes of climate change?",
    answer:
      "The main causes of climate change are human activities that release greenhouse gases into the atmosphere. These include burning fossil fuels (coal, oil, and natural gas) for energy, deforestation, and industrial processes.",
    reporter: "Helen",
    score: "Pass",
    question: "What are the main causes of climate change?",
    date_created: "2024-04-05",
  },
  {
    id: "5",
    bot: "Directus GPT (Greece)",
    message: "Write a short poem about the ocean.",
    answer:
      "Vast ocean, deep and blue,\nWaves crashing, ever new.\nSecrets hidden, mysteries untold,\nA world of wonder, brave and bold.",
    reporter: "Liam Nicoll",
    score: "Fail",
    question: "Write a short poem about the ocean.",
    date_created: "2024-05-12",
  },
  {
    id: "6",
    bot: "Weaviate",
    message: "What is the capital of France?",
    answer: "The capital of France is Paris.",
    reporter: "Paskal",
    score: "Pass",
    question: "What is the capital of France?",
    date_created: "2024-06-01",
  },
  {
    id: "7",
    bot: "Signpost Help Helper",
    message:
      "I need help finding affordable housing in New York City. Where can I start?",
    answer:
      "To find affordable housing in New York City, you can start by contacting the NYC Department of Housing Preservation and Development (HPD) or exploring resources like NYC Housing Connect.",
    reporter: "Liam Nicoll",
    score: "Pass",
    question:
      "I need help finding affordable housing in New York City. Where can I start?",
    date_created: "2024-07-18",
  },
  {
    id: "8",
    bot: "Zendesk GPT (Julisha)",
    message: "Summarize the plot of Hamlet.",
    answer:
      "Hamlet is a tragedy by William Shakespeare. The play follows Prince Hamlet as he seeks revenge on his uncle Claudius, who has murdered Hamlet's father, seized the throne, and married Hamlet's mother.",
    reporter: "Helen",
    score: "Pass",
    question: "Summarize the plot of Hamlet.",
    date_created: "2024-08-25",
  },
  {
    id: "9",
    bot: "Directus Claude (Julisha)",
    message: "What are the benefits of exercise?",
    answer:
      "The benefits of exercise include improved cardiovascular health, increased strength and endurance, weight management, reduced risk of chronic diseases, and improved mood and mental health.",
    reporter: "Paskal",
    score: "Fail",
    question: "What are the benefits of exercise?",
    date_created: "2024-09-08",
  },
  {
    id: "10",
    bot: "Directus GPT (Greece)",
    message: "Translate 'Hello, world!' into Spanish.",
    answer: "The translation of 'Hello, world!' into Spanish is '¡Hola, mundo!'",
    reporter: "Liam Nicoll",
    score: "Fail",
    question: "Translate 'Hello, world!' into Spanish.",
    date_created: "2024-10-02",
  },
  {
    id: "11",
    bot: "Weaviate",
    message: "What is the chemical symbol for gold?",
    answer: "The chemical symbol for gold is Au.",
    reporter: "Liam Nicoll",
    score: "Pass",
    question: "What is the chemical symbol for gold?",
    date_created: "2024-11-30",
  },
  {
    id: "12",
    bot: "Signpost Help Helper",
    message:
      "I'm looking for job training programs in Chicago. Can you help me find some?",
    answer:
      "To find job training programs in Chicago, you can explore resources like the Chicago Cook Workforce Partnership and local community colleges.",
    reporter: "Paskal",
    score: "Pass",
    question:
      "I'm looking for job training programs in Chicago. Can you help me find some?",
    date_created: "2024-12-24",
  },
  {
    id: "13",
    bot: "Zendesk GPT (Julisha)",
    message: "Explain the concept of blockchain technology.",
    answer:
      "Blockchain technology is a decentralized, distributed, and immutable ledger that records transactions across many computers. It is used to create secure and transparent systems, such as cryptocurrencies.",
    reporter: "Paskal",
    score: "Fail",
    question: "Explain the concept of blockchain technology.",
    date_created: "2025-01-07",
  },
  {
    id: "14",
    bot: "Directus Claude (Julisha)",
    message: "What are the symptoms of the common cold?",
    answer:
      "The symptoms of the common cold include a runny nose, sore throat, cough, sneezing, and headache.",
    reporter: "Helen",
    score: "Pass",
    question: "What are the symptoms of the common cold?",
    date_created: "2025-02-14",
  },
  {
    id: "15",
    bot: "Directus GPT (Greece)",
    message: "Write a haiku about autumn.",
    answer:
      "Leaves fall, gold and red,\nCrisp air and pumpkin spice scent,\nWinter sleeps nearby.",
    reporter: "Paskal",
    score: "Fail",
    question: "Write a haiku about autumn.",
    date_created: "2025-03-22",
  },
  {
    id: "16",
    bot: "Weaviate",
    message: "What is the largest planet in our solar system?",
    answer: "The largest planet in our solar system is Jupiter.",
    reporter: "Paskal",
    score: "Pass",
    question: "What is the largest planet in our solar system?",
    date_created: "2025-04-11",
  },
  {
    id: "17",
    bot: "Signpost Help Helper",
    message:
      "I need information about food banks in Los Angeles. Where can I find a list?",
    answer:
      "To find a list of food banks in Los Angeles, you can contact the Los Angeles Regional Food Bank or search online for local food pantries.",
    reporter: "Liam Nicoll",
    score: "Pass",
    question:
      "I need information about food banks in Los Angeles. Where can I find a list?",
    date_created: "2025-05-05",
  },
  {
    id: "18",
    bot: "Zendesk GPT (Julisha)",
    message: "Describe the process of photosynthesis.",
    answer:
      "Photosynthesis is the process by which plants and other organisms convert light energy into chemical energy. During photosynthesis, plants use light energy to convert carbon dioxide and water into glucose and oxygen.",
    reporter: "Helen",
    score: "Fail",
    question: "Describe the process of photosynthesis.",
    date_created: "2025-06-19",
  },
  {
    id: "19",
    bot: "Directus Claude (Julisha)",
    message: "What are the benefits of meditation?",
    answer:
      "The benefits of meditation include reduced stress and anxiety, improved focus and concentration, increased self-awareness, and emotional regulation.",
    reporter: "Paskal",
    score: "Fail",
    question: "What are the benefits of meditation?",
    date_created: "2025-07-28",
  },
  {
    id: "20",
    bot: "Directus GPT (Greece)",
    message: "Translate 'Thank you' into Japanese.",
    answer: "The translation of 'Thank you' into Japanese is 'ありがとう (arigatou)'.",
    reporter: "Helen",
    score: "Pass",
    question: "Translate 'Thank you' into Japanese.",
    date_created: "2025-08-09",
  },
  {
    id: "21",
    bot: "Directus Claude (Julisha)",
    message: "What is the population of the world?",
    answer: "The population of the world is approximately 8 billion people.",
    reporter: "Paskal",
    score: "Pass",
    question: "What is the population of the world?",
    date_created: "2025-09-16",
  },
];

export default sampleLogs;
