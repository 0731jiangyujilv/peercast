export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
      <img src="/logo.svg" alt="PeerCast Logo" className="w-48 h-32 object-contain" />
      <h1 className="text-2xl font-bold">PeerCast</h1>
      <p className="text-sm text-tg-hint max-w-xs">
        1v1 crypto price PeerCasts in Telegram group chats, powered by Chainlink.
      </p>
      <p className="text-xs text-tg-hint">
        Open this page from a PeerCast link in your Telegram group to deposit.
      </p>
    </div>
  )
}
