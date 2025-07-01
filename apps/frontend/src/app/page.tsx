export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">上司独裁</h1>
          <p className="text-gray-600">
            4-5人用非対称型対戦オンラインカードゲーム
          </p>
        </header>

        <main>
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-4">Firebase移行中...</p>
            <p className="text-gray-600">
              Socket.ioからFirebase Realtime Databaseへの移行を進めています。
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
