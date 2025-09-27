'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageHeader from '@/components/PageHeader';
import { Card, StatCard } from '@/components/Card';
import Button from '@/components/Button';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  User,
  Calendar,
  Tag,
  MessageCircle,
  Eye,
  Edit,
  Archive
} from 'lucide-react';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: 'technical' | 'billing' | 'access' | 'feature_request' | 'bug_report';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  responses: number;
}

export default function SupportPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Mock data - replace with actual API calls
  const tickets: SupportTicket[] = [
    {
      id: '1',
      title: 'Unable to upload medical records',
      description: 'Getting error when trying to upload PDF files. The upload process starts but fails after a few seconds.',
      user: {
        name: 'Dr. Sarah Chen',
        email: 'sarah.chen@cityhospital.com',
        role: 'doctor'
      },
      priority: 'high',
      status: 'open',
      category: 'technical',
      createdAt: '2024-07-20T09:30:00Z',
      updatedAt: '2024-07-20T09:30:00Z',
      responses: 0
    },
    {
      id: '2',
      title: 'Billing inquiry for monthly usage',
      description: 'Need clarification on the billing for last month. The charges seem higher than expected.',
      user: {
        name: 'Michael Rodriguez',
        email: 'admin@stmary.hospital',
        role: 'hospital_admin'
      },
      priority: 'medium',
      status: 'in_progress',
      category: 'billing',
      createdAt: '2024-07-19T14:20:00Z',
      updatedAt: '2024-07-20T08:15:00Z',
      assignedTo: 'Support Team',
      responses: 2
    },
    {
      id: '3',
      title: 'Cannot access patient records from mobile app',
      description: 'The mobile app keeps showing a login error even though credentials are correct.',
      user: {
        name: 'Emma Wilson',
        email: 'emma.w@email.com',
        role: 'patient'
      },
      priority: 'medium',
      status: 'resolved',
      category: 'access',
      createdAt: '2024-07-18T11:45:00Z',
      updatedAt: '2024-07-19T16:30:00Z',
      assignedTo: 'Tech Support',
      responses: 4
    },
    {
      id: '4',
      title: 'Feature request: Bulk export of records',
      description: 'Would like the ability to export multiple patient records at once instead of one by one.',
      user: {
        name: 'Dr. James Park',
        email: 'j.park@metromedical.com',
        role: 'doctor'
      },
      priority: 'low',
      status: 'open',
      category: 'feature_request',
      createdAt: '2024-07-17T16:00:00Z',
      updatedAt: '2024-07-17T16:00:00Z',
      responses: 1
    },
    {
      id: '5',
      title: 'AI summary not working correctly',
      description: 'The AI summary feature is generating incorrect information from the medical reports.',
      user: {
        name: 'Dr. Lisa Thompson',
        email: 'l.thompson@universityhospital.edu',
        role: 'doctor'
      },
      priority: 'urgent',
      status: 'in_progress',
      category: 'bug_report',
      createdAt: '2024-07-20T07:15:00Z',
      updatedAt: '2024-07-20T10:45:00Z',
      assignedTo: 'AI Team',
      responses: 3
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'closed':
        return <Archive className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical':
        return 'bg-purple-100 text-purple-800';
      case 'billing':
        return 'bg-green-100 text-green-800';
      case 'access':
        return 'bg-red-100 text-red-800';
      case 'feature_request':
        return 'bg-blue-100 text-blue-800';
      case 'bug_report':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
  const urgentTickets = tickets.filter(t => t.priority === 'urgent').length;

  return (
    <ProtectedRoute allowedRoles={['system_admin']}>
      <div className="space-y-6">
        <PageHeader
          title="Support Tickets"
          description="Manage and respond to user support requests"
        >
          <Button variant="primary">
            <MessageSquare className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </PageHeader>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Tickets"
            value={totalTickets.toString()}
            change={{ value: "+5 this week", trend: "up" }}
            icon={<MessageSquare className="w-6 h-6 text-blue-600" />}
          />
          <StatCard
            title="Open Tickets"
            value={openTickets.toString()}
            change={{ value: "Needs attention", trend: "neutral" }}
            icon={<AlertTriangle className="w-6 h-6 text-yellow-600" />}
          />
          <StatCard
            title="In Progress"
            value={inProgressTickets.toString()}
            change={{ value: "Being resolved", trend: "neutral" }}
            icon={<Clock className="w-6 h-6 text-orange-600" />}
          />
          <StatCard
            title="Urgent"
            value={urgentTickets.toString()}
            change={{ value: urgentTickets > 0 ? "Requires immediate attention" : "No urgent tickets", trend: urgentTickets > 0 ? "down" : "up" }}
            icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          />
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="access">Access</option>
              <option value="feature_request">Feature Request</option>
              <option value="bug_report">Bug Report</option>
            </select>

            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </Card>

        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">#{ticket.id} - {ticket.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(ticket.category)}`}>
                        <Tag className="w-3 h-3 mr-1" />
                        {ticket.category.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{ticket.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(ticket.status)}
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* User Info */}
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    <span className="font-medium">{ticket.user.name}</span>
                    <span className="ml-1">({ticket.user.role.replace('_', ' ')})</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    <span>{ticket.responses} responses</span>
                  </div>
                  {ticket.assignedTo && (
                    <div className="flex items-center">
                      <span className="text-blue-600">Assigned to: {ticket.assignedTo}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Last updated: {new Date(ticket.updatedAt).toLocaleString()}
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="primary">
                      <Edit className="w-4 h-4 mr-1" />
                      Respond
                    </Button>
                    {ticket.status !== 'closed' && (
                      <Button size="sm" variant="secondary">
                        <Archive className="w-4 h-4 mr-1" />
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredTickets.length === 0 && (
          <Card className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-500">No support tickets match your current filters.</p>
          </Card>
        )}

        {/* Urgent Tickets Alert */}
        {urgentTickets > 0 && (
          <Card className="border-red-200 bg-red-50">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Urgent Tickets Require Attention</h3>
                <p className="text-sm text-red-700 mt-1">
                  {urgentTickets} urgent ticket{urgentTickets !== 1 ? 's' : ''} need{urgentTickets === 1 ? 's' : ''} immediate attention.
                </p>
                <div className="mt-3">
                  <Button size="sm" variant="danger">
                    Review Urgent Tickets
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
