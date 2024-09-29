"use client";

import { CreateVote } from "../../../components/commands/CreateVote";

// [!region using-status]
export default function Home({ params }: { params: { slug: string } }) {
  return (
    <main className="flex items-center justify-center min-h-screen text-white bg-gray-900">
      <CreateVote params={params} />
    </main>
  );
}
// [!endregion using-status]
