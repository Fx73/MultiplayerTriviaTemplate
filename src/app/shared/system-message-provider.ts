export class SystemMessageProvider {
    private static messages: Record<string, string[]> = {
        kick: [
            "🚪 Bye bye! One less player in the arena.",
            "🔨 Player ejected. I'm sure they had it coming!",
            "💨 Poof! A player vanished mysteriously. Nothing to see here...",
            "⚠️ Someone just got kicked! Play nice, folks.",
            "Justice served. Probably deserved it 😏"
        ],
        rejoinAfterKicked: [
            "😏 They’re back... and we’ve decided to give them another shot!",
            "🔄 Redemption arc unlocked. Let’s see if they behave this time!",
            "🕊️ Forgiveness granted. The prodigal player returns.",
            "🚪 The door wasn’t locked — just gently slammed. Glad you’re back!",
            "🎭 Welcome back to the stage. Don’t steal the spotlight this time."
        ],
        rejoin: [
            "🛜 They're back online — the signal gods have smiled again!",
            "🔌 Reconnected and ready. Let’s pretend that never happened.",
            "📶 Back from the void! Hope it wasn’t a coffee spill.",
            "💡 Connection restored. A mild blip in the matrix.",
            "🐢 Lag gone, player reborn. Let's roll!"
        ],
        disconnect: [
            "🛜 Connection lost... they'll be missed. Or will they?",
            "🔌 A player dropped out. Hope it wasn’t rage quit!",
            "📴 Someone’s Wi-Fi went on vacation.",
            "😵 They've faded into the void. Classic unplug moment.",
            "⏳ We'll hold a candle till they reconnect."
        ],
        join: [
            "🎉 A new challenger enters the arena!",
            "🖐️ Look who's joined the party!",
            "✨ One more player, one more chance to win!",
            "👋 Welcome aboard — let the games begin!",
            "🫂 Team just got stronger!"
        ],
        hostChange: [
            "👑 The crown has been passed!",
            "🧭 New captain at the helm — hold on tight!",
            "🎤 Host duties transferred. Long live the new king!",
            "🪑 Host chair just got warmer...",
            "🔄 Host rotation complete. Let's roll!"
        ],
        gameStart: [
            "🎮 Game on! No more warmups — let the battle begin!",
            "🚀 Launching into action — hope you stretched your brain!",
            "🔔 First question loading... brace yourselves!",
            "🧠 Time to shine! Let’s see who brought the knowledge.",
            "🎉 All players ready? Let’s get this show on the road!",
            "🕹️ And we're live! May the smartest one win.",
            "👀 No turning back now. It’s game time!"
        ]

    };

    static get(event: keyof typeof SystemMessageProvider.messages): string {
        const pool = this.messages[event];
        if (!pool || pool.length === 0) {
            return "🎲 A mysterious event occurred... and no message was found.";
        }
        const i = Math.floor(Math.random() * pool.length);
        return pool[i];
    }
}
