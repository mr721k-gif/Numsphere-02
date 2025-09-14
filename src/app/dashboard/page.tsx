"use client";

import { useState, useEffect } from 'react';
import { createClient } from '../../../supabase/client';
import { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { 
  Phone, 
  PhoneCall, 
  MessageSquare, 
  Settings, 
  BarChart3, 
  Globe, 
  Users, 
  Search,
  Plus,
  Play,
  Pause,
  Volume2,
  MapPin,
  Building,
  Clock,
  TrendingUp,
  Zap,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardNavbar from '@/components/dashboard-navbar';

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
}

interface PhoneNumber {
  id: string;
  number: string;
  country: string;
  type: 'local' | 'toll-free' | 'mobile';
  status: 'active' | 'inactive';
  monthlyPrice: number;
}

interface CallFlow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  calls: number;
}

interface AddressResult {
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  type: 'business' | 'residential';
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [twilioNumbers, setTwilioNumbers] = useState<TwilioPhoneNumber[]>([]);
  const [loadingTwilio, setLoadingTwilio] = useState(false);
  const [addressSearch, setAddressSearch] = useState('');
  const [addressResults, setAddressResults] = useState<AddressResult[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);

  // Mock data for call flows
  const [callFlows] = useState<CallFlow[]>([
    { id: '1', name: 'Sales Team Routing', description: 'Routes calls to available sales reps', status: 'active', calls: 1247 },
    { id: '2', name: 'Support Queue', description: 'Customer support with hold music', status: 'active', calls: 892 },
    { id: '3', name: 'After Hours', description: 'Voicemail and callback system', status: 'inactive', calls: 156 },
  ]);

  useEffect(() => {
    const supabase = createClient();
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        redirect('/sign-in');
      }
      setUser(user);
      setLoading(false);
    };

