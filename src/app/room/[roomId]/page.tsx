import { AuthGate } from "@/components/auth/AuthGate";
import { RoomExperience } from "@/components/game/RoomExperience";

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return (
    <AuthGate>
      <RoomExperience roomId={roomId} />
    </AuthGate>
  );
}
