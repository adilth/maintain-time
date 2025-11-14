import { ChatClient } from "./(components)/Chat-client";
import { getSavedSuggestions, getServerProfile } from "./actions";

export default async function Home() {
  // Fetch data on the server
  const [profile, savedSuggestions] = await Promise.all([
    getServerProfile(),
    getSavedSuggestions(),
  ]);

  const initialSessions =
    savedSuggestions.length > 0
      ? [
          {
            id: "saved-suggestions",
            message: "Your saved suggestions:",
            suggestions: savedSuggestions,
            loading: false,
          },
        ]
      : [];

  return (
    <div className="flex flex-col h-svh">
      <ChatClient initialSessions={initialSessions} initialProfile={profile} />
    </div>
  );
}
