"use client";

import React, { useState, useEffect } from "react";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function CallingPage() {
  const [device, setDevice] = useState<any>(null);
  const [deviceReady, setDeviceReady] = useState(false);
  const [connection, setConnection] = useState<any>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [targetNumber, setTargetNumber] = useState("");
  const [selectedNumber, setSelectedNumber] = useState("+15551234567"); // your Twilio number

  useEffect(() => {
    let interval: any;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const initializeTwilioDevice = async () => {
    try {
      console.log("🎤 Requesting microphone...");
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("🎤 Mic granted");

      const res = await fetch("/api/twilio/voice-token", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch token");
      const { token } = await res.json();

      const { Device } = await import("@twilio/voice-sdk");
      const newDevice = new Device(token, {
        logLevel: 3,
        answerOnBridge: true,
        codecPreferences: ["opus", "pcmu"],
      });

      newDevice.on("registered", () => {
        console.log("📞 Device registered");
        setDevice(newDevice);
        setDeviceReady(true);
        toast({ title: "Voice Ready", description: "Device registered." });
      });

      newDevice.on("error", (err: any) => {
        console.error("❌ Device error:", err);
        toast({
          title: "Device Error",
          description: err.message,
          variant: "destructive",
        });
        setDeviceReady(false);
      });

      await newDevice.register();
    } catch (error: any) {
      console.error("Init error:", error);
      toast({
        title: "Init Error",
        description: error.message,
        variant: "destructive",
      });
      setDeviceReady(false);
    }
  };

  const makeCall = async () => {
    if (!deviceReady || !device) {
      toast({
        title: "Device not ready",
        description: "Click Enable Microphone first.",
        variant: "destructive",
      });
      return;
    }
    if (!targetNumber) {
      toast({
        title: "Error",
        description: "Enter a valid phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    setCallDuration(0);

    try {
      const clean = targetNumber.replace(/\D/g, "");
      const e164 = clean.length === 10 ? `+1${clean}` : `+${clean}`;

      const params = { To: e164, From: selectedNumber };
      const call = await device.connect({ params });

      setConnection(call);

      // ✅ attach listeners correctly
      call.addListener("accept", () => {
        setIsCallActive(true);
        setIsConnecting(false);
        toast({
          title: "Connected",
          description: `Call to ${formatPhoneNumber(targetNumber)}`,
        });
      });

      call.addListener("disconnect", () => {
        setIsCallActive(false);
        setIsConnecting(false);
        setConnection(null);
        setCallDuration(0);
        setIsMuted(false);
        toast({ title: "Call Ended" });
      });

      call.addListener("error", (error: any) => {
        console.error("Call error:", error);
        setIsCallActive(false);
        setIsConnecting(false);
        setConnection(null);
        toast({
          title: "Call Failed",
          description: error.message || "Failed to connect.",
          variant: "destructive",
        });
      });

      toast({
        title: "Connecting...",
        description: `Calling ${formatPhoneNumber(targetNumber)}`,
      });
    } catch (err) {
      console.error("Error calling:", err);
      setIsConnecting(false);
      toast({
        title: "Call Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const endCall = () => {
    if (connection) {
      connection.disconnect();
      setConnection(null);
    }
  };

  const toggleMute = () => {
    if (connection) {
      connection.mute(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const formatPhoneNumber = (num: string) => {
    const cleaned = num.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return num;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <Card className="w-full max-w-md shadow-lg rounded-xl">
        <CardContent className="p-6 space-y-6">
          <h1 className="text-2xl font-bold text-center">Phone Dialer</h1>

          <Input
            type="tel"
            placeholder="Enter target phone number"
            value={targetNumber}
            onChange={(e) => setTargetNumber(e.target.value)}
          />

          <div className="flex items-center justify-center gap-4 mt-4">
            {!isCallActive ? (
              <Button
                onClick={makeCall}
                disabled={isConnecting}
                className="bg-green-500 hover:bg-green-600 text-white w-24 h-12 rounded-full"
              >
                {isConnecting ? "..." : <Phone size={20} />}
              </Button>
            ) : (
              <Button
                onClick={endCall}
                className="bg-red-500 hover:bg-red-600 text-white w-24 h-12 rounded-full"
              >
                <PhoneOff size={20} />
              </Button>
            )}

            {isCallActive && (
              <Button
                onClick={toggleMute}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 w-16 h-12 rounded-full"
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </Button>
            )}
          </div>

          {isCallActive && (
            <div className="text-center text-gray-600">
              Duration: {Math.floor(callDuration / 60)}:
              {(callDuration % 60).toString().padStart(2, "0")}
            </div>
          )}

          <div className="text-center text-sm text-gray-600">
            {deviceReady ? "✅ Device ready" : "❌ Not ready"}
          </div>

          <Button
            onClick={initializeTwilioDevice}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white mt-4"
          >
            Enable Microphone
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
