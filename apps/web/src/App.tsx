import { useState } from 'react'

function App() {
  const [message, setMessage] = useState<string>('')

  return (
    <div className="app">
      <h1>RAGfolio</h1>
      <p>Your RAG Application - Frontend</p>
      <p className="subtitle">React + TypeScript + Vite</p>
    </div>
  )
}

export default App
