"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  Handle,
  Position,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import Link from "next/link";

// Flow node types
type FlowNode =
  | { type: "say"; id: string; message: string; next?: string }
  | {
      type: "menu";
      id: string;
      prompt: string;
      options: Record<string, string>;
      max_attempts?: number;
      on_fail?: string;
    }
  | { type: "forward"; id: string; to: string }
  | { type: "voicemail"; id: string }
  | { type: "hangup"; id: string };

type FlowJSON = {
  start: string;
  nodes: Record<string, FlowNode>;
};

const DEFAULT_DISCLAIMER = "This call is being recorded for training purposes.";

const DEFAULT_NODE_POSITION = { x: 100, y: 100 } as const;

function GenericNode({ data }: any) {
  return (
    <div className="rounded-lg border bg-white shadow-sm px-3 py-2 min-w-[140px]">
      <div className="text-xs font-semibold text-gray-700 mb-1">
        {data.label}
      </div>
      <div className="text-[11px] text-gray-500 truncate max-w-[200px]">
        {data.subtitle}
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function MenuNode({ data }: any) {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
  return (
    <div className="rounded-lg border bg-white shadow-sm px-3 py-2 min-w-[180px]">
      <div className="text-xs font-semibold text-gray-700 mb-1">Menu</div>
      <div className="text-[11px] text-gray-500 truncate">
        {data.prompt || "Press a key..."}
      </div>
      <Handle type="target" position={Position.Top} />
      <div className="flex flex-wrap gap-1 mt-2">
        {digits.map((d) => (
          <div key={d} className="relative">
            <span className="text-[10px] text-gray-600">{d}</span>
            <Handle
              id={d}
              type="source"
              position={Position.Bottom}
              style={{ left: 8 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const nodeTypes = { generic: GenericNode, menuNode: MenuNode } as const;

export default function CallFlowsPage() {
  // Numbers
  const [numbers, setNumbers] = useState<
    Array<{ sid: string; phoneNumber: string }>
  >([]);
  const [selectedNumber, setSelectedNumber] = useState<string>("");
  const [hasOwnedNumber, setHasOwnedNumber] = useState<boolean>(true);

  // Flow state
  const [flow, setFlow] = useState<FlowJSON>({
    start: "start",
    nodes: {
      start: {
        id: "start",
        type: "menu",
        prompt: "Press 1 for sales, 2 for support",
        options: { "1": "sales", "2": "support" },
        max_attempts: 3,
      },
      sales: { id: "sales", type: "forward", to: "+15551230001" },
      support: { id: "support", type: "voicemail" },
    },
  });
  const [recordingEnabled, setRecordingEnabled] = useState<boolean>(true);
  const [disclaimer, setDisclaimer] = useState<string>(DEFAULT_DISCLAIMER);
  const [saving, setSaving] = useState(false);
  const [loadingFlow, setLoadingFlow] = useState(false);
  const [manualNumber, setManualNumber] = useState("");

  const activeNumber = selectedNumber || manualNumber;

  // React Flow state derived from flow JSON
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    // Load Twilio numbers (if API exists)
    fetch("/api/twilio/numbers", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((res) => {
        const owned = Array.isArray(res.numbers)
          ? res.numbers.filter((n: any) => n.owned)
          : [];
        if (owned.length) {
          const nums = owned.map((n: any) => ({
            sid: n.sid,
            phoneNumber: n.phoneNumber,
          }));
          setNumbers(nums);
          setSelectedNumber(nums[0].phoneNumber);
          setHasOwnedNumber(true);
        } else {
          setNumbers([]);
          setSelectedNumber("");
          setHasOwnedNumber(false);
        }
      })
      .catch(() => {
        setHasOwnedNumber(false);
      });
  }, []);

  useEffect(() => {
    if (!activeNumber) return;
    setLoadingFlow(true);
    fetch(`/api/call-flows?phone_number=${encodeURIComponent(activeNumber)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.flow) {
          setFlow(res.flow.flow_json as FlowJSON);
          setRecordingEnabled(!!res.flow.recording_enabled);
          setDisclaimer(res.flow.recording_disclaimer || DEFAULT_DISCLAIMER);
        }
      })
      .finally(() => setLoadingFlow(false));
  }, [activeNumber]);

  useEffect(() => {
    // Initialize nodes/edges from flow
    const n: Node[] = Object.values(flow.nodes).map((node, i) => {
      const base: any = {
        id: node.id,
        position: { x: 120 + (i % 3) * 220, y: 80 + Math.floor(i / 3) * 160 },
        data: {},
        type: "generic",
      };
      if (node.type === "say")
        base.data = { label: "Say", subtitle: (node as any).message };
      if (node.type === "forward")
        base.data = { label: "Forward", subtitle: (node as any).to };
      if (node.type === "voicemail")
        base.data = { label: "Voicemail", subtitle: "Record + Hangup" };
      if (node.type === "hangup")
        base.data = { label: "Hangup", subtitle: "End call" };
      if (node.type === "menu") {
        base.type = "menuNode";
        base.data = { prompt: (node as any).prompt };
      }
      return base as Node;
    });

    const e: Edge[] = [];
    Object.values(flow.nodes).forEach((node) => {
      if ((node as any).next) {
        e.push({
          id: `${node.id}->${(node as any).next}`,
          source: node.id,
          target: (node as any).next,
        });
      }
      if (node.type === "menu") {
        const opts = (node as any).options || {};
        Object.entries(opts).forEach(([digit, dest]) => {
          if (dest)
            e.push({
              id: `${node.id}:${digit}->${dest}`,
              source: node.id,
              sourceHandle: String(digit),
              target: String(dest),
            });
        });
      }
    });

    setNodes(n);
    setEdges(e);
  }, [flow]);

  const onConnect = (params: Connection) => {
    setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    // Reflect connection into flow JSON
    const { source, target, sourceHandle } = params as any;
    if (!source || !target) return;
    const srcNode = flow.nodes[source];
    if (!srcNode) return;
    if (srcNode.type === "menu" && sourceHandle) {
      const current = (srcNode as any).options || {};
      const options = { ...current, [sourceHandle]: target };
      updateNode(source, { options } as any);
    } else if (srcNode.type === "say") {
      updateNode(source, { next: target } as any);
    }
  };

  const addVisualNode = (type: FlowNode["type"]) => {
    addNode(type);
    const id = Object.keys(flow.nodes).slice(-1)[0];
    const newId = id || `${type}-${Math.random().toString(36).slice(2, 7)}`;
    const pos = { x: 100 + Math.random() * 400, y: 120 + Math.random() * 300 };
    const base: any = { id: newId, position: pos, data: {}, type: "generic" };
    if (type === "say") base.data = { label: "Say", subtitle: "New message" };
    if (type === "forward") base.data = { label: "Forward", subtitle: "+1" };
    if (type === "voicemail")
      base.data = { label: "Voicemail", subtitle: "Record + Hangup" };
    if (type === "hangup")
      base.data = { label: "Hangup", subtitle: "End call" };
    if (type === "menu") {
      base.type = "menuNode";
      base.data = { prompt: "Choose an option" };
    }
    setNodes((prev) => [...prev, base]);
  };

  const onNodeClick = (_: any, node: Node) => setSelectedNodeId(node.id);

  // Inspector helpers
  const selectedNode = selectedNodeId ? flow.nodes[selectedNodeId] : null;

  const nodeList = useMemo(() => Object.values(flow.nodes), [flow]);

  const addNode = (type: FlowNode["type"]) => {
    const idBase = `${type}-${Math.random().toString(36).slice(2, 7)}`;
    let node: FlowNode;
    if (type === "say")
      node = { type, id: idBase, message: "New message" } as FlowNode;
    else if (type === "menu")
      node = {
        type,
        id: idBase,
        prompt: "Choose an option",
        options: { "1": flow.start },
        max_attempts: 3,
      } as FlowNode;
    else if (type === "forward")
      node = { type, id: idBase, to: "+1" } as FlowNode;
    else if (type === "voicemail") node = { type, id: idBase } as FlowNode;
    else node = { type: "hangup", id: idBase } as FlowNode;

    setFlow((f) => ({ ...f, nodes: { ...f.nodes, [node.id]: node } }));
  };

  const updateNode = (id: string, patch: Partial<FlowNode>) => {
    setFlow((f) => ({
      ...f,
      nodes: { ...f.nodes, [id]: { ...f.nodes[id], ...patch } as FlowNode },
    }));
  };

  const removeNode = (id: string) => {
    setFlow((f) => {
      const n = { ...f.nodes };
      delete n[id];
      const newStart = f.start === id ? Object.keys(n)[0] || "start" : f.start;
      return { ...f, start: newStart, nodes: n };
    });
  };

  const save = async () => {
    if (!selectedNumber || !hasOwnedNumber) return;
    setSaving(true);
    try {
      const res = await fetch("/api/call-flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: selectedNumber,
          flow_json: flow,
          recording_enabled: recordingEnabled,
          recording_disclaimer: disclaimer || DEFAULT_DISCLAIMER,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch (e) {
      // noop minimal error handling
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <h1 className="text-2xl font-semibold">Inbound Call Flows</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={save} disabled={!selectedNumber || !hasOwnedNumber || saving}>
              {saving ? "Saving..." : "Save Flow"}
            </Button>
          </div>
        </div>

        {!hasOwnedNumber && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <div className="font-medium">You don't own a phone number yet</div>
            <div className="text-sm mt-1">
              Purchase a number to assign and configure a call flow.
            </div>
          </div>
        )}

        <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Assign to number</Label>
              {numbers.length > 0 ? (
                <select
                  className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                  value={selectedNumber}
                  onChange={(e) => setSelectedNumber(e.target.value)}
                >
                  {numbers.map((n) => (
                    <option key={n.sid} value={n.phoneNumber}>
                      {n.phoneNumber}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  No owned numbers found. Buy a number first, then return here to assign a flow.
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Record calls</Label>
              <div className="flex items-center gap-3 h-10">
                <Switch
                  checked={recordingEnabled}
                  onCheckedChange={setRecordingEnabled}
                />
                <span className="text-sm text-muted-foreground">
                  Enable recording
                </span>
              </div>
            </div>

            <div className="space-y-2 md:col-span-1">
              <Label>Recording disclaimer</Label>
              <Input
                value={disclaimer}
                onChange={(e) => setDisclaimer(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Palette */}
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Blocks</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  addVisualNode("say");
                }}
              >
                Say
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  addVisualNode("menu");
                }}
              >
                Menu
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  addVisualNode("forward");
                }}
              >
                Forward
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  addVisualNode("voicemail");
                }}
              >
                Voicemail
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  addVisualNode("hangup");
                }}
              >
                Hangup
              </Button>
            </CardContent>

            {/* Inspector */}
            <div className="px-6 pb-6">
              {selectedNode ? (
                <div className="mt-2 space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    Inspector
                  </div>
                  {selectedNode.type === "say" && (
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Input
                        value={(selectedNode as any).message}
                        onChange={(e) =>
                          updateNode(selectedNode.id, {
                            message: e.target.value,
                          } as any)
                        }
                      />
                    </div>
                  )}
                  {selectedNode.type === "menu" && (
                    <div className="space-y-2">
                      <Label>Prompt</Label>
                      <Input
                        value={(selectedNode as any).prompt}
                        onChange={(e) =>
                          updateNode(selectedNode.id, {
                            prompt: e.target.value,
                          } as any)
                        }
                      />
                    </div>
                  )}
                  {selectedNode.type === "forward" && (
                    <div className="space-y-2">
                      <Label>Forward to</Label>
                      <Input
                        value={(selectedNode as any).to}
                        onChange={(e) =>
                          updateNode(selectedNode.id, {
                            to: e.target.value,
                          } as any)
                        }
                      />
                    </div>
                  )}
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        setFlow((f) => ({ ...f, start: selectedNode.id }))
                      }
                    >
                      Set as Start
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground px-1">
                  Select a node to edit
                </div>
              )}
            </div>
          </Card>

          {/* Right: Builder */}
          <Card className="lg:col-span-2 border-0 shadow-md bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">
                Flow Builder{" "}
                {loadingFlow && (
                  <span className="text-xs text-muted-foreground">
                    (loading...)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[560px] rounded-lg border overflow-hidden">
                <ReactFlow
                  nodeTypes={nodeTypes as any}
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={onNodeClick}
                  fitView
                >
                  <MiniMap />
                  <Controls />
                  <Background gap={16} />
                </ReactFlow>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}