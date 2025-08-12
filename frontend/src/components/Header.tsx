import { UserButton, auth } from "@clerk/nextjs";
import Link from "next/link";

export default function Header() {
  const { userId } = auth();

  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <Link href="/">
        <h1 className="text-xl font-bold">Health Platform</h1>
      </Link>
      <div>
        {userId ? (
          <UserButton afterSignOutUrl="/" />
        ) : (
          <div className="flex gap-4">
            <Link href="/sign-in">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Sign In
              </button>
            </Link>
            <Link href="/sign-up">
              <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                Sign Up
              </button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
