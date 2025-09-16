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
  RefreshCw,
  ShoppingCart,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  owned: boolean;
}

interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  isoCountry: string;
  capabilities: any;
  estimatedPrice: string;
}

interface CallFlow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  calls: number;
  phone_number_id?: string;
}

interface CallLog {
  id: string;
  from_number: string;
  to_number: string;
  direction: 'inbound' | 'outbound';
  status: string;
  duration: number;
  started_at: string;
  ended_at: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('overview');
  const [twilioNumbers, setTwilioNumbers] = useState<TwilioPhoneNumber[]>([]);
  const [availableNumbers, setAvailableNumbers] = useState<AvailableNumber[]>([]);
  const [callFlows, setCallFlows] = useState<CallFlow[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loadingTwilio, setLoadingTwilio] = useState(false);
  const [searchingNumbers, setSearchingNumbers] = useState(false);
  const [purchasingNumber, setPurchasingNumber] = useState<string | null>(null);
  
  // Search states
  const [numberSearch, setNumberSearch] = useState({
    country: 'US',
    areaCode: '',
    contains: ''
  });

  // Call flow creation
  const [newCallFlow, setNewCallFlow] = useState({
    name: '',
    description: '',
    phoneNumberId: ''
  });

  const supabase = createClient();

  useEffect(() => {
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
      const { data, error } = await supabase.functions.invoke('supabase-functions-get-twilio-numbers', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      setTwilioNumbers(data.numbers || []);
    } catch (error) {
      console.error('Error fetching Twilio numbers:', error);
    } finally {
      setLoadingTwilio(false);
    }
  };

  const searchAvailableNumbers = async () => {
    setSearchingNumbers(true);
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-search-available-numbers', {
        body: numberSearch,
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      setAvailableNumbers(data.numbers || []);
    } catch (error) {
      console.error('Error searching numbers:', error);
      alert('Failed to search numbers. Please try again.');
    } finally {
      setSearchingNumbers(false);
    }
  };

