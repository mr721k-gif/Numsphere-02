"use client";

import React, { useState, useEffect } from "react";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  Calendar,
  Filter,
  ArrowLeft,
  Download,
  TrendingUp,
  Activity,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Recording {
  recording_id: string;
  duration: number;
  url: string;
  created_at: string | null;
  is_voicemail?: boolean;
}

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
  recordings?: Recording[];
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

  const filteredLogs = callLogs.filter((log) => {
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

    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      const withoutCountry = cleaned.slice(1);
      return `+1 (${withoutCountry.slice(0, 3)}) ${withoutCountry.slice(
        3,
        6,
      )}-${withoutCountry.slice(6)}`;
    } else if (cleaned.length === 10) {
      return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(
        3,
        6,
      )}-${cleaned.slice(6)}`;
    }

    return number.startsWith("+") ? number : `+${number}`;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "failed":
      case "busy":
      case "no-answer":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Calculate stats
  const totalCalls = filteredLogs.length;
  const completedCalls = filteredLogs.filter(
    (log) => log.status.toLowerCase() === "completed",
  ).length;
  const inboundCalls = filteredLogs.filter(
    (log) => log.direction === "inbound",
  ).length;
  const outboundCalls = filteredLogs.filter(
    (log) => log.direction === "outbound",
  ).length;
  const totalDuration = filteredLogs.reduce(
    (acc, log) => acc + log.duration,
    0,
  );
  const avgDuration =
    totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-600 font-semibold">Loading call logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-4">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute top-0 left-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <circle
            cx="10%"
            cy="20%"
            r="150"
            fill="url(#gradient1)"
            className="animate-pulse"
            style={{ animationDuration: "4s" }}
          />
          <circle
            cx="90%"
            cy="80%"
            r="200"
            fill="url(#gradient1)"
            className="animate-pulse"
            style={{ animationDuration: "6s", animationDelay: "1s" }}
          />
          <circle
            cx="50%"
            cy="50%"
            r="100"
            fill="url(#gradient1)"
            className="animate-pulse"
            style={{ animationDuration: "5s", animationDelay: "2s" }}
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
            <Link href="/dashboard/calling">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:scale-105">
                <Phone className="w-4 h-4 mr-2" />
                Make a Call
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-600/30 animate-in zoom-in duration-500">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Call Logs</h1>
              <p className="text-gray-600 text-lg mt-1">
                Track and analyze your call activity
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div
            className="animate-in fade-in slide-in-from-left-4 duration-500"
            style={{ animationDelay: "0ms" }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Calls
                </CardTitle>
                <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Phone className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  {totalCalls}
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  All time calls
                </p>
              </CardContent>
            </Card>
          </div>

          <div
            className="animate-in fade-in slide-in-from-left-4 duration-500"
            style={{ animationDelay: "50ms" }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Completed
                </CardTitle>
                <div className="p-2 bg-gradient-to-br from-green-600 to-green-700 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <PhoneIncoming className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                  {completedCalls}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {totalCalls > 0
                    ? Math.round((completedCalls / totalCalls) * 100)
                    : 0}
                  % success rate
                </p>
              </CardContent>
            </Card>
          </div>

          <div
            className="animate-in fade-in slide-in-from-left-4 duration-500"
            style={{ animationDelay: "100ms" }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  In/Out Ratio
                </CardTitle>
                <div className="p-2 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Activity className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                  {inboundCalls}/{outboundCalls}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Inbound vs Outbound
                </p>
              </CardContent>
            </Card>
          </div>

          <div
            className="animate-in fade-in slide-in-from-left-4 duration-500"
            style={{ animationDelay: "150ms" }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Avg Duration
                </CardTitle>
                <div className="p-2 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Clock className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                  {formatDuration(avgDuration)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Per call average</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters Section */}
        <Card
          className="mb-6 shadow-xl border-0 bg-white/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: "200ms" }}
        >
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by phone number or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 border-gray-200 focus:border-indigo-500 transition-all duration-300"
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-56 border-2 border-gray-200 focus:border-indigo-500 transition-all duration-300">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter calls" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Calls</SelectItem>
                  <SelectItem value="inbound">Incoming Only</SelectItem>
                  <SelectItem value="outbound">Outgoing Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Call Logs List */}
        <Card
          className="shadow-xl border-0 bg-white/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: "250ms" }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Phone className="w-5 h-5 text-indigo-600" />
              Call History ({filteredLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-block p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-4 animate-pulse">
                  <Phone className="w-20 h-20 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-600 mb-2">
                  No calls found
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || filter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Start making calls to see your history here"}
                </p>
                <Link href="/dashboard/calling">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:scale-105">
                    <Phone className="w-4 h-4 mr-2" />
                    Make Your First Call
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log, index) => (
                  <div
                    key={log.id}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="p-5 bg-white rounded-2xl border-2 border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-left-4 group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`p-3 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 ${
                            log.direction === "inbound"
                              ? "bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/30"
                              : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30"
                          }`}
                        >
                          {log.direction === "inbound" ? (
                            <PhoneIncoming className="w-6 h-6 text-white" />
                          ) : (
                            <PhoneOutgoing className="w-6 h-6 text-white" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-gray-900 text-lg">
                              {formatPhoneNumber(log.from_number)}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="font-bold text-gray-900 text-lg">
                              {formatPhoneNumber(log.to_number)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                            <Badge className="bg-gray-100 text-gray-700 border-2 border-gray-200 capitalize">
                              {log.direction}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(log.started_at)}</span>
                            </div>
                            {log.duration > 0 && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span className="font-semibold">
                                  {formatDuration(log.duration)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Recordings Section */}
                          {log.recordings && log.recordings.length > 0 && (
                            <div className="mt-4 space-y-2">
                              {log.recordings.map((rec) => (
                                <div
                                  key={rec.recording_id}
                                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border-2 border-gray-200"
                                >
                                  <div className="flex flex-col text-sm">
                                    <span className="font-semibold text-gray-700">
                                      {rec.is_voicemail
                                        ? "📩 Voicemail Recording"
                                        : "🎙 Call Recording"}{" "}
                                      ({formatDuration(rec.duration)})
                                    </span>
                                    {rec.created_at && (
                                      <span className="text-xs text-gray-500 mt-1">
                                        {new Date(
                                          rec.created_at,
                                        ).toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <audio
                                      controls
                                      src={rec.url}
                                      className="w-full sm:w-48"
                                    />
                                    <Button
                                      asChild
                                      variant="outline"
                                      size="sm"
                                      className="text-blue-600 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 hover:scale-105 whitespace-nowrap"
                                    >
                                      <a
                                        href={`/api/recording/${rec.recording_id}`}
                                        download
                                      >
                                        <Download className="w-4 h-4 mr-1" />
                                        Download
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <Badge
                        className={`${getStatusColor(log.status)} border-2 font-semibold px-3 py-1 transition-all duration-300 group-hover:scale-105`}
                      >
                        {log.status}
                      </Badge>
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
