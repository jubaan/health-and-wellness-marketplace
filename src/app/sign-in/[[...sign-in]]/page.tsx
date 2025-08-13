"use client";
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center py-10">
      <SignIn appearance={{ variables: { colorPrimary: "#2f9f9c" } }} />
    </div>
  );
}

