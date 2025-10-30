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
  User,
  Users,
  Search,
  Zap,
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
  const [searchQuery, setSearchQuery] = useState("");

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
    // Check for deviceReady state
    const savedDeviceReady = sessionStorage.getItem("deviceReady");
    if (savedDeviceReady === "true") {
      setDeviceReady(true);
    }

    // Enforce auth client-side
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

    // Load Twilio numbers
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
        sessionStorage.setItem("deviceReady", "true");
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
        sessionStorage.removeItem("deviceReady");
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
      sessionStorage.removeItem("deviceReady");
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

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone_number.includes(searchQuery),
  );

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 z-10 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white border-gray-300 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Phone Dialer
                  </h1>
                  <p className="text-xs text-gray-600">Make calls with ease</p>
                </div>
              </div>
            </div>
            <Link href="/dashboard/call-logs">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-50"
              >
                <History className="w-4 h-4 mr-2" />
                Call Logs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content - No Scrolling */}
      <div className="flex-1 max-h-screen max-w-[1800px] mx-auto px-6 py-4 w-full">
        {!hasOwnedNumber && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800 mb-3">
            <div className="font-medium text-sm">
              ⚠️ No phone number available
            </div>
            <div className="text-xs mt-1">
              Purchase a number in the Dashboard to start making calls.
              <Link href="/dashboard" className="underline ml-1 font-semibold">
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6 h-full">
          {/* iPhone Dialer - Left Side (4 columns) */}
          <div className="col-span-3 flex items-center justify-center h-full">
            <div className="w-full max-w-[310px] h-full flex flex-col">
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-[35px] p-2 shadow-2xl border-2 border-gray-900 flex-1 flex flex-col">
                <div className="bg-white rounded-[33px] overflow-hidden shadow-inner flex-1 flex flex-col">
                  {/* Dialer content will go here */}
                  {/* Status Bar */}
                  <div className="bg-white px-4 py-2 flex items-center justify-between text-[9px] font-semibold flex-shrink-0">
                    <div className="text-gray-900">9:41</div>
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M2 22h20V2z" />
                      </svg>
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.66-1.66-4.34-1.66-6 0z" />
                      </svg>
                      <svg
                        className="w-2 h-3"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <rect x="1" y="6" width="18" height="12" rx="2" />
                        <path d="M21 9v6" />
                      </svg>
                    </div>
                  </div>

                  {/* Call Display Area */}
                  <div
                    className="flex flex-col items-center justify-between px-4 py-4 bg-gradient-to-b from-white to-gray-50"
                    style={{ height: "calc(100% - 38px)" }}
                  >
                    {/* Contact/Number Display */}
                    <div className="text-center w-full space-y-2">
                      {!deviceReady && !isCallActive && (
                        <div className="mb-3">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-[10px] font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                            Mic Not Enabled
                          </div>
                        </div>
                      )}
                      {deviceReady && !isCallActive && !isConnecting && (
                        <div className="mb-3">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            Ready to Call
                          </div>
                        </div>
                      )}
                      {(isCallActive || isConnecting) && (
                        <div className="mb-3">
                          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                            <Phone className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="relative">
                        <Input
                          type="tel"
                          placeholder="Enter number"
                          value={targetNumber}
                          onChange={(e) => setTargetNumber(e.target.value)}
                          className="text-center text-lg font-light h-9 border-0 bg-transparent focus:ring-0 text-gray-900"
                          disabled={
                            isCallActive || isConnecting || !hasOwnedNumber
                          }
                        />
                      </div>
                      {isConnecting && (
                        <div className="text-gray-600 animate-pulse text-xs">
                          Connecting...
                        </div>
                      )}
                      {isCallActive && (
                        <div className="space-y-1">
                          <div className="text-2xl font-light text-gray-900">
                            {Math.floor(callDuration / 60)}:
                            {(callDuration % 60).toString().padStart(2, "0")}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-medium">
                            Connected
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dial Pad */}
                    {!isCallActive && !isConnecting && (
                      <div className="w-full">
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          {dialPadNumbers.flat().map((item, index) => (
                            <button
                              key={index}
                              onClick={() => handleDialPadPress(item.number)}
                              disabled={!hasOwnedNumber}
                              className="w-full h-14 sm:h-16 md:h-20 rounded-full bg-white hover:bg-gray-100 active:bg-gray-200 border border-gray-200 shadow-sm transition-all duration-150 hover:scale-105 active:scale-95 flex flex-col items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="text-2xl font-light text-gray-900">
                                {item.number}
                              </span>
                              {item.letters && (
                                <span className="text-[8px] text-gray-500 tracking-wider">
                                  {item.letters}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-center">
                          <button
                            onClick={handleBackspace}
                            disabled={!targetNumber || !hasOwnedNumber}
                            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Delete className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Call Control Buttons */}
                    <div className="w-full flex items-center justify-center gap-3 mt-3">
                      {!isCallActive && !isConnecting && !deviceReady && (
                        <Button
                          onClick={initializeTwilioDevice}
                          disabled={!hasOwnedNumber}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-4 py-3 rounded-full shadow-lg hover:scale-105 transition-all duration-200 text-xs"
                        >
                          <Mic className="h-3 w-3 mr-1" />
                          Enable Mic
                        </Button>
                      )}
                      {!isCallActive && !isConnecting && deviceReady && (
                        <button
                          onClick={makeCall}
                          disabled={!targetNumber || !hasOwnedNumber}
                          className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <Phone className="h-5 w-5" />
                        </button>
                      )}
                      {isConnecting && (
                        <div className="w-12 h-12 rounded-full bg-emerald-500 text-white shadow-xl flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        </div>
                      )}
                      {isCallActive && (
                        <>
                          <button
                            onClick={toggleMute}
                            className={`w-11 h-11 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center ${
                              isMuted
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            }`}
                          >
                            {isMuted ? (
                              <MicOff className="h-5 w-5" />
                            ) : (
                              <Mic className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={endCall}
                            className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center"
                          >
                            <PhoneOff className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Home Indicator */}
                  <div className="bg-white pb-1.5 pt-1 flex justify-center">
                    <div className="w-24 h-1 bg-gray-900 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contacts & Settings - Right Side (9 columns) */}
          <div className="col-span-9 flex flex-col gap-3 h-full">
            {/* Contacts Card */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm flex-1 flex flex-col overflow-hidden">
              <CardHeader className="border-b border-gray-100 pb-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    Contacts
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    {contacts.length}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
                <div className="grid grid-cols-2 gap-4 h-full">
                  {/* Left: Add Contact */}
                  <div className="space-y-3">
                    <form
                      onSubmit={addContactAndDial}
                      className="space-y-3 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100"
                    >
                      <div className="text-sm font-semibold text-gray-700 mb-2">
                        Add New Contact
                      </div>
                      <Input
                        placeholder="Name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="h-9 border-gray-300"
                      />
                      <Input
                        placeholder="Phone (+1...)"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="h-9 border-gray-300"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="cursor-pointer text-xs h-9"
                        />
                        {uploadingImage && (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent" />
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-9 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Save & Call
                      </Button>
                    </form>

                    {/* Settings Card */}
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                      <CardHeader className="border-b border-gray-100 pb-3">
                        <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-indigo-600" />
                          Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        {!hasOwnedNumber ? (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                            No owned numbers found
                          </div>
                        ) : (
                          <>
                            <Label className="text-xs font-semibold text-gray-700">
                              Outgoing Number
                            </Label>
                            <select
                              className="w-full h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
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
                              variant="outline"
                              size="sm"
                              className="w-full border-gray-300"
                            >
                              Configure Webhook
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right: Contacts List */}
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="relative mb-3 flex-shrink-0">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-9 border-gray-300"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                      {filteredContacts.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <User className="h-12 w-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No contacts found</p>
                        </div>
                      )}
                      {filteredContacts.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => setTargetNumber(c.phone_number)}
                          className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-indigo-100">
                              <AvatarImage
                                src={
                                  c.image_url ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.name)}`
                                }
                              />
                              <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-sm">
                                {c.name?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-gray-800">
                                {c.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {c.phone_number}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTargetNumber(c.phone_number);
                            }}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
