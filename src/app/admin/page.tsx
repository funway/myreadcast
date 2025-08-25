export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-extrabold text-primary">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 卡片示例 */}
        <div className="bg-base-200 rounded-lg shadow p-4 flex flex-col items-center">
          <div className="text-3xl font-bold text-secondary mb-2">📊</div>
          <h2 className="font-semibold text-lg">系统状态</h2>
          <p className="text-sm text-base-content/70 text-center mt-2">
            系统运行良好
          </p>
        </div>

        <div className="bg-base-200 rounded-lg shadow p-4 flex flex-col items-center">
          <div className="text-3xl font-bold text-secondary mb-2">📚</div>
          <h2 className="font-semibold text-lg">库管理</h2>
          <p className="text-sm text-base-content/70 text-center mt-2">
            当前有 12 个库
          </p>
        </div>

        <div className="bg-base-200 rounded-lg shadow p-4 flex flex-col items-center">
          <div className="text-3xl font-bold text-secondary mb-2">👥</div>
          <h2 className="font-semibold text-lg">用户管理</h2>
          <p className="text-sm text-base-content/70 text-center mt-2">
            当前在线 3 人
          </p>
        </div>
      </div>
    </div>
  )
}