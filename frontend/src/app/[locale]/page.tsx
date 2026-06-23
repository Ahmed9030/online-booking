import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("Common");
  const authT = useTranslations("Auth");

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-slate-50 p-6 dark:bg-zinc-900">
      <main className="flex w-full max-w-md flex-col items-center gap-6 py-12 px-6 bg-white rounded-2xl shadow-xl dark:bg-zinc-800 text-center">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white font-heading">
          {t("title")}
        </h1>
        <p className="text-md text-zinc-500 dark:text-zinc-400">
          {t("welcome")}
        </p>
        <div className="flex gap-4">
          <button className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-semibold shadow transition">
            {authT("login")}
          </button>
          <button className="px-5 py-2 border border-zinc-200 text-zinc-700 dark:text-zinc-300 dark:border-zinc-700 text-sm rounded-lg font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition">
            {authT("register")}
          </button>
        </div>
      </main>
    </div>
  );
}
