import { PersistentTabBar } from "@/components/shell/PersistentTabBar";

export default function MainShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 w-full min-w-0 relative">
      <div className="flex-1 pb-28">
        {children}
      </div>
      <PersistentTabBar />
    </div>
  );
}
