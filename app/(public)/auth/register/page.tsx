export default function RegisterPage() {
  return (
    <section className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">注册</h1>
      <form action="/api/auth/register" method="post" className="space-y-3">
        <input name="email" type="email" placeholder="邮箱" required className="w-full" />
        <input name="username" placeholder="用户名" required className="w-full" />
        <input name="password" type="password" placeholder="密码" required className="w-full" />
        <button className="w-full rounded-md bg-accent py-2 font-medium text-black">注册</button>
      </form>
    </section>
  );
}
