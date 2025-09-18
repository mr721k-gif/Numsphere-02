"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../../../../supabase/client";
import { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import DashboardNavbar from "@/components/dashboard-navbar";
import Link from "next/link";

interface TwilioPhoneNumber {
  sid: string;
  phoneNumber: string;
  friendlyName: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  status: string;
  dateCreated: string;
  origin: string;
  owned: boolean;
}

declare global {
  interface Window {
    Twilio: any;
  }
}

const formatPhoneNumber = (phoneNumber: string) => {
  // Remove +1 prefix if present and format as XXX-XXX-XXXX
  const cleaned = phoneNumber.replace(/^\+1/, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phoneNumber;
};

export default function CallingPage() {
  const [twilioNumbers, setTwilioNumbers] = useState<TwilioNumber[]>([]);
  const [selectedNumber, setSelectedNumber] = useState("");
  const [targetNumber, setTargetNumber] = useState("");
  const [device, setDevice] = useState<any>(null);
  const [connection, setConnection] = useState<any>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchTwilioNumbers();
    initializeTwilioDevice();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const fetchTwilioNumbers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-get-twilio-numbers",
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        },
      );

      if (error) throw error;
      const ownedNumbers =
        data.numbers?.filter(
          (n: TwilioNumber) => n.owned && n.capabilities.voice,
        ) || [];
      setTwilioNumbers(ownedNumbers);

      if (ownedNumbers.length > 0 && !selectedNumber) {
        setSelectedNumber(ownedNumbers[0].phoneNumber);
      }
    } catch (error) {
      console.error("Error fetching Twilio numbers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch phone numbers.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeTwilioDevice = async () => {
    try {
      const res = await fetch("/api/twilio/voice-token", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to get token");

      const token = data?.token as string | undefined;
      if (!token) throw new Error("Twilio token is missing or invalid");

      const { Device } = await import("@twilio/voice-sdk");
      const newDevice = new Device(token, {
        logLevel: 1,
        answerOnBridge: true,
      });

      newDevice.on("ready", () => {
        console.log("Twilio Device Ready");
        setDevice(newDevice);
      });

      newDevice.on("error", (error: any) => {
        console.error("Twilio Device Error:", error);
        toast({
          title: "Device Error",
          description: error.message,
          variant: "destructive",
        });
      });

      newDevice.on("incoming", (conn: any) => {
        console.log("Incoming call");
        // Handle incoming calls if needed
      });

      await newDevice.register();
    } catch (error) {
      console.error("Error initializing Twilio device:", error);
      toast({
        title: "Error",
        description: "Failed to initialize calling device.",
        variant: "destructive",
      });
    }
  };

  const makeCall = async () => {
    if (!device) {
      toast({
        title: "Error",
        description: "Voice device not ready. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedNumber) {
      toast({
        title: "Error",
        description: "Please select a phone number to call from.",
        variant: "destructive",
      });
      return;
    }

    if (!targetNumber || targetNumber.replace(/\D/g, "").length < 10) {
      toast({
        title: "Error",
        description: "Please enter a valid target phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    setCallDuration(0);

    try {
      // Convert formatted number back to E.164 format for Twilio
      const cleanTargetNumber = targetNumber.replace(/\D/g, ""); // Remove all non-digits
      const e164TargetNumber =
        cleanTargetNumber.length === 10
          ? `+1${cleanTargetNumber}`
          : `+${cleanTargetNumber}`;

      const params = {
        To: e164TargetNumber,
        From: selectedNumber,
      };

      const conn = device.connect(params);
      setConnection(conn);

      conn.on("accept", () => {
        console.log("Call accepted");
        setIsCallActive(true);
        setIsConnecting(false);
        toast({
          title: "Connected",
          description: `Call connected to ${formatPhoneNumber(targetNumber)}`,
        });
      });

      conn.on("disconnect", () => {
        console.log("Call disconnected");
        setIsCallActive(false);
        setIsConnecting(false);
        setConnection(null);
        setCallDuration(0);
        setIsMuted(false);
        toast({
          title: "Call Ended",
          description: "Call has been disconnected.",
        });
      });

      conn.on("error", (error: any) => {
        console.error("Call error:", error);
        setIsCallActive(false);
        setIsConnecting(false);
        setConnection(null);
        toast({
          title: "Call Failed",
          description: error.message || "Failed to connect call.",
          variant: "destructive",
        });
      });

      toast({
        title: "Connecting",
        description: `Calling ${formatPhoneNumber(targetNumber)}...`,
      });
    } catch (error) {
      console.error("Error making call:", error);
      setIsConnecting(false);
      toast({
        title: "Call Failed",
        description: "Failed to initiate call. Please try again.",
        variant: "destructive",
      });
    }
  };

  const endCall = () => {
    if (connection) {
      connection.disconnect();
    }
    setIsCallActive(false);
    setIsConnecting(false);
    setConnection(null);
    setCallDuration(0);
    setIsMuted(false);
  };

  const toggleMute = () => {
    if (connection) {
      connection.mute(!isMuted);
      setIsMuted(!isMuted);
      toast({
        title: isMuted ? "Unmuted" : "Muted",
        description: isMuted ? "Microphone is now on" : "Microphone is now off",
      });
    }
  };

  const sendDTMF = (digit: string) => {
    if (connection && isCallActive) {
      connection.sendDigits(digit);
      toast({
        title: "DTMF Sent",
        description: `Sent digit: ${digit}`,
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTargetNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits
    if (value.length >= 6) {
      value = `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6, 10)}`;
    } else if (value.length >= 3) {
      value = `${value.slice(0, 3)}-${value.slice(3)}`;
    }
    setTargetNumber(value);
  };

  const addDigitToTarget = (digit: string) => {
    if (!isCallActive) {
      const currentDigits = targetNumber.replace(/\D/g, "");
      if (currentDigits.length < 10) {
        const newDigits = currentDigits + digit;
        let formatted = newDigits;
        if (newDigits.length >= 6) {
          formatted = `${newDigits.slice(0, 3)}-${newDigits.slice(3, 6)}-${newDigits.slice(6, 10)}`;
        } else if (newDigits.length >= 3) {
          formatted = `${newDigits.slice(0, 3)}-${newDigits.slice(3)}`;
        }
        setTargetNumber(formatted);
      }
    } else {
      sendDTMF(digit);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />

      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Make a Call</h1>
          <p className="text-gray-600">
            Use your phone numbers to make calls directly from your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Call Setup */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Call Setup</CardTitle>
              <CardDescription className="text-gray-500">
                Configure your call settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-gray-700">From (Your Number)</Label>
                <Select
                  value={selectedNumber}
                  onValueChange={setSelectedNumber}
                >
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Select your phone number" />
                  </SelectTrigger>
                  <SelectContent>
                    {twilioNumbers.map((number) => (
                      <SelectItem key={number.sid} value={number.phoneNumber}>
                        {formatPhoneNumber(number.phoneNumber)} -{" "}
                        {number.friendlyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-700">To (Target Number)</Label>
                <Input
                  placeholder="313-333-3333"
                  value={targetNumber}
                  onChange={handleTargetNumberChange}
                  className="border-gray-200"
                  disabled={isCallActive || isConnecting}
                  maxLength={12}
                />
              </div>

              {twilioNumbers.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    You need to purchase a phone number with voice capabilities
                    first.
                  </p>
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm" className="mt-2">
                      Buy Phone Number
                    </Button>
                  </Link>
                </div>
              )}

              {/* Device Status */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${device ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <span className="text-sm text-gray-600">
                    {device ? "Voice device ready" : "Voice device not ready"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call Controls */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Call Controls</CardTitle>
              <CardDescription className="text-gray-500">
                {isCallActive
                  ? `Connected - ${formatDuration(callDuration)}`
                  : isConnecting
                    ? "Connecting..."
                    : "Ready to call"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-6">
                {/* Call Status */}
                <div className="text-center">
                  {isCallActive && (
                    <div className="space-y-2">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <PhoneCall className="w-10 h-10 text-green-600" />
                      </div>
                      <p className="text-lg font-medium text-gray-900">
                        {formatPhoneNumber(targetNumber)}
                      </p>
                      <Badge className="bg-green-50 text-green-700 border-green-200">
                        Connected
                      </Badge>
                    </div>
                  )}

                  {isConnecting && (
                    <div className="space-y-2">
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                        <Phone className="w-10 h-10 text-blue-600" />
                      </div>
                      <p className="text-lg font-medium text-gray-900">
                        Calling {formatPhoneNumber(targetNumber)}...
                      </p>
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                        Connecting
                      </Badge>
                    </div>
                  )}

                  {!isCallActive && !isConnecting && (
                    <div className="space-y-2">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <Phone className="w-10 h-10 text-gray-600" />
                      </div>
                      <p className="text-lg font-medium text-gray-900">
                        Ready to call
                      </p>
                    </div>
                  )}
                </div>

                {/* Call Buttons */}
                <div className="flex space-x-4">
                  {!isCallActive && !isConnecting && (
                    <Button
                      onClick={makeCall}
                      disabled={
                        !selectedNumber ||
                        !targetNumber ||
                        twilioNumbers.length === 0 ||
                        !device
                      }
                      className="bg-green-600 hover:bg-green-700 px-8"
                      size="lg"
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Call
                    </Button>
                  )}

                  {(isCallActive || isConnecting) && (
                    <>
                      <Button
                        onClick={endCall}
                        variant="destructive"
                        size="lg"
                        className="px-8"
                      >
                        <PhoneOff className="w-5 h-5 mr-2" />
                        End Call
                      </Button>

                      {isCallActive && (
                        <Button
                          onClick={toggleMute}
                          variant="outline"
                          size="lg"
                          className={isMuted ? "bg-red-50 border-red-200" : ""}
                        >
                          {isMuted ? (
                            <MicOff className="w-5 h-5" />
                          ) : (
                            <Mic className="w-5 h-5" />
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dial Pad */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Dial Pad</CardTitle>
              <CardDescription className="text-gray-500">
                {isCallActive ? "Send DTMF tones" : "Enter phone number"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {/* Row 1 */}
                <Button
                  variant="outline"
                  className="h-12 text-lg font-semibold"
                  onClick={() => addDigitToTarget("1")}
                >
                  1
                </Button>
                <Button
                  variant="outline"
                  className="h-12 text-lg font-semibold"
                  onClick={() => addDigitToTarget("2")}
                >
                  2<br />
                  <span className="text-xs">ABC</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-12 text-lg font-semibold"
                  onClick={() => addDigitToTarget("3")}
                >
                  3<br />
                  <span className="text-xs">DEF</span>
                </Button>

                {/* Row 2 */}
                <Button
                  variant="outline"
                  className="h-12 text-lg font-semibold"
                  onClick={() => addDigitToTarget("4")}
                >
                  4<br />
                  <span className="text-xs">GHI</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-12 text-lg font-semibold"
                  onClick={() => addDigitToTarget("5")}
                >
                  5<br />
                  <span className="text-xs">JKL</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-12 text-lg font-semibold"
                  onClick={() => addDigitToTarget("6")}
                >
                  6<br />
                  <span className="text-xs">MNO</span>
                </Button>

                {/* Row 3 */}
                <Button
                  variant="outline"
                  className="h-12 text-lg font-semibold"
                  onClick={() => addDigitToTarget("7")}
                >
                  7<br />
                  <span className="text-xs">PQRS</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-12 text-lg font-semibold"
                  onClick={() => addDigitToTarget("8")}
                >
                  8<br />
                  <span className="text-xs">TUV</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-12 text-lg font-semibold"
                  onClick={() => addDigitToTarget("9")}
                >
                  9<br />
                  <span className="text-xs">WXYZ</span>
                </Button>

                {/* Row 4 */}
                <Button
                  variant="outline"
                  className="h-12 text-lg font-semibold"
                  onClick={() => addDigitToTarget("*")}
                >
                  *
                </Button>
                <Button
                  variant="outline"
                  className="h-12 text-lg font-semibold"
                  onClick={() => addDigitToTarget("0")}
                >
                  0
                </Button>
                <Button
                  variant="outline"
                  className="h-12 text-lg font-semibold"
                  onClick={() => addDigitToTarget("#")}
                >
                  #
                </Button>
              </div>

              {/* Clear button for target number */}
              {!isCallActive && !isConnecting && targetNumber && (
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={() => setTargetNumber("")}
                >
                  Clear
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