    getUser();
  }, []);

  const fetchTwilioNumbers = async () => {
    setLoadingTwilio(true);
    try {
      const response = await fetch('/api/twilio/numbers');
      if (response.ok) {
        const data = await response.json();
        setTwilioNumbers(data.numbers || []);
      } else {
        console.error('Failed to fetch Twilio numbers');
      }
    } catch (error) {
      console.error('Error fetching Twilio numbers:', error);
    } finally {
      setLoadingTwilio(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTwilioNumbers();
    }
  }, [user]);

  const handleAddressSearch = async () => {
    if (!addressSearch.trim()) return;
    
    setSearchingAddress(true);
    
    // Mock address search - in real app, integrate with Google Places API or similar
    setTimeout(() => {
      const mockResults: AddressResult[] = [
        {
          address: `${addressSearch} Main Street`,
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'US',
          type: 'business'
        },
        {
          address: `${addressSearch} Broadway`,
          city: 'New York',
          state: 'NY',
          zip: '10002',
          country: 'US',
          type: 'business'
        },
        {
          address: `${addressSearch} 5th Avenue`,
          city: 'New York',
          state: 'NY',
          zip: '10003',
          country: 'US',
          type: 'residential'
        }
      ];
      setAddressResults(mockResults);
      setSearchingAddress(false);
    }, 1000);
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
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-8">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Phone className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Numsphere
              </span>
            </div>
            
            {/* User Profile */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  {user?.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-medium text-sm">
                      {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
            
            <nav className="space-y-2">
              <a href="#overview" className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 font-medium">
                <BarChart3 className="w-5 h-5" />
                <span>Overview</span>
              </a>
              <a href="#numbers" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
                <Phone className="w-5 h-5" />
                <span>Phone Numbers</span>
              </a>
              <a href="#calls" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
                <PhoneCall className="w-5 h-5" />
                <span>Call Flows</span>
              </a>
              <a href="#analytics" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
                <TrendingUp className="w-5 h-5" />
                <span>Analytics</span>
              </a>
              <a href="#address" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
                <MapPin className="w-5 h-5" />
                <span>Address Lookup</span>
              </a>
              <a href="#settings" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </a>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening with your communications.</p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="numbers">Numbers</TabsTrigger>
              <TabsTrigger value="flows">Call Flows</TabsTrigger>
              <TabsTrigger value="address">Address Lookup</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Calls Today</CardTitle>
                    <PhoneCall className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1,247</div>
                    <p className="text-xs text-muted-foreground">+12% from yesterday</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Twilio Numbers</CardTitle>
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{twilioNumbers.length}</div>
                    <p className="text-xs text-muted-foreground">Active phone numbers</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Call Success Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">98.5%</div>
                    <p className="text-xs text-muted-foreground">+0.3% from last week</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$247.89</div>
                    <p className="text-xs text-muted-foreground">-5% from last month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest calls and system events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { time: '2 minutes ago', event: 'Incoming call to +1 (555) 123-4567', status: 'completed' },
                      { time: '5 minutes ago', event: 'Call flow "Sales Team Routing" updated', status: 'info' },
                      { time: '12 minutes ago', event: 'New voicemail received', status: 'new' },
                      { time: '1 hour ago', event: 'Monthly usage report generated', status: 'completed' },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 rounded-lg border">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.status === 'completed' ? 'bg-green-500' :
                          activity.status === 'new' ? 'bg-blue-500' : 'bg-gray-400'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.event}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="numbers" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Twilio Phone Numbers</h2>
                  <p className="text-gray-600">Manage your Twilio phone numbers</p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={fetchTwilioNumbers}
                    disabled={loadingTwilio}
                  >
                    {loadingTwilio ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Number
                  </Button>
                </div>
              </div>

              {loadingTwilio ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {twilioNumbers.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Twilio numbers found</h3>
                        <p className="text-gray-600 mb-4">
                          Connect your Twilio account or purchase numbers to get started
                        </p>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Get Started
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    twilioNumbers.map((number) => (
                      <Card key={number.sid}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Phone className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{number.phoneNumber}</h3>
                                <p className="text-sm text-gray-600">{number.friendlyName}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  {number.capabilities.voice && (
                                    <Badge variant="secondary">Voice</Badge>
                                  )}
                                  {number.capabilities.sms && (
                                    <Badge variant="secondary">SMS</Badge>
                                  )}
                                  {number.capabilities.mms && (
                                    <Badge variant="secondary">MMS</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={number.status === 'in-use' ? 'default' : 'secondary'}>
                                {number.status}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(number.dateCreated).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="flows" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Call Flows</h2>
                  <p className="text-gray-600">Design and manage your call routing</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Flow
                </Button>
              </div>

              <div className="grid gap-4">
                {callFlows.map((flow) => (
                  <Card key={flow.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Zap className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{flow.name}</h3>
                            <p className="text-gray-600">{flow.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant={flow.status === 'active' ? 'default' : 'secondary'}>
                                {flow.status}
                              </Badge>
                              <span className="text-sm text-gray-500">{flow.calls} calls processed</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            {flow.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Address Lookup</h2>
                <p className="text-gray-600">Search and verify addresses for your business contacts</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Search Addresses</CardTitle>
                  <CardDescription>Enter a partial address or building number to find matching locations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter address (e.g., 4749, 123 Main St...)"
                      value={addressSearch}
                      onChange={(e) => setAddressSearch(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
                    />
                    <Button onClick={handleAddressSearch} disabled={searchingAddress}>
                      {searchingAddress ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {addressResults.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold">Search Results:</h3>
                      {addressResults.map((result, index) => (
                        <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                {result.type === 'business' ? <Building className="w-5 h-5 text-gray-600" /> : <MapPin className="w-5 h-5 text-gray-600" />}
                              </div>
                              <div>
                                <h4 className="font-medium">{result.address}</h4>
                                <p className="text-sm text-gray-600">{result.city}, {result.state} {result.zip}</p>
                                <p className="text-xs text-gray-500">{result.country}</p>
                              </div>
                            </div>
                            <Badge variant={result.type === 'business' ? 'default' : 'secondary'}>
                              {result.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Settings</h2>
                <p className="text-gray-600">Manage your account and preferences</p>
              </div>

              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Update your account details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input value={user?.email || ''} disabled />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input value={user?.user_metadata?.full_name || ''} disabled />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Twilio Integration</CardTitle>
                    <CardDescription>Configure your Twilio account settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={fetchTwilioNumbers} className="bg-blue-600 hover:bg-blue-700">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Twilio Data
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}