  const purchaseNumber = async (phoneNumber: string) => {
    setPurchasingNumber(phoneNumber);
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-purchase-phone-number', {
        body: { phoneNumber },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      
      // Refresh the numbers list
      await fetchTwilioNumbers();
      
      // Remove from available numbers
      setAvailableNumbers(prev => prev.filter(num => num.phoneNumber !== phoneNumber));
      
      alert('Phone number purchased successfully!');
    } catch (error) {
      console.error('Error purchasing number:', error);
      alert('Failed to purchase number. Please try again.');
    } finally {
      setPurchasingNumber(null);
    }
  };

  const createCallFlow = async () => {
    try {
      const { data, error } = await supabase
        .from('call_flows')
        .insert({
          user_id: user?.id,
          name: newCallFlow.name,
          description: newCallFlow.description,
          phone_number_id: newCallFlow.phoneNumberId || null,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      
      setCallFlows(prev => [...prev, data]);
      setNewCallFlow({ name: '', description: '', phoneNumberId: '' });
      alert('Call flow created successfully!');
    } catch (error) {
      console.error('Error creating call flow:', error);
      alert('Failed to create call flow. Please try again.');
    }
  };

  useEffect(() => {
    if (user) {
      fetchTwilioNumbers();
      
      // Fetch call flows
      supabase
        .from('call_flows')
        .select('*')
        .eq('user_id', user.id)
        .then(({ data }) => setCallFlows(data || []));

      // Fetch call logs
      supabase
        .from('call_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50)
        .then(({ data }) => setCallLogs(data || []));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Numbers</CardTitle>
                  <Phone className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{twilioNumbers.filter(n => n.owned).length}</div>
                  <p className="text-xs text-gray-500">Active phone numbers</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Call Flows</CardTitle>
                  <Zap className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{callFlows.length}</div>
                  <p className="text-xs text-gray-500">Active call flows</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Calls Today</CardTitle>
                  <PhoneCall className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{callLogs.filter(log => 
                    new Date(log.started_at).toDateString() === new Date().toDateString()
                  ).length}</div>
                  <p className="text-xs text-gray-500">Calls processed today</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">98.5%</div>
                  <p className="text-xs text-gray-500">Call completion rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Recent Call Logs</CardTitle>
                <CardDescription className="text-gray-500">Your latest call activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {callLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center space-x-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50">
                      <div className={`w-2 h-2 rounded-full ${
                        log.status === 'completed' ? 'bg-green-500' :
                        log.status === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {log.direction === 'inbound' ? 'Incoming' : 'Outgoing'} call
                        </p>
                        <p className="text-xs text-gray-500">
                          {log.from_number} → {log.to_number} • {log.duration}s
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.started_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  {callLogs.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No call logs yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'numbers':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Phone Numbers</h2>
                <p className="text-gray-600">Manage your purchased phone numbers</p>
              </div>
              <Button 
                variant="outline" 
                onClick={fetchTwilioNumbers}
                disabled={loadingTwilio}
                className="border-gray-200"
              >
                {loadingTwilio ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="grid gap-4">
              {twilioNumbers.filter(n => n.owned).map((number) => (
                <Card key={number.sid} className="bg-white border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Phone className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{number.phoneNumber}</h3>
                          <p className="text-sm text-gray-600">{number.friendlyName}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {number.capabilities.voice && (
                              <Badge variant="secondary" className="bg-blue-50 text-blue-700">Voice</Badge>
                            )}
                            {number.capabilities.sms && (
                              <Badge variant="secondary" className="bg-green-50 text-green-700">SMS</Badge>
                            )}
                            {number.capabilities.mms && (
                              <Badge variant="secondary" className="bg-purple-50 text-purple-700">MMS</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                        <Button variant="outline" size="sm" className="border-gray-200">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {twilioNumbers.filter(n => n.owned).length === 0 && (
                <Card className="bg-white border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No phone numbers yet</h3>
                    <p className="text-gray-600 mb-4">
                      Purchase your first phone number to get started
                    </p>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => setCurrentView('purchase')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Buy Your First Number
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      case 'purchase':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Buy Phone Numbers</h2>
              <p className="text-gray-600">Search and purchase phone numbers from Twilio</p>
            </div>

            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Search Available Numbers</CardTitle>
                <CardDescription className="text-gray-500">Find the perfect phone number for your business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-700">Country</Label>
                    <Select value={numberSearch.country} onValueChange={(value) => 
                      setNumberSearch(prev => ({ ...prev, country: value }))
                    }>
                      <SelectTrigger className="border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-700">Area Code</Label>
                    <Input
                      placeholder="e.g., 415"
                      value={numberSearch.areaCode}
                      onChange={(e) => setNumberSearch(prev => ({ ...prev, areaCode: e.target.value }))}
                      className="border-gray-200"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700">Contains</Label>
                    <Input
                      placeholder="e.g., 1234"
                      value={numberSearch.contains}
                      onChange={(e) => setNumberSearch(prev => ({ ...prev, contains: e.target.value }))}
                      className="border-gray-200"
                    />
                  </div>
                </div>
                <Button onClick={searchAvailableNumbers} disabled={searchingNumbers} className="bg-blue-600 hover:bg-blue-700">
                  {searchingNumbers ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Search Numbers
                </Button>
              </CardContent>
            </Card>

            {availableNumbers.length > 0 && (
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900">Available Numbers</CardTitle>
                  <CardDescription className="text-gray-500">Click to purchase a number</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {availableNumbers.map((number, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                        <div>
                          <h4 className="font-medium text-gray-900">{number.phoneNumber}</h4>
                          <p className="text-sm text-gray-600">
                            {number.locality}, {number.region} • {number.estimatedPrice}
                          </p>
                        </div>
                        <Button 
                          onClick={() => purchaseNumber(number.phoneNumber)}
                          disabled={purchasingNumber === number.phoneNumber}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {purchasingNumber === number.phoneNumber ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Purchase
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return <div>Content for {currentView}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r min-h-screen">
          <div className="p-6">
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
              <button 
                onClick={() => setCurrentView('overview')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'overview' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Overview</span>
              </button>
              <button 
                onClick={() => setCurrentView('numbers')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'numbers' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Phone className="w-5 h-5" />
                <span>Phone Numbers</span>
              </button>
              <button 
                onClick={() => setCurrentView('purchase')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'purchase' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Buy Numbers</span>
              </button>
              <button 
                onClick={() => setCurrentView('flows')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'flows' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Zap className="w-5 h-5" />
                <span>Call Flows</span>
              </button>
              <button 
                onClick={() => setCurrentView('logs')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'logs' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <PhoneCall className="w-5 h-5" />
                <span>Call Logs</span>
              </button>
              <button 
                onClick={() => setCurrentView('settings')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'settings' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Manage your VoIP communications and phone numbers.</p>
          </div>

          {renderContent()}
        </div>
      </div>
    </div>
  );
}