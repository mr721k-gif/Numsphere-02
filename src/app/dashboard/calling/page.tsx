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

export default function CallingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [twilioNumbers, setTwilioNumbers] = useState<TwilioPhoneNumber[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string>("");
  const [targetNumber, setTargetNumber] = useState<string>("");
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [device, setDevice] = useState<any>(null);
  const [connection, setConnection] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string>("");
  
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        redirect("/sign-in");
      }
      setUser(user);
      setLoading(false);
    };

    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTwilioNumbers();
      initializeTwilioDevice();
    }
  }, [user]);

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
      const ownedNumbers = data.numbers?.filter((n: TwilioPhoneNumber) => n.owned && n.capabilities.voice) || [];
      setTwilioNumbers(ownedNumbers);
      if (ownedNumbers.length > 0) {
        setSelectedNumber(ownedNumbers[0].phoneNumber);
      }
    } catch (error) {
      console.error("Error fetching Twilio numbers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch phone numbers. Please try again.",
        variant: "destructive",
      });
    }
  };

  const initializeTwilioDevice = async () => {
    try {
      // Load Twilio SDK
      if (!window.Twilio) {
        const script = document.createElement('script');
        script.src = 'https://sdk.twilio.com/js/client/releases/1.14.1/twilio.min.js';
        script.async = true;
        document.head.appendChild(script);
        
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      // Get access token
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-generate-access-token",
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        },
      );

      if (error) throw error;
      
      setAccessToken(data.token);

      // Initialize Twilio Device
      const twilioDevice = new window.Twilio.Device(data.token, {
        logLevel: 1,
        answerOnBridge: true,
      });

      twilioDevice.on('ready', () => {
        console.log('Twilio Device is ready');
        toast({
          title: "Ready",
          description: "Voice calling is now available.",
        });
      });

      twilioDevice.on('error', (error: any) => {
        console.error('Twilio Device error:', error);
        toast({
          title: "Device Error",
          description: error.message || "An error occurred with the calling device.",
          variant: "destructive",
        });
      });

      twilioDevice.on('connect', (conn: any) => {
        console.log('Call connected');
        setConnection(conn);
        setIsCallActive(true);
        setIsConnecting(false);
        startCallTimer();
        
        toast({
          title: "Connected",
          description: "Call connected successfully.",
        });
      });

      twilioDevice.on('disconnect', () => {
        console.log('Call disconnected');
        setIsCallActive(false);
        setIsConnecting(false);
        setConnection(null);
        stopCallTimer();
        
        toast({
          title: "Disconnected",
          description: "Call ended.",
        });
      });

      setDevice(twilioDevice);

    } catch (error) {
      console.error('Error initializing Twilio Device:', error);
      toast({
        title: "Initialization Error",
        description: "Failed to initialize calling device. Please refresh and try again.",
        variant: "destructive",
      });
    }
  };

  const startCallTimer = () => {
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setCallDuration(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const makeCall = async () => {
    if (!device || !selectedNumber || !targetNumber) {
      toast({
        title: "Error",
        description: "Please select a phone number and enter a target number.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      const params = {
        To: targetNumber,
        From: selectedNumber,
      };

      const conn = device.connect(params);
      setConnection(conn);
      
      toast({
        title: "Connecting",
        description: `Calling ${targetNumber}...`,
      });
      
    } catch (error) {
      console.error('Error making call:', error);
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
    stopCallTimer();
  };

  const toggleMute = () => {
    if (connection) {
      connection.mute(!isMuted);
      setIsMuted(!isMuted);
      toast({
        title: isMuted ? "Unmuted" : "Muted",
        description: isMuted ? "Microphone is now on." : "Microphone is now off.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />

      <div className="max-w-4xl mx-auto p-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                <Select value={selectedNumber} onValueChange={setSelectedNumber}>
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Select your phone number" />
                  </SelectTrigger>
                  <SelectContent>
                    {twilioNumbers.map((number) => (
                      <SelectItem key={number.sid} value={number.phoneNumber}>
                        {number.phoneNumber} - {number.friendlyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-700">To (Target Number)</Label>
                <Input
                  placeholder="+1234567890"
                  value={targetNumber}
                  onChange={(e) => setTargetNumber(e.target.value)}
                  className="border-gray-200"
                  disabled={isCallActive || isConnecting}
                />
              </div>

              {twilioNumbers.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    You need to purchase a phone number with voice capabilities first.
                  </p>
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm" className="mt-2">
                      Buy Phone Number
                    </Button>
                  </Link>
                </div>
              )}
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
                    : "Ready to call"
                }
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
                        {targetNumber}
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
                        Calling {targetNumber}...
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
                      disabled={!selectedNumber || !targetNumber || twilioNumbers.length === 0}
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
        </div>

        {/* Device Status */}
        <Card className="bg-white border-0 shadow-sm mt-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Device Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${device ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {device ? 'Voice device ready' : 'Voice device not ready'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}