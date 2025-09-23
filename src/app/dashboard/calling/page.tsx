"use client";

import React, { useState, useEffect } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Delete,
  History,
  ArrowLeft,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../supabase/client";

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
  const [selectedNumberSid, setSelectedNumberSid] = useState<string | null>(
    null,
  );
  const [hasOwnedNumber, setHasOwnedNumber] = useState<boolean>(true);

  const router = useRouter();
  const supabase = createClient();

  // Contacts state
  const [contacts, setContacts] = useState<
    Array<{
      id: string;
      name: string;
      phone_number: string;
      image_url?: string;
    }>
  >([]);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Twilio numbers
  const [twilioNumbers, setTwilioNumbers] = useState<
    Array<{ sid: string; phoneNumber: string }>
  >([]);

  // Dialing pad numbers
  const dialPadNumbers = [
    [
      { number: "1", letters: "" },
      { number: "2", letters: "ABC" },
      { number: "3", letters: "DEF" },
    ],
    [
      { number: "4", letters: "GHI" },
      { number: "5", letters: "JKL" },
      { number: "6", letters: "MNO" },
    ],
    [
      { number: "7", letters: "PQRS" },
      { number: "8", letters: "TUV" },
      { number: "9", letters: "WXYZ" },
    ],
    [
      { number: "*", letters: "" },
      { number: "0", letters: "+" },
      { number: "#", letters: "" },
    ],
  ];

  useEffect(() => {
    // Enforce auth client-side (middleware also protects server-side)
    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) router.replace("/sign-in");
    };
    check();

    // Load contacts
    fetch("/api/contacts", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        if (res.contacts) setContacts(res.contacts);
      })
      .catch(() => {});

    // Load Twilio numbers (owned by the current user only)
    fetch("/api/twilio/numbers", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        const owned = Array.isArray(res.numbers)
          ? res.numbers.filter((n: any) => n.owned)
          : [];
        if (owned.length) {
          const numbers = owned.map((n: any) => ({
            sid: n.sid,
            phoneNumber: n.phoneNumber,
          }));
          setTwilioNumbers(numbers);
          setSelectedNumber(numbers[0].phoneNumber);
          setSelectedNumberSid(numbers[0].sid);
          setHasOwnedNumber(true);
        } else {
          setTwilioNumbers([]);
          setSelectedNumber("");
          setSelectedNumberSid(null);
          setHasOwnedNumber(false);
        }
      })
      .catch(() => {
        setHasOwnedNumber(false);
      });

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
    if (!hasOwnedNumber || !selectedNumber) {
      toast({
        title: "No caller ID",
        description: "You need to buy a phone number first in Call Flows.",
        variant: "destructive",
      });
      return;
    }
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
          status: "in-progress",
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

  // Add a new contact and immediately dial
  const addContactAndDial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          phone_number: newPhone,
          image_url: newImageUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save contact");
      const contact = data.contact;
      setContacts((prev) => [contact, ...prev]);
      setNewName("");
      setNewPhone("");
      setNewImageUrl("");
      setTargetNumber(contact.phone_number);
      // Dial right away
      if (!isCallActive && !isConnecting) {
        await makeCall();
      }
      toast({ title: "Contact saved", description: `Calling ${contact.name}` });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const configureVoiceWebhook = async () => {
    if (!selectedNumberSid) {
      toast({ title: "No number selected", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("/api/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumberSid: selectedNumberSid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to configure");
      toast({ title: "Voice webhook configured", description: data.voiceUrl });
    } catch (e: any) {
      toast({
        title: "Configure failed",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const logCall = async (callData: any) => {
    try {
      await fetch("/api/call-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(callData),
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
      setTargetNumber((prev) => prev + value);
    }
  };

  const handleBackspace = () => {
    setTargetNumber((prev) => prev.slice(0, -1));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/contacts/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      setNewImageUrl(data.url);
      toast({ title: "Image uploaded" });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back to Dashboard Button */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {!hasOwnedNumber && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <div className="font-medium">You don't own a phone number yet</div>
            <div className="text-sm mt-1">
              Buy a number in The "Buy Number Page" inside of your Dashboard to
              place calls.
              <Link href="/dashboard" className="underline ml-1">
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}

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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Contacts */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Contacts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={addContactAndDial} className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        placeholder="Name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                      <Input
                        placeholder="Phone (+1...)"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="cursor-pointer"
                        />
                        {uploadingImage ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400" />
                        ) : (
                          newImageUrl && (
                            <Upload size={18} className="text-green-600" />
                          )
                        )}
                      </div>
                    </div>
                    {newImageUrl && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Avatar>
                          <AvatarImage src={newImageUrl} />
                          <AvatarFallback>{newName?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">Image attached</span>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        Save & Call
                      </Button>
                    </div>
                  </form>

                  <Separator />

                  <div className="space-y-2 max-h-[520px] overflow-auto pr-2">
                    {contacts.length === 0 && (
                      <div className="text-sm text-gray-500">
                        No contacts yet. Add one above.
                      </div>
                    )}
                    {contacts.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setTargetNumber(c.phone_number)}
                        className="flex items-center justify-between p-2 rounded-md border border-gray-200 bg-white hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={
                                c.image_url ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.name)}`
                              }
                            />
                            <AvatarFallback>
                              {c.name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-800">
                              {c.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {c.phone_number}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTargetNumber(c.phone_number);
                          }}
                        >
                          Dial
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Middle: Call Interface + Dial Pad */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl font-bold text-gray-800">
                      {isCallActive
                        ? "Call Active"
                        : isConnecting
                          ? "Connecting..."
                          : "Ready to Call"}
                    </CardTitle>
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        deviceReady
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
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
                        disabled={
                          isCallActive || isConnecting || !hasOwnedNumber
                        }
                      />
                    </div>

                    {/* Call Duration */}
                    {isCallActive && (
                      <div className="text-center">
                        <div className="text-3xl font-mono text-gray-700">
                          {Math.floor(callDuration / 60)}:
                          {(callDuration % 60).toString().padStart(2, "0")}
                        </div>
                        <div className="text-sm text-gray-500">
                          Call Duration
                        </div>
                      </div>
                    )}

                    {/* Call Controls */}
                    <div className="flex justify-center items-center gap-4">
                      {!isCallActive ? (
                        <Button
                          onClick={makeCall}
                          disabled={
                            isConnecting || !targetNumber || !hasOwnedNumber
                          }
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
                              isMuted
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-gray-500 hover:bg-gray-600"
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
                        disabled={!hasOwnedNumber}
                      >
                        Enable Microphone
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl font-bold text-gray-800">
                      Dial Pad
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                      {dialPadNumbers.flat().map((item, index) => (
                        <Button
                          key={index}
                          onClick={() => handleDialPadPress(item.number)}
                          disabled={
                            isCallActive || isConnecting || !hasOwnedNumber
                          }
                          className="w-16 h-16 rounded-full bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300 text-gray-800 shadow-md transition-all duration-200 hover:scale-105 flex flex-col items-center justify-center p-0"
                          variant="outline"
                        >
                          <span className="text-xl font-bold">
                            {item.number}
                          </span>
                          {item.letters && (
                            <span className="text-xs text-gray-500 -mt-1">
                              {item.letters}
                            </span>
                          )}
                        </Button>
                      ))}
                    </div>
                    <div className="flex justify-center mt-4">
                      <Button
                        onClick={handleBackspace}
                        disabled={
                          isCallActive ||
                          isConnecting ||
                          !targetNumber ||
                          !hasOwnedNumber
                        }
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

              {/* Right: Caller ID & Webhook */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Caller ID & Webhook</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!hasOwnedNumber ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      No owned numbers found. Purchase one in Call Flows.
                    </div>
                  ) : (
                    <>
                      <Label htmlFor="out-number">Choose outgoing number</Label>
                      <select
                        id="out-number"
                        className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                        value={selectedNumber}
                        onChange={(e) => {
                          const num = e.target.value;
                          setSelectedNumber(num);
                          const match = twilioNumbers.find(
                            (n) => n.phoneNumber === num,
                          );
                          setSelectedNumberSid(match?.sid || null);
                        }}
                      >
                        {twilioNumbers.map((n) => (
                          <option key={n.sid} value={n.phoneNumber}>
                            {n.phoneNumber}
                          </option>
                        ))}
                      </select>
                      <Button
                        onClick={configureVoiceWebhook}
                        variant="secondary"
                      >
                        Configure Voice Webhook
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
