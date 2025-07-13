"use client";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import LiveStream from "@/components/livestream/LiveStream";

export default function LivestreamPage() {
  const { data: session } = useSession();
  const params = useParams();
  const creatorId = params.creatorId as string;
  const isCreator = session?.user?.id === creatorId;

  return (
    <LiveStream
      role={isCreator ? "creator" : "audience"}
      roomId={creatorId}
      creatorName={isCreator ? session?.user?.name : undefined}
      audienceName={!isCreator ? session?.user?.name : undefined}
    />
  );
} 