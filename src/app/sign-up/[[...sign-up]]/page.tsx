"use client";
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center py-10">
      <SignUp appearance={{ variables: { colorPrimary: "#2f9f9c" } }} />
    </div>
  );
}

