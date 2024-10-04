"use client";

import { Tally } from "@/components/commands/Tally";
// import { LogInCard } from "../../../components/login-card";


// [!region using-status]
export default function Home({ params }: { params: { slug: string } }) {
    // use the various signer statuses to determine if we are:
    // loading - waiting for a request to resolve
    // connected - the user signed in with an email tied to a smart account
    // unconnected - we need to provide a login UI for the user to sign in
    
    
    

    return (
        <main className="flex items-center justify-center min-h-screen text-white bg-gray-900">
            
                <Tally params={params} />
           
        </main>
    );
}
// [!endregion using-status]
