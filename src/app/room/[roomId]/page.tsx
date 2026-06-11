import dynamic from "next/dynamic";
import { AuthGate } from "@/components/auth/AuthGate";
import { RoomRouteLoading } from "@/components/game/RoomRouteLoading";

const RoomExperience = dynamic(
  () => import("@/components/game/RoomExperience").then((m) => ({ default: m.RoomExperience })),
  { loading: () => <RoomRouteLoading /> },
);

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return (
    <AuthGate>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <RoomExperience roomId={roomId} />
      </div>
    </AuthGate>
  );
}
