"use client";

import React, { useState, useEffect } from "react";
import { Phone, PhoneIncoming, PhoneOutgoing, Clock, Calendar, Filter, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface CallLog {
  id: string;
  from_number: string;
  to_number: string;
  direction: "inbound" | "outbound";
  status: string;
  duration: number;
  started_at: string;
  ended_at: string;
  created_at: string;
}

export default function CallLogsPage() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCallLogs();
  }, []);

  const fetchCallLogs = async () => {
    try {
      const response = await fetch("/api/call-logs");
      if (response.ok) {
        const data = await response.json();
        setCallLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Failed to fetch call logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = callLogs.filter(log => {
    const matchesFilter = filter === "all" || log.direction === filter;
    const matchesSearch = 
      log.from_number.includes(searchTerm) || 
      log.to_number.includes(searchTerm) ||
      log.status.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const formatPhoneNumber = (number: string) => {
    if (!number) return "Unknown";
    
    const cleaned = number.replace(/\D/g, "");
    
    // Handle US numbers (11 digits starting with 1, or 10 digits)
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      const withoutCountry = cleaned.slice(1);
      return `+1 (${withoutCountry.slice(0, 3)}) ${withoutCountry.slice(3, 6)}-${withoutCountry.slice(6)}`;
    } else if (cleaned.length === 10) {
      return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    // For other international numbers, just add + if not present
    return number.startsWith('+') ? number : `+${number}`;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "failed":
      case "busy":
      case "no-answer":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Call Logs</h1>
              <p className="text-gray-600 mt-1">View your call history and details</p>
            </div>
          </div>
          <Link href="/dashboard/calling">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Phone className="w-4 h-4 mr-2" />
              Back to Dialer
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by phone number or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter calls" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Calls</SelectItem>
                  <SelectItem value="inbound">Incoming</SelectItem>
                  <SelectItem value="outbound">Outgoing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Call Logs */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Call History ({filteredLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No calls found</h3>
                <p className="text-gray-500">
                  {searchTerm || filter !== "all" 
                    ? "Try adjusting your search or filter criteria" 
                    : "Start making calls to see your history here"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        log.direction === "inbound" ? "bg-green-100" : "bg-blue-100"
                      }`}>
                        {log.direction === "inbound" ? (
                          <PhoneIncoming className="w-5 h-5 text-green-600" />
                        ) : (
                          <PhoneOutgoing className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-800">
                          {log.direction === "inbound" 
                            ? `${formatPhoneNumber(log.from_number)} → ${formatPhoneNumber(log.to_number)}`
                            : `${formatPhoneNumber(log.from_number)} → ${formatPhoneNumber(log.to_number)}`
                          }
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <span className="capitalize">{log.direction} call</span>
                          <span>•</span>
                          <Calendar className="w-3 h-3" />
                          {formatDate(log.started_at)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                        {log.duration > 0 && (
                          <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(log.duration)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}