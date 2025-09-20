"use client";

import React, { useState, useEffect } from "react";
import { Phone, PhoneOff, Mic, MicOff, Delete, History, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default function CallingPage() {
  const [device, setDevice] = useState<any>(null);
  const [deviceReady, setDeviceReady] = useState(false);
  const [connection, setConnection] = useState<any>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [targetNumber, setTargetNumber] = useState("");
  const [selectedNumber, setSelectedNumber] = useState("+15551234567");

  // Dialing pad numbers
  const dialPadNumbers = [
    [{ number: "1", letters: "" }, { number: "2", letters: "ABC" }, { number: "3", letters: "DEF" }],
    [{ number: "4", letters: "GHI" }, { number: "5", letters: "JKL" }, { number: "6", letters: "MNO" }],
    [{ number: "7", letters: "PQRS" }, { number: "8", letters: "TUV" }, { number: "9", letters: "WXYZ" }],
    [{ number: "*", letters: "" }, { number: "0", letters: "+" }, { number: "#", letters: "" }]
  ];

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

      call.addListener("accept", () => {
        setIsCallActive(true);
        setIsConnecting(false);
        toast({
          title: "Connected",
          description: `Call to ${formatPhoneNumber(targetNumber)}`,
        });
        
        // Log the call
        logCall({
          to_number: e164,
          from_number: selectedNumber,
          direction: "outbound",
          status: "in-progress"
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

  const logCall = async (callData: any) => {
    try {
      await fetch("/api/call-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(callData)
      });
    } catch (error) {
      console.error("Failed to log call:", error);
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

  const handleDialPadPress = (value: string) => {
    if (value === "0" && targetNumber === "") {
      setTargetNumber("+");
    } else {
      setTargetNumber(prev => prev + value);
    }
  };

  const handleBackspace = () => {
    setTargetNumber(prev => prev.slice(0, -1));
  };

  const formatPhoneNumber = (num: string) => {
    const cleaned = num.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return num;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back to Dashboard Button */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="dialer" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="dialer">Phone Dialer</TabsTrigger>
            <TabsTrigger value="logs" asChild>
              <Link href="/dashboard/call-logs">
                <Button variant="ghost" className="w-full">
                  <History className="w-4 h-4 mr-2" />
                  Call Logs
                </Button>
              </Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dialer">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Call Interface */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    {isCallActive ? "Call Active" : isConnecting ? "Connecting..." : "Ready to Call"}
                  </CardTitle>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    deviceReady ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {deviceReady ? "✅ Device Ready" : "❌ Not Ready"}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Phone Number Display */}
                  <div className="text-center">
                    <Input
                      type="tel"
                      placeholder="Enter phone number"
                      value={targetNumber}
                      onChange={(e) => setTargetNumber(e.target.value)}
                      className="text-center text-xl font-mono h-14 text-gray-800 border-2 border-gray-200 focus:border-blue-500"
                      disabled={isCallActive || isConnecting}
                    />
                  </div>

                  {/* Call Duration */}
                  {isCallActive && (
                    <div className="text-center">
                      <div className="text-3xl font-mono text-gray-700">
                        {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, "0")}
                      </div>
                      <div className="text-sm text-gray-500">Call Duration</div>
                    </div>
                  )}

                  {/* Call Controls */}
                  <div className="flex justify-center items-center gap-4">
                    {!isCallActive ? (
                      <Button
                        onClick={makeCall}
                        disabled={isConnecting || !targetNumber}
                        className="bg-green-500 hover:bg-green-600 text-white w-16 h-16 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
                        size="icon"
                      >
                        {isConnecting ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        ) : (
                          <Phone size={24} />
                        )}
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={toggleMute}
                          className={`w-14 h-14 rounded-full shadow-lg transition-all duration-200 hover:scale-105 ${
                            isMuted ? "bg-red-500 hover:bg-red-600" : "bg-gray-500 hover:bg-gray-600"
                          } text-white`}
                          size="icon"
                        >
                          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                        </Button>
                        
                        <Button
                          onClick={endCall}
                          className="bg-red-500 hover:bg-red-600 text-white w-16 h-16 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
                          size="icon"
                        >
                          <PhoneOff size={24} />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Enable Microphone Button */}
                  {!deviceReady && (
                    <Button
                      onClick={initializeTwilioDevice}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12 text-lg font-medium shadow-lg"
                    >
                      Enable Microphone
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Dialing Pad */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-bold text-gray-800">Dial Pad</CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                    {dialPadNumbers.flat().map((item, index) => (
                      <Button
                        key={index}
                        onClick={() => handleDialPadPress(item.number)}
                        disabled={isCallActive || isConnecting}
                        className="w-16 h-16 rounded-full bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300 text-gray-800 shadow-md transition-all duration-200 hover:scale-105 flex flex-col items-center justify-center p-0"
                        variant="outline"
                      >
                        <span className="text-xl font-bold">{item.number}</span>
                        {item.letters && (
                          <span className="text-xs text-gray-500 -mt-1">{item.letters}</span>
                        )}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Backspace Button */}
                  <div className="flex justify-center mt-4">
                    <Button
                      onClick={handleBackspace}
                      disabled={isCallActive || isConnecting || !targetNumber}
                      className="w-16 h-16 rounded-full bg-gray-100 hover:bg-gray-200 border-2 border-gray-200 hover:border-red-300 text-gray-600 shadow-md transition-all duration-200 hover:scale-105"
                      variant="outline"
                      size="icon"
                    >
                      <Delete size={20} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}