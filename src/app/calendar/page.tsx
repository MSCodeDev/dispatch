import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CalendarPage } from "@/components/CalendarPage";

export default async function Calendar() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <CalendarPage />;
}
