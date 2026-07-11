import { redirect } from "next/navigation";

// o sistema abre no Feed — resumo dos dois perfis
export default function Home() {
  redirect("/feed");
}
