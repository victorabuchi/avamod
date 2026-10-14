import { Studio } from "./studio";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Flatsmith</h1>
      <p className="mt-2 max-w-xl text-neutral-600 dark:text-neutral-400">
        Upload a photo of any garment. Get a clean vector flat and a tech pack as SVG, 300 DPI PNG, PDF, AI, EPS and layered PSD.
      </p>
      <Studio />
    </main>
  );
}
