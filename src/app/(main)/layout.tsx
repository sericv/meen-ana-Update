import { PersistentTabBar } from "@/components/shell/PersistentTabBar";

export default function MainShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 h-full w-full min-h-0 min-w-0 relative overflow-hidden">
      <div className="flex-1 overflow-hidden min-h-0 relative">
        {children}
      </div>
      <PersistentTabBar />
    </div>
  );
}
