import { useState } from 'react'
import CsvLoader from './components/CsvLoader'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <CsvLoader></CsvLoader>
    </div>
  )
}

export default App
