// components/CsvLoader.tsx
import { useEffect, useState } from "react";
import { initEngine, createEngine } from "../services/engine";

function CsvLoader() {
  const [ready, setReady] = useState(false);
  const [engine, setEngine] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [summaries, setSummaries] = useState<any>(null);

  useEffect(() => {
    initEngine().then(() => setReady(true));
  }, []);

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!ready) return;

    const file = e.target.files?.[0];
    if (!file) return;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const ge = createEngine(bytes);

    setEngine(ge);
    setData(ge.get_table());
    setSummaries(ge.get_summary());
  };

  return (
    <div>
      {!ready && <p>Inicializando motor WASM…</p>}

      <input
        type="file"
        accept=".csv"
        disabled={!ready}
        onChange={handleFile}
      />

      <pre>{JSON.stringify(data, null, 2)}</pre>
      <pre>{JSON.stringify(summaries, null, 2)}</pre>
    </div>
  );
}

export default CsvLoader;
