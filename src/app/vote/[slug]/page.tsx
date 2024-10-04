"use client";

import { Vote } from "@/components/commands/Vote";
import { LoadingSpinner } from "../../../components/ui/loading-spinner";
import { useEffect } from "react";
import Head from "next/head";

// [!region using-status]
export default function Home({ params }: { params: { slug: string } }) {
    useEffect(() => {
        console.log(params.slug);
    }, []);

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Head>
          <title>Center Button</title>
          <meta name="description" content="A centered button with Next.js and Tailwind CSS" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
          
          <Vote params={params} />
        </main>
      </div>
    );
}
// [!endregion using-status]
