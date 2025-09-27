'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card } from '@/components/Card';
import Button from '@/components/Button';
import PageHeader from '@/components/PageHeader';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  Paperclip,
  Send,
  User,
  Calendar
} from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  category: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

export default function HospitalSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'TK-001',
      title: 'Patient Data Access Issue',
      description: 'Unable to access patient records for John Doe (ID: P-12345)',
      priority: 'high',
      status: 'in-progress',
      category: 'Data Access',
      createdAt: '2025-01-20T10:30:00Z',
      updatedAt: '2025-01-21T14:15:00Z',
      assignedTo: 'Tech Support Team'
    },
    {
      id: 'TK-002',
      title: 'Blockchain Sync Delay',
      description: 'Recent transactions taking longer than usual to sync with blockchain',
      priority: 'medium',
      status: 'open',
      category: 'Blockchain',
      createdAt: '2025-01-21T09:15:00Z',
      updatedAt: '2025-01-21T09:15:00Z'
    }
  ]);

  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    category: 'General'
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'in-progress': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'closed': return <XCircle className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const ticket: Ticket = {
      id: `TK-${String(tickets.length + 1).padStart(3, '0')}`,
      ...newTicket,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTickets([ticket, ...tickets]);
    setNewTicket({ title: '', description: '', priority: 'medium', category: 'General' });
    setShowNewTicketForm(false);
  };

  const filteredTickets = tickets.filter(ticket => {
    const statusMatch = filterStatus === 'all' || ticket.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || ticket.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  return (
    <ProtectedRoute allowedRoles={['hospital_admin']}>
      <div className="space-y-6">
        <PageHeader 
          title="Support Center" 
          description="Manage support tickets and get technical assistance"
        >
          <Button 
            onClick={() => setShowNewTicketForm(true)}
            variant="primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </PageHeader>
        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tickets..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            
            <select 
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Advanced
            </Button>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-2">
            <Card title={`Support Tickets (${filteredTickets.length} tickets)`}>
              <div className="space-y-3">
                {filteredTickets.map((ticket) => (
                  <div 
                    key={ticket.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              {ticket.id}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority.toUpperCase()}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">{ticket.title}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ticket.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                              {ticket.category}
                            </span>
                            {ticket.assignedTo && (
                              <div className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                <span>{ticket.assignedTo}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          <span className="ml-1 capitalize">{ticket.status.replace('-', ' ')}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredTickets.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                    <p className="text-gray-500">Try adjusting your filters or create a new ticket</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Ticket Details or New Ticket Form */}
          <div className="lg:col-span-1">
            {showNewTicketForm ? (
              <Card title="Create New Ticket" className="sticky top-8">
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={newTicket.title}
                      onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select
                        value={newTicket.priority}
                        onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={newTicket.category}
                        onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="General">General</option>
                        <option value="Data Access">Data Access</option>
                        <option value="Blockchain">Blockchain</option>
                        <option value="AI Features">AI Features</option>
                        <option value="Billing">Billing</option>
                        <option value="Technical">Technical</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Drag files here or click to attach</p>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <Button 
                      type="submit"
                      variant="primary"
                      className="flex-1"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submit
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewTicketForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            ) : selectedTicket ? (
              <Card title="Ticket Details" className="sticky top-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {selectedTicket.id}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority.toUpperCase()}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900">{selectedTicket.title}</h3>
                  <p className="text-gray-600 text-sm">{selectedTicket.description}</p>
                  
                  <div className="space-y-3 border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                        {getStatusIcon(selectedTicket.status)}
                        <span className="ml-1 capitalize">{selectedTicket.status.replace('-', ' ')}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Category:</span>
                      <span className="text-gray-900">{selectedTicket.category}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Created:</span>
                      <span className="text-gray-900">{new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
                    </div>
                    {selectedTicket.assignedTo && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Assigned to:</span>
                        <span className="text-gray-900">{selectedTicket.assignedTo}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full">
                        Add Comment
                      </Button>
                      <Button variant="outline" className="w-full">
                        Mark as Resolved
                      </Button>
                      <Button variant="outline" className="w-full">
                        Escalate Priority
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="sticky top-8">
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Ticket</h3>
                  <p className="text-gray-500 text-sm">Choose a ticket from the list to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
