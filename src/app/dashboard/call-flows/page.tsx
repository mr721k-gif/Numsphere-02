"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/ui/loading-spinner";
import {
  Phone,
  Settings,
  Save,
  Trash2,
  Plus,
  Edit,
  Zap,
  Wand2,
  Volume2,
  Maximize2,
  X,
  ChevronLeft,
} from "lucide-react";
import { createClient } from "../../../../supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useCallFlowStore } from "@/stores/callFlowStore";
import BlockPalette from "@/components/BlockPalette";
import FlowCanvas from "@/components/FlowCanvas";
import BlockProperties from "@/components/BlockProperties";

interface TwilioNumber {
  id: string;
  phone_number: string;
  friendly_name: string | null;
  status: string;
  minutes_used: number;
  minutes_allocated: number;
  plan_id: string;
}

export default function CallFlowManager() {
  const [twilioNumbers, setTwilioNumbers] = useState<TwilioNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFlowEditor, setShowFlowEditor] = useState(false);
  const [fullscreenEditor, setFullscreenEditor] = useState(false);
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const {
    flows,
    blocks,
    selectedBlock,
    connectingFrom,
    flowName,
    selectedNumberId,
    isSaving,
    currentFlow,
    loadFlows,
    saveFlow,
    deleteFlow,
    setBlocks,
    addBlock,
    updateBlock,
    deleteBlock,
    connectBlocks,
    disconnectBlocks,
    setSelectedBlock,
    setConnectingFrom,
    setFlowName,
    setSelectedNumberId,
    setCurrentFlow,
    resetEditor,
  } = useCallFlowStore();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadFlows(user.id);
    }
  }, [user, loadFlows]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const { data: numbersData, error: numbersError } = await supabase
        .from("phone_numbers")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (numbersError) {
        console.error("Error fetching numbers:", numbersError);
      } else {
        setTwilioNumbers(numbersData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreateFlow = () => {
    resetEditor();
    setShowFlowEditor(true);
  };

  const handleEditFlow = (flow: any) => {
    setCurrentFlow(flow);
    setFlowName(flow.name || "");
    const matched = twilioNumbers.find(
      (n) => n.phone_number === flow.phone_number,
    );
    setSelectedNumberId(matched?.id || "");

    if (Array.isArray(flow.flow_json)) {
      setBlocks(flow.flow_json);
    } else if (flow.flow_json?.blocks && Array.isArray(flow.flow_json.blocks)) {
      setBlocks(flow.flow_json.blocks);
    } else {
      const legacyBlocks = convertLegacyToBlocks(flow.flow_json);
      setBlocks(legacyBlocks);
    }

    setShowFlowEditor(true);
  };

  const convertLegacyToBlocks = (config: any) => {
    const blocks = [];
    let yPos = 100;

    if (config.greeting) {
      blocks.push({
        id: "1",
        type: "say",
        config: { text: config.greeting },
        position: { x: 100, y: yPos },
        connections: [],
      });
      yPos += 150;
    }

    if (config.menu) {
      blocks.push({
        id: "2",
        type: "gather",
        config: {
          prompt: config.menu.prompt,
          options: config.menu.options || [],
        },
        position: { x: 100, y: yPos },
        connections: [],
      });
      yPos += 150;
    }

    return blocks;
  };

  const handleAddBlock = (block: any) => {
    let newX = 100;
    let newY = 100;

    if (connectingFrom) {
      const parentBlock = blocks.find((b) => b.id === connectingFrom);
      if (parentBlock) {
        newX = parentBlock.position.x + 200;
        newY = parentBlock.position.y;
        connectBlocks(connectingFrom, block.id);
        setConnectingFrom(null);
      }
    } else {
      const gridSize = 100;
      const maxCols = 6;
      let row = 0;
      let col = 0;

      while (true) {
        newX = 50 + col * 180;
        newY = 50 + row * gridSize;

        const occupied = blocks.some(
          (b) =>
            Math.abs(b.position.x - newX) < 160 &&
            Math.abs(b.position.y - newY) < 80,
        );

        if (!occupied) break;

        col++;
        if (col >= maxCols) {
          col = 0;
          row++;
        }
      }
    }

    const newBlock = {
      ...block,
      position: { x: newX, y: newY },
    };

    addBlock(newBlock);
  };

  const handleSaveFlow = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save flows.",
        variant: "destructive",
      });
      return;
    }

    if (!flowName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a flow name.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedNumberId) {
      toast({
        title: "Validation Error",
        description: "Please select a phone number.",
        variant: "destructive",
      });
      return;
    }

    if (blocks.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one block to your flow.",
        variant: "destructive",
      });
      return;
    }

    const selectedNumber =
      twilioNumbers.find((n) => n.id === selectedNumberId)?.phone_number || "";

    const existingFlowForNumber = flows.find(
      (flow) =>
        flow.phone_number === selectedNumber && flow.id !== currentFlow?.id,
    );
    if (existingFlowForNumber) {
      toast({
        title: "Flow Already Exists",
        description: `A call flow "${existingFlowForNumber.name || "Untitled"}" already exists for this phone number. Each number can only have one active flow. Please delete the existing flow first or edit it instead.`,
        variant: "destructive",
      });
      return;
    }

    const success = await saveFlow(user.id, selectedNumber, true);
    if (success) {
      toast({
        title: "Success! 🎉",
        description: `Call flow "${flowName}" ${currentFlow ? "updated" : "created"} successfully! Your Twilio number is now configured.`,
      });
      setShowFlowEditor(false);
      setFullscreenEditor(false);
      resetEditor();
    } else {
      toast({
        title: "Error",
        description:
          "Failed to save call flow. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFlow = async (flowId: string) => {
    if (!user) return;

    const success = await deleteFlow(flowId, user.id);
    if (success) {
      toast({
        title: "Success",
        description: "Call flow deleted successfully!",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete call flow.",
        variant: "destructive",
      });
    }
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      const number = cleaned.slice(1);
      return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    }
    return phoneNumber;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin">
            <Zap className="h-12 w-12 text-indigo-600" />
          </div>
          <p className="text-gray-600 font-medium">Loading your flows...</p>
        </div>
      </div>
    );
  }

  if (twilioNumbers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl p-12 border border-indigo-100 shadow-lg">
              <div className="text-center">
                <div className="inline-block p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-6 animate-bounce shadow-lg">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  No Phone Numbers Yet
                </h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                  Purchase a phone number first to create your first call flow
                </p>
                <Button
                  onClick={() => router.push("/dashboard?view=purchase")}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-indigo-600/30"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Get Phone Number
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fullscreen Editor Mode
  if (fullscreenEditor) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Fullscreen Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFullscreenEditor(false)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-all duration-200"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentFlow ? "Edit" : "Create"} Call Flow
              </h1>
              <p className="text-sm text-gray-600">
                {flowName || "Untitled Flow"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-700">
                {formatPhoneNumber(
                  twilioNumbers.find((n) => n.id === selectedNumberId)
                    ?.phone_number || "Select Number",
                )}
              </div>
              <div className="text-xs text-gray-500">
                {blocks.length} blocks
              </div>
            </div>
            <Button
              onClick={handleSaveFlow}
              disabled={isSaving}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-600/30 transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed min-w-[120px]"
            >
              {isSaving ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </span>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {currentFlow ? "Update" : "Save"}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Fullscreen Canvas */}
        <div className="flex-1 flex gap-6 p-6 overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-72 space-y-4 overflow-y-auto">
            <Card className="border border-gray-200 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-gray-900">
                  Flow Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="flowName"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Flow Name
                  </Label>
                  <Input
                    id="flowName"
                    placeholder="e.g., Business Hours Flow"
                    value={flowName}
                    onChange={(e) => setFlowName(e.target.value)}
                    className="h-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="numberSelect"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Phone Number
                  </Label>
                  <Select
                    value={selectedNumberId}
                    onValueChange={setSelectedNumberId}
                  >
                    <SelectTrigger className="h-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                      <SelectValue placeholder="Select a phone number" />
                    </SelectTrigger>
                    <SelectContent>
                      {twilioNumbers.map((number) => {
                        const hasExistingFlow = flows.some(
                          (flow) =>
                            flow.phone_number === number.phone_number &&
                            flow.id !== currentFlow?.id,
                        );
                        return (
                          <SelectItem
                            key={number.id}
                            value={number.id}
                            disabled={hasExistingFlow}
                          >
                            <div className="flex items-center justify-between w-full gap-2">
                              <span>
                                {formatPhoneNumber(number.phone_number)}
                              </span>
                              {hasExistingFlow && (
                                <Badge className="ml-2 text-xs bg-amber-100 text-amber-800">
                                  Has Flow
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {selectedNumberId &&
                    flows.some(
                      (flow) =>
                        flow.phone_number ===
                          (twilioNumbers.find((n) => n.id === selectedNumberId)
                            ?.phone_number || "") &&
                        flow.id !== currentFlow?.id,
                    ) && (
                      <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                        ⚠️ This number already has a flow
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>

            <BlockPalette
              onAddBlock={handleAddBlock}
              connectingFrom={connectingFrom}
            />
          </div>

          {/* Main Canvas */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
            {(() => {
              const blocksWithConnections = blocks.map((b) => ({
                ...b,
                connections: b.next || [],
              }));
              const selectedBlockWithConnections = selectedBlock
                ? { ...selectedBlock, connections: selectedBlock.next || [] }
                : null;
              return (
                <FlowCanvas
                  blocks={blocksWithConnections as any}
                  selectedBlock={selectedBlockWithConnections as any}
                  connectingFrom={connectingFrom}
                  onBlockSelect={setSelectedBlock as any}
                  onBlockUpdate={updateBlock as any}
                  onBlockDelete={deleteBlock}
                  onConnect={connectBlocks}
                  onSetConnecting={setConnectingFrom}
                />
              );
            })()}
          </div>

          {/* Right Sidebar */}
          <div className="w-72 overflow-y-auto">
            {(() => {
              const blocksWithConnections = blocks.map((b) => ({
                ...b,
                connections: b.next || [],
              }));
              const selectedBlockWithConnections = selectedBlock
                ? { ...selectedBlock, connections: selectedBlock.next || [] }
                : null;
              return (
                <BlockProperties
                  block={selectedBlockWithConnections as any}
                  allBlocks={blocksWithConnections as any}
                  onUpdateBlock={updateBlock as any}
                  onConnect={connectBlocks}
                  onDisconnect={disconnectBlocks}
                  onStartConnecting={setConnectingFrom as any}
                />
              );
            })()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg">
                    <Wand2 className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900">
                    Call Flow Manager
                  </h1>
                </div>
                <p className="text-gray-600 text-lg">
                  Design intelligent call experiences for your business
                </p>
              </div>
              <Button
                onClick={handleCreateFlow}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                <Zap className="h-5 w-5" />
                Create New Flow
              </Button>
            </div>
          </div>

          {/* Flows Grid */}
          {flows.length === 0 ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-white rounded-3xl p-16 border border-indigo-100 shadow-lg text-center">
                <div className="inline-block p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-6 animate-pulse shadow-lg">
                  <Zap className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No Call Flows Yet
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                  Create your first interactive call flow with our visual
                  editor. Drag and drop blocks to build amazing call
                  experiences.
                </p>
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-200">
                    🎯 Drag & Drop
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-700 border border-purple-200">
                    🔧 Block Preview
                  </Badge>
                  <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">
                    1 Flow Per Number
                  </Badge>
                </div>
                <Button
                  onClick={handleCreateFlow}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-indigo-600/30"
                >
                  Get Started
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 animate-in fade-in duration-700">
              {flows.map((flow, index) => (
                <div
                  key={flow.id}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                  className="animate-in fade-in slide-in-from-left-4 duration-500 group"
                >
                  <div className="relative p-6 bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-md">
                          <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {flow.name || "Untitled Flow"}
                          </h3>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-200">
                              📞 {formatPhoneNumber(flow.phone_number || "")}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {Array.isArray(flow.flow_json) ? (
                                <span>📦 {flow.flow_json.length} blocks</span>
                              ) : flow.flow_json?.blocks ? (
                                <span>
                                  📦 {flow.flow_json.blocks.length} blocks
                                </span>
                              ) : (
                                <span>Legacy configuration</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditFlow(flow)}
                          className="border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all duration-300"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteFlow(flow.id)}
                          className="border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Flow Editor Dialog */}
      <Dialog
        open={showFlowEditor && !fullscreenEditor}
        onOpenChange={(open) => {
          if (!open) {
            setShowFlowEditor(false);
            resetEditor();
          }
        }}
      >
        <DialogContent className="max-w-[95vw] h-[95vh] overflow-hidden bg-white border border-gray-200">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                  <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg">
                    <Wand2 className="h-5 w-5 text-white" />
                  </div>
                  {currentFlow ? "Edit Call Flow" : "Create Call Flow"}
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-1">
                  Design your interactive call flow with drag-and-drop blocks
                </DialogDescription>
              </div>
              <button
                onClick={() => setFullscreenEditor(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="Fullscreen"
              >
                <Maximize2 className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </DialogHeader>

          <div className="flex h-full gap-3 overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-64 space-y-3 overflow-y-auto flex-shrink-0 pr-2">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-gray-900">
                    Flow Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="flowName"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Flow Name
                    </Label>
                    <Input
                      id="flowName"
                      placeholder="e.g., Business Hours Flow"
                      value={flowName}
                      onChange={(e) => setFlowName(e.target.value)}
                      className="h-9 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="numberSelect"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Phone Number
                    </Label>
                    <Select
                      value={selectedNumberId}
                      onValueChange={setSelectedNumberId}
                    >
                      <SelectTrigger className="h-9 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                        <SelectValue placeholder="Select a phone number" />
                      </SelectTrigger>
                      <SelectContent>
                        {twilioNumbers.map((number) => {
                          const hasExistingFlow = flows.some(
                            (flow) =>
                              flow.phone_number === number.phone_number &&
                              flow.id !== currentFlow?.id,
                          );
                          return (
                            <SelectItem
                              key={number.id}
                              value={number.id}
                              disabled={hasExistingFlow}
                            >
                              <div className="flex items-center justify-between w-full gap-2">
                                <span>
                                  {formatPhoneNumber(number.phone_number)}
                                </span>
                                {hasExistingFlow && (
                                  <Badge className="ml-2 text-xs bg-amber-100 text-amber-800">
                                    Has Flow
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    {selectedNumberId &&
                      flows.some(
                        (flow) =>
                          flow.phone_number ===
                            (twilioNumbers.find(
                              (n) => n.id === selectedNumberId,
                            )?.phone_number || "") &&
                          flow.id !== currentFlow?.id,
                      ) && (
                        <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                          ⚠️ This number already has a flow
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>

              <div className="sticky top-0">
                <BlockPalette
                  onAddBlock={handleAddBlock}
                  connectingFrom={connectingFrom}
                />
              </div>
            </div>

            {/* Main Canvas */}
            <div className="flex-1 min-w-0 rounded-xl overflow-hidden border border-gray-200 shadow-md bg-white">
              {(() => {
                const blocksWithConnections = blocks.map((b) => ({
                  ...b,
                  connections: b.next || [],
                }));
                const selectedBlockWithConnections = selectedBlock
                  ? { ...selectedBlock, connections: selectedBlock.next || [] }
                  : null;
                return (
                  <FlowCanvas
                    blocks={blocksWithConnections as any}
                    selectedBlock={selectedBlockWithConnections as any}
                    connectingFrom={connectingFrom}
                    onBlockSelect={setSelectedBlock as any}
                    onBlockUpdate={updateBlock as any}
                    onBlockDelete={deleteBlock}
                    onConnect={connectBlocks}
                    onSetConnecting={setConnectingFrom}
                  />
                );
              })()}
            </div>

            {/* Right Sidebar */}
            <div className="w-64 overflow-y-auto flex-shrink-0 pl-2">
              {(() => {
                const blocksWithConnections = blocks.map((b) => ({
                  ...b,
                  connections: b.next || [],
                }));
                const selectedBlockWithConnections = selectedBlock
                  ? { ...selectedBlock, connections: selectedBlock.next || [] }
                  : null;
                return (
                  <BlockProperties
                    block={selectedBlockWithConnections as any}
                    allBlocks={blocksWithConnections as any}
                    onUpdateBlock={updateBlock as any}
                    onConnect={connectBlocks}
                    onDisconnect={disconnectBlocks}
                    onStartConnecting={setConnectingFrom as any}
                  />
                );
              })()}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="flex justify-between items-center gap-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-200">
                {formatPhoneNumber(
                  twilioNumbers.find((n) => n.id === selectedNumberId)
                    ?.phone_number || "Select Number",
                )}
              </Badge>
              <Badge className="bg-purple-100 text-purple-700 border border-purple-200">
                {blocks.length} blocks
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFlowEditor(false)}
                disabled={isSaving}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveFlow}
                disabled={isSaving}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-600/30 transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed min-w-[120px]"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-4 w-4 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {currentFlow ? "Update" : "Save"}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
