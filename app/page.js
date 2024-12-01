'use client'
import dynamic from "next/dynamic";

const Map = dynamic(() => import("../components/Map"), { ssr: false });

export default function Home() {
  return (
    <div>
      <h1 className="text-xl m-4 text-center">Real-Time Map</h1>
      <Map />
    </div>
  );
}
