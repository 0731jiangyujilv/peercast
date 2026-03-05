export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="text-5xl">🎲</div>
      <h1 className="text-2xl font-bold">Chatutu</h1>
      <p className="text-sm text-tg-hint max-w-xs">
        1v1 crypto price bets in Telegram group chats, powered by Chainlink.
      </p>
      <p className="text-xs text-tg-hint">
        Open this page from a bet link in your Telegram group to deposit.
      </p>
    </div>
  )
}
