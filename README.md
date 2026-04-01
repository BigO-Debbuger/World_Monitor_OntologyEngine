# Netra AI - World Monitor Ontology Engine

Netra AI is a high-performance, dynamic geopolitical intelligence dashboard and command center. It provides real-time event context, scenario simulation, and knowledge graph mapping to visualize geopolitical events and their localized impacts, with a specific focus on India.

## 🌟 Key Features

- **Interactive Geopolitical Dashboard**: Visualize global events and their connections to Indian territories using a custom, high-contrast CartoDB Dark Matter map.
- **AI-Driven Scenario Engine**: Intelligent scenario simulation utilizing a multi-tiered fallback strategy (Google Gemini → Grok → Deterministic Engine) for maximum reliability and uptime.
- **Dynamic Knowledge Graph**: Real-time intelligent entity resolution and relationship mapping using D3 Force Graph.
- **Live Intelligence Feeds**: Integrated 24/7 situational intelligence news streams (e.g., NDTV, DD News) with direct sound controls.
- **Indian States Impact Corridor**: Dedicated severity-coded panels highlighting localized effects, impact assessments, and strategic responses.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI & Styling**: React, Tailwind CSS 4, Lucide React
- **Mapping & Visualization**: Leaflet, React Leaflet, React Force Graph 2D, D3.js
- **AI Integration**: Google Generative AI SDK, OpenAI API

## 🛠️ Getting Started

First, clone the repository and install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Environment Variables

Create a `.env.local` file in the root directory and add your API keys. Make sure to **never commit this file** (it is ignored by default via `.gitignore`).

```env
# Example .env.local
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
GROK_API_KEY=your_grok_api_key_here
```

### Running the Development Server

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the Netra AI dashboard in action.

## 🔒 Security

All sensitive keys and environment variables are safely hidden and excluded from source control. Always refer to `.env.local` for local configurations.

## 🤝 Contribution

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/BigO-Debbuger/World_Monitor_OntologyEngine/issues) if you want to contribute.

## 📜 License

This project is licensed under the MIT License.